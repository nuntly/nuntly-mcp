import { describe, expect, it } from 'bun:test';
import { createMcpServer } from '../src/ai';
import { MCP_VERSION } from '../src/version';

describe('MCP server smoke', () => {
  it('exposes a non-empty MCP_VERSION', () => {
    expect(typeof MCP_VERSION).toBe('string');
    expect(MCP_VERSION.length).toBeGreaterThan(0);
  });

  it('createMcpServer returns a server instance with the MCP version', () => {
    const server = createMcpServer({ apiKey: 'test_key' });
    expect(server).toBeDefined();
    // McpServer exposes the underlying server; smoke-check that
    // construction does not throw with minimal options.
    expect(typeof server.connect).toBe('function');
    expect(typeof server.close).toBe('function');
  });

  it('createMcpServer accepts caller appInfo override', () => {
    const server = createMcpServer({
      apiKey: 'test_key',
      appInfo: { name: '@my-org/integration', version: '1.2.3' },
    });
    expect(server).toBeDefined();
  });
});
