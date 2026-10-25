import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CreateBulkEmailsRequest, CreateEmailRequest, CursorPageParams, Nuntly } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import { emailContentItemOutput, emailStatusOutput, eventTypeOutput, tagInput } from '../schemas.js';

export function registerEmailsTools(server: McpServer, nuntly: Nuntly): void {
  // DELETE /emails/{id}
  server.registerTool(
    'cancel-email',
    {
      title: 'Cancel Email',
      description:
        'Cancels a scheduled email before it is sent and returns its id with status canceled. Only scheduled emails sent outside a bulk request qualify.',
      inputSchema: z
        .object({
          id: z.string().describe('The email ID'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the email'),
          status: emailStatusOutput().describe('The status of the email.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, destructiveHint: true },
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

  // GET /emails/{id}/events
  server.registerTool(
    'list-email-events',
    {
      title: 'List Email Events',
      description:
        'Returns the full event history of an email, newest first, such as queued, sent, delivered, opened, clicked or bounced. The list is not paginated.',
      inputSchema: z
        .object({
          id: z.string().describe('The email ID'),
        })
        .strict(),
      outputSchema: z
        .object({
          data: z.array(
            z
              .object({
                id: z.string(),
                orgId: z.string().describe('The id of the organization'),
                emailId: z.string().describe('The id of the email'),
                createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
                occurredAt: z.string().describe('The date at which the event occurred').optional(),
                eventType: eventTypeOutput().describe('An event'),
                payload: z.record(z.string(), z.unknown()),
              })
              .passthrough(),
          ),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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

  // GET /emails
  server.registerTool(
    'list-emails',
    {
      title: 'List Emails',
      description:
        'Lists your emails newest first with cursor pagination, up to 30 per page. Each item has its sender, recipients, subject, status and submission date.',
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
                id: z.string().describe('The id of the email'),
                from: z.string().describe('The e-mail address of the sender'),
                to: z.union([z.string(), z.array(z.string())]).describe('The primary recipient(s) of the email'),
                subject: z.string().describe('The subject of the e-mail'),
                status: emailStatusOutput().describe('The status of the email.'),
                createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
                scheduledAt: z.string().describe('The date at which the email is scheduled to be sent').optional(),
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
        const page = await nuntly.emails.list({ cursor: args.cursor, limit: args.limit } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /emails/{id}
  server.registerTool(
    'retrieve-email',
    {
      title: 'Retrieve Email',
      description:
        'Returns a single email by id with its delivery status, status reason, recipients, subject, headers, tags, attachment metadata and schedule.',
      inputSchema: z
        .object({
          id: z.string().describe('The email ID'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the email'),
          orgId: z.string().describe('The id of the organization'),
          messageId: z.string().describe('The id from email provider').optional(),
          bulkId: z.string().describe('The bulk id').optional(),
          from: z.string().describe('The e-mail address of the sender'),
          to: z.union([z.string(), z.array(z.string())]).describe('The primary recipient(s) of the email'),
          cc: z
            .union([z.string(), z.array(z.string())])
            .describe('The carbon copy recipient(s) of the email')
            .optional(),
          bcc: z
            .union([z.string(), z.array(z.string())])
            .describe('The blind carbon copy recipient(s) of the email')
            .optional(),
          status: emailStatusOutput().describe('The status of the email.'),
          statusReason: z
            .record(z.string(), z.unknown())
            .describe('May provide more informations about the status')
            .optional(),
          subject: z.string().describe('The subject of the e-mail'),
          replyTo: z
            .union([z.string(), z.array(z.string())])
            .describe(
              "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address",
            )
            .optional(),
          headers: z.record(z.string(), z.unknown()).describe('The headers to add to the email').optional(),
          tags: z
            .array(
              z
                .object({
                  name: z.string().describe('The name of the tag'),
                  value: z.string().describe('The tag to add to the email'),
                })
                .passthrough(),
            )
            .describe('The tags to add to the email')
            .optional(),
          attachments: z
            .array(
              z
                .object({
                  filename: z.string().optional(),
                  contentType: z.string().optional(),
                  size: z.number().optional(),
                })
                .passthrough(),
            )
            .describe('The attachements')
            .optional(),
          variables: z.record(z.string(), z.unknown()).describe('The variables for the template').optional(),
          scheduledAt: z.string().describe('The date at which the email is scheduled to be sent').optional(),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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

  // GET /emails/bulk/{bulkId}
  server.registerTool(
    'retrieve-email-bulk',
    {
      title: 'Retrieve Email Bulk',
      description:
        'Returns the emails created by a bulk request, with the id and current status of each one, looked up by the bulk id returned when it was sent.',
      inputSchema: z
        .object({
          bulkId: z.string().describe('The bulkId'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string(),
          emails: z.array(
            z.object({ id: z.string(), status: emailStatusOutput(), detail: z.string().optional() }).passthrough(),
          ),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const bulkId = String(args.bulkId);
        const result = await nuntly.emails.bulk.retrieve(bulkId);
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
      title: 'Retrieve Email Content',
      description:
        'Returns download links, valid for 2 minutes, for the HTML, plain-text and raw MIME versions of an email, plus its stored subject and body templates.',
      inputSchema: z
        .object({
          id: z.string().describe('The email ID'),
        })
        .strict(),
      outputSchema: z
        .object({
          html: emailContentItemOutput().nullable().describe('HTML content, or `null` if unavailable.'),
          text: emailContentItemOutput().nullable().describe('Plain text content, or `null` if unavailable.'),
          mime: emailContentItemOutput().nullable().describe('Raw MIME (.eml) content, or `null` if unavailable.'),
          subjectTemplate: emailContentItemOutput()
            .nullable()
            .describe('Subject template content, or `null` if unavailable. Returned for failed emails only.'),
          htmlTemplate: emailContentItemOutput()
            .nullable()
            .describe('HTML template content, or `null` if unavailable. Returned for failed emails only.'),
          textTemplate: emailContentItemOutput()
            .nullable()
            .describe('Text template content, or `null` if unavailable. Returned for failed emails only.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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

  // GET /emails/stats
  server.registerTool(
    'retrieve-email-stats',
    {
      title: 'Retrieve Email Stats',
      description:
        'Returns daily email counts for the last 30 days and today, per status and engagement type (sent, delivered, bounced, opened, clicked and more).',
      outputSchema: z
        .object({
          start: z.string().describe('The start date of the stats range'),
          end: z.string().describe('The end date of the stats range'),
          stats: z.array(
            z
              .object({
                occurredOn: z.string(),
                queued: z.number(),
                scheduled: z.number(),
                processed: z.number(),
                sending: z.number(),
                sent: z.number(),
                delivered: z.number(),
                deliveryDelayed: z.number(),
                bounced: z.number(),
                failed: z.number(),
                rejected: z.number(),
                canceled: z.number(),
                complaintReceived: z.number(),
                renderingFailed: z.number(),
                opened: z.number(),
                uniqueOpened: z.number(),
                clicked: z.number(),
                uniqueClicked: z.number(),
              })
              .passthrough(),
          ),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
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

  // POST /emails
  server.registerTool(
    'send-email',
    {
      title: 'Send Email',
      description:
        'Send transactional emails through Nuntly platform. It supports HTML and plain-text emails, attachments, labels, custom headers and scheduling.',
      inputSchema: z
        .object({
          from: z.string().describe('The e-mail address of the sender'),
          to: z.union([z.string(), z.array(z.string())]).describe('The primary recipient(s) of the email'),
          cc: z
            .union([z.string(), z.array(z.string())])
            .describe('The carbon copy recipient(s) of the email')
            .optional(),
          bcc: z
            .union([z.string(), z.array(z.string())])
            .describe('The blind carbon copy recipient(s) of the email')
            .optional(),
          replyTo: z
            .union([z.string(), z.array(z.string())])
            .describe(
              "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address",
            )
            .optional(),
          subject: z.string().describe('The subject of the e-mail'),
          text: z.string().describe('The plaintext version of the email').optional(),
          html: z.string().describe('The HTML version of the email').optional(),
          headers: z.record(z.string(), z.string()).describe('The headers to add to the email').optional(),
          tags: z.array(tagInput()).describe('The tags to add to the email').optional(),
          attachments: z
            .array(
              z
                .object({
                  content: z.string().describe('The base64-encoded content of the attachment'),
                  filename: z
                    .string()
                    .describe('The name of the attached file to be displayed to the recipient')
                    .optional(),
                  contentType: z.string().describe('Content type of the attachment (the MIME type)').optional(),
                })
                .strict(),
            )
            .describe('The attachements to add to the email')
            .optional(),
          variables: z
            .record(z.string(), z.union([z.string(), z.number(), z.boolean()]).nullable())
            .describe('The variables for the template')
            .optional(),
          scheduledAt: z.string().describe('The date at which the email is scheduled to be sent').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the email'),
          status: emailStatusOutput().describe('The status of the email.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
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

  // POST /emails/bulk
  server.registerTool(
    'send-email-bulk',
    {
      title: 'Send Email Bulk',
      description:
        'Queues 1 to 20 emails in one request with optional shared fallback values, and returns a bulk id plus the id and status of each email. No scheduling.',
      inputSchema: z
        .object({
          fallback: z
            .object({
              from: z.string().describe('The e-mail address of the sender').optional(),
              to: z
                .union([z.string(), z.array(z.string())])
                .describe('The primary recipient(s) of the email')
                .optional(),
              cc: z
                .union([z.string(), z.array(z.string())])
                .describe('The carbon copy recipient(s) of the email')
                .optional(),
              bcc: z
                .union([z.string(), z.array(z.string())])
                .describe('The blind carbon copy recipient(s) of the email')
                .optional(),
              replyTo: z
                .union([z.string(), z.array(z.string())])
                .describe(
                  "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address",
                )
                .optional(),
              subject: z.string().describe('The subject of the e-mail').optional(),
              text: z.string().describe('The plaintext version of the email').optional(),
              html: z.string().describe('The HTML version of the email').optional(),
              headers: z.record(z.string(), z.string()).describe('The headers to add to the email').optional(),
              tags: z.array(tagInput()).describe('The tags to add to the email').optional(),
              variables: z
                .record(z.string(), z.union([z.string(), z.number(), z.boolean()]).nullable())
                .describe('The variables for the template')
                .optional(),
            })
            .strict()
            .describe('Used as a fallback field email value if no value is present in emails.')
            .optional(),
          emails: z
            .array(
              z
                .object({
                  from: z.string().describe('The e-mail address of the sender').optional(),
                  to: z
                    .union([z.string(), z.array(z.string())])
                    .describe('The primary recipient(s) of the email')
                    .optional(),
                  cc: z
                    .union([z.string(), z.array(z.string())])
                    .describe('The carbon copy recipient(s) of the email')
                    .optional(),
                  bcc: z
                    .union([z.string(), z.array(z.string())])
                    .describe('The blind carbon copy recipient(s) of the email')
                    .optional(),
                  replyTo: z
                    .union([z.string(), z.array(z.string())])
                    .describe(
                      "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address",
                    )
                    .optional(),
                  subject: z.string().describe('The subject of the e-mail').optional(),
                  text: z.string().describe('The plaintext version of the email').optional(),
                  html: z.string().describe('The HTML version of the email').optional(),
                  headers: z.record(z.string(), z.string()).describe('The headers to add to the email').optional(),
                  tags: z.array(tagInput()).describe('The tags to add to the email').optional(),
                  variables: z
                    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]).nullable())
                    .describe('The variables for the template')
                    .optional(),
                })
                .strict(),
            )
            .describe('The bulk emails to send.'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The bulk id').optional(),
          emails: z.array(z.object({ id: z.string().optional(), status: emailStatusOutput() }).passthrough()),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
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
}
