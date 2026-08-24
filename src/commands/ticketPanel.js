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

export const ticketPanelCommand = {
  data: new SlashCommandBuilder()
    .setName('panneau-ticket')
    .setDescription(
      'Installe le panneau des tickets',
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageChannels,
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
    if (
      !config.ticketCategoryId ||
      !config.staffRoleId
    ) {
      return interaction.reply({
        content:
          '❌ Configure TICKET_CATEGORY_ID et STAFF_ROLE_ID dans le fichier .env.',
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
        `🎫 Assistance ${config.brandName}`,
      )
      .setDescription(
        'Clique sur le bouton ci-dessous pour ouvrir ' +
        'un ticket privé avec l’équipe.\n\n' +
        'Explique clairement ta demande et ajoute ' +
        'les preuves nécessaires.',
      )
      .setFooter({
        text:
          'Un seul ticket ouvert par personne.',
      });

    const button = new ButtonBuilder()
      .setCustomId('ticket_open')
      .setLabel('Ouvrir un ticket')
      .setEmoji('🎫')
      .setStyle(ButtonStyle.Primary);

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