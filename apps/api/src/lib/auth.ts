import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { env } from '../config.js';
import type { AuthenticatedIdentity } from '../types.js';

const tenantId = env.ENTRA_TENANT_ID;
const issuer = tenantId ? `https://login.microsoftonline.com/${tenantId}/v2.0` : '';
const jwks = issuer ? createRemoteJWKSet(new URL(`${issuer}/discovery/v2.0/keys`)) : null;

/**
 * Validates bearer token claims and enforces required role membership.
 * In local mode, returns a permissive development identity.
 */
export async function requireIdentity(
  event: APIGatewayProxyEventV2,
  allowedRoles: string[]
): Promise<AuthenticatedIdentity> {
  if (env.AUTH_ENABLED === 'false') {
    return {
      subject: 'local-development',
      name: 'Local Development',
      roles: ['review.admin', 'review.submit', 'review.read']
    };
  }

  const authorization = event.headers.authorization ?? event.headers.Authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Missing bearer token.');
  }

  if (!jwks || !issuer || !env.ENTRA_API_AUDIENCE) {
    throw new Error('Authentication is enabled but Entra validation settings are incomplete.');
  }

  const token = authorization.slice('Bearer '.length).trim();
  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience: env.ENTRA_API_AUDIENCE
  });

  const roles = coerceStringArray(payload.roles);
  if (!allowedRoles.some((role) => roles.includes(role))) {
    throw new Error('The signed-in identity does not have the required role.');
  }

  const subject = payload.oid ?? payload.sub;
  if (typeof subject !== 'string') {
    throw new Error('Token did not include a valid subject identifier.');
  }

  return {
    subject,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    roles
  };
}

/**
 * Parses comma-separated role configuration values into a list.
 */
export function parseRoleList(value: string): string[] {
  return value
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
}

/**
 * Checks whether an authenticated identity has a specific role.
 */
export function hasRole(identity: AuthenticatedIdentity, role: string): boolean {
  return identity.roles.includes(role);
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}
