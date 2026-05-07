import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly } from '@nuntly/sdk';
import { formatResult, formatError } from '../helpers.js';

export function registerOrganizationsTools(server: McpServer, nuntly: Nuntly): void {

  // GET /organizations/{id}/usage
  server.tool(
    'retrieve-organization-usage',
    "Returns current period usage metrics (daily and monthly) for sending and receiving, against your plan limits.",
    {
    id: z.string().describe("The organizations usage ID"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const result = await nuntly.organizations.usage.retrieve(id);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /organizations
  server.tool(
    'retrieve-organizations',
    "Returns all organizations the authenticated user belongs to.",
    {
    cursor: z.string().describe("Pagination cursor from a previous response").optional(),
    limit: z.number().describe("Maximum number of items to return").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const page = await nuntly.organizations.list({ cursor: args.cursor, limit: args.limit } as any);
        return formatResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /organizations/{id}
  server.tool(
    'retrieve-organization',
    "Returns the organization's profile, plan, region, and account status.",
    {
    id: z.string().describe("The organization ID"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const result = await nuntly.organizations.retrieve(id);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
