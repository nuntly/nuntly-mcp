import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AgentMemoryQuery, AgentMemoryRequest, Nuntly } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';

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
      outputSchema: z
        .object({
          id: z.string().nullable().describe('The agent memory record id.'),
          createdAt: z.string().nullable().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().nullable().describe('Date at which the object was updated (ISO 8601 format)'),
          agentId: z.string().describe('The agent identifier.'),
          inboxId: z.string().nullable().describe('The inbox id.'),
          threadId: z.string().nullable().describe('The thread id.'),
          memory: z.record(z.string(), z.unknown()).describe('The agent memory data.'),
          summary: z.string().nullable().describe('The conversation summary.'),
        })
        .passthrough(),
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
          memory: z.record(z.string(), z.unknown()).describe('The agent memory key-value data.'),
          summary: z.string().nullable().describe('A human-readable conversation summary.').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().nullable().describe('The agent memory record id.'),
          createdAt: z.string().nullable().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().nullable().describe('Date at which the object was updated (ISO 8601 format)'),
          agentId: z.string().describe('The agent identifier.'),
          inboxId: z.string().nullable().describe('The inbox id.'),
          threadId: z.string().nullable().describe('The thread id.'),
          memory: z.record(z.string(), z.unknown()).describe('The agent memory data.'),
          summary: z.string().nullable().describe('The conversation summary.'),
        })
        .passthrough(),
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
