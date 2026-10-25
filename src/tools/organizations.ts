import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CursorPageParams, Nuntly } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import { organizationResponseOutput } from '../schemas.js';

export function registerOrganizationsTools(server: McpServer, nuntly: Nuntly): void {
  // GET /organizations
  server.registerTool(
    'list-organizations',
    {
      title: 'List Organizations',
      description:
        'Lists the organization that the API key belongs to, with its id, name, and status. The result is paginated with a cursor like other list endpoints.',
      inputSchema: z
        .object({
          cursor: z.string().describe('Pagination cursor from a previous response').optional(),
          limit: z
            .number()
            .int()
            .min(1)
            .max(30)
            .describe('The maximum number of results to return, from 1 to 30. Defaults to 30.')
            .optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          data: z.array(organizationResponseOutput()),
          nextCursor: z.string().nullable().optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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
      title: 'Retrieve Organization',
      description:
        'Retrieves the organization that the API key belongs to by id, returning its name and its status (enabled or disabled).',
      inputSchema: z
        .object({
          id: z.string().describe('The organization ID'),
        })
        .strict(),
      outputSchema: organizationResponseOutput(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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
      title: 'Retrieve Organization Usage',
      description:
        'Returns the daily and monthly email usage of the organization, with each limit, its reset time, and a breakdown by channel.',
      inputSchema: z
        .object({
          id: z.string().describe('The organization ID'),
        })
        .strict(),
      outputSchema: z
        .object({
          email: z
            .object({
              daily: z
                .object({
                  used: z.number(),
                  limit: z.number().nullable(),
                  breakdown: z
                    .object({
                      transactional: z.object({ sent: z.number(), received: z.number() }).passthrough(),
                      broadcast: z.object({ sent: z.number() }).passthrough(),
                    })
                    .passthrough(),
                  resetsAt: z.string(),
                })
                .passthrough(),
              monthly: z
                .object({
                  used: z.number(),
                  limit: z.number().nullable(),
                  breakdown: z
                    .object({
                      transactional: z.object({ sent: z.number(), received: z.number() }).passthrough(),
                      broadcast: z.object({ sent: z.number() }).passthrough(),
                    })
                    .passthrough(),
                  resetsAt: z.string().nullable(),
                })
                .passthrough(),
            })
            .passthrough(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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
