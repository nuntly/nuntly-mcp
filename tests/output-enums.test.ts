import { describe, expect, it } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/ai';

async function connect(respond: () => Response) {
  let calls = 0;
  const server = createMcpServer({
    apiKey: 'test_key',
    baseUrl: 'https://api.test.com',
    retry: 'none',
    fetch: (async () => {
      calls++;
      return respond();
    }) as typeof fetch,
  });
  const client = new Client({ name: 'test', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, calls: () => calls };
}

describe('MCP output enums', () => {
  it('passes through an enum value the server does not know yet', async () => {
    const { client } = await connect(
      () =>
        new Response(JSON.stringify({ data: { id: 'em_1', status: 'suppressed' } }), {
          status: 202,
          headers: { 'content-type': 'application/json' },
        }),
    );

    const result = await client.callTool({
      name: 'send-email',
      arguments: { from: 'hello@acme.com', to: 'ada@example.com', subject: 'Welcome', text: 'Hi' },
    });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({ id: 'em_1', status: 'suppressed' });
  });

  it('still rejects an input value outside its enum', async () => {
    const { client, calls } = await connect(() => new Response('{}', { status: 201 }));

    const result = await client
      .callTool({ name: 'create-api-key', arguments: { name: 'ci', permission: 'rootAccess' } })
      .catch((error: Error) => ({ isError: true, content: [{ type: 'text', text: error.message }] }));

    expect(result.isError).toBe(true);
    expect(calls()).toBe(0);
  });
});
