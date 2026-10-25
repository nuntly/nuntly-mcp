import { describe, expect, it } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/ai';

async function connect(data: unknown, status = 200) {
  const bodies: string[] = [];
  const server = createMcpServer({
    apiKey: 'test_key',
    baseUrl: 'https://api.test.com',
    retry: 'none',
    fetch: (async (input: Request | string, init?: RequestInit) => {
      bodies.push(input instanceof Request ? await input.clone().text() : String(init?.body ?? ''));
      return new Response(JSON.stringify({ data }), {
        status,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch,
  });
  const client = new Client({ name: 'test', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  // The client validates structuredContent only against output schemas cached by listTools.
  const { tools } = await client.listTools();
  return { client, bodies, tools };
}

type JsonSchema = {
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  additionalProperties?: unknown;
};

// Walks schema keywords only: a field may itself be named `properties` (contact.properties).
function objectsOf(schema: JsonSchema | undefined): JsonSchema[] {
  if (!schema) return [];
  const children = [...Object.values(schema.properties ?? {}), schema.items, ...(schema.anyOf ?? [])].flatMap(objectsOf);
  return schema.properties ? [schema, ...children] : children;
}

describe('MCP output passthrough', () => {
  it('keeps a top-level field the server does not know yet', async () => {
    const { client } = await connect({ id: 'em_1', status: 'queued', region: 'eu-west-3' }, 202);

    const result = await client.callTool({
      name: 'send-email',
      arguments: { from: 'hello@acme.com', to: 'ada@example.com', subject: 'Welcome', text: 'Hi' },
    });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({ id: 'em_1', status: 'queued', region: 'eu-west-3' });
  });

  it('keeps an unknown field in an array item', async () => {
    const key = { id: 'ak_1', shortToken: 'abc123', status: 'enabled', createdAt: '2026-10-21T00:00:00Z', scope: 'send' };
    const { client } = await connect([key]);

    const result = await client.callTool({ name: 'list-api-keys', arguments: {} });

    expect(result.isError).toBeFalsy();
    expect((result.structuredContent as { data: unknown[] }).data).toEqual([key]);
  });

  it('keeps an unknown field in an inline object', async () => {
    const html = { downloadUrl: 'https://files.acme.com/m.html', size: 120, expiresAt: '2026-10-21T00:02:00Z', encoding: 'utf-8' };
    const { client } = await connect({ text: null, html, mime: null });

    const result = await client.callTool({ name: 'retrieve-message-content', arguments: { messageId: 'msg_1' } });

    expect(result.isError).toBeFalsy();
    expect((result.structuredContent as { html: unknown }).html).toEqual(html);
  });

  it('advertises every output object as open and every input object as closed', async () => {
    const { tools } = await connect({});

    const outputs = tools.flatMap(t => objectsOf(t.outputSchema as JsonSchema));
    expect(outputs.length).toBeGreaterThan(tools.length);
    for (const o of outputs) expect(o.additionalProperties).toBe(true);
    expect(tools.find(t => t.name === 'send-email')!.outputSchema!.properties).toHaveProperty('status');

    // A tool with no arguments gets the MCP SDK's default empty input schema.
    const inputs = tools.flatMap(t => objectsOf(t.inputSchema as JsonSchema)).filter(i => Object.keys(i.properties!).length);
    for (const i of inputs) expect(i.additionalProperties).toBe(false);
  });

  it('declares an output schema on every tool, retrieve-template-version-content included', async () => {
    const content = {
      html: { status: 'available', downloadUrl: 'https://files.acme.com/v.html', expiresAt: '2026-10-21T00:02:00Z' },
      text: { status: 'absent' },
    };
    const { client, tools } = await connect(content);

    for (const t of tools) expect(t.outputSchema, t.name).toBeDefined();
    const result = await client.callTool({
      name: 'retrieve-template-version-content',
      arguments: { templateId: 'tpl_1', versionId: 'tv_1' },
    });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual(content);
  });

  it('advertises every schema inline, with no $ref', async () => {
    const { tools } = await connect({});

    for (const t of tools) {
      expect(JSON.stringify(t.inputSchema), t.name).not.toContain('$ref');
      expect(JSON.stringify(t.outputSchema), t.name).not.toContain('$ref');
    }
  });
});
