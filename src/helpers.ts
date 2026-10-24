export function formatResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

/**
 * Builds a CallToolResult with both a textual `content` block (for MCP
 * clients that don't validate against `outputSchema`) and a
 * `structuredContent` payload that the MCP server validates against the
 * tool's `outputSchema`. The cast is safe by construction: every caller
 * passes a value the SDK already typed as a plain JSON object.
 */
export function formatStructuredResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data as Record<string, unknown>,
  };
}

/**
 * Structural narrowing helper for the shape `APIError` exposes from
 * `@nuntly/sdk`. We avoid `instanceof APIError` to keep `helpers.ts`
 * free of a runtime import (this file is bundled by tsup and a value
 * import would force the whole SDK into the MCP bundle even when only
 * the error formatter is reached).
 */
interface ApiErrorShape {
  status?: number;
  message?: string;
  requestId?: string | null;
  body?: { errors?: unknown };
}

function isApiErrorShape(e: unknown): e is ApiErrorShape {
  return typeof e === 'object' && e !== null;
}

export function formatError(error: unknown) {
  const e: ApiErrorShape = isApiErrorShape(error) ? error : {};
  const parts: string[] = [e.message ?? String(error)];
  if (e.status) parts.unshift(`HTTP ${e.status}`);
  if (e.requestId) parts.push(`(request: ${e.requestId})`);
  if (e.body?.errors) parts.push(`Fields: ${JSON.stringify(e.body.errors)}`);
  return { content: [{ type: 'text' as const, text: parts.join(' - ') }], isError: true };
}
