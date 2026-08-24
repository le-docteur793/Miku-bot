import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { sendLog } from '../utils/logger.js';

export const clearCommand = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription(
      'Supprime plusieurs messages du salon',
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages,
    )
    .addIntegerOption((option) =>
      option
        .setName('nombre')
        .setDescription(
          'Nombre de messages à supprimer',
        )
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    ),

  async execute(interaction, { config }) {
    const channel = interaction.channel;

    if (
      !channel?.isTextBased() ||
      !('bulkDelete' in channel)
    ) {
      return interaction.reply({
        content:
          '❌ Cette commande ne fonctionne pas dans ce salon.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const amount =
      interaction.options.getInteger(
        'nombre',
        true,
      );

    const deleted = await channel.bulkDelete(
      amount,
      true,
    );

    await interaction.reply({
      content:
        `✅ ${deleted.size} message(s) supprimé(s).`,
      flags: MessageFlags.Ephemeral,
    });

    const logEmbed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('🧹 Messages supprimés')
      .addFields(
        {
          name: 'Modérateur',
          value: interaction.user.toString(),
          inline: true,
        },
        {
          name: 'Salon',
          value: channel.toString(),
          inline: true,
        },
        {
          name: 'Nombre',
          value: String(deleted.size),
          inline: true,
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