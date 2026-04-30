const graphToken = process.env.GRAPH_TOKEN;
const tenantId = process.env.ENTRA_TENANT_ID;
const displayName = process.env.ENTRA_APP_DISPLAY_NAME;
const redirectUri = process.env.ENTRA_REDIRECT_URI;
const identityMode = process.env.ENTRA_IDENTITY_MODE ?? 'create';
const accessTier = process.env.ENTRA_ACCESS_TIER ?? 'preview';

if (!graphToken || !tenantId || !displayName) {
  throw new Error('GRAPH_TOKEN, ENTRA_TENANT_ID, and ENTRA_APP_DISPLAY_NAME are required.');
}

async function graphRequest(path, init = {}) {
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${graphToken}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) {
    return undefined;
  }

  return response.json();
}

const existingApplication = identityMode === 'create-or-update' ? await findApplicationByDisplayName(displayName) : undefined;
const application = existingApplication
  ? await updateApplication(existingApplication.id)
  : await createApplication();
const servicePrincipal = await ensureServicePrincipal(application.appId);

console.log(
  JSON.stringify(
    {
      tenantId,
      appObjectId: application.id,
      appId: application.appId,
      servicePrincipalObjectId: servicePrincipal.id,
      displayName,
      identityMode,
      accessTier,
      lifecycleAction: existingApplication ? 'updated-existing' : 'created-new'
    },
    null,
    2
  )
);

async function createApplication() {
  return graphRequest('/applications', {
    method: 'POST',
    body: JSON.stringify(applicationPayload())
  });
}

async function updateApplication(applicationId) {
  await graphRequest(`/applications/${applicationId}`, {
    method: 'PATCH',
    body: JSON.stringify(applicationPayload())
  });

  return graphRequest(`/applications/${applicationId}?$select=id,appId,displayName`);
}

async function ensureServicePrincipal(appId) {
  const existingServicePrincipal = await findServicePrincipalByAppId(appId);

  if (existingServicePrincipal) {
    return existingServicePrincipal;
  }

  return graphRequest('/servicePrincipals', {
    method: 'POST',
    body: JSON.stringify({
      appId,
      accountEnabled: true
    })
  });
}

async function findApplicationByDisplayName(name) {
  const filter = escapeODataString(name);
  const response = await graphRequest(`/applications?$select=id,appId,displayName&$filter=displayName eq '${filter}'`);
  return response.value?.[0];
}

async function findServicePrincipalByAppId(appId) {
  const filter = escapeODataString(appId);
  const response = await graphRequest(`/servicePrincipals?$select=id,appId,displayName&$filter=appId eq '${filter}'`);
  return response.value?.[0];
}

function applicationPayload() {
  return {
    displayName,
    signInAudience: 'AzureADMyOrg',
    web: redirectUri
      ? {
          redirectUris: [redirectUri]
        }
      : undefined,
    tags: ['aws-bedrock-scaffold', `access:${accessTier}`]
  };
}

function escapeODataString(value) {
  return value.replaceAll("'", "''");
}
