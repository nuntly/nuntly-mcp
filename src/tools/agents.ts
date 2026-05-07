import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly } from '@nuntly/sdk';
import { formatResult, formatError } from '../helpers.js';

export function registerAgentsTools(server: McpServer, nuntly: Nuntly): void {

  // GET /agents/{agentId}/memory
  server.tool(
    'retrieve-agent-memory',
    "Retrieve the memory for an AI agent.",
    {
    agentId: z.string().describe("The agentId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const agentId = String(args.agentId);
        const result = await nuntly.agents.memory.retrieve(agentId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PUT /agents/{agentId}/memory
  server.tool(
    'upsert-agent-memory',
    "Create or update the memory for an AI agent.",
    {
    agentId: z.string().describe("The agentId"),
    inboxId: z.string().describe("The inbox id to scope the memory to.").optional(),
    threadId: z.string().describe("The thread id to scope the memory to.").optional(),
    memory: z.record(z.string(), z.unknown()).describe("The agent memory key-value data."),
    summary: z.string().describe("A human-readable conversation summary.").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const agentId = String(args.agentId);
        const { agentId: _agentId, ...body } = args;
        const result = await nuntly.agents.memory.upsert(agentId, body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
