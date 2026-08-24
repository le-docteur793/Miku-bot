import {
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

function getQueue(player, guildId) {
  return player.nodes.get(guildId);
}

function getVoiceProblem(interaction) {
  const memberChannel =
    interaction.member.voice.channel;

  if (!memberChannel) {
    return 'Rejoins d’abord un salon vocal.';
  }

  const botChannelId =
    interaction.guild.members.me
      ?.voice.channelId;

  if (
    botChannelId &&
    botChannelId !== memberChannel.id
  ) {
    return (
      'Rejoins le même salon vocal que le bot.'
    );
  }

  return null;
}

function privateMessage(
  interaction,
  content,
) {
  return interaction.reply({
    content,
    flags: MessageFlags.Ephemeral,
  });
}

export const musicCommand = {
  data: new SlashCommandBuilder()
    .setName('musique')
    .setDescription(
      'Contrôle le lecteur de musique',
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('lire')
        .setDescription(
          'Recherche ou ajoute une musique',
        )
        .addStringOption((option) =>
          option
            .setName('recherche')
            .setDescription(
              'Titre ou lien SoundCloud, Spotify, Vimeo ou audio direct',
            )
            .setRequired(true),
        ),
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('pause')
        .setDescription(
          'Met la musique en pause',
        ),
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('reprendre')
        .setDescription(
          'Reprend la lecture',
        ),
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('passer')
        .setDescription(
          'Passe la musique actuelle',
        ),
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('arreter')
        .setDescription(
          'Arrête la musique et vide la file',
        ),
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('file')
        .setDescription(
          'Affiche la file d’attente',
        ),
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName('volume')
        .setDescription(
          'Modifie le volume',
        )
        .addIntegerOption((option) =>
          option
            .setName('niveau')
            .setDescription(
              'Volume entre 1 et 150',
            )
            .setMinValue(1)
            .setMaxValue(150)
            .setRequired(true),
        ),
    ),

  async execute(
    interaction,
    { player, config },
  ) {
    const action =
      interaction.options.getSubcommand();

    const voiceProblem =
      getVoiceProblem(interaction);

    if (voiceProblem) {
      return privateMessage(
        interaction,
        `❌ ${voiceProblem}`,
      );
    }

    if (action === 'lire') {
      const query =
        interaction.options.getString(
          'recherche',
          true,
        );

      if (
        /youtu(?:\.be|be\.com)/i.test(
          query,
        )
      ) {
        return privateMessage(
          interaction,
          '❌ Les liens YouTube ne sont pas pris en charge. ' +
          'Utilise une recherche, SoundCloud, Spotify, ' +
          'Vimeo ou un lien audio direct.',
        );
      }

      await interaction.deferReply();

      const result = await player.play(
        interaction.member.voice.channel,
        query,
        {
          requestedBy: interaction.user,

          nodeOptions: {
            metadata: {
              channelId:
                interaction.channelId,
            },

            bufferingTimeout: 15_000,

            leaveOnStop: true,
            leaveOnStopCooldown: 5_000,

            leaveOnEnd: true,
            leaveOnEndCooldown: 15_000,

            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 60_000,

            skipOnNoStream: true,
          },
        },
      );

      return interaction.editReply(
        `🎵 **${result.track.title}** ` +
        'a été ajoutée à la file.',
      );
    }

    const queue = getQueue(
      player,
      interaction.guildId,
    );

    if (!queue) {
      return privateMessage(
        interaction,
        '❌ Aucune musique n’est en cours.',
      );
    }

    if (action === 'pause') {
      if (!queue.isPlaying()) {
        return privateMessage(
          interaction,
          '❌ Aucune musique n’est en cours de lecture.',
        );
      }

      queue.node.setPaused(true);

      return interaction.reply(
        '⏸️ Musique mise en pause.',
      );
    }

    if (action === 'reprendre') {
      queue.node.setPaused(false);

      return interaction.reply(
        '▶️ Lecture reprise.',
      );
    }

    if (action === 'passer') {
      if (!queue.currentTrack) {
        return privateMessage(
          interaction,
          '❌ Aucune musique à passer.',
        );
      }

      const title =
        queue.currentTrack.title;

      queue.node.skip();

      return interaction.reply(
        `⏭️ **${title}** a été passée.`,
      );
    }

    if (action === 'arreter') {
      queue.delete();

      return interaction.reply(
        '⏹️ Musique arrêtée et file vidée.',
      );
    }

    if (action === 'volume') {
      const volume =
        interaction.options.getInteger(
          'niveau',
          true,
        );

      queue.node.setVolume(volume);

      return interaction.reply(
        `🔊 Volume réglé sur **${volume} %**.`,
      );
    }

    if (action === 'file') {
      const upcoming = queue.tracks
        .toArray()
        .slice(0, 10);

      const current =
        queue.currentTrack
          ? `**En cours :** ` +
            `${queue.currentTrack.title} — ` +
            `${queue.currentTrack.author}`
          : '**En cours :** aucune musique';

      const list = upcoming.length
        ? upcoming
            .map(
              (track, index) =>
                `${index + 1}. ` +
                `${track.title} — ` +
                `${track.author}`,
            )
            .join('\n')
        : 'La file est vide.';

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎵 File musicale')
        .setDescription(
          `${current}\n\n` +
          `**À suivre :**\n${list}`,
        )
        .setFooter({
          text:
            `${upcoming.length} ` +
            'titre(s) affiché(s)',
        });

      return interaction.reply({
        embeds: [embed],
      });
    }
  },
};