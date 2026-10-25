import { z } from 'zod';

export const agentMemoryOutput = () =>
  z
    .object({
      id: z.string().nullable().describe('The agent memory record id.'),
      createdAt: z.string().nullable().describe('Date at which the object was created (ISO 8601 format)'),
      updatedAt: z.string().nullable().describe('Date at which the object was updated (ISO 8601 format)'),
      agentId: z.string().describe('The agent identifier.'),
      inboxId: z.string().nullable().describe('The inbox id.'),
      threadId: z.string().nullable().describe('The thread id.'),
      memory: z.record(z.string(), z.unknown()).describe('The agent memory data.'),
      summary: z.string().nullable().describe('The conversation summary.'),
    })
    .passthrough();
export const apiKeyResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the api key'),
      name: z.string().describe('The name of the api key').optional(),
      shortToken: z.string().describe('The last 6 characters of the api key token'),
      status: apiKeyStatusOutput().describe('The status for the api key'),
      createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
    })
    .passthrough();
export const apiKeyStatusOutput = () => z.enum(['enabled', 'disabled', 'revoked']).or(z.string());
export const attachmentResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the attachment'),
      filename: z.string().nullable().describe('The original filename.'),
      contentType: z.string().describe('The MIME content type.'),
      size: z.number().describe('The size in bytes.'),
      contentDisposition: z.string().nullable().describe('The content disposition (inline or attachment).'),
      contentId: z.string().nullable().describe('The CID for inline images.'),
      downloadUrl: z
        .string()
        .describe('Presigned download URL (included when retrieving a single attachment).')
        .optional(),
    })
    .passthrough();
export const broadcastResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the broadcast.'),
      name: z.string().describe('An internal label, shown only to your team.').optional(),
      templateId: z.string().describe('The id of the template.').optional(),
      templateVersionId: z
        .string()
        .describe('The content version this broadcast sends. Frozen once queued.')
        .optional(),
      domainId: z.string().describe('The id of the sending domain.').optional(),
      topicId: z.string().describe('The topic this broadcast targets.').optional(),
      segmentId: z.string().describe('The segment this broadcast targets.').optional(),
      from: z.string(),
      subject: z.string().describe('The subject, falling back to the template version’s subject.').optional(),
      replyTo: z
        .union([z.string(), z.array(z.string())])
        .describe(
          "The email address where replies should be sent. If a recipient replies, the response will go to this address instead of the sender's email address",
        )
        .optional(),
      status: broadcastStatusOutput().describe('The lifecycle state of the broadcast.'),
      statusAt: z.string().describe('Date at which the broadcast reached its current state.'),
      statusReason: z
        .record(z.string(), z.unknown())
        .describe('May provide more information about the status.')
        .optional(),
      createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
      updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
      variables: z.record(z.string(), z.unknown()).describe('The stored variable values.').optional(),
    })
    .passthrough();
export const broadcastStatusOutput = () =>
  z.enum(['draft', 'scheduled', 'queued', 'sending', 'sent', 'paused', 'failed']).or(z.string());
export const contactPropertyResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the contact property.'),
      name: z
        .string()
        .describe(
          "A name for the property, used as its key in a contact's properties. Stored trimmed, with the letter case it was typed with.",
        ),
      type: z
        .enum(['string', 'number'])
        .or(z.string())
        .describe('The declared type of the property. Immutable after creation.'),
      description: z.string().nullable().describe('An optional description of the property.').optional(),
      defaultValue: z.union([z.string(), z.number()]).optional(),
      createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
      updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
    })
    .passthrough();
export const contactResponseOutput = () =>
  z
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
    .passthrough();
export const contactSegmentMembershipResponseOutput = () =>
  z
    .object({
      contactId: z.string().describe('The id of the contact.'),
      segmentId: z.string().describe('The id of the segment.'),
      createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
    })
    .passthrough();
export const contentOutcomeOutput = () =>
  z.union([
    z
      .object({ status: z.enum(['available']).or(z.string()), downloadUrl: z.string(), expiresAt: z.string() })
      .passthrough(),
    z.object({ status: z.enum(['absent']).or(z.string()) }).passthrough(),
    z.object({ status: z.enum(['unavailable']).or(z.string()) }).passthrough(),
  ]);
export const domainReceivingStatusOutput = () =>
  z.enum(['disabled', 'bootstrapping', 'pending', 'active', 'failed']).or(z.string());
export const domainRecordsResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the domain'),
      name: z.string().describe("The name of the domain to send e-mails'"),
      createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
      status: domainStatusOutput().describe('The status for the domain'),
      region: z.enum(['eu-west-1']).or(z.string()).describe('The region of the domain data'),
      statusAt: z.string().describe('The date of the lastest verification of this record'),
      sending: z.boolean().describe('Whether sending is enabled for the domain'),
      receiving: z.boolean().describe('Whether receiving is enabled for the domain'),
      sendingStatus: domainSendingStatusOutput().describe('The sending status for the domain'),
      sendingStatusAt: z.string().describe('The date of the latest sending status change'),
      receivingStatus: domainReceivingStatusOutput().describe('The receiving status for the domain'),
      receivingStatusAt: z.string().describe('The date of the latest receiving status change'),
      openTracking: z.boolean().describe('Emit an event for each recipient opens an email their email client'),
      clickTracking: z.boolean().describe('Emit an event for each time the recipient clicks a link in the email'),
      records: z
        .array(
          z
            .object({
              name: z.string(),
              fullname: z.string(),
              recordType: z.enum(['TXT', 'MX', 'CNAME']).or(z.string()),
              ttl: z.string(),
              group: z.enum(['DKIM', 'SPF', 'MX', 'DMARC', 'MX_RECEIVING']).or(z.string()),
              selector: z.string().optional(),
              priority: z.string().optional(),
              value: z.string(),
              status: z.enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure']).or(z.string()),
              statusAt: z.string(),
            })
            .passthrough(),
        )
        .describe('The DNS records for your domain.'),
    })
    .passthrough();
