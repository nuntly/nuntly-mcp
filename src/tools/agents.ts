import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly, AgentMemoryRequest } from '@nuntly/sdk';
import { formatStructuredResult, formatError } from '../helpers.js';

export function registerAgentsTools(server: McpServer, nuntly: Nuntly): void {

  // GET /agents/{agentId}/memory
  server.registerTool(
    'retrieve-agent-memory',
    {
      title: "Retrieve Agent Memory",
      description: "Retrieve the memory for an AI agent.",
      inputSchema: {
        agentId: z.string().describe("The agentId"),
      },
      outputSchema: {
        id: z.string().describe("The agent memory record id."),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
        updatedAt: z.string().describe("Date at which the object was updated (ISO 8601 format)").optional(),
        agentId: z.string().describe("The agent identifier."),
        inboxId: z.string().describe("The inbox id."),
        threadId: z.string().describe("The thread id."),
        memory: z.record(z.string(), z.unknown()).describe("The agent memory data."),
        summary: z.string().describe("The conversation summary."),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const agentId = String(args.agentId);
        const result = await nuntly.agents.memory.retrieve(agentId);
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
      title: "Upsert Agent Memory",
      description: "Create or update the memory for an AI agent.",
      inputSchema: {
        agentId: z.string().describe("The agentId"),
        inboxId: z.string().describe("The inbox id to scope the memory to.").optional(),
        threadId: z.string().describe("The thread id to scope the memory to.").optional(),
        memory: z.record(z.string(), z.unknown()).describe("The agent memory key-value data."),
        summary: z.string().describe("A human-readable conversation summary.").optional(),
      },
      outputSchema: {
        id: z.string().describe("The agent memory record id."),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
        updatedAt: z.string().describe("Date at which the object was updated (ISO 8601 format)").optional(),
        agentId: z.string().describe("The agent identifier."),
        inboxId: z.string().describe("The inbox id."),
        threadId: z.string().describe("The thread id."),
        memory: z.record(z.string(), z.unknown()).describe("The agent memory data."),
        summary: z.string().describe("The conversation summary."),
      },
      annotations: {"openWorldHint":true},
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
