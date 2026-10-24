import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  CreateBroadcastRequest,
  CursorPageParams,
  Nuntly,
  SendBroadcastRequest,
  UpdateBroadcastRequest,
} from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';

export function registerBroadcastsTools(server: McpServer, nuntly: Nuntly): void {
  // POST /broadcasts
  server.registerTool(
    'create-broadcast',
    {
      title: 'Create Broadcast',
      description: 'Create a broadcast for your contacts.',
      inputSchema: z
        .object({
          templateId: z.string().describe('The template to send.').optional(),
          from: z.string().describe('The sender address, on a verified domain.'),
          name: z.string().describe('An internal label, shown only to your team.').optional(),
          subject: z.string().describe('The subject. Defaults to the template version’s subject.').optional(),
          replyTo: z
            .union([z.string(), z.array(z.string())])
            .describe(
              "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address",
            )
            .optional(),
          topicId: z.string().describe('The topic to send to.').optional(),
          segmentId: z.string().describe('The segment to send to.').optional(),
          variables: z.record(z.string(), z.unknown()).describe('Variable values keyed by declared name.').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the broadcast.'),
          name: z.string().describe('An internal label, shown only to your team.').optional(),
          templateId: z.string().describe('The id of the template.').optional(),
          templateVersionId: z
            .string()
            .describe('The content version this broadcast sends. Frozen once queued.')
            .optional(),
          domainId: z.string().describe('The id of the sending domain.').optional(),
          topicId: z.string().describe('The topic this broadcast targets.').optional(),
          segmentId: z.string().describe('The segment this broadcast targets.').optional(),
          from: z.string(),
          subject: z.string().describe('The subject, falling back to the template version’s subject.').optional(),
          replyTo: z
            .union([z.string(), z.array(z.string())])
            .describe(
              "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address",
            )
            .optional(),
          status: z
            .enum(['draft', 'scheduled', 'queued', 'sending', 'sent', 'paused', 'failed'])
            .or(z.string())
            .describe('The lifecycle state of the broadcast.'),
          statusAt: z.string().describe('Date at which the broadcast reached its current state.'),
          statusReason: z
            .record(z.string(), z.unknown())
            .describe('May provide more information about the status.')
            .optional(),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
          variables: z.record(z.string(), z.unknown()).describe('The stored variable values.').optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.broadcasts.create(body as CreateBroadcastRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /broadcasts/{broadcastId}
  server.registerTool(
    'delete-broadcast',
    {
      title: 'Delete Broadcast',
      description: 'Delete a draft, scheduled, or failed broadcast.',
      inputSchema: z
        .object({
          broadcastId: z.string().describe('The broadcastId'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the resource.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, destructiveHint: true },
    },
    async (args) => {
      try {
        const broadcastId = String(args.broadcastId);
        const result = await nuntly.broadcasts.delete(broadcastId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /broadcasts/{broadcastId}/recipients
  server.registerTool(
    'list-broadcast-recipients',
    {
      title: 'List Broadcast Recipients',
      description: 'List the recipients of a broadcast.',
      inputSchema: z
        .object({
          broadcastId: z.string().describe('The broadcastId'),
          cursor: z.string().describe('Pagination cursor from a previous response').optional(),
          limit: z.number().describe('Maximum number of items to return').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          data: z.array(
            z
              .object({
                id: z.string().describe('The id of the recipient record.'),
                contactId: z.string().nullable().describe('The source contact, absent once deleted.'),
                email: z.string().describe('The recipient address, kept until your retention window ends.'),
                outcome: z
                  .enum([
                    'queued',
                    'scheduled',
                    'processed',
                    'failed',
                    'sending',
                    'sent',
                    'delivered',
                    'bounced',
                    'complained',
                    'canceled',
                    'rejected',
                  ])
                  .or(z.string())
                  .describe('The current status of the recipient’s email.'),
                createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
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
        const broadcastId = String(args.broadcastId);
        const page = await nuntly.broadcasts.recipients.list(broadcastId, {
          cursor: args.cursor,
          limit: args.limit,
        } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /broadcasts
  server.registerTool(
    'list-broadcasts',
    {
      title: 'List Broadcasts',
      description: 'List the organization broadcasts.',
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
                id: z.string().describe('The id of the broadcast.'),
                name: z.string().describe('An internal label, shown only to your team.').optional(),
                templateId: z.string().describe('The id of the template.').optional(),
                templateVersionId: z
                  .string()
                  .describe('The content version this broadcast sends. Frozen once queued.')
                  .optional(),
                domainId: z.string().describe('The id of the sending domain.').optional(),
                topicId: z.string().describe('The topic this broadcast targets.').optional(),
                segmentId: z.string().describe('The segment this broadcast targets.').optional(),
                from: z.string(),
                subject: z.string().describe('The subject, falling back to the template version’s subject.').optional(),
                replyTo: z
                  .union([z.string(), z.array(z.string())])
                  .describe(
                    "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address",
                  )
                  .optional(),
                status: z
                  .enum(['draft', 'scheduled', 'queued', 'sending', 'sent', 'paused', 'failed'])
                  .or(z.string())
                  .describe('The lifecycle state of the broadcast.'),
                statusAt: z.string().describe('Date at which the broadcast reached its current state.'),
                statusReason: z
                  .record(z.string(), z.unknown())
                  .describe('May provide more information about the status.')
                  .optional(),
                createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
                updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
                variables: z.record(z.string(), z.unknown()).describe('The stored variable values.').optional(),
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
        const page = await nuntly.broadcasts.list({ cursor: args.cursor, limit: args.limit } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /broadcasts/{broadcastId}
  server.registerTool(
    'retrieve-broadcast',
    {
      title: 'Retrieve Broadcast',
      description: 'Retrieve a broadcast and its status.',
      inputSchema: z
        .object({
          broadcastId: z.string().describe('The broadcastId'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the broadcast.'),
          name: z.string().describe('An internal label, shown only to your team.').optional(),
          templateId: z.string().describe('The id of the template.').optional(),
          templateVersionId: z
            .string()
            .describe('The content version this broadcast sends. Frozen once queued.')
            .optional(),
          domainId: z.string().describe('The id of the sending domain.').optional(),
          topicId: z.string().describe('The topic this broadcast targets.').optional(),
          segmentId: z.string().describe('The segment this broadcast targets.').optional(),
          from: z.string(),
          subject: z.string().describe('The subject, falling back to the template version’s subject.').optional(),
          replyTo: z
            .union([z.string(), z.array(z.string())])
            .describe(
              "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address",
            )
            .optional(),
          status: z
            .enum(['draft', 'scheduled', 'queued', 'sending', 'sent', 'paused', 'failed'])
            .or(z.string())
            .describe('The lifecycle state of the broadcast.'),
          statusAt: z.string().describe('Date at which the broadcast reached its current state.'),
          statusReason: z
            .record(z.string(), z.unknown())
            .describe('May provide more information about the status.')
            .optional(),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
          variables: z.record(z.string(), z.unknown()).describe('The stored variable values.').optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const broadcastId = String(args.broadcastId);
        const result = await nuntly.broadcasts.retrieve(broadcastId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /broadcasts/{broadcastId}/send
  server.registerTool(
    'send-broadcast',
    {
      title: 'Send Broadcast',
      description: 'Send a broadcast now or schedule it.',
      inputSchema: z
        .object({
          broadcastId: z.string().describe('The broadcastId'),
          scheduledAt: z.string().describe('When to send. Omit to send immediately.').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the broadcast.'),
          status: z
            .enum(['draft', 'scheduled', 'queued', 'sending', 'sent', 'paused', 'failed'])
            .or(z.string())
            .describe('The lifecycle state of the broadcast.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const broadcastId = String(args.broadcastId);
        const { broadcastId: _broadcastId, ...body } = args;
        const result = await nuntly.broadcasts.send(broadcastId, body as SendBroadcastRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /broadcasts/{broadcastId}
  server.registerTool(
    'update-broadcast',
    {
      title: 'Update Broadcast',
      description: 'Edit a draft or scheduled broadcast.',
      inputSchema: z
        .object({
          broadcastId: z.string().describe('The broadcastId'),
          templateId: z.string().nullable().describe('Set to null to detach the template.').optional(),
          from: z.string().describe('The sender address, on a verified domain.').optional(),
          name: z.string().nullable().describe('Set to null to remove the name.').optional(),
          subject: z
            .string()
            .nullable()
            .describe('Set to null to fall back to the template version’s subject.')
            .optional(),
          replyTo: z
            .union([z.string(), z.array(z.string())])
            .nullable()
            .describe(
              "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address",
            )
            .optional(),
          topicId: z.string().nullable().describe('Set to null to remove the topic.').optional(),
          segmentId: z.string().nullable().describe('Set to null to remove the segment.').optional(),
          variables: z
            .record(z.string(), z.unknown())
            .describe('Replaces the stored values. Send {} to clear them.')
            .optional(),
          status: z
            .enum(['draft', 'scheduled', 'queued', 'sending', 'sent', 'paused', 'failed'])
            .describe('Only draft is accepted.')
            .optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the resource.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const broadcastId = String(args.broadcastId);
        const { broadcastId: _broadcastId, ...body } = args;
        const result = await nuntly.broadcasts.update(broadcastId, body as UpdateBroadcastRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
