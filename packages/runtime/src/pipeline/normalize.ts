import type {
  Message,
  Attachment,
  RawMessage,
} from "@agentik-os/shared";

export function normalizeMessage(raw: RawMessage): Message {
  return {
    id: generateMessageId(),
    channel: raw.channel,
    channelMessageId: raw.channelMessageId,
    userId: raw.userId,
    agentId: raw.agentId || "default",
    content: raw.content,
    attachments: normalizeAttachments(raw.attachments),
    metadata: raw.metadata || {},
    timestamp: raw.timestamp || new Date(),
  };
}

function normalizeAttachments(
  rawAttachments?: unknown[]
): Attachment[] | undefined {
  if (!rawAttachments || rawAttachments.length === 0) {
    return undefined;
  }

  return rawAttachments
    .filter(isValidAttachment)
    .map((raw) => normalizeAttachment(raw));
}

function isValidAttachment(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const attachment = raw as Record<string, unknown>;
  return (
    typeof attachment.type === "string" &&
    typeof attachment.mimeType === "string"
  );
}

function normalizeAttachment(raw: unknown): Attachment {
  const attachment = raw as Record<string, unknown>;
  return {
    type: String(attachment.type) as Attachment["type"],
    mimeType: String(attachment.mimeType),
    url: attachment.url ? String(attachment.url) : undefined,
    filename: attachment.filename ? String(attachment.filename) : undefined,
    size: attachment.size ? Number(attachment.size) : undefined,
  };
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
