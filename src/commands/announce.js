import {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

const parseColor = (value, fallback) => {
  if (!value) return fallback;

  const normalized = value.replace('#', '');

  return /^[0-9A-Fa-f]{6}$/.test(normalized)
    ? Number.parseInt(normalized, 16)
    : fallback;
};

export const announceCommand = {
  data: new SlashCommandBuilder()
    .setName('annonce')
    .setDescription(
      'Publie une annonce officielle',
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages,
    )
    .addChannelOption((option) =>
      option
        .setName('salon')
        .setDescription(
          'Salon dans lequel publier',
        )
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildAnnouncement,
        )
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('titre')
        .setDescription(
          'Titre de l’annonce',
        )
        .setMaxLength(256)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription(
          'Contenu de l’annonce',
        )
        .setMaxLength(4000)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('couleur')
        .setDescription(
          'Couleur hexadécimale : 6D5DFC',
        ),
    )
    .addStringOption((option) =>
      option
        .setName('image')
        .setDescription(
          'Lien HTTPS vers une image',
        ),
    ),

  async execute(interaction, { config }) {
    const channel =
      interaction.options.getChannel(
        'salon',
        true,
      );

    const title =
      interaction.options.getString(
        'titre',
        true,
      );

    const message =
      interaction.options.getString(
        'message',
        true,
      );

    const image =
      interaction.options.getString(
        'image',
      );

    if (
      image &&
      !/^https:\/\//i.test(image)
    ) {
      return interaction.reply({
        content:
          '❌ Le lien doit commencer par https://',
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(
        parseColor(
          interaction.options.getString(
            'couleur',
          ),
          config.embedColor,
        ),
      )
      .setTitle(title)
      .setDescription(message)
      .setFooter({
        text:
          `${config.brandName} • ` +
          `Publié par ${interaction.user.username}`,
        iconURL:
          interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    if (image) {
      embed.setImage(image);
    }

    await channel.send({
      embeds: [embed],
    });

    await interaction.reply({
      content:
        `✅ Annonce publiée dans ` +
        `${channel.toString()}.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};