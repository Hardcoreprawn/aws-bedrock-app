import { EventType, PublicClientApplication, type AccountInfo, type AuthenticationResult } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID;
const configuredAuthority = import.meta.env.VITE_ENTRA_AUTHORITY;
const apiScope = import.meta.env.VITE_ENTRA_API_SCOPE;

const authority = configuredAuthority || (tenantId ? `https://login.microsoftonline.com/${tenantId}` : '');

export const isAuthConfigured = Boolean(clientId && authority && apiScope);

const msalInstance = isAuthConfigured
  ? new PublicClientApplication({
      auth: {
        clientId,
        authority,
        redirectUri: window.location.origin
      },
      cache: {
        cacheLocation: 'sessionStorage'
      }
    })
  : null;

let initialized = false;

/**
 * Initializes MSAL once, processes redirect responses, and selects active account.
 */
export async function initializeAuth() {
  if (!msalInstance || initialized) {
    return;
  }

  await msalInstance.initialize();
  initialized = true;

  const redirectResult = await msalInstance.handleRedirectPromise();
  if (redirectResult?.account) {
    msalInstance.setActiveAccount(redirectResult.account);
  }

  const currentAccount = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (currentAccount) {
    msalInstance.setActiveAccount(currentAccount);
  }

  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS || event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
      const payload = event.payload as AuthenticationResult;
      if (payload.account) {
        msalInstance.setActiveAccount(payload.account);
      }
    }
  });
}

/**
 * Returns the currently active signed-in account, if any.
 */
export function getAccount(): AccountInfo | null {
  return msalInstance?.getActiveAccount() ?? null;
}

/**
 * Starts interactive sign-in flow using configured API scope.
 */
export async function signIn() {
  if (!msalInstance) {
    throw new Error('Authentication is not configured.');
  }

  await msalInstance.loginRedirect({
    scopes: [apiScope]
  });
}

/**
 * Signs out the active account and clears session state.
 */
export async function signOut() {
  if (!msalInstance) {
    return;
  }

  await msalInstance.logoutRedirect({
    account: msalInstance.getActiveAccount() ?? undefined
  });
}

/**
 * Acquires a bearer token for API calls, or returns undefined in local preview mode.
 */
export async function acquireApiToken(): Promise<string | undefined> {
  if (!msalInstance) {
    return undefined;
  }

  const account = msalInstance.getActiveAccount();
  if (!account) {
    throw new Error('Sign in is required before calling the API.');
  }

  const response = await msalInstance.acquireTokenSilent({
    account,
    scopes: [apiScope]
  });

  return response.accessToken;
}
