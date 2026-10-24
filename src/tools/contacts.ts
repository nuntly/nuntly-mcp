import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CreateContactRequest, CursorPageParams, Nuntly, UpdateContactRequest } from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatStructuredResult } from '../helpers.js';

export function registerContactsTools(server: McpServer, nuntly: Nuntly): void {
  // POST /contacts
  server.registerTool(
    'create-contact',
    {
      title: 'Create Contact',
      description: 'Create a contact.',
      inputSchema: z
        .object({
          email: z.string().describe('The contact email address. Stored lowercased and trimmed.'),
          properties: z
            .record(z.string(), z.unknown())
            .describe('Contact properties keyed by name. A null value means not supplied.')
            .optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the contact.'),
          email: z.string().describe('The contact email address. Stored lowercased and trimmed.'),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
          properties: z
            .record(z.string(), z.unknown())
            .describe("The contact's properties, keyed by property name.")
            .optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.contacts.create(body as CreateContactRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /contacts/{contactId}
  server.registerTool(
    'delete-contact',
    {
      title: 'Delete Contact',
      description: 'Delete a contact.',
      inputSchema: z
        .object({
          contactId: z.string().describe('The contactId'),
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
        const contactId = String(args.contactId);
        const result = await nuntly.contacts.delete(contactId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /contacts
  server.registerTool(
    'list-contacts',
    {
      title: 'List Contacts',
      description: 'List the organization contacts.',
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
                id: z.string().describe('The id of the contact.'),
                email: z.string().describe('The contact email address. Stored lowercased and trimmed.'),
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
        const page = await nuntly.contacts.list({ cursor: args.cursor, limit: args.limit } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /contacts/{contactId}
  server.registerTool(
    'retrieve-contact',
    {
      title: 'Retrieve Contact',
      description: 'Retrieve one contact.',
      inputSchema: z
        .object({
          contactId: z.string().describe('The contactId'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the contact.'),
          email: z.string().describe('The contact email address. Stored lowercased and trimmed.'),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
          properties: z
            .record(z.string(), z.unknown())
            .describe("The contact's properties, keyed by property name.")
            .optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const contactId = String(args.contactId);
        const result = await nuntly.contacts.retrieve(contactId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /contacts/{contactId}
  server.registerTool(
    'update-contact',
    {
      title: 'Update Contact',
      description: "Update a contact's properties.",
      inputSchema: z
        .object({
          contactId: z.string().describe('The contactId'),
          email: z.string().describe('The address cannot be changed.').optional(),
          properties: z
            .record(z.string(), z.unknown())
            .describe('Contact properties keyed by name, matched exactly. A null value removes the property.')
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
        const contactId = String(args.contactId);
        const { contactId: _contactId, ...body } = args;
        const result = await nuntly.contacts.update(contactId, body as UpdateContactRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
