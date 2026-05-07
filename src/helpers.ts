export function formatResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

export function formatError(error: unknown) {
  const e = error as any;
  const parts: string[] = [e?.message ?? String(error)];
  if (e?.status) parts.unshift(`HTTP ${e.status}`);
  if (e?.requestId) parts.push(`(request: ${e.requestId})`);
  if (e?.body?.errors) parts.push(`Fields: ${JSON.stringify(e.body.errors)}`);
  return { content: [{ type: 'text' as const, text: parts.join(' - ') }], isError: true };
}
