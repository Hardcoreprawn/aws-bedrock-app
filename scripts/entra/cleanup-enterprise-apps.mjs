const graphToken = process.env.GRAPH_TOKEN;
const prefix = process.env.ENTRA_APP_PREFIX ?? 'test_';
const maxAgeHours = Number(process.env.MAX_AGE_HOURS ?? '24');

if (!graphToken) {
  throw new Error('GRAPH_TOKEN is required.');
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

const applications = await graphRequest(`/applications?$select=id,appId,displayName,createdDateTime&$filter=startsWith(displayName,'${prefix}')`);
const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
const deleted = [];

for (const application of applications.value ?? []) {
  const created = Date.parse(application.createdDateTime ?? '');
  if (Number.isNaN(created) || created > cutoff) {
    continue;
  }

  const servicePrincipals = await graphRequest(`/servicePrincipals?$select=id&$filter=appId eq '${application.appId}'`);

  for (const servicePrincipal of servicePrincipals.value ?? []) {
    await graphRequest(`/servicePrincipals/${servicePrincipal.id}`, {
      method: 'DELETE'
    });
  }

  await graphRequest(`/applications/${application.id}`, {
    method: 'DELETE'
  });

  deleted.push({
    displayName: application.displayName,
    appId: application.appId
  });
}

console.log(JSON.stringify({ deleted, maxAgeHours }, null, 2));
