# SDK conformance vectors

Language-neutral cases that pin the runtime behavior every Nuntly SDK shares. The TypeScript SDK (`nuntly-sdk-typescript`) runs every case of every file in `tests/conformance.test.ts`. The Java SDK (`nuntly-sdk-java`) runs them in `ConformanceTest` in the `core` test sources (retry, errors, pagination, transport) and in the `sdk` test sources (`WebhookConformanceTest`, and `ResourceConformanceTest` for the transport path id cases and forward compatibility). The MCP server (`nuntly-mcp`) runs `errors.json` in `tests/conformance-errors.test.ts`: a failed tool call's text carries the status, code, details and request id.

| File | Pins |
|---|---|
| `webhook.json` | Signature header parsing, secrets, rotation, tolerance in both directions, unknown event types, signed payloads that are not an event |
| `retry.json` | Which responses and errors are retried, how many times, the delay before each retry, idempotency key reuse, the order of the hook calls |
| `errors.json` | The error type for each status and the `status`, `code`, `title`, `details`, `requestId` and `retryAfter` accessors |
| `pagination.json` | The page after the last one, auto-pagination across pages, and a cursor the API returns again |
| `transport.json` | Request URLs built from the base URL and from path ids, the path ids rejected before sending, and the timeout error kept apart from other connection errors |

Each expected outcome comes from the API or from the shared SDK contract, never from running the SDK under test.

A case listed under `runtimes` runs only in those runtimes; it carries a `reason`.

## Error kinds

| Kind | TypeScript | Java |
|---|---|---|
| `bad_request` | `BadRequestError` | `ApiError.BadRequestError` |
| `authentication` | `AuthenticationError` | `ApiError.AuthenticationError` |
| `permission_denied` | `PermissionDeniedError` | `ApiError.PermissionDeniedError` |
| `not_found` | `NotFoundError` | `ApiError.NotFoundError` |
| `conflict` | `ConflictError` | `ApiError.ConflictError` |
| `unprocessable_entity` | `UnprocessableEntityError` | `ApiError.UnprocessableEntityError` |
| `rate_limit` | `RateLimitError` | `ApiError.RateLimitError` |
| `internal_server` | `InternalServerError` | `ApiError.InternalServerError` |
| `api` | `APIError` (no subclass) | `ApiError` (no subclass) |
| `connection` | `APIConnectionError` | `ConnectionError` |
| `timeout` | `APIConnectionTimeoutError` | `ConnectionError.TimeoutError` |
| `hook` | the error the hook threw | the exception the hook threw |
| `no_more_pages` | `Error` with the message `No more pages` | `NoSuchElementException` |
| `sdk` | `NuntlyError` (no subclass) | `NuntlyError` (no subclass) |
