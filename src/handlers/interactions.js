import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from '../discord.js';

import {
  sendLog,
} from '../utils/logger.js';

import {
  canManageRole,
  isStaff,
} from '../utils/permissions.js';

import {
  replyError,
  truncate,
} from '../utils/replies.js';

import {
  createTranscript,
} from '../utils/transcript.js';

import {
  getCommandModule,
  handleConfigurationInteraction,
  isConfigurationInteraction,
} from '../commands/configuration.js';

function cleanChannelName(username) {
  const cleaned = username
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);

  return cleaned || 'membre';
}

async function openTicket(
  interaction,
  context,
) {
  const { config } = context;

  const staffRoleIds = config.staffRoleIds || [];

  if (
    !config.modules.tickets ||
    !config.ticketCategoryId ||
    !staffRoleIds.length
  ) {
    return replyError(
      interaction,
      'Le système de tickets n’est pas encore configuré.',
    );
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  const topic =
    `ticket-owner:${interaction.user.id}`;

  const existing =
    interaction.guild.channels.cache.find(
      (channel) =>
        channel.type ===
          ChannelType.GuildText &&
        channel.topic === topic,
    );

  if (existing) {
    return interaction.editReply(
      `❌ Tu as déjà un ticket ouvert : ` +
      `${existing.toString()}`,
    );
  }

  const permissions = [
    {
      id:
        interaction.guild.roles
          .everyone.id,

      deny: [
        PermissionFlagsBits.ViewChannel,
      ],
    },

    {
      id: interaction.user.id,

      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits
          .ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },

    ...staffRoleIds.map((roleId) => ({
      id: roleId,

      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits
          .ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits
          .ManageMessages,
      ],
    })),
  ];

  if (interaction.guild.members.me) {
    permissions.push({
      id:
        interaction.guild.members.me.id,

      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits
          .ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits
          .ManageChannels,
      ],
    });
  }

  const channel =
    await interaction.guild.channels.create({
      name:
        `ticket-` +
        cleanChannelName(
          interaction.user.username,
        ),

      type: ChannelType.GuildText,

      parent:
        config.ticketCategoryId,

      topic,

      permissionOverwrites:
        permissions,

      reason:
        `Ticket ouvert par ` +
        `${interaction.user.tag}`,
    });

  const embed =
    new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(
        `🎫 Ticket de ` +
        `${interaction.user.username}`,
      )
      .setDescription(
        `Bienvenue ${interaction.user.toString()}. ` +
        'Décris précisément ta demande.\n' +
        'Un membre du staff te répondra dès que possible.',
      )
      .setTimestamp();

  const closeButton =
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Fermer le ticket')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger);

  const row =
    new ActionRowBuilder()
      .addComponents(closeButton);

  await channel.send({
    content:
      `${interaction.user.toString()} ` +
      staffRoleIds
        .map((roleId) => `<@&${roleId}>`)
        .join(' '),

    embeds: [embed],
    components: [row],

    allowedMentions: {
      users: [interaction.user.id],
      roles: staffRoleIds,
    },
  });

  await interaction.editReply(
    `✅ Ton ticket a été créé : ` +
    `${channel.toString()}`,
  );

  const logEmbed =
    new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🎫 Ticket ouvert')
      .addFields(
        {
          name: 'Membre',
          value:
            interaction.user.toString(),
          inline: true,
        },
        {
          name: 'Salon',
          value: channel.toString(),
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

async function closeTicket(
  interaction,
  context,
) {
  const { config } = context;

  const topic =
    interaction.channel.topic;

  const ownerId =
    topic?.startsWith('ticket-owner:')
      ? topic.split(':')[1]
      : null;

  if (!ownerId) {
    return replyError(
      interaction,
      'Ce salon n’est pas reconnu comme un ticket.',
    );
  }

  if (
    interaction.user.id !== ownerId &&
    !isStaff(
      interaction.member,
      config,
    )
  ) {
    return replyError(
      interaction,
      'Seul le propriétaire du ticket ou le staff peut le fermer.',
    );
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  const transcript =
    await createTranscript(
      interaction.channel,
    ).catch(() =>
      Buffer.from(
        'Transcription indisponible.',
        'utf8',
      ),
    );

  const fileName =
    `transcription-` +
    `${interaction.channel.name}.txt`;

  const logEmbed =
    new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🔒 Ticket fermé')
      .addFields(
        {
          name: 'Salon',
          value:
            `#${interaction.channel.name}`,
          inline: true,
        },
        {
          name: 'Fermé par',
          value:
            interaction.user.toString(),
          inline: true,
        },
        {
          name: 'Propriétaire',
          value: `<@${ownerId}>`,
          inline: true,
        },
      )
      .setTimestamp();

  await sendLog(
    interaction.guild,
    config,
    {
      embeds: [logEmbed],

      files: [
        new AttachmentBuilder(
          transcript,
          {
            name: fileName,
          },
        ),
      ],
    },
  );

  await interaction.editReply(
    '✅ Ticket fermé. Le salon sera supprimé.',
  );

  setTimeout(() => {
    void interaction.channel
      .delete(
        `Ticket fermé par ` +
        `${interaction.user.tag}`,
      )
      .catch((error) => {
        console.error(
          '[TICKET] Suppression impossible :',
          error,
        );
      });
  }, 1500);
}

async function showApplicationModal(
  interaction,
  context,
) {
  if (!context.config.modules.applications) {
    return replyError(
      interaction,
      'Le module Candidatures est actuellement désactivé.',
    );
  }

  const modal =
    new ModalBuilder()
      .setCustomId(
        'application_submit',
      )
      .setTitle('Candidature');

  const identityInput =
    new TextInputBuilder()
      .setCustomId('identity')
      .setLabel(
        'Prénom ou pseudonyme',
      )
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

  const ageInput =
    new TextInputBuilder()
      .setCustomId('age')
      .setLabel('Quel âge as-tu ?')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(30)
      .setRequired(true);

  const positionInput =
    new TextInputBuilder()
      .setCustomId('position')
      .setLabel(
        'Quel poste souhaites-tu rejoindre ?',
      )
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

  const motivationInput =
    new TextInputBuilder()
      .setCustomId('motivation')
      .setLabel('Tes motivations')
      .setStyle(
        TextInputStyle.Paragraph,
      )
      .setMaxLength(1000)
      .setRequired(true);

  const experienceInput =
    new TextInputBuilder()
      .setCustomId('experience')
      .setLabel(
        'Expérience et disponibilités',
      )
      .setStyle(
        TextInputStyle.Paragraph,
      )
      .setMaxLength(1000)
      .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder()
      .addComponents(identityInput),

    new ActionRowBuilder()
      .addComponents(ageInput),

    new ActionRowBuilder()
      .addComponents(positionInput),

    new ActionRowBuilder()
      .addComponents(motivationInput),

    new ActionRowBuilder()
      .addComponents(experienceInput),
  );

  await interaction.showModal(modal);
}

async function submitApplication(
  interaction,
  context,
) {
  const { config } = context;

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
  });

  if (!config.applicationChannelId) {
    return interaction.editReply(
      '❌ Le système de candidatures n’est pas encore configuré.',
    );
  }

  if (!config.modules.applications) {
    return interaction.editReply(
      '❌ Le module Candidatures est actuellement désactivé.',
    );
  }

  const channel =
    await interaction.guild.channels
      .fetch(
        config.applicationChannelId,
      )
      .catch(() => null);

  if (!channel?.isTextBased()) {
    return interaction.editReply(
      '❌ Le salon des candidatures est introuvable.',
    );
  }

  const identity =
    interaction.fields
      .getTextInputValue('identity');

  const age =
    interaction.fields
      .getTextInputValue('age');

  const position =
    interaction.fields
      .getTextInputValue('position');

  const motivation =
    interaction.fields
      .getTextInputValue('motivation');

  const experience =
    interaction.fields
      .getTextInputValue('experience');

  const embed =
    new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(
        '📋 Nouvelle candidature',
      )
      .setAuthor({
        name: interaction.user.tag,
        iconURL:
          interaction.user
            .displayAvatarURL(),
      })
      .addFields(
        {
          name: 'Identité',
          value: truncate(
            identity,
            1000,
          ),
          inline: true,
        },
        {
          name: 'Âge',
          value: truncate(
            age,
            1000,
          ),
          inline: true,
        },
        {
          name: 'Poste demandé',
          value: truncate(
            position,
            1000,
          ),
        },
        {
          name: 'Motivations',
          value: truncate(
            motivation,
            1000,
          ),
        },
        {
          name:
            'Expérience et disponibilités',
          value: truncate(
            experience,
            1000,
          ),
        },
      )
      .setFooter({
        text:
          `Candidat ID : ` +
          `${interaction.user.id}`,
      })
      .setTimestamp();

  const acceptButton =
    new ButtonBuilder()
      .setCustomId(
        `application_accept:` +
        `${interaction.user.id}`,
      )
      .setLabel('Accepter')
      .setStyle(ButtonStyle.Success);

  const rejectButton =
    new ButtonBuilder()
      .setCustomId(
        `application_reject:` +
        `${interaction.user.id}`,
      )
      .setLabel('Refuser')
      .setStyle(ButtonStyle.Danger);

  const row =
    new ActionRowBuilder()
      .addComponents(
        acceptButton,
        rejectButton,
      );

  await channel.send({
    content:
      config.staffRoleIds.length
        ? config.staffRoleIds
            .map((roleId) => `<@&${roleId}>`)
            .join(' ')
        : undefined,

    embeds: [embed],
    components: [row],

    allowedMentions: {
      roles:
        config.staffRoleIds,
    },
  });

  await interaction.editReply(
    '✅ Ta candidature a bien été envoyée.',
  );
}

