import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly } from '@nuntly/sdk';
import { formatResult, formatError } from '../helpers.js';

export function registerEmailsTools(server: McpServer, nuntly: Nuntly): void {

  // DELETE /emails/{id}
  server.tool(
    'cancel-email',
    "Cancel a scheduled email before delivery. Only emails with `scheduled` status can be cancelled.",
    {
    id: z.string().describe("The email ID"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const result = await nuntly.emails.cancel(id);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails
  server.tool(
    'list-emails',
    "Returns sent emails ordered by submission date, newest first.",
    {
    cursor: z.string().describe("Pagination cursor from a previous response").optional(),
    limit: z.number().describe("Maximum number of items to return").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const page = await nuntly.emails.list({ cursor: args.cursor, limit: args.limit } as any);
        return formatResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails/bulk/{bulkId}
  server.tool(
    'retrieve-bulk-emails',
    "Returns the delivery status of all emails submitted in a bulk request.",
    {
    bulkId: z.string().describe("The bulkId"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const bulkId = String(args.bulkId);
        const result = await nuntly.emails.bulk.list(bulkId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails/{id}
  server.tool(
    'retrieve-email',
    "Returns an email with its current delivery status and metadata.",
    {
    id: z.string().describe("The email ID"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const result = await nuntly.emails.retrieve(id);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails/{id}/content
  server.tool(
    'retrieve-email-content',
    "Returns presigned URLs to download the HTML, plain-text, and raw MIME source of a sent email.",
    {
    id: z.string().describe("The emails content ID"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const result = await nuntly.emails.content.retrieve(id);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails/{id}/events
  server.tool(
    'retrieve-email-events',
    "Returns the full delivery event history for an email (sent, delivered, opened, bounced, etc.).",
    {
    id: z.string().describe("The emails event ID"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const id = String(args.id);
        const result = await nuntly.emails.events.list(id);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails/stats
  server.tool(
    'retrieve-email-stats',
    "Returns aggregated daily sending statistics for the current period.",
    async () => {
      try {
        const result = await nuntly.emails.stats.retrieve();
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /emails/bulk
  server.tool(
    'send-bulk-emails',
    "Send up to 20 emails in a single request. Use `fallback` to set default values shared across all messages.",
    {
    fallback: z.record(z.string(), z.unknown()).describe("Used as a fallback field email value if no value is present in emails").optional(),
    emails: z.array(z.record(z.string(), z.unknown())).describe("The bulk emails to send"),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const body = args;
        const result = await nuntly.emails.bulk.send(body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /emails
  server.tool(
    'send-email',
    "Send transactional emails through Nuntly platform. It supports HTML and plain-text emails, attachments, labels, custom headers and scheduling.",
    {
    from: z.string().describe("The e-mail address of the sender"),
    to: z.union([z.string(), z.array(z.string())]).describe("The primary recipient(s) of the email"),
    cc: z.union([z.string(), z.array(z.string())]).describe("The carbon copy recipient(s) of the email").optional(),
    bcc: z.union([z.string(), z.array(z.string())]).describe("The blind carbon copy recipient(s) of the email").optional(),
    replyTo: z.union([z.string(), z.array(z.string())]).describe("The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address").optional(),
    subject: z.string().describe("The subject of the e-mail"),
    text: z.string().describe("The plaintext version of the email").optional(),
    html: z.string().describe("The HTML version of the email").optional(),
    headers: z.record(z.string(), z.unknown()).describe("The headers to add to the email").optional(),
    tags: z.array(z.object({ name: z.string().describe("The name of the tag"), value: z.string().describe("The tag to add to the email") })).describe("The tags to add to the email").optional(),
    attachments: z.array(z.object({ content: z.string().describe("The base64-encoded content of the attachment"), filename: z.string().describe("The name of the attached file to be displayed to the recipient").optional(), contentType: z.string().describe("Content type of the attachment (the MIME type)").optional() })).describe("The attachements to add to the email").optional(),
    variables: z.record(z.string(), z.unknown()).describe("The variables for the template").optional(),
    scheduledAt: z.string().describe("The date at which the email is scheduled to be sent").optional(),
    } as any,
    async (args: Record<string, unknown>) => {
      try {
        const body = args;
        const result = await nuntly.emails.send(body as any);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