export const domainSendingStatusOutput = () => z.enum(['enabled', 'disabled', 'paused']).or(z.string());
export const domainStatusOutput = () =>
  z.enum(['bootstrapping', 'pending', 'success', 'failed', 'temporary_failure']).or(z.string());
export const emailContentItemOutput = () =>
  z
    .object({
      downloadUrl: z.string().describe('Presigned download URL.'),
      size: z.number().nullable().describe('Uncompressed size in bytes.'),
      expiresAt: z.string().describe('When the URL expires.'),
    })
    .passthrough();
export const emailStatusOutput = () =>
  z
    .enum([
      'queued',
      'scheduled',
      'processed',
      'failed',
      'sending',
      'sent',
      'delivered',
      'bounced',
      'complained',
      'canceled',
      'rejected',
    ])
    .or(z.string());
export const eventTypeOutput = () =>
  z
    .enum([
      'email.queued',
      'email.scheduled',
      'email.processed',
      'email.sending',
      'email.sent',
      'email.delivered',
      'email.opened',
      'email.clicked',
      'email.bounced',
      'email.complained',
      'email.rejected',
      'email.deliveryDelayed',
      'email.failed',
      'email.renderingFailed',
      'email.subscribed',
      'email.unsubscribed',
      'message.received',
      'message.security.flagged',
      'message.agent.triggered',
      'message.sent',
      'message.rejected',
    ])
    .or(z.string());
export const idResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the resource.'),
    })
    .passthrough();
export const inboxResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the inbox'),
      createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
      updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)').optional(),
      domainId: z.string().describe('The id of the domain.'),
      domainName: z.string().describe('The domain name.'),
      address: z.string().describe('The local-part of the email address.'),
      name: z.string().nullable().describe('The display name of the inbox.'),
      namespaceId: z.string().nullable().describe('The id of the namespace.'),
      namespaceName: z.string().nullable().describe('The display name of the namespace.'),
      agentId: z.string().nullable().describe('The AI agent identifier.'),
    })
    .passthrough();
export const messageContentItemOutput = () =>
  z
    .object({
      downloadUrl: z.string().describe('Presigned download URL.'),
      size: z.number().nullable().describe('Uncompressed size in bytes.'),
      expiresAt: z.string().describe('When the URL expires.'),
    })
    .passthrough();
export const namespaceResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the namespace'),
      createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
      updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)').optional(),
      name: z.string().describe('The display name of the namespace.'),
      externalId: z.string().nullable().describe('The external identifier for the namespace.'),
    })
    .passthrough();
export const organizationResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the organization'),
      name: z.string().describe('The name of the organization'),
      status: z.enum(['enabled', 'disabled']).or(z.string()).describe('The status of the organization'),
    })
    .passthrough();
export const segmentResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the segment.'),
      name: z.string().describe('A name for the segment, shown to your team. Stored lowercased and trimmed.'),
      createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
      updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
    })
    .passthrough();
export const sendMessageResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the message'),
      threadId: z.string().describe('The id of the thread.'),
      messageId: z.string().describe('The RFC 5322 Message-ID header.'),
      subject: z.string().describe('The subject of the message.'),
    })
    .passthrough();
export const tagInput = () =>
  z
    .object({
      name: z.string().describe('The name of the tag'),
      value: z.string().describe('The tag to add to the email'),
    })
    .strict();
export const templateResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the template.'),
      name: z.string().describe('A name for the template, shown only to your team.'),
      status: z.enum(['draft', 'published']).or(z.string()).describe('The lifecycle state of the template.'),
      createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
      updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
    })
    .passthrough();
export const templateVersionResponseOutput = () =>
  z
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
    .passthrough();
export const threadResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the thread'),
      createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
      updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)').optional(),
      domainId: z.string().nullable().describe('The id of the domain.'),
      domainName: z.string().describe('The domain name.'),
      inboxId: z.string().describe('The id of the inbox.'),
      subject: z.string().describe('The original subject line.'),
      lastMessageAt: z.string().describe('The timestamp of the most recent message.'),
      messageCount: z.number().describe('The number of messages in the thread.'),
      labels: z.array(z.string()).describe('Aggregated labels from all messages in the thread.'),
      agentId: z.string().nullable().describe('The AI agent identifier.'),
    })
    .passthrough();
export const topicMembershipStateOutput = () => z.enum(['subscribed', 'unsubscribed']).or(z.string());
export const topicResponseOutput = () =>
  z
    .object({
      id: z.string().describe('The id of the topic.'),
      name: z.string().describe('A name for the topic, shown to your team. Stored lowercased and trimmed.'),
      createdAt: z.string().describe('Date at which the object was created (ISO 8601 format)'),
      updatedAt: z.string().describe('Date at which the object was updated (ISO 8601 format)'),
    })
    .passthrough();
export const webhookDisabledReasonOutput = () => z.enum(['manual', 'auto_consecutive_failures']).or(z.string());
export const webhookEventTypeInput = () =>
  z.enum([
    'email.sent',
    'email.delivered',
    'email.opened',
    'email.clicked',
    'email.bounced',
    'email.complained',
    'email.rejected',
    'email.deliveryDelayed',
    'email.failed',
    'message.received',
    'message.security.flagged',
    'message.agent.triggered',
    'message.sent',
    'message.rejected',
  ]);
export const webhookMutableStatusInput = () => z.enum(['enabled', 'disabled']);
export const webhookStatusOutput = () => z.enum(['enabled', 'disabled', 'revoked']).or(z.string());
