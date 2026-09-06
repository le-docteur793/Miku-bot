import {
  EmbedBuilder,
  SlashCommandBuilder,
} from '../discord.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('aide')
    .setDescription(
      'Affiche la liste des commandes du bot',
    ),

  async execute(interaction, { config }) {
    const fields = [];

    if (config.modules.moderation) {
      fields.push({
        name: '🛡️ Modération',
        value:
          '/clear · /kick · /ban · ' +
          '/timeout · /avertissement',
      });
    }

    const communityCommands = [];

    if (config.modules.tickets) {
      communityCommands.push('/panneau-ticket');
    }

    if (config.modules.applications) {
      communityCommands.push('/panneau-candidature');
    }

    if (config.modules.rolePanels) {
      communityCommands.push('/panneau-role');
    }

    if (communityCommands.length) {
      fields.push({
        name: '🎫 Communauté',
        value: communityCommands.join(' · '),
      });
    }

    if (config.modules.announcements) {
      fields.push({
        name: '📢 Communication',
        value: '/annonce',
      });
    }

    fields.push({
      name: '⚙️ Administration',
      value: '/configuration',
    });

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(
        `🤖 Commandes de ${config.brandName}`,
      )
      .addFields(fields)
      .setFooter({
        text:
          'Les commandes administratives apparaissent selon tes permissions.',
      });

    await interaction.reply({
      embeds: [embed],
    });
  },
};
