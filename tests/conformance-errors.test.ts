import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/ai';

// The vectors are in conformance/ at the repository root, the nearest ancestor that has one.
function vectors<T>(file: string): T {
  for (let dir = import.meta.dir; dir !== dirname(dir); dir = dirname(dir)) {
    const path = join(dir, 'conformance', file);
    if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf8')) as T;
  }
  throw new Error(`conformance/${file} not found`);
}

interface ErrorCase {
  name: string;
  response: { status: number; headers?: Record<string, string>; body?: unknown; rawBody?: string };
  expected: { kind: string; status?: number; code?: string; details?: unknown; requestId?: string };
}

async function callFailingTool(response: ErrorCase['response']) {
  const server = createMcpServer({
    apiKey: 'test_key',
    baseUrl: 'https://api.test.com',
    retry: 'none',
    fetch: (async () => {
      const body = response.rawBody ?? JSON.stringify(response.body ?? {});
      const headers = response.rawBody === undefined ? { 'content-type': 'application/json', ...response.headers } : response.headers;
      return new Response(body === '' ? null : body, { status: response.status, headers });
    }) as typeof fetch,
  });
  const client = new Client({ name: 'test', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const result = await client.callTool({ name: 'retrieve-email', arguments: { id: 'em_1' } });
  const [content] = result.content as { type: string; text: string }[];
  return { isError: result.isError, text: content?.text ?? '' };
}

describe('a failed tool call keeps the status, code, details and request id of the API error', () => {
  for (const c of vectors<{ cases: ErrorCase[] }>('errors.json').cases) {
    it(c.name, async () => {
      const result = await callFailingTool(c.response);

      expect(result.isError).toBe(true);
      if (c.expected.status !== undefined) expect(result.text).toContain(`HTTP ${c.expected.status}`);
      if (c.expected.code !== undefined && c.expected.code !== 'unknown') expect(result.text).toContain(c.expected.code);
      if (c.expected.details !== undefined) expect(result.text).toContain(JSON.stringify(c.expected.details));
      if (c.expected.requestId !== undefined) expect(result.text).toContain(c.expected.requestId);
    });
  }
});
