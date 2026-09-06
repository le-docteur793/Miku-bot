import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from '../discord.js';

export const applicationPanelCommand = {
  data: new SlashCommandBuilder()
    .setName('panneau-candidature')
    .setDescription(
      'Installe le panneau de candidatures',
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild,
    )
    .addChannelOption((option) =>
      option
        .setName('salon')
        .setDescription(
          'Salon dans lequel installer le panneau',
        )
        .addChannelTypes(
          ChannelType.GuildText,
        ),
    ),

  async execute(interaction, { config }) {
    if (!config.modules.applications) {
      return interaction.reply({
        content:
          '❌ Le module Candidatures est désactivé dans /configuration.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      !config.applicationChannelId ||
      !config.staffRoleIds.length
    ) {
      return interaction.reply({
        content:
          '❌ Configure le salon des candidatures et les rôles du staff avec /configuration.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const channel =
      interaction.options.getChannel(
        'salon',
      ) || interaction.channel;

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(
        `📋 Recrutement ${config.brandName}`,
      )
      .setDescription(
        'Tu souhaites rejoindre notre équipe ? ' +
        'Clique sur le bouton et remplis le formulaire.\n\n' +
        'Prends le temps de répondre sérieusement ' +
        'à toutes les questions.',
      );

    const button = new ButtonBuilder()
      .setCustomId('application_open')
      .setLabel(
        'Déposer une candidature',
      )
      .setEmoji('📋')
      .setStyle(ButtonStyle.Success);

    const row =
      new ActionRowBuilder().addComponents(
        button,
      );

    await channel.send({
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({
      content:
        `✅ Panneau installé dans ` +
        `${channel.toString()}.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
