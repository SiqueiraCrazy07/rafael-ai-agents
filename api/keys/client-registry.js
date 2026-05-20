const crypto = require('crypto');

function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(String(apiKey)).digest('hex');
}

function timingSafeEqualString(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createClient({ clientId, apiKey, scopes = ['runtime:read'], enabled = true, createdAt = new Date().toISOString() }) {
  if (!clientId || !apiKey) {
    throw new Error('clientId and apiKey are required to create an API client');
  }

  return {
    clientId,
    keyHash: hashApiKey(apiKey),
    scopes,
    readonly: true,
    createdAt,
    enabled
  };
}

function loadClients(options = {}) {
  const clients = [];

  if (Array.isArray(options.clients)) {
    clients.push(...options.clients);
  }

  if (process.env.API_READONLY_KEY) {
    clients.push(createClient({
      clientId: process.env.API_READONLY_CLIENT_ID || 'env-readonly-client',
      apiKey: process.env.API_READONLY_KEY,
      scopes: ['runtime:read', 'events:read', 'decisions:read', 'validation:read'],
      enabled: process.env.API_READONLY_ENABLED !== 'false'
    }));
  }

  return clients;
}

function findClientByApiKey(apiKey, clients) {
  if (!apiKey || !Array.isArray(clients)) {
    return null;
  }

  const incomingHash = hashApiKey(apiKey);

  return clients.find((client) => (
    client
    && client.enabled === true
    && client.readonly === true
    && typeof client.keyHash === 'string'
    && timingSafeEqualString(client.keyHash, incomingHash)
  )) || null;
}

function redactClient(client) {
  if (!client) {
    return null;
  }

  return {
    clientId: client.clientId,
    scopes: client.scopes || [],
    readonly: client.readonly === true,
    createdAt: client.createdAt,
    enabled: client.enabled === true
  };
}

module.exports = {
  createClient,
  findClientByApiKey,
  hashApiKey,
  loadClients,
  redactClient
};
