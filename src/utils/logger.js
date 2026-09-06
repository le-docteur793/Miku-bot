export async function sendLog(guild, config, payload) {
  if (
    !guild ||
    !config.logChannelId ||
    config.modules?.logs === false
  ) {
    return null;
  }

  const channel = await guild.channels
    .fetch(config.logChannelId)
    .catch(() => null);

  if (!channel?.isTextBased()) return null;

  return channel.send(payload).catch((error) => {
    console.error('[LOGS] Envoi impossible :', error);
    return null;
  });
}
