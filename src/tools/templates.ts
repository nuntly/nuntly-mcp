import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  CreateTemplateRequest,
  CreateTemplateVersionRequest,
  CursorPageParams,
  Nuntly,
  UpdateTemplateRequest,
} from '@nuntly/sdk';
import { z } from 'zod';
import { formatError, formatResult, formatStructuredResult } from '../helpers.js';

export function registerTemplatesTools(server: McpServer, nuntly: Nuntly): void {
  // POST /templates
  server.registerTool(
    'create-template',
    {
      title: 'Create Template',
      description: 'Create a template.',
      inputSchema: z
        .object({
          name: z.string().describe('A name for the template, shown only to your team.'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the template.'),
          name: z.string().describe('A name for the template, shown only to your team.'),
          status: z.enum(['draft', 'published']).or(z.string()).describe('The lifecycle state of the template.'),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const body = args;
        const result = await nuntly.templates.create(body as CreateTemplateRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // POST /templates/{templateId}/versions
  server.registerTool(
    'create-template-version',
    {
      title: 'Create Template Version',
      description: 'Create a draft version of a template.',
      inputSchema: z
        .object({
          templateId: z.string().describe('The templateId'),
          subject: z.string(),
          html: z.string(),
          text: z.string().describe('The plain-text body.').optional(),
          variables: z
            .array(
              z
                .object({
                  name: z.string().describe('The variable name, case-sensitive.'),
                  type: z.enum(['string', 'number', 'boolean']).describe('The variable type.'),
                  default: z
                    .union([z.string(), z.number(), z.boolean()])
                    .describe('Used when a broadcast sets no value.')
                    .optional(),
                })
                .strict(),
            )
            .describe('Variables the content may reference, at most 20. Immutable once created.')
            .optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the content version.'),
          templateId: z.string().describe('The id of the template.'),
          status: z.enum(['draft', 'active']).or(z.string()).describe('The lifecycle state of the content version.'),
          subject: z.string(),
          publishedAt: z.string().describe('Date at which this version was published.').optional(),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
          variables: z
            .array(
              z
                .object({
                  name: z.string().describe('The variable name, case-sensitive.'),
                  type: z.enum(['string', 'number', 'boolean']).or(z.string()).describe('The variable type.'),
                  default: z
                    .union([z.string(), z.number(), z.boolean()])
                    .describe('Used when a broadcast sets no value.')
                    .optional(),
                })
                .passthrough(),
            )
            .describe('The declared variables.')
            .optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const templateId = String(args.templateId);
        const { templateId: _templateId, ...body } = args;
        const result = await nuntly.templates.versions.create(templateId, body as CreateTemplateVersionRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // DELETE /templates/{templateId}
  server.registerTool(
    'delete-template',
    {
      title: 'Delete Template',
      description: 'Delete a template and its versions.',
      inputSchema: z
        .object({
          templateId: z.string().describe('The templateId'),
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
        const templateId = String(args.templateId);
        const result = await nuntly.templates.delete(templateId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /templates/{templateId}/versions
  server.registerTool(
    'list-template-versions',
    {
      title: 'List Template Versions',
      description: 'List the versions of a template.',
      inputSchema: z
        .object({
          templateId: z.string().describe('The templateId'),
          cursor: z.string().describe('Pagination cursor from a previous response').optional(),
          limit: z.number().describe('Maximum number of items to return').optional(),
        })
        .strict(),
      outputSchema: z
        .object({
          data: z.array(
            z
              .object({
                id: z.string().describe('The id of the content version.'),
                templateId: z.string().describe('The id of the template.'),
                status: z
                  .enum(['draft', 'active'])
                  .or(z.string())
                  .describe('The lifecycle state of the content version.'),
                subject: z.string(),
                publishedAt: z.string().describe('Date at which this version was published.').optional(),
                createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
                updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
                variables: z
                  .array(
                    z
                      .object({
                        name: z.string().describe('The variable name, case-sensitive.'),
                        type: z.enum(['string', 'number', 'boolean']).or(z.string()).describe('The variable type.'),
                        default: z
                          .union([z.string(), z.number(), z.boolean()])
                          .describe('Used when a broadcast sets no value.')
                          .optional(),
                      })
                      .passthrough(),
                  )
                  .describe('The declared variables.')
                  .optional(),
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
        const templateId = String(args.templateId);
        const page = await nuntly.templates.versions.list(templateId, {
          cursor: args.cursor,
          limit: args.limit,
        } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /templates
  server.registerTool(
    'list-templates',
    {
      title: 'List Templates',
      description: 'List the organization templates.',
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
                id: z.string().describe('The id of the template.'),
                name: z.string().describe('A name for the template, shown only to your team.'),
                status: z.enum(['draft', 'published']).or(z.string()).describe('The lifecycle state of the template.'),
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
        const page = await nuntly.templates.list({ cursor: args.cursor, limit: args.limit } as CursorPageParams);
        return formatStructuredResult({ data: page.data, nextCursor: page.nextCursor });
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /templates/{templateId}/versions/{versionId}/publish
  server.registerTool(
    'publish-template-version',
    {
      title: 'Publish Template Version',
      description: 'Publish a draft template version.',
      inputSchema: z
        .object({
          templateId: z.string().describe('The templateId'),
          versionId: z.string().describe('The versionId'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the template.'),
          templateVersionId: z.string().describe('The id of the version that was published.'),
        })
        .passthrough(),
      annotations: { openWorldHint: true },
    },
    async (args) => {
      try {
        const templateId = String(args.templateId);
        const versionId = String(args.versionId);
        const result = await nuntly.templates.versions.publish(templateId, versionId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /templates/{templateId}
  server.registerTool(
    'retrieve-template',
    {
      title: 'Retrieve Template',
      description: 'Retrieve one template.',
      inputSchema: z
        .object({
          templateId: z.string().describe('The templateId'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the template.'),
          name: z.string().describe('A name for the template, shown only to your team.'),
          status: z.enum(['draft', 'published']).or(z.string()).describe('The lifecycle state of the template.'),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const templateId = String(args.templateId);
        const result = await nuntly.templates.retrieve(templateId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /templates/{templateId}/versions/{versionId}
  server.registerTool(
    'retrieve-template-version',
    {
      title: 'Retrieve Template Version',
      description: 'Retrieve one content version.',
      inputSchema: z
        .object({
          templateId: z.string().describe('The templateId'),
          versionId: z.string().describe('The versionId'),
        })
        .strict(),
      outputSchema: z
        .object({
          id: z.string().describe('The id of the content version.'),
          templateId: z.string().describe('The id of the template.'),
          status: z.enum(['draft', 'active']).or(z.string()).describe('The lifecycle state of the content version.'),
          subject: z.string(),
          publishedAt: z.string().describe('Date at which this version was published.').optional(),
          createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
          updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
          variables: z
            .array(
              z
                .object({
                  name: z.string().describe('The variable name, case-sensitive.'),
                  type: z.enum(['string', 'number', 'boolean']).or(z.string()).describe('The variable type.'),
                  default: z
                    .union([z.string(), z.number(), z.boolean()])
                    .describe('Used when a broadcast sets no value.')
                    .optional(),
                })
                .passthrough(),
            )
            .describe('The declared variables.')
            .optional(),
        })
        .passthrough(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const templateId = String(args.templateId);
        const versionId = String(args.versionId);
        const result = await nuntly.templates.versions.retrieve(templateId, versionId);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // GET /templates/{templateId}/versions/{versionId}/content
  server.registerTool(
    'retrieve-template-version-content',
    {
      title: 'Retrieve Template Version Content',
      description: "Get download links for a version's HTML and text.",
      inputSchema: z
        .object({
          templateId: z.string().describe('The templateId'),
          versionId: z.string().describe('The versionId'),
        })
        .strict(),
      annotations: { openWorldHint: true, readOnlyHint: true },
    },
    async (args) => {
      try {
        const templateId = String(args.templateId);
        const versionId = String(args.versionId);
        const result = await nuntly.templates.versions.content.retrieve(templateId, versionId);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );

  // PATCH /templates/{templateId}
  server.registerTool(
    'update-template',
    {
      title: 'Update Template',
      description: 'Rename a template.',
      inputSchema: z
        .object({
          templateId: z.string().describe('The templateId'),
          name: z.string().describe('A name for the template, shown only to your team.').optional(),
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
        const templateId = String(args.templateId);
        const { templateId: _templateId, ...body } = args;
        const result = await nuntly.templates.update(templateId, body as UpdateTemplateRequest);
        return formatStructuredResult(result);
      } catch (error) {
        return formatError(error);
      }
    },
  );
}