async function reviewApplication(
  interaction,
  context,
  accepted,
) {
  const { config } = context;

  if (
    !isStaff(
      interaction.member,
      config,
    )
  ) {
    return replyError(
      interaction,
      'Cette action est réservée au staff.',
    );
  }

  const userId =
    interaction.customId.split(':')[1];

  const originalEmbed =
    interaction.message.embeds[0];

  if (!originalEmbed) {
    return replyError(
      interaction,
      'La candidature est introuvable.',
    );
  }

  const updatedEmbed =
    EmbedBuilder
      .from(originalEmbed)
      .setColor(
        accepted
          ? 0x2ecc71
          : 0xe74c3c,
      )
      .setFooter({
        text:
          (
            accepted
              ? 'Candidature acceptée'
              : 'Candidature refusée'
          ) +
          ` par ${interaction.user.tag}`,
      })
      .setTimestamp();

  await interaction.update({
    embeds: [updatedEmbed],
    components: [],
  });

  const candidate =
    await interaction.client.users
      .fetch(userId)
      .catch(() => null);

  if (candidate) {
    const decision =
      accepted
        ? 'acceptée ✅'
        : 'refusée ❌';

    await candidate
      .send(
        `Ta candidature sur ` +
        `**${interaction.guild.name}** ` +
        `a été **${decision}**.`,
      )
      .catch(() => null);
  }

  const logEmbed =
    new EmbedBuilder()
      .setColor(
        accepted
          ? 0x2ecc71
          : 0xe74c3c,
      )
      .setTitle(
        accepted
          ? '✅ Candidature acceptée'
          : '❌ Candidature refusée',
      )
      .addFields(
        {
          name: 'Candidat',
          value: `<@${userId}>`,
          inline: true,
        },
        {
          name: 'Décision par',
          value:
            interaction.user.toString(),
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

async function toggleRole(
  interaction,
  context,
) {
  const { config } = context;

  if (!config.modules.rolePanels) {
    return replyError(
      interaction,
      'Le module Panneaux de rôles est actuellement désactivé.',
    );
  }

  const roleId =
    interaction.customId.split(':')[1];

  const role =
    await interaction.guild.roles
      .fetch(roleId)
      .catch(() => null);

  const member =
    await interaction.guild.members
      .fetch(interaction.user.id)
      .catch(() => null);

  if (!role || !member) {
    return replyError(
      interaction,
      'Ce rôle est introuvable.',
    );
  }

  if (
    !canManageRole(
      interaction.guild,
      role,
    )
  ) {
    return replyError(
      interaction,
      'Je ne peux pas gérer ce rôle. Vérifie la hiérarchie.',
    );
  }

  const hasRole =
    member.roles.cache.has(role.id);

  if (hasRole) {
    await member.roles.remove(
      role,
      'Rôle retiré depuis le panneau',
    );
  } else {
    await member.roles.add(
      role,
      'Rôle ajouté depuis le panneau',
    );
  }

  await interaction.reply({
    content: hasRole
      ? `✅ Le rôle ${role.toString()} a été retiré.`
      : `✅ Le rôle ${role.toString()} a été ajouté.`,

    flags: MessageFlags.Ephemeral,
  });

  const logEmbed =
    new EmbedBuilder()
      .setColor(
        role.color ||
        config.embedColor,
      )
      .setTitle(
        hasRole
          ? '🏷️ Rôle retiré'
          : '🏷️ Rôle ajouté',
      )
      .addFields(
        {
          name: 'Membre',
          value:
            interaction.user.toString(),
          inline: true,
        },
        {
          name: 'Rôle',
          value: role.toString(),
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

export async function handleInteraction(
  interaction,
  context,
) {
  try {
    if (!interaction.inGuild()) {
      return replyError(
        interaction,
        'Cette action doit être utilisée dans un serveur.',
      );
    }

    const config = await context.getGuildConfig(
      interaction.guildId,
    );

    const scopedContext = {
      ...context,
      config,
    };

    if (isConfigurationInteraction(interaction)) {
      return handleConfigurationInteraction(
        interaction,
        scopedContext,
      );
    }

    if (
      interaction.isChatInputCommand()
    ) {
      const command =
        context.client.commands.get(
          interaction.commandName,
        );

      if (!command) {
        return replyError(
          interaction,
          'Commande inconnue.',
        );
      }

      const moduleKey = getCommandModule(
        interaction.commandName,
      );

      if (
        moduleKey &&
        !config.modules[moduleKey]
      ) {
        return replyError(
          interaction,
          'Ce module est actuellement désactivé.',
        );
      }

      return command.execute(
        interaction,
        scopedContext,
      );
    }

    if (interaction.isButton()) {
      if (
        interaction.customId ===
        'ticket_open'
      ) {
        return openTicket(
          interaction,
          scopedContext,
        );
      }

      if (
        interaction.customId ===
        'ticket_close'
      ) {
        return closeTicket(
          interaction,
          scopedContext,
        );
      }

      if (
        interaction.customId ===
        'application_open'
      ) {
        return showApplicationModal(
          interaction,
          scopedContext,
        );
      }

      if (
        interaction.customId
          .startsWith(
            'application_accept:',
          )
      ) {
        return reviewApplication(
          interaction,
          scopedContext,
          true,
        );
      }

      if (
        interaction.customId
          .startsWith(
            'application_reject:',
          )
      ) {
        return reviewApplication(
          interaction,
          scopedContext,
          false,
        );
      }

      if (
        interaction.customId
          .startsWith(
            'role_toggle:',
          )
      ) {
        return toggleRole(
          interaction,
          scopedContext,
        );
      }
    }

    if (
      interaction.isModalSubmit() &&
      interaction.customId ===
        'application_submit'
    ) {
      return submitApplication(
        interaction,
        scopedContext,
      );
    }
  } catch (error) {
    console.error(
      '[INTERACTION] Erreur :',
      error,
    );

    return replyError(
      interaction,
      'Une erreur est survenue. Vérifie la console de l’hébergeur.',
    ).catch(() => null);
  }
}
