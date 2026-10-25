import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CreateDomainRequest, CursorPageParams, Nuntly, UpdateDomainRequest } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import {
  domainReceivingStatusOutput,
  domainRecordsResponseOutput,
  domainSendingStatusOutput,
  domainStatusOutput,
} from '../schemas.js';

export function registerDomainsTools(server: McpServer, nuntly: Nuntly): void {
  // POST /domains
  server.registerTool(
    'create-domain',
    {
      title: 'Create Domain',
      description:
        'Adds a domain for sending, receiving, or both, and returns the DNS records to publish. Verification starts automatically and the plan domain limit applies.',
      inputSchema: z
        .object({
          name: z.string().describe("The name of the domain to send e-mails'"),
          sending: z.boolean().describe('Enable sending').optional(),
          receiving: z.boolean().describe('Enable receiving').optional(),
        })
        .strict(),
      outputSchema: domainRecordsResponseOutput(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.domains.create(body as CreateDomainRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /domains/{id}
  server.registerTool(
    'delete-domain',
    {
      title: 'Delete Domain',
      description:
        'Permanently deletes a domain along with its inboxes, received messages, attachments, and sending configuration. This action is irreversible.',
      inputSchema: z
        .object({
          id: z.string().describe('The domain ID'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the domain'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, destructiveHint: true },
    },
    async (args) => {
      try {
        const id = String(args.id);
        const result = await nuntly.domains.delete(id);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /domains
  server.registerTool(
    'list-domains',
    {
      title: 'List Domains',
      description:
        'Lists the domains of your organization, newest first, with cursor pagination. Each domain shows its verification status and sending and receiving status.',
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
          data: z.array(
            z
              .object({
                id: z.string().describe('The id of the domain'),
                name: z.string().describe("The name of the domain to send e-mails'"),
                status: domainStatusOutput().describe('The status for the domain'),
                sendingStatus: domainSendingStatusOutput().describe('The sending status for the domain'),
                receivingStatus: domainReceivingStatusOutput().describe('The receiving status for the domain'),
                createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
                region: z.enum(['eu-west-1']).or(z.string()).describe('The region of the domain data'),
              })
              .passthrough(),
          ),
          nextCursor: z.string().nullable().optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const page = await nuntly.domains.list({ cursor: args.cursor, limit: args.limit } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /domains/{id}
  server.registerTool(
    'retrieve-domain',
    {
      title: 'Retrieve Domain',
      description:
        'Retrieves a domain with its capabilities, tracking settings, statuses, and the DNS records to publish, each with its own verification status.',
      inputSchema: z
        .object({
          id: z.string().describe('The domain ID'),
        })
        .strict(),
      outputSchema: domainRecordsResponseOutput(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const id = String(args.id);
        const result = await nuntly.domains.retrieve(id);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /domains/{id}
  server.registerTool(
    'update-domain',
    {
      title: 'Update Domain',
      description:
        'Turns sending, receiving, open tracking, or click tracking on or off for a domain. Enabling a capability adds its DNS records and restarts verification.',
      inputSchema: z
        .object({
          id: z.string().describe('The domain ID'),
          openTracking: z
            .boolean()
            .describe('Emit an event for each recipient opens an email their email client')
            .optional(),
          clickTracking: z
            .boolean()
            .describe('Emit an event for each time the recipient clicks a link in the email')
            .optional(),
          sending: z.boolean().describe('Enable or disable sending').optional(),
          receiving: z.boolean().describe('Enable or disable receiving').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the domain'),
          openTracking: z.boolean().describe('Emit an event for each recipient opens an email their email client'),
          clickTracking: z.boolean().describe('Emit an event for each time the recipient clicks a link in the email'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const id = String(args.id);
        const { id: _id, ...body } = args;
        const result = await nuntly.domains.update(id, body as UpdateDomainRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
