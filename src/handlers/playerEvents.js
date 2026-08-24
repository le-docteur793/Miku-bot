import {
  EmbedBuilder,
} from 'discord.js';

async function getMetadataChannel(
  client,
  queue,
) {
  const channelId =
    queue.metadata?.channelId;

  if (!channelId) {
    return null;
  }

  const channel =
    await client.channels
      .fetch(channelId)
      .catch(() => null);

  return channel?.isTextBased()
    ? channel
    : null;
}

export function registerPlayerEvents(
  player,
  { client, config },
) {
  player.events.on(
    'playerStart',
    async (queue, track) => {
      const channel =
        await getMetadataChannel(
          client,
          queue,
        );

      if (!channel) {
        return;
      }

      const embed =
        new EmbedBuilder()
          .setColor(
            config.embedColor,
          )
          .setTitle(
            '🎵 Lecture en cours',
          )
          .setDescription(
            `**${track.title}**\n` +
            `${track.author}`,
          )
          .setThumbnail(
            track.thumbnail || null,
          )
          .setFooter({
            text: track.requestedBy
              ? `Demandé par ` +
                `${track.requestedBy.username}`
              : config.brandName,
          });

      await channel
        .send({
          embeds: [embed],
        })
        .catch(() => null);
    },
  );

  const reportError =
    async (queue, error) => {
      console.error(
        '[MUSIQUE] Erreur :',
        error,
      );

      const channel =
        await getMetadataChannel(
          client,
          queue,
        );

      if (channel) {
        await channel
          .send(
            '❌ Impossible de lire cette musique. ' +
            'Essaie une autre source ou vérifie FFmpeg.',
          )
          .catch(() => null);
      }
    };

  player.events.on(
    'error',
    reportError,
  );

  player.events.on(
    'playerError',
    reportError,
  );
}