import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CreateContactPropertyRequest, CursorPageParams, Nuntly, UpdateContactPropertyRequest } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';
import { contactPropertyResponseOutput, idResponseOutput } from '../schemas.js';

export function registerContactPropertiesTools(server: McpServer, nuntly: Nuntly): void {
  // POST /contact-properties
  server.registerTool(
    'create-contact-property',
    {
      title: 'Create Contact Property',
      description: 'Create a contact property.',
      inputSchema: z
        .object({
          name: z
            .string()
            .describe(
              "A name for the property, used as its key in a contact's properties. Stored trimmed, with the letter case it was typed with.",
            ),
          type: z.enum(['string', 'number']).describe('The declared type of the property. Immutable after creation.'),
          description: z.string().nullable().describe('An optional description of the property.').optional(),
          defaultValue: z
            .union([z.string(), z.number()])
            .nullable()
            .describe('Applied to new contacts that omit this property.')
            .optional(),
        })
        .strict(),
      outputSchema: contactPropertyResponseOutput(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.contactProperties.create(body as CreateContactPropertyRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /contact-properties/{contactPropertyId}
  server.registerTool(
    'delete-contact-property',
    {
      title: 'Delete Contact Property',
      description: 'Delete a contact property.',
      inputSchema: z
        .object({
          contactPropertyId: z.string().describe('The contactPropertyId'),
        })
        .strict(),
      outputSchema: idResponseOutput(),
      annotations: { openWorldHint: true, destructiveHint: true },
    },
    async (args) => {
      try {
        const contactPropertyId = String(args.contactPropertyId);
        const result = await nuntly.contactProperties.delete(contactPropertyId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /contact-properties
  server.registerTool(
    'list-contact-properties',
    {
      title: 'List Contact Properties',
      description: 'List the organization contact properties.',
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
          data: z.array(contactPropertyResponseOutput()),
          nextCursor: z.string().nullable().optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const page = await nuntly.contactProperties.list({
          cursor: args.cursor,
          limit: args.limit,
        } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /contact-properties/{contactPropertyId}
  server.registerTool(
    'retrieve-contact-property',
    {
      title: 'Retrieve Contact Property',
      description: 'Retrieve one contact property.',
      inputSchema: z
        .object({
          contactPropertyId: z.string().describe('The contactPropertyId'),
        })
        .strict(),
      outputSchema: contactPropertyResponseOutput(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const contactPropertyId = String(args.contactPropertyId);
        const result = await nuntly.contactProperties.retrieve(contactPropertyId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /contact-properties/{contactPropertyId}
  server.registerTool(
    'update-contact-property',
    {
      title: 'Update Contact Property',
      description: 'Update a contact property.',
      inputSchema: z
        .object({
          contactPropertyId: z.string().describe('The contactPropertyId'),
          description: z.string().nullable().describe('An optional description of the property.').optional(),
          defaultValue: z.union([z.string(), z.number()]).nullable().optional(),
        })
        .strict(),
      outputSchema: idResponseOutput(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const contactPropertyId = String(args.contactPropertyId);
        const { contactPropertyId: _contactPropertyId, ...body } = args;
        const result = await nuntly.contactProperties.update(contactPropertyId, body as UpdateContactPropertyRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
