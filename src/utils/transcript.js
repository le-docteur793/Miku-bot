export async function createTranscript(channel) {
  const messages = await channel.messages.fetch({
    limit: 100,
  });

  const lines = [...messages.values()]
    .sort(
      (firstMessage, secondMessage) =>
        firstMessage.createdTimestamp -
        secondMessage.createdTimestamp,
    )
    .map((message) => {
      const timestamp = new Date(
        message.createdTimestamp,
      ).toLocaleString('fr-FR');

      const content =
        message.content || '[message sans texte]';

      const attachments = [
        ...message.attachments.values(),
      ]
        .map((attachment) => attachment.url)
        .join(' ');

      return (
        `[${timestamp}] ${message.author.tag} : ${content}` +
        (attachments ? ` ${attachments}` : '')
      );
    });

  return Buffer.from(
    `Transcription de #${channel.name}\n\n` +
    `${lines.join('\n')}\n`,
    'utf8',
  );
}