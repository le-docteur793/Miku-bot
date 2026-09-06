import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from '../discord.js';

import {
  addWarning,
  clearWarnings,
  listWarnings,
} from '../utils/warningstore.js';

import { sendLog } from '../utils/logger.js';
import { truncate } from '../utils/replies.js';

export const warningsCommand = {
  data: new SlashCommandBuilder()
    .setName('avertissement')
    .setDescription(
      'Gère les avertissements des membres',
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers,
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('ajouter')
        .setDescription(
          'Ajoute un avertissement',
        )
        .addUserOption((option) =>
          option
            .setName('membre')
            .setDescription(
              'Membre concerné',
            )
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('raison')
            .setDescription(
              'Raison de l’avertissement',
            )
            .setMaxLength(500)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('liste')
        .setDescription(
          'Affiche les avertissements',
        )
        .addUserOption((option) =>
          option
            .setName('membre')
            .setDescription(
              'Membre concerné',
            )
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('effacer')
        .setDescription(
          'Efface les avertissements',
        )
        .addUserOption((option) =>
          option
            .setName('membre')
            .setDescription(
              'Membre concerné',
            )
            .setRequired(true),
        ),
    ),

  async execute(interaction, { config }) {
    const action =
      interaction.options.getSubcommand();

    const user =
      interaction.options.getUser(
        'membre',
        true,
      );

    if (action === 'ajouter') {
      const reason =
        interaction.options.getString(
          'raison',
          true,
        );

      await addWarning({
        guildId: interaction.guildId,
        userId: user.id,
        moderatorId: interaction.user.id,
        reason,
      });

      await user
        .send(
          `Tu as reçu un avertissement sur ` +
          `**${interaction.guild.name}**.\n` +
          `Raison : ${reason}`,
        )
        .catch(() => null);

      await interaction.reply({
        content:
          `✅ Avertissement ajouté à ` +
          `**${user.tag}**.`,
        flags: MessageFlags.Ephemeral,
      });

      const logEmbed = new EmbedBuilder()
        .setColor(0xf39c12)
        .setTitle(
          '⚠️ Avertissement ajouté',
        )
        .addFields(
          {
            name: 'Membre',
            value: user.toString(),
            inline: true,
          },
          {
            name: 'Modérateur',
            value:
              interaction.user.toString(),
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

      return;
    }

    if (action === 'liste') {
      const warnings =
        await listWarnings(
          interaction.guildId,
          user.id,
        );

      const description = warnings.length
        ? warnings
            .slice(-10)
            .map(
              (warning, index) => {
                const date = new Date(
                  warning.createdAt,
                ).toLocaleDateString(
                  'fr-FR',
                );

                return (
                  `${index + 1}. ` +
                  `**${date}** — ` +
                  truncate(
                    warning.reason,
                    200,
                  )
                );
              },
            )
            .join('\n')
        : 'Aucun avertissement.';

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(
              `Avertissements de ${user.tag}`,
            )
            .setDescription(description)
            .setFooter({
              text:
                `${warnings.length} ` +
                `avertissement(s) au total`,
            }),
        ],

        flags: MessageFlags.Ephemeral,
      });
    }

    if (action === 'effacer') {
      const removed =
        await clearWarnings(
          interaction.guildId,
          user.id,
        );

      await interaction.reply({
        content:
          `✅ ${removed} avertissement(s) ` +
          `effacé(s) pour **${user.tag}**.`,
        flags: MessageFlags.Ephemeral,
      });

      const logEmbed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle(
          '🧽 Avertissements effacés',
        )
        .addFields(
          {
            name: 'Membre',
            value: user.toString(),
            inline: true,
          },
          {
            name: 'Modérateur',
            value:
              interaction.user.toString(),
            inline: true,
          },
          {
            name: 'Nombre',
            value: String(removed),
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
    }
  },
};
