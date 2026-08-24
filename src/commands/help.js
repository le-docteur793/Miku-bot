import {
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('aide')
    .setDescription(
      'Affiche la liste des commandes du bot',
    ),

  async execute(interaction, { config }) {
    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(
        `🤖 Commandes de ${config.brandName}`,
      )
      .addFields(
        {
          name: '🛡️ Modération',
          value:
            '/clear · /kick · /ban · ' +
            '/timeout · /avertissement',
        },
        {
          name: '🎫 Communauté',
          value:
            '/panneau-ticket · ' +
            '/panneau-candidature · ' +
            '/panneau-role',
        },
        {
          name: '📢 Communication',
          value: '/annonce',
        },
        {
          name: '🎵 Musique',
          value:
            '/musique lire · pause · reprendre · ' +
            'passer · arreter · file · volume',
        },
      )
      .setFooter({
        text:
          'Les commandes administratives apparaissent selon tes permissions.',
      });

    await interaction.reply({
      embeds: [embed],
    });
  },
};