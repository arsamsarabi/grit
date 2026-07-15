export type CommitMessageParts = {
  type: string;
  scope?: string;
  summary: string;
  body?: string;
  emojiEnabled?: boolean;
  emojiMap?: Record<string, string>;
};

export function formatCommitMessage(parts: CommitMessageParts): string {
  const scope = parts.scope?.trim() ? `(${parts.scope.trim()})` : "";
  let subject = `${parts.type}${scope}: ${parts.summary.trim()}`;

  if (parts.emojiEnabled) {
    const emoji = parts.emojiMap?.[parts.type];
    if (emoji) {
      subject = `${emoji} ${subject}`;
    }
  }

  const body = parts.body?.trim();
  return body ? `${subject}\n\n${body}` : subject;
}
