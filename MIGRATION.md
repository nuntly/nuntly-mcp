# Migration guide

## `v1.x` → `v2.0.0`

These changes can break a 1.x setup.

### Tools refuse unknown arguments

A tool call with an argument the tool does not declare, at the top level or inside a nested object such as an attachment or a bulk email item, returns an error result that names the argument, and no request reaches the API. 1.x dropped the argument and ran the call without it: `send-email` with `scheduled_at` instead of `scheduledAt` sent the email at once. Use the argument names that `tools/list` returns.

### `limit` takes an integer from 1 to 30

The `limit` argument of every list tool refuses a value that is not an integer from 1 to 30, and no request reaches the API. 1.x passed any number to the API, which refuses a value outside that range.

### `retrieve-thread` asks before it runs

`retrieve-thread` no longer carries `readOnlyHint: true`, since `markRead: 'true'` removes the unread labels. It carries `destructiveHint: false` and `idempotentHint: true` instead. A client that runs read-only tools without asking now asks before calling it. Its `markRead` takes `'true'` or `'false'` only.

### Keep a single `@nuntly/sdk` copy for `registerTools`

`registerTools` takes your `Nuntly` client and calls the methods of this version on it, such as `emails.bulk.retrieve` (1.x: `emails.bulk.list`). Your project needs a single copy of `@nuntly/sdk` that satisfies this package's dependency on it: the same version for a prerelease, this version or a later 2.x for a release. A client from a second copy does not type-check, and in JavaScript it can make a tool return an error result. `npm ls @nuntly/sdk`, or your package manager's equivalent, shows the copies your project holds; `npm dedupe` merges duplicate copies. The stdio server (`npx @nuntly/sdk-mcp`) creates its own client and is not affected.

### Tool names follow the SDK names

Every tool name is now the name its SDK method implies: `nuntly.emails.bulk.send()` is `send-email-bulk`. The tool names are the OpenAPI `operationId`s, renamed the same way. `list-webhook-event-deliveries` keeps its 1.x name. The renamed tools, and whether the old name shipped in 1.x:

| Before | 2.0.0 | In 1.x |
|---|---|---|
| `send-bulk-emails` | `send-email-bulk` | yes |
| `retrieve-bulk-emails` | `retrieve-email-bulk` | yes |
| `retrieve-email-events` | `list-email-events` | yes |
| `reply-to-message` | `reply-message` | yes |
| `list-webhooks-events` | `list-webhook-events` | yes |
| `add-contact-segment-membership` | `add-contact-segment` | no |
| `check-contact-segment-membership` | `retrieve-contact-segment` | no |
| `remove-contact-segment-membership` | `remove-contact-segment` | no |
| `list-contact-topic-memberships` | `list-contact-topics` | no |
| `set-contact-topic-membership` | `update-contact-topic` | no |
| `create-contact-property-definition` | `create-contact-property` | no |
| `list-contact-property-definitions` | `list-contact-properties` | no |
| `retrieve-contact-property-definition` | `retrieve-contact-property` | no |
| `update-contact-property-definition` | `update-contact-property` | no |
| `delete-contact-property-definition` | `delete-contact-property` | no |
| `list-topic-membership-exceptions` | `list-topic-memberships` | no |

Update every place that names a tool: an MCP client allowlist or permission rule (for example an `allowedTools` entry), and a prompt or agent configuration that names a tool.

### Changes from the TypeScript SDK

The server sends its requests through `@nuntly/sdk`, so these changes of the [SDK migration guide](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/MIGRATION.md) apply to it too:

- The server retries a conflict only when the API asks for it, and retries a call that creates something after a server or network error only when it carries an idempotency key, which the sending tools generate. See [Retries and non-JSON errors](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/MIGRATION.md#5-retries-and-non-json-errors).
- `retrieve-agent-memory` returns an empty memory instead of a not-found error when nothing is saved, and `upsert-agent-memory` checks the inbox and thread. See [Agent memory reads as empty](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/MIGRATION.md#3-agent-memory-reads-as-empty). The API serves this empty memory to a 1.x server too, whose `retrieve-agent-memory` then fails its output validation.
- The `events` argument of `create-webhook` and `update-webhook` accepts the 14 event types a webhook delivers. The 7 internal types (such as `email.queued` or `email.unsubscribed`) fail input validation. See [Webhooks use the webhook event types only](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/MIGRATION.md#6-webhooks-use-the-webhook-event-types-only).
- A path id equal to `''`, `.` or `..` fails before any request is sent. See [Fixed in 2.0.0](https://github.com/nuntly/nuntly-sdk-typescript/blob/main/MIGRATION.md#fixed-in-200).

### Fixed in 2.0.0

The output schemas accept fields added by later API releases, at every object level. Since 1.x every output object rejected unknown fields, so a client validating `structuredContent` failed a call that had succeeded on the API (a `send-email` could send the email and still report an error). Input schemas stay closed.

A failed tool call's text holds the API error `code` and its `details`, such as the field a 422 names, next to the HTTP status, the message and the request id. Since 1.x it read a `body.errors` field the SDK error does not have, so the code and the details were lost.
