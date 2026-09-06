import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from '../discord.js';

import { sendLog } from '../utils/logger.js';

export const kickCommand = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription(
      'Expulse un membre du serveur',
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.KickMembers,
    )
    .addUserOption((option) =>
      option
        .setName('membre')
        .setDescription('Membre à expulser')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('raison')
        .setDescription(
          'Raison de l’expulsion',
        )
        .setMaxLength(500),
    ),

  async execute(interaction, { config }) {
    const member =
      interaction.options.getMember(
        'membre',
      );

    const reason =
      interaction.options.getString(
        'raison',
      ) || 'Aucune raison précisée';

    if (!member) {
      return interaction.reply({
        content:
          '❌ Ce membre est introuvable.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (member.id === interaction.user.id) {
      return interaction.reply({
        content:
          '❌ Tu ne peux pas t’expulser toi-même.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        content:
          '❌ Je ne peux pas expulser ce membre. Vérifie la hiérarchie des rôles.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await member
      .send(
        `Tu as été expulsé de ` +
        `**${interaction.guild.name}**.\n` +
        `Raison : ${reason}`,
      )
      .catch(() => null);

    await member.kick(reason);

    await interaction.reply({
      content:
        `✅ **${member.user.tag}** a été expulsé.`,
      flags: MessageFlags.Ephemeral,
    });

    const logEmbed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle('👢 Membre expulsé')
      .addFields(
        {
          name: 'Membre',
          value:
            `${member.user.tag} ` +
            `(${member.id})`,
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
