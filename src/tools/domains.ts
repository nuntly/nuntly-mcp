import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly, CreateDomainRequest, CursorPageParams, UpdateDomainRequest } from '@nuntly/sdk';
import { formatStructuredResult, formatError } from '../helpers.js';

export function registerDomainsTools(server: McpServer, nuntly: Nuntly): void {

  // POST /domains
  server.registerTool(
    'create-domain',
    {
      title: "Create Domain",
      description: "Add a domain for sending or receiving emails.",
      inputSchema: {
        name: z.string().describe("The name of the domain to send e-mails'"),
        sending: z.boolean().describe("Enable sending").optional(),
        receiving: z.boolean().describe("Enable receiving").optional(),
      },
      outputSchema: {
        id: z.string().describe("The id of the domain"),
        name: z.string().describe("The name of the domain to send e-mails'"),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
        status: z.enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure']).describe("The status for the domain"),
        region: z.enum(['eu-west-1']).describe("The region of the domain data"),
        statusAt: z.string().describe("The date of the lastest verification of this record"),
        sending: z.boolean().describe("Whether sending is enabled for the domain"),
        receiving: z.boolean().describe("Whether receiving is enabled for the domain"),
        sendingStatus: z.enum(['enabled', 'disabled', 'paused']).describe("The sending status for the domain"),
        sendingStatusAt: z.string().describe("The date of the latest sending status change"),
        receivingStatus: z.enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure']).describe("The receiving status for the domain"),
        receivingStatusAt: z.string().describe("The date of the latest receiving status change"),
        openTracking: z.boolean().describe("Emit an event for each recipient opens an email their email client"),
        clickTracking: z.boolean().describe("Emit an event for each time the recipient clicks a link in the email"),
        records: z.array(z.object({ name: z.string(), fullname: z.string(), recordType: z.enum(['TXT', 'MX', 'CNAME']), ttl: z.string(), group: z.enum(['DKIM', 'SPF', 'MX', 'DMARC', 'MX_RECEIVING']), selector: z.string().optional(), priority: z.string().optional(), value: z.string(), status: z.enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure']), statusAt: z.string() })).describe("The DNS records for your domain."),
      },
      annotations: {"openWorldHint":true},
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
      title: "Delete Domain",
      description: "Permanently deletes a domain along with its inboxes, received messages, attachments, and sending configuration. This action is irreversible.",
      inputSchema: {
        id: z.string().describe("The domain ID"),
      },
      outputSchema: {
        id: z.string().describe("The id of the domain"),
      },
      annotations: {"openWorldHint":true,"destructiveHint":true},
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
      title: "List Domains",
      description: "Returns all domains with their verification and capability status.",
      inputSchema: {
        cursor: z.string().describe("Pagination cursor from a previous response").optional(),
        limit: z.number().describe("Maximum number of items to return").optional(),
      },
      outputSchema: {
        data: z.array(z.object({ id: z.string().describe("The id of the domain"), name: z.string().describe("The name of the domain to send e-mails'"), status: z.enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure']).describe("The status for the domain"), sendingStatus: z.enum(['enabled', 'disabled', 'paused']).describe("The sending status for the domain"), receivingStatus: z.enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure']).describe("The receiving status for the domain"), createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"), region: z.enum(['eu-west-1']).describe("The region of the domain data") })),
        nextCursor: z.string().optional(),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
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
      title: "Retrieve Domain",
      description: "Returns a domain with its DNS record configuration and current verification status for each record.",
      inputSchema: {
        id: z.string().describe("The domain ID"),
      },
      outputSchema: {
        id: z.string().describe("The id of the domain"),
        name: z.string().describe("The name of the domain to send e-mails'"),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
        status: z.enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure']).describe("The status for the domain"),
        region: z.enum(['eu-west-1']).describe("The region of the domain data"),
        statusAt: z.string().describe("The date of the lastest verification of this record"),
        sending: z.boolean().describe("Whether sending is enabled for the domain"),
        receiving: z.boolean().describe("Whether receiving is enabled for the domain"),
        sendingStatus: z.enum(['enabled', 'disabled', 'paused']).describe("The sending status for the domain"),
        sendingStatusAt: z.string().describe("The date of the latest sending status change"),
        receivingStatus: z.enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure']).describe("The receiving status for the domain"),
        receivingStatusAt: z.string().describe("The date of the latest receiving status change"),
        openTracking: z.boolean().describe("Emit an event for each recipient opens an email their email client"),
        clickTracking: z.boolean().describe("Emit an event for each time the recipient clicks a link in the email"),
        records: z.array(z.object({ name: z.string(), fullname: z.string(), recordType: z.enum(['TXT', 'MX', 'CNAME']), ttl: z.string(), group: z.enum(['DKIM', 'SPF', 'MX', 'DMARC', 'MX_RECEIVING']), selector: z.string().optional(), priority: z.string().optional(), value: z.string(), status: z.enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure']), statusAt: z.string() })).describe("The DNS records for your domain."),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
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
      title: "Update Domain",
      description: "Toggle sending, receiving, open tracking, or click tracking capabilities for a domain.",
      inputSchema: {
        id: z.string().describe("The domain ID"),
        openTracking: z.boolean().describe("Emit an event for each recipient opens an email their email client").optional(),
        clickTracking: z.boolean().describe("Emit an event for each time the recipient clicks a link in the email").optional(),
        sending: z.boolean().describe("Enable or disable sending").optional(),
        receiving: z.boolean().describe("Enable or disable receiving").optional(),
      },
      outputSchema: {
        id: z.string().describe("The id of the domain"),
        openTracking: z.boolean().describe("Emit an event for each recipient opens an email their email client"),
        clickTracking: z.boolean().describe("Emit an event for each time the recipient clicks a link in the email"),
      },
      annotations: {"openWorldHint":true},
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
