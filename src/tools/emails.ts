import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Nuntly, CreateBulkEmailsRequest, CreateEmailRequest, CursorPageParams } from '@nuntly/sdk';
import { formatStructuredResult, formatError } from '../helpers.js';

export function registerEmailsTools(server: McpServer, nuntly: Nuntly): void {

  // DELETE /emails/{id}
  server.registerTool(
    'cancel-email',
    {
      description: "Cancel a scheduled email before delivery. Only emails with `scheduled` status can be cancelled.",
      inputSchema: {
        id: z.string().describe("The email ID"),
      },
      outputSchema: {
        id: z.string().describe("The id of the email"),
        status: z.enum(['queued', 'scheduled', 'processed', 'failed', 'sending', 'sent', 'delivered', 'bounced', 'complained', 'canceled', 'rejected']).describe("The status of the email."),
      },
      annotations: {"openWorldHint":true,"destructiveHint":true},
    },
    async (args) => {
      try {
        const id = String(args.id);
        const result = await nuntly.emails.cancel(id);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails
  server.registerTool(
    'list-emails',
    {
      description: "Returns sent emails ordered by submission date, newest first.",
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
        const page = await nuntly.emails.list({ cursor: args.cursor, limit: args.limit } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails/bulk/{bulkId}
  server.registerTool(
    'retrieve-bulk-emails',
    {
      description: "Returns the emails submitted in a bulk request.",
      inputSchema: {
        bulkId: z.string().describe("The bulkId"),
      },
      outputSchema: {
        id: z.string(),
        emails: z.array(z.object({ id: z.string(), status: z.enum(['queued', 'scheduled', 'processed', 'failed', 'sending', 'sent', 'delivered', 'bounced', 'complained', 'canceled', 'rejected']), detail: z.string().optional() })),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const bulkId = String(args.bulkId);
        const result = await nuntly.emails.bulk.list(bulkId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails/{id}
  server.registerTool(
    'retrieve-email',
    {
      description: "Returns an email with its current delivery status and metadata.",
      inputSchema: {
        id: z.string().describe("The email ID"),
      },
      outputSchema: {
        id: z.string().describe("The id of the email"),
        orgId: z.string().describe("The id of the organization"),
        messageId: z.string().describe("The id from email provider").optional(),
        bulkId: z.string().describe("The bulk id").optional(),
        from: z.string().describe("The e-mail address of the sender"),
        to: z.union([z.string(), z.array(z.string())]).describe("The primary recipient(s) of the email"),
        cc: z.union([z.string(), z.array(z.string())]).describe("The carbon copy recipient(s) of the email").optional(),
        bcc: z.union([z.string(), z.array(z.string())]).describe("The blind carbon copy recipient(s) of the email").optional(),
        status: z.enum(['queued', 'scheduled', 'processed', 'failed', 'sending', 'sent', 'delivered', 'bounced', 'complained', 'canceled', 'rejected']).describe("The status of the email."),
        statusReason: z.record(z.string(), z.unknown()).describe("May provide more informations about the status").optional(),
        subject: z.string().describe("The subject of the e-mail"),
        replyTo: z.union([z.string(), z.array(z.string())]).describe("The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address").optional(),
        headers: z.record(z.string(), z.unknown()).describe("The headers to add to the email").optional(),
        tags: z.array(z.object({ name: z.string().describe("The name of the tag"), value: z.string().describe("The tag to add to the email") })).describe("The tags to add to the email").optional(),
        attachments: z.array(z.object({ filename: z.string().optional(), contentType: z.string().optional(), size: z.number().optional() })).describe("The attachements").optional(),
        variables: z.record(z.string(), z.unknown()).describe("The variables for the template").optional(),
        scheduledAt: z.string().describe("The date at which the email is scheduled to be sent").optional(),
        createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const id = String(args.id);
        const result = await nuntly.emails.retrieve(id);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails/{id}/content
  server.registerTool(
    'retrieve-email-content',
    {
      description: "Returns presigned URLs to download the HTML, plain-text, and raw MIME source of a sent email.",
      inputSchema: {
        id: z.string().describe("The emails content ID"),
      },
      outputSchema: {
        html: z.object({ downloadUrl: z.string().describe("Presigned download URL."), size: z.number().describe("Uncompressed size in bytes."), expiresAt: z.string().describe("When the URL expires.") }).describe("HTML content, or `null` if unavailable."),
        text: z.object({ downloadUrl: z.string().describe("Presigned download URL."), size: z.number().describe("Uncompressed size in bytes."), expiresAt: z.string().describe("When the URL expires.") }).describe("Plain text content, or `null` if unavailable."),
        mime: z.object({ downloadUrl: z.string().describe("Presigned download URL."), size: z.number().describe("Uncompressed size in bytes."), expiresAt: z.string().describe("When the URL expires.") }).describe("Raw MIME (.eml) content, or `null` if unavailable."),
        subjectTemplate: z.object({ downloadUrl: z.string().describe("Presigned download URL."), size: z.number().describe("Uncompressed size in bytes."), expiresAt: z.string().describe("When the URL expires.") }).describe("Subject template content, or `null` if unavailable. Returned for failed emails only."),
        htmlTemplate: z.object({ downloadUrl: z.string().describe("Presigned download URL."), size: z.number().describe("Uncompressed size in bytes."), expiresAt: z.string().describe("When the URL expires.") }).describe("HTML template content, or `null` if unavailable. Returned for failed emails only."),
        textTemplate: z.object({ downloadUrl: z.string().describe("Presigned download URL."), size: z.number().describe("Uncompressed size in bytes."), expiresAt: z.string().describe("When the URL expires.") }).describe("Text template content, or `null` if unavailable. Returned for failed emails only."),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const id = String(args.id);
        const result = await nuntly.emails.content.retrieve(id);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails/{id}/events
  server.registerTool(
    'retrieve-email-events',
    {
      description: "Returns the delivery event history for an email (sent, delivered, opened, bounced, etc.).",
      inputSchema: {
        id: z.string().describe("The emails event ID"),
      },
      outputSchema: {
        data: z.array(z.object({ id: z.string(), orgId: z.string().describe("The id of the organization"), emailId: z.string().describe("The id of the email"), createdAt: z.string().describe("Date at which the object was created (ISO 8601 format)"), occurredAt: z.string().describe("The date at which the event occurred").optional(), eventType: z.enum(['email.queued', 'email.scheduled', 'email.processed', 'email.sending', 'email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained', 'email.rejected', 'email.deliveryDelayed', 'email.failed', 'email.renderingFailed', 'email.subscribed', 'email.unsubscribed', 'message.received', 'message.security.flagged', 'message.agent.triggered', 'message.sent', 'message.rejected']).describe("An event"), payload: z.record(z.string(), z.unknown()) })),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async (args) => {
      try {
        const id = String(args.id);
        const result = await nuntly.emails.events.list(id);
        return formatStructuredResult({ data: result });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails/stats
  server.registerTool(
    'retrieve-email-stats',
    {
      description: "Returns aggregated daily sending statistics for the current period.",
      outputSchema: {
        start: z.string().describe("The start date of the stats range"),
        end: z.string().describe("The end date of the stats range"),
        stats: z.array(z.object({ occurredOn: z.string(), queued: z.number(), scheduled: z.number(), processed: z.number(), sending: z.number(), sent: z.number(), delivered: z.number(), deliveredDelayed: z.number(), bounced: z.number(), failed: z.number(), rejected: z.number(), canceled: z.number(), complaintReceived: z.number(), renderingFailed: z.number(), opened: z.number(), uniqueOpened: z.number(), clicked: z.number(), uniqueClicked: z.number() })),
      },
      annotations: {"openWorldHint":true,"readOnlyHint":true},
    },
    async () => {
      try {
        const result = await nuntly.emails.stats.retrieve();
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /emails/bulk
  server.registerTool(
    'send-bulk-emails',
    {
      description: "Send up to 20 emails in a single request. Use `fallback` to set default values shared across all messages.",
      inputSchema: {
        fallback: z.object({ from: z.string().describe("The e-mail address of the sender").optional(), to: z.union([z.string(), z.array(z.string())]).describe("The primary recipient(s) of the email").optional(), cc: z.union([z.string(), z.array(z.string())]).describe("The carbon copy recipient(s) of the email").optional(), bcc: z.union([z.string(), z.array(z.string())]).describe("The blind carbon copy recipient(s) of the email").optional(), replyTo: z.union([z.string(), z.array(z.string())]).describe("The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address").optional(), subject: z.string().describe("The subject of the e-mail").optional(), text: z.string().describe("The plaintext version of the email").optional(), html: z.string().describe("The HTML version of the email").optional(), headers: z.record(z.string(), z.unknown()).describe("The headers to add to the email").optional(), tags: z.array(z.object({ name: z.string().describe("The name of the tag"), value: z.string().describe("The tag to add to the email") })).describe("The tags to add to the email").optional(), variables: z.record(z.string(), z.unknown()).describe("The variables for the template").optional() }).describe("Used as a fallback field email value if no value is present in emails.").optional(),
        emails: z.array(z.object({ from: z.string().describe("The e-mail address of the sender").optional(), to: z.union([z.string(), z.array(z.string())]).describe("The primary recipient(s) of the email").optional(), cc: z.union([z.string(), z.array(z.string())]).describe("The carbon copy recipient(s) of the email").optional(), bcc: z.union([z.string(), z.array(z.string())]).describe("The blind carbon copy recipient(s) of the email").optional(), replyTo: z.union([z.string(), z.array(z.string())]).describe("The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address").optional(), subject: z.string().describe("The subject of the e-mail").optional(), text: z.string().describe("The plaintext version of the email").optional(), html: z.string().describe("The HTML version of the email").optional(), headers: z.record(z.string(), z.unknown()).describe("The headers to add to the email").optional(), tags: z.array(z.object({ name: z.string().describe("The name of the tag"), value: z.string().describe("The tag to add to the email") })).describe("The tags to add to the email").optional(), variables: z.record(z.string(), z.unknown()).describe("The variables for the template").optional() })).describe("The bulk emails to send."),
      },
      outputSchema: {
        id: z.string().describe("The bulk id").optional(),
        emails: z.array(z.object({ id: z.string().optional(), status: z.enum(['queued', 'scheduled', 'processed', 'failed', 'sending', 'sent', 'delivered', 'bounced', 'complained', 'canceled', 'rejected']) })),
      },
      annotations: {"openWorldHint":true},
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.emails.bulk.send(body as CreateBulkEmailsRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /emails
  server.registerTool(
    'send-email',
    {
      description: "Send transactional emails through Nuntly platform. It supports HTML and plain-text emails, attachments, labels, custom headers and scheduling.",
      inputSchema: {
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
      },
      outputSchema: {
        id: z.string().describe("The id of the email"),
        status: z.enum(['queued', 'scheduled', 'processed', 'failed', 'sending', 'sent', 'delivered', 'bounced', 'complained', 'canceled', 'rejected']).describe("The status of the email."),
      },
      annotations: {"openWorldHint":true},
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.emails.send(body as CreateEmailRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
