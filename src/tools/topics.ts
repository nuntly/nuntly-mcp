import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CreateTopicRequest, CursorPageParams, Nuntly, UpdateTopicRequest } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';

export function registerTopicsTools(server: McpServer, nuntly: Nuntly): void {
  // POST /topics
  server.registerTool(
    'create-topic',
    {
      title: 'Create Topic',
      description: 'Create a topic.',
      inputSchema: z
        .object({
          name: z.string().describe('A name for the topic, shown to your team. Stored lowercased and trimmed.'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the topic.'),
          name: z.string().describe('A name for the topic, shown to your team. Stored lowercased and trimmed.'),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.topics.create(body as CreateTopicRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /topics/{topicId}
  server.registerTool(
    'delete-topic',
    {
      title: 'Delete Topic',
      description: 'Delete a topic.',
      inputSchema: z
        .object({
          topicId: z.string().describe('The topicId'),
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
        const topicId = String(args.topicId);
        const result = await nuntly.topics.delete(topicId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /topics
  server.registerTool(
    'list-topics',
    {
      title: 'List Topics',
      description: 'List the organization topics.',
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
                id: z.string().describe('The id of the topic.'),
                name: z.string().describe('A name for the topic, shown to your team. Stored lowercased and trimmed.'),
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
        const page = await nuntly.topics.list({ cursor: args.cursor, limit: args.limit } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /topics/{topicId}
  server.registerTool(
    'retrieve-topic',
    {
      title: 'Retrieve Topic',
      description: 'Retrieve one topic.',
      inputSchema: z
        .object({
          topicId: z.string().describe('The topicId'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the topic.'),
          name: z.string().describe('A name for the topic, shown to your team. Stored lowercased and trimmed.'),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const topicId = String(args.topicId);
        const result = await nuntly.topics.retrieve(topicId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /topics/{topicId}
  server.registerTool(
    'update-topic',
    {
      title: 'Update Topic',
      description: 'Rename a topic.',
      inputSchema: z
        .object({
          topicId: z.string().describe('The topicId'),
          name: z.string().describe('A name for the topic, shown to your team. Stored lowercased and trimmed.'),
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
        const topicId = String(args.topicId);
        const { topicId: _topicId, ...body } = args;
        const result = await nuntly.topics.update(topicId, body as UpdateTopicRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
