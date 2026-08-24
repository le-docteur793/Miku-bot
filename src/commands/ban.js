import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { sendLog } from '../utils/logger.js';

export const banCommand = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription(
      'Bannit un membre du serveur',
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.BanMembers,
    )
    .addUserOption((option) =>
      option
        .setName('membre')
        .setDescription('Membre à bannir')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('raison')
        .setDescription(
          'Raison du bannissement',
        )
        .setMaxLength(500),
    )
    .addIntegerOption((option) =>
      option
        .setName('suppression')
        .setDescription(
          'Nombre de jours de messages à supprimer',
        )
        .setMinValue(0)
        .setMaxValue(7),
    ),

  async execute(interaction, { config }) {
    const user =
      interaction.options.getUser(
        'membre',
        true,
      );

    const member =
      interaction.options.getMember(
        'membre',
      );

    const reason =
      interaction.options.getString(
        'raison',
      ) || 'Aucune raison précisée';

    const deleteDays =
      interaction.options.getInteger(
        'suppression',
      ) ?? 0;

    if (user.id === interaction.user.id) {
      return interaction.reply({
        content:
          '❌ Tu ne peux pas te bannir toi-même.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (member && !member.bannable) {
      return interaction.reply({
        content:
          '❌ Je ne peux pas bannir ce membre. Vérifie la hiérarchie des rôles.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await user
      .send(
        `Tu as été banni de ` +
        `**${interaction.guild.name}**.\n` +
        `Raison : ${reason}`,
      )
      .catch(() => null);

    await interaction.guild.members.ban(
      user,
      {
        reason,
        deleteMessageSeconds:
          deleteDays * 86_400,
      },
    );

    await interaction.reply({
      content:
        `✅ **${user.tag}** a été banni.`,
      flags: MessageFlags.Ephemeral,
    });

    const logEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🔨 Membre banni')
      .addFields(
        {
          name: 'Membre',
          value:
            `${user.tag} (${user.id})`,
        },
        {
          name: 'Modérateur',
          value: interaction.user.toString(),
          inline: true,
        },
        {
          name: 'Raison',
          value: reason,
        },
      )
      .setTimestamp();

    await sendLog(
      interaction.guild,
      config,
      {
        embeds: [logEmbed],
      },
    );
  },
};