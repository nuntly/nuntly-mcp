import { describe, expect, it } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/ai';

async function listTools() {
  const server = createMcpServer({ apiKey: 'test_key', baseUrl: 'https://api.test.com' });
  const client = new Client({ name: 'test', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const { tools } = await client.listTools();
  return new Map(tools.map(t => [t.name, t.annotations]));
}

describe('MCP tool annotations', () => {
  it('does not announce retrieve-thread as read-only, since markRead clears unread labels', async () => {
    const annotations = await listTools();

    expect(annotations.get('retrieve-thread')?.readOnlyHint).toBeUndefined();
    expect(annotations.get('retrieve-message')?.readOnlyHint).toBe(true);
  });

  it('announces retrieve-thread as non-destructive and idempotent', async () => {
    const annotations = await listTools();

    expect(annotations.get('retrieve-thread')?.destructiveHint).toBe(false);
    expect(annotations.get('retrieve-thread')?.idempotentHint).toBe(true);
  });
});
