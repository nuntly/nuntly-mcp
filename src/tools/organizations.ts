import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly, CursorPageParams } from '@nuntly/sdk';
import { formatStructuredResult, formatError } from '../helpers.js';

export function registerOrganizationsTools(server: McpServer, nuntly: Nuntly): void {

  // GET /organizations
  server.registerTool(
    'list-organizations',
    {
      description: "Returns all organizations the authenticated user belongs to.",
      inputSchema: {
        cursor: z.string().describe("Pagination cursor from a previous response").optional(),
        limit: z.number().describe("Maximum number of items to return").optional(),
      },
      outputSchema: {
        data: z.array(z.record(z.string(), z.unknown())),
        nextCursor: z.string().optional(),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const page = await nuntly.organizations.list({ cursor: args.cursor, limit: args.limit } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /organizations/{id}
  server.registerTool(
    'retrieve-organization',
    {
      description: "Returns the organization's profile, plan, region, and account status.",
      inputSchema: {
        id: z.string().describe("The organization ID"),
      },
      outputSchema: {
        id: z.string().describe("The id of the organization"),
        name: z.string().describe("The name of the organization"),
        status: z.enum(['enabled', 'disabled']).describe("The status of the organization"),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const id = String(args.id);
        const result = await nuntly.organizations.retrieve(id);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /organizations/{id}/usage
  server.registerTool(
    'retrieve-organization-usage',
    {
      description: "Returns current period usage metrics (daily and monthly) for sending and receiving, against your plan limits.",
      inputSchema: {
        id: z.string().describe("The organizations usage ID"),
      },
      outputSchema: {
        transactional: z.object({ limits: z.object({ daily: z.number(), monthly: z.number() }), usage: z.object({ daily: z.number(), monthly: z.number() }), sending: z.object({ daily: z.number(), monthly: z.number() }), receiving: z.object({ daily: z.number(), monthly: z.number() }) }),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const id = String(args.id);
        const result = await nuntly.organizations.usage.retrieve(id);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
