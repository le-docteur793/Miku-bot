import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from '../discord.js';

import { sendLog } from '../utils/logger.js';

export const timeoutCommand = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription(
      'Place temporairement un membre en sourdine',
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers,
    )
    .addUserOption((option) =>
      option
        .setName('membre')
        .setDescription('Membre concerné')
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('minutes')
        .setDescription(
          'Durée du timeout en minutes',
        )
        .setMinValue(1)
        .setMaxValue(40_320)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('raison')
        .setDescription(
          'Raison du timeout',
        )
        .setMaxLength(500),
    ),

  async execute(interaction, { config }) {
    const member =
      interaction.options.getMember(
        'membre',
      );

    const minutes =
      interaction.options.getInteger(
        'minutes',
        true,
      );

    const reason =
      interaction.options.getString(
        'raison',
      ) || 'Aucune raison précisée';

    if (!member || !member.moderatable) {
      return interaction.reply({
        content:
          '❌ Je ne peux pas placer ce membre en timeout.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await member.timeout(
      minutes * 60_000,
      reason,
    );

    await interaction.reply({
      content:
        `✅ **${member.user.tag}** est en timeout ` +
        `pendant ${minutes} minute(s).`,
      flags: MessageFlags.Ephemeral,
    });

    const logEmbed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('⏳ Timeout appliqué')
      .addFields(
        {
          name: 'Membre',
          value: member.toString(),
          inline: true,
        },
        {
          name: 'Durée',
          value: `${minutes} minute(s)`,
          inline: true,
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
