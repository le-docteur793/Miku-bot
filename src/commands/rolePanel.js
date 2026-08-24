import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import {
  canManageRole,
} from '../utils/permissions.js';

export const rolePanelCommand = {
  data: new SlashCommandBuilder()
    .setName('panneau-role')
    .setDescription(
      'Crée un bouton donnant ou retirant un rôle',
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageRoles,
    )
    .addRoleOption((option) =>
      option
        .setName('role')
        .setDescription(
          'Rôle à attribuer',
        )
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('texte')
        .setDescription(
          'Texte affiché sur le bouton',
        )
        .setMaxLength(80),
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
    const role =
      interaction.options.getRole(
        'role',
        true,
      );

    if (
      !canManageRole(
        interaction.guild,
        role,
      )
    ) {
      return interaction.reply({
        content:
          `❌ Place le rôle du bot au-dessus de ` +
          `${role.toString()} dans la hiérarchie.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const label = (
      interaction.options.getString(
        'texte',
      ) ||
      `Obtenir le rôle ${role.name}`
    ).slice(0, 80);

    const channel =
      interaction.options.getChannel(
        'salon',
      ) || interaction.channel;

    const embed = new EmbedBuilder()
      .setColor(
        role.color || config.embedColor,
      )
      .setTitle('🏷️ Rôle automatique')
      .setDescription(
        'Clique sur le bouton pour obtenir ' +
        `ou retirer le rôle ${role.toString()}.`,
      );

    const button = new ButtonBuilder()
      .setCustomId(
        `role_toggle:${role.id}`,
      )
      .setLabel(label)
      .setStyle(ButtonStyle.Secondary);

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