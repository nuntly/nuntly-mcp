import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AgentMemoryQuery, AgentMemoryRequest, Nuntly } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import { agentMemoryOutput } from '../schemas.js';

export function registerAgentsTools(server: McpServer, nuntly: Nuntly): void {
  // GET /agents/{agentId}/memory
  server.registerTool(
    'retrieve-agent-memory',
    {
      title: 'Retrieve Agent Memory',
      description:
        'Retrieves the key-value memory and summary saved for an AI agent, at organization level or scoped to one inbox or thread via query parameters.',
      inputSchema: z
        .object({
          agentId: z.string().describe('The agentId'),
          inboxId: z
            .string()
            .describe('The id of an inbox in your organization. Scopes memory to that inbox.')
            .optional(),
          threadId: z
            .string()
            .describe('The id of a thread in your organization. Scopes memory to that thread.')
            .optional(),
        })
        .strict(),
      outputSchema: agentMemoryOutput(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const agentId = String(args.agentId);
        const result = await nuntly.agents.memory.retrieve(agentId, {
          inboxId: args.inboxId,
          threadId: args.threadId,
        } as AgentMemoryQuery);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PUT /agents/{agentId}/memory
  server.registerTool(
    'upsert-agent-memory',
    {
      title: 'Upsert Agent Memory',
      description:
        'Saves the key-value memory and optional summary of an AI agent, at organization level or scoped to a specific inbox or thread. Returns the saved memory.',
      inputSchema: z
        .object({
          agentId: z.string().describe('The agentId'),
          inboxId: z
            .string()
            .describe('The id of an inbox in your organization. Scopes memory to that inbox.')
            .optional(),
          threadId: z
            .string()
            .describe('The id of a thread in your organization. Scopes memory to that thread.')
            .optional(),
          memory: z
            .record(
              z.string(),
              z
                .union([
                  z.string(),
                  z.number(),
                  z.boolean(),
                  z.array(z.union([z.string(), z.number(), z.boolean()]).nullable()),
                ])
                .nullable(),
            )
            .describe('The agent memory key-value data.'),
          summary: z.string().nullable().describe('A human-readable conversation summary.').optional(),
        })
        .strict(),
      outputSchema: agentMemoryOutput(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const agentId = String(args.agentId);
        const { agentId: _agentId, ...body } = args;
        const result = await nuntly.agents.memory.upsert(agentId, body as AgentMemoryRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
