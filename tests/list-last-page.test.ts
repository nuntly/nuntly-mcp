import { describe, expect, it } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/ai';

const key = { id: 'ak_1', shortToken: 'abc123', status: 'enabled', createdAt: '2026-10-21T00:00:00Z' };

// Calls list-api-keys against an API that answers with `body`.
async function listApiKeys(body: unknown) {
  const server = createMcpServer({
    apiKey: 'test_key',
    baseUrl: 'https://api.test.com',
    retry: 'none',
    fetch: (async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })) as typeof fetch,
  });
  const client = new Client({ name: 'test', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  await client.listTools();
  return client.callTool({ name: 'list-api-keys', arguments: {} });
}

describe('MCP list tools', () => {
  it('accept the null nextCursor the API returns on the last page', async () => {
    const result = await listApiKeys({ data: [key], nextCursor: null });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({ data: [key], nextCursor: null });
  });

  it('return a null nextCursor when the last page leaves it out', async () => {
    const result = await listApiKeys({ data: [key] });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toStrictEqual({ data: [key], nextCursor: null });
  });
});
