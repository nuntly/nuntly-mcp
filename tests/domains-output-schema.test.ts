import { describe, expect, it } from 'bun:test';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Nuntly } from '@nuntly/sdk';
import type { ZodTypeAny } from 'zod';
import { registerDomainsTools } from '../src/tools/domains';

// Values the Nuntly API returns for domain.receivingStatus.
const API_RECEIVING_STATUSES = ['disabled', 'bootstrapping', 'pending', 'active', 'failed'];

function registeredOutputSchemas(): Record<string, Record<string, ZodTypeAny>> {
  const schemas: Record<string, Record<string, ZodTypeAny>> = {};
  const server = {
    registerTool: (name: string, config: { outputSchema: Record<string, ZodTypeAny> }) => {
      schemas[name] = config.outputSchema;
    },
  } as unknown as McpServer;
  registerDomainsTools(server, {} as Nuntly);
  return schemas;
}

describe('domain tools output schema', () => {
  const schemas = registeredOutputSchemas();

  const receivingStatusOf: Record<string, (s: Record<string, ZodTypeAny>) => ZodTypeAny> = {
    'create-domain': (s) => s.receivingStatus,
    'retrieve-domain': (s) => s.receivingStatus,
    'list-domains': (s) => (s.data as unknown as { element: { shape: Record<string, ZodTypeAny> } }).element.shape.receivingStatus,
  };

  for (const [tool, pick] of Object.entries(receivingStatusOf)) {
    it(`${tool} accepts every receivingStatus the API returns`, () => {
      const field = pick(schemas[tool]!);
      for (const value of API_RECEIVING_STATUSES) {
        expect(field.safeParse(value).success).toBe(true);
      }
    });
  }
});
