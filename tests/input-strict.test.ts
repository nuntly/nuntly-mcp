import { describe, expect, it } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/ai';

async function connect() {
  const bodies: string[] = [];
  const server = createMcpServer({
    apiKey: 'test_key',
    baseUrl: 'https://api.test.com',
    retry: 'none',
    fetch: (async (input: Request | string, init?: RequestInit) => {
      bodies.push(input instanceof Request ? await input.clone().text() : String(init?.body ?? ''));
      return new Response(JSON.stringify({ data: { id: 'em_1', status: 'queued' } }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch,
  });
  const client = new Client({ name: 'test', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, bodies };
}

const email = { from: 'hello@acme.com', to: 'ada@example.com', subject: 'Welcome', text: 'Hi' };

function errorText(result: Awaited<ReturnType<Client['callTool']>>): string {
  return (result.content as Array<{ text: string }>).map(c => c.text).join('\n');
}

describe('MCP input strictness', () => {
  it('rejects an unknown top-level field without calling the API', async () => {
    const { client, bodies } = await connect();

    const result = await client.callTool({
      name: 'send-email',
      arguments: { ...email, scheduled_at: '2026-11-01T09:00:00Z' },
    });

    expect(result.isError).toBe(true);
    expect(errorText(result)).toContain('scheduled_at');
    expect(bodies).toHaveLength(0);
  });

  it('rejects an unknown field in a nested object without calling the API', async () => {
    const { client, bodies } = await connect();

    const result = await client.callTool({
      name: 'send-email',
      arguments: { ...email, attachments: [{ content: 'SGk=', filename: 'hi.txt', disposition: 'inline' }] },
    });

    expect(result.isError).toBe(true);
    expect(errorText(result)).toContain('disposition');
    expect(bodies).toHaveLength(0);
  });

  it('rejects an unknown field in a bulk email item', async () => {
    const { client, bodies } = await connect();

    const result = await client.callTool({
      name: 'send-email-bulk',
      arguments: { emails: [{ ...email, scheduledAt: '2026-11-01T09:00:00Z' }] },
    });

    expect(result.isError).toBe(true);
    expect(errorText(result)).toContain('scheduledAt');
    expect(bodies).toHaveLength(0);
  });

  it('rejects an unknown field on a tool that takes only path parameters', async () => {
    const { client, bodies } = await connect();

    const result = await client.callTool({
      name: 'retrieve-template-version-content',
      arguments: { templateId: 'tpl_1', versionId: 'tv_1', format: 'html' },
    });

    expect(result.isError).toBe(true);
    expect(errorText(result)).toContain('format');
    expect(bodies).toHaveLength(0);
  });

  it('sends a call with only declared fields as before', async () => {
    const { client, bodies } = await connect();

    const result = await client.callTool({
      name: 'send-email',
      arguments: { ...email, scheduledAt: '2026-11-01T09:00:00Z' },
    });

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(bodies[0]!)).toMatchObject({ ...email, scheduledAt: '2026-11-01T09:00:00Z' });
  });
});
