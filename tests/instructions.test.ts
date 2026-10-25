import { describe, expect, it } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/ai';

async function instructions() {
  const server = createMcpServer({ apiKey: 'test_key', baseUrl: 'https://api.test.com' });
  const client = new Client({ name: 'test', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client.getInstructions() ?? '';
}

describe('MCP server instructions', () => {
  it('tells the agent a broadcast can be sent to a topic', async () => {
    expect(await instructions()).toMatch(/broadcast[^.]*to a topic/);
  });
});
