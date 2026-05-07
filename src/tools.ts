import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Nuntly } from '@nuntly/sdk';
import { registerAgentsTools } from './tools/agents.js';
import { registerApiKeysTools } from './tools/api-keys.js';
import { registerDomainsTools } from './tools/domains.js';
import { registerEmailsTools } from './tools/emails.js';
import { registerInboxesTools } from './tools/inboxes.js';
import { registerMessagesTools } from './tools/messages.js';
import { registerNamespacesTools } from './tools/namespaces.js';
import { registerOrganizationsTools } from './tools/organizations.js';
import { registerThreadsTools } from './tools/threads.js';
import { registerWebhooksTools } from './tools/webhooks.js';
import { registerWebhooksEventsTools } from './tools/webhooks-events.js';

export function registerTools(server: McpServer, nuntly: Nuntly): void {
  registerAgentsTools(server, nuntly);
  registerApiKeysTools(server, nuntly);
  registerDomainsTools(server, nuntly);
  registerEmailsTools(server, nuntly);
  registerInboxesTools(server, nuntly);
  registerMessagesTools(server, nuntly);
  registerNamespacesTools(server, nuntly);
  registerOrganizationsTools(server, nuntly);
  registerThreadsTools(server, nuntly);
  registerWebhooksTools(server, nuntly);
  registerWebhooksEventsTools(server, nuntly);
}
