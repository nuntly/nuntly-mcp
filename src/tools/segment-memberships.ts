import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CursorPageParams, Nuntly } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import { contactSegmentMembershipResponseOutput } from '../schemas.js';

export function registerSegmentMembershipsTools(server: McpServer, nuntly: Nuntly): void {
  // POST /contacts/{contactId}/segments/{segmentId}
  server.registerTool(
    'add-contact-segment',
    {
      title: 'Add Contact Segment',
      description: 'Add a contact to a segment. Idempotent.',
      inputSchema: z
        .object({
          contactId: z.string().describe('The contactId'),
          segmentId: z.string().describe('The segmentId'),
        })
        .strict(),
      outputSchema: contactSegmentMembershipResponseOutput(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const contactId = String(args.contactId);
        const segmentId = String(args.segmentId);
        const result = await nuntly.contacts.segments.add(contactId, segmentId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /contacts/{contactId}/segments
  server.registerTool(
    'list-contact-segments',
    {
      title: 'List Contact Segments',
      description: "List a contact's segments.",
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
                segmentId: z.string().describe('The id of the segment.'),
                createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
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
        const result = await nuntly.contacts.segments.list(contactId);
        return formatStructuredResult({ data: result });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /segments/{segmentId}/members
  server.registerTool(
    'list-segment-members',
    {
      title: 'List Segment Members',
      description: 'List the members of a segment.',
      inputSchema: z
        .object({
          segmentId: z.string().describe('The segmentId'),
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
        const segmentId = String(args.segmentId);
        const page = await nuntly.segments.members.list(segmentId, {
          cursor: args.cursor,
          limit: args.limit,
        } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /contacts/{contactId}/segments/{segmentId}
  server.registerTool(
    'remove-contact-segment',
    {
      title: 'Remove Contact Segment',
      description: 'Remove a contact from a segment.',
      inputSchema: z
        .object({
          contactId: z.string().describe('The contactId'),
          segmentId: z.string().describe('The segmentId'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the contact removed from the segment.'),
          segmentId: z
            .string()
            .describe('The id of the segment the contact was removed from. The segment itself is not deleted.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, destructiveHint: true },
    },
    async (args) => {
      try {
        const contactId = String(args.contactId);
        const segmentId = String(args.segmentId);
        const result = await nuntly.contacts.segments.remove(contactId, segmentId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /contacts/{contactId}/segments/{segmentId}
  server.registerTool(
    'retrieve-contact-segment',
    {
      title: 'Retrieve Contact Segment',
      description: 'Check if a contact is in a segment.',
      inputSchema: z
        .object({
          contactId: z.string().describe('The contactId'),
          segmentId: z.string().describe('The segmentId'),
        })
        .strict(),
      outputSchema: contactSegmentMembershipResponseOutput(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const contactId = String(args.contactId);
        const segmentId = String(args.segmentId);
        const result = await nuntly.contacts.segments.retrieve(contactId, segmentId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
