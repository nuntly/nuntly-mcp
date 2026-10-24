import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CreateDomainRequest, CursorPageParams, Nuntly, UpdateDomainRequest } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';

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
      outputSchema: z
        .object({
          id: z.string().describe('The id of the domain'),
          name: z.string().describe("The name of the domain to send e-mails'"),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          status: z
            .enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure'])
            .or(z.string())
            .describe('The status for the domain'),
          region: z.enum(['eu-west-1']).or(z.string()).describe('The region of the domain data'),
          statusAt: z.string().describe('The date of the lastest verification of this record'),
          sending: z.boolean().describe('Whether sending is enabled for the domain'),
          receiving: z.boolean().describe('Whether receiving is enabled for the domain'),
          sendingStatus: z
            .enum(['enabled', 'disabled', 'paused'])
            .or(z.string())
            .describe('The sending status for the domain'),
          sendingStatusAt: z.string().describe('The date of the latest sending status change'),
          receivingStatus: z
            .enum(['disabled', 'bootstrapping', 'pending', 'active', 'failed'])
            .or(z.string())
            .describe('The receiving status for the domain'),
          receivingStatusAt: z.string().describe('The date of the latest receiving status change'),
          openTracking: z.boolean().describe('Emit an event for each recipient opens an email their email client'),
          clickTracking: z.boolean().describe('Emit an event for each time the recipient clicks a link in the email'),
          records: z
            .array(
              z
                .object({
                  name: z.string(),
                  fullname: z.string(),
                  recordType: z.enum(['TXT', 'MX', 'CNAME']).or(z.string()),
                  ttl: z.string(),
                  group: z.enum(['DKIM', 'SPF', 'MX', 'DMARC', 'MX_RECEIVING']).or(z.string()),
                  selector: z.string().optional(),
                  priority: z.string().optional(),
                  value: z.string(),
                  status: z.enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure']).or(z.string()),
                  statusAt: z.string(),
                })
                .passthrough(),
            )
            .describe('The DNS records for your domain.'),
        })
        .passthrough(),
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
          limit: z.number().describe('Maximum number of items to return').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          data: z.array(
            z
              .object({
                id: z.string().describe('The id of the domain'),
                name: z.string().describe("The name of the domain to send e-mails'"),
                status: z
                  .enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure'])
                  .or(z.string())
                  .describe('The status for the domain'),
                sendingStatus: z
                  .enum(['enabled', 'disabled', 'paused'])
                  .or(z.string())
                  .describe('The sending status for the domain'),
                receivingStatus: z
                  .enum(['disabled', 'bootstrapping', 'pending', 'active', 'failed'])
                  .or(z.string())
                  .describe('The receiving status for the domain'),
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
      outputSchema: z
        .object({
          id: z.string().describe('The id of the domain'),
          name: z.string().describe("The name of the domain to send e-mails'"),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          status: z
            .enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure'])
            .or(z.string())
            .describe('The status for the domain'),
          region: z.enum(['eu-west-1']).or(z.string()).describe('The region of the domain data'),
          statusAt: z.string().describe('The date of the lastest verification of this record'),
          sending: z.boolean().describe('Whether sending is enabled for the domain'),
          receiving: z.boolean().describe('Whether receiving is enabled for the domain'),
          sendingStatus: z
            .enum(['enabled', 'disabled', 'paused'])
            .or(z.string())
            .describe('The sending status for the domain'),
          sendingStatusAt: z.string().describe('The date of the latest sending status change'),
          receivingStatus: z
            .enum(['disabled', 'bootstrapping', 'pending', 'active', 'failed'])
            .or(z.string())
            .describe('The receiving status for the domain'),
          receivingStatusAt: z.string().describe('The date of the latest receiving status change'),
          openTracking: z.boolean().describe('Emit an event for each recipient opens an email their email client'),
          clickTracking: z.boolean().describe('Emit an event for each time the recipient clicks a link in the email'),
          records: z
            .array(
              z
                .object({
                  name: z.string(),
                  fullname: z.string(),
                  recordType: z.enum(['TXT', 'MX', 'CNAME']).or(z.string()),
                  ttl: z.string(),
                  group: z.enum(['DKIM', 'SPF', 'MX', 'DMARC', 'MX_RECEIVING']).or(z.string()),
                  selector: z.string().optional(),
                  priority: z.string().optional(),
                  value: z.string(),
                  status: z.enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure']).or(z.string()),
                  statusAt: z.string(),
                })
                .passthrough(),
            )
            .describe('The DNS records for your domain.'),
        })
        .passthrough(),
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
