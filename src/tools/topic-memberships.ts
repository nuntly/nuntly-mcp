import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CursorPageParams, Nuntly, SetContactTopicMembershipRequest } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import { topicMembershipStateOutput } from '../schemas.js';

export function registerTopicMembershipsTools(server: McpServer, nuntly: Nuntly): void {
  // GET /contacts/{contactId}/topics
  server.registerTool(
    'list-contact-topics',
    {
      title: 'List Contact Topics',
      description: "List a contact's subscription state per topic.",
      inputSchema: z
        .object({
          contactId: z.string().describe('The contactId'),
        })
        .strict(),
      outputSchema: z
        .object({
          data: z.array(
            z
              .object({
                topicId: z.string().describe('The id of the topic.'),
                state: topicMembershipStateOutput().describe('The subscribe/unsubscribe state.'),
                source: z
                  .enum(['explicit', 'default', 'platform_opt_out'])
                  .or(z.string())
                  .describe(
                    'How this state was derived: an explicit membership record, the organization default (subscribed, when no record exists), or a platform-wide opt-out, which overrides every other source.',
                  ),
              })
              .passthrough(),
          ),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const contactId = String(args.contactId);
        const result = await nuntly.contacts.topics.list(contactId);
        return formatStructuredResult({ data: result });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /topics/{topicId}/memberships
  server.registerTool(
    'list-topic-memberships',
    {
      title: 'List Topic Memberships',
      description: "List a topic's explicit membership records only. A contact without one is subscribed by default.",
      inputSchema: z
        .object({
          topicId: z.string().describe('The topicId'),
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
                contactId: z.string().describe('The id of the contact.'),
                state: topicMembershipStateOutput().describe('The subscribe/unsubscribe state.'),
                createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
                updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
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
        const topicId = String(args.topicId);
        const page = await nuntly.topics.memberships.list(topicId, {
          cursor: args.cursor,
          limit: args.limit,
        } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PUT /contacts/{contactId}/topics/{topicId}
  server.registerTool(
    'update-contact-topic',
    {
      title: 'Update Contact Topic',
      description: 'Subscribe or unsubscribe a contact from a topic.',
      inputSchema: z
        .object({
          contactId: z.string().describe('The contactId'),
          topicId: z.string().describe('The topicId'),
          state: z.enum(['subscribed', 'unsubscribed']).describe('The subscribe/unsubscribe state.'),
        })
        .strict(),
      outputSchema: z
        .object({
          contactId: z.string().describe('The id of the contact.'),
          topicId: z.string().describe('The id of the topic.'),
          state: topicMembershipStateOutput().describe('The subscribe/unsubscribe state.'),
          updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const contactId = String(args.contactId);
        const topicId = String(args.topicId);
        const { contactId: _contactId, topicId: _topicId, ...body } = args;
        const result = await nuntly.contacts.topics.update(
          contactId,
          topicId,
          body as SetContactTopicMembershipRequest,
        );
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
