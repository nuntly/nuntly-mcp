import { describe, expect, it } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/ai';

async function connect() {
  const urls: string[] = [];
  const server = createMcpServer({
    apiKey: 'test_key',
    baseUrl: 'https://api.test.com',
    retry: 'none',
    fetch: (async (input: Request | string) => {
      urls.push(input instanceof Request ? input.url : String(input));
      return new Response(JSON.stringify({ data: { id: 'bc_1' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch,
  });
  const client = new Client({ name: 'test', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, urls };
}

describe('MCP input bounds', () => {
  it('rejects an update-broadcast status other than draft without calling the API', async () => {
    const { client, urls } = await connect();

    const result = await client.callTool({
      name: 'update-broadcast',
      arguments: { broadcastId: 'bc_1', status: 'sent' },
    });

    expect(result.isError).toBe(true);
    expect(urls).toHaveLength(0);
  });

  it('sends an update-broadcast back to draft', async () => {
    const { client, urls } = await connect();

    const result = await client.callTool({
      name: 'update-broadcast',
      arguments: { broadcastId: 'bc_1', status: 'draft' },
    });

    expect(result.isError).toBeFalsy();
    expect(urls).toHaveLength(1);
  });

  for (const limit of [0, 2.5, 31]) {
    it(`rejects a list limit of ${limit} without calling the API`, async () => {
      const { client, urls } = await connect();

      const result = await client.callTool({ name: 'list-emails', arguments: { limit } });

      expect(result.isError).toBe(true);
      expect(urls).toHaveLength(0);
    });
  }

  it('sends a list limit of 30', async () => {
    const { client, urls } = await connect();

    await client.callTool({ name: 'list-namespaces', arguments: { limit: 30 } });

    expect(new URL(urls[0]!).searchParams.get('limit')).toBe('30');
  });

  const invalidMaps = [
    {
      name: 'send-email',
      arguments: { from: 'hello@acme.com', to: 'ada@example.com', subject: 'Hi', text: 'Hi', headers: { 'X-Count': 1 } },
    },
    { name: 'update-contact', arguments: { contactId: 'ct_1', properties: { vip: true } } },
    { name: 'upsert-agent-memory', arguments: { agentId: 'support', memory: { customer: { plan: 'pro' } } } },
  ];
  for (const call of invalidMaps) {
    it(`rejects an invalid map value in ${call.name} without calling the API`, async () => {
      const { client, urls } = await connect();

      const result = await client.callTool(call);

      expect(result.isError).toBe(true);
      expect(urls).toHaveLength(0);
    });
  }
});
