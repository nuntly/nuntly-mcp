import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CreateSegmentRequest, CursorPageParams, Nuntly, UpdateSegmentRequest } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import { idResponseOutput, segmentResponseOutput } from '../schemas.js';

export function registerSegmentsTools(server: McpServer, nuntly: Nuntly): void {
  // POST /segments
  server.registerTool(
    'create-segment',
    {
      title: 'Create Segment',
      description: 'Create an organization-level static segment.',
      inputSchema: z
        .object({
          name: z.string().describe('A name for the segment, shown to your team. Stored lowercased and trimmed.'),
        })
        .strict(),
      outputSchema: segmentResponseOutput(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.segments.create(body as CreateSegmentRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /segments/{segmentId}
  server.registerTool(
    'delete-segment',
    {
      title: 'Delete Segment',
      description: 'Delete a segment.',
      inputSchema: z
        .object({
          segmentId: z.string().describe('The segmentId'),
        })
        .strict(),
      outputSchema: idResponseOutput(),
      annotations: { openWorldHint: true, destructiveHint: true },
    },
    async (args) => {
      try {
        const segmentId = String(args.segmentId);
        const result = await nuntly.segments.delete(segmentId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /segments
  server.registerTool(
    'list-segments',
    {
      title: 'List Segments',
      description: 'List the organization segments.',
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
          data: z.array(segmentResponseOutput()),
          nextCursor: z.string().nullable().optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const page = await nuntly.segments.list({ cursor: args.cursor, limit: args.limit } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /segments/{segmentId}
  server.registerTool(
    'retrieve-segment',
    {
      title: 'Retrieve Segment',
      description: 'Retrieve one segment.',
      inputSchema: z
        .object({
          segmentId: z.string().describe('The segmentId'),
        })
        .strict(),
      outputSchema: segmentResponseOutput(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const segmentId = String(args.segmentId);
        const result = await nuntly.segments.retrieve(segmentId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /segments/{segmentId}
  server.registerTool(
    'update-segment',
    {
      title: 'Update Segment',
      description: 'Rename a segment.',
      inputSchema: z
        .object({
          segmentId: z.string().describe('The segmentId'),
          name: z.string().describe('A name for the segment, shown to your team. Stored lowercased and trimmed.'),
        })
        .strict(),
      outputSchema: idResponseOutput(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const segmentId = String(args.segmentId);
        const { segmentId: _segmentId, ...body } = args;
        const result = await nuntly.segments.update(segmentId, body as UpdateSegmentRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
