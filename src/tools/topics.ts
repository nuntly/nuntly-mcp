import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CreateTopicRequest, CursorPageParams, Nuntly, UpdateTopicRequest } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import { idResponseOutput, topicResponseOutput } from '../schemas.js';

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
      outputSchema: topicResponseOutput(),
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
      outputSchema: idResponseOutput(),
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
          data: z.array(topicResponseOutput()),
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
      outputSchema: topicResponseOutput(),
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
      outputSchema: idResponseOutput(),
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
