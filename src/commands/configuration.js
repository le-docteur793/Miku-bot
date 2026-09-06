import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from '../discord.js';

import { replyError } from '../utils/replies.js';

const moduleLabels = Object.freeze({
  welcome: 'Messages de bienvenue',
  autoRole: 'Rôle automatique',
  logs: 'Journaux',
  tickets: 'Tickets',
  applications: 'Candidatures',
  moderation: 'Modération',
  announcements: 'Annonces',
  rolePanels: 'Panneaux de rôles',
});

const commandModules = Object.freeze({
  clear: 'moderation',
  kick: 'moderation',
  ban: 'moderation',
  timeout: 'moderation',
  avertissement: 'moderation',
  annonce: 'announcements',
  'panneau-ticket': 'tickets',
  'panneau-candidature': 'applications',
  'panneau-role': 'rolePanels',
});

function canConfigure(interaction) {
  return Boolean(
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator,
    ) ||
    interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild,
    ),
  );
}

function channelMention(channelId) {
  return channelId ? `<#${channelId}>` : 'Non configuré';
}

function roleMention(roleId) {
  return roleId ? `<@&${roleId}>` : 'Non configuré';
}

function staffRoles(config) {
  return config.staffRoleIds?.length
    ? config.staffRoleIds.map(roleMention).join(', ')
    : 'Non configuré';
}

function colorHex(color) {
  return `#${color.toString(16).padStart(6, '0').toUpperCase()}`;
}

function moduleStatus(config, key) {
  return config.modules[key] ? '🟢 Activé' : '🔴 Désactivé';
}

function homeComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('configuration:page:channels')
        .setLabel('Salons')
        .setEmoji('💬')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('configuration:page:roles')
        .setLabel('Rôles')
        .setEmoji('🏷️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('configuration:page:modules')
        .setLabel('Modules')
        .setEmoji('🧩')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('configuration:appearance')
        .setLabel('Apparence')
        .setEmoji('🎨')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('configuration:refresh')
        .setLabel('Actualiser')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

function dashboardPayload(config) {
  const moduleLines = Object.keys(moduleLabels)
    .map(
      (key) =>
        `${config.modules[key] ? '✅' : '❌'} ${moduleLabels[key]}`,
    )
    .join('\n');

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle(`⚙️ Configuration de ${config.brandName}`)
    .setDescription(
      'Utilise les boutons ci-dessous. Les modifications sont ' +
      'enregistrées immédiatement et restent après un redémarrage.',
    )
    .addFields(
      {
        name: '👋 Accueil',
        value:
          `Salon : ${channelMention(config.welcomeChannelId)}\n` +
          `Rôle membre : ${roleMention(config.memberRoleId)}`,
        inline: true,
      },
      {
        name: '📋 Journaux et candidatures',
        value:
          `Logs : ${channelMention(config.logChannelId)}\n` +
          `Candidatures : ${channelMention(
            config.applicationChannelId,
          )}`,
        inline: true,
      },
      {
        name: '🎫 Tickets',
        value:
          `Catégorie : ${channelMention(config.ticketCategoryId)}\n` +
          `Staff : ${staffRoles(config)}`,
      },
      {
        name: '🎨 Apparence',
        value:
          `Nom : **${config.brandName}**\n` +
          `Couleur : **${colorHex(config.embedColor)}**`,
        inline: true,
      },
      {
        name: '🧩 Modules',
        value: moduleLines,
        inline: true,
      },
    )
    .setFooter({
      text: 'Panneau visible uniquement par toi',
    });

  return {
    embeds: [embed],
    components: homeComponents(),
  };
}

function backButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('configuration:home')
      .setLabel('Retour au résumé')
      .setEmoji('↩️')
      .setStyle(ButtonStyle.Secondary),
  );
}

function channelSelect(customId, placeholder, channelTypes) {
  return new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .setChannelTypes(...channelTypes)
      .setMinValues(1)
      .setMaxValues(1),
  );
}

function channelsPayload(config) {
  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle('💬 Configuration des salons')
    .setDescription(
      `**Bienvenue :** ${channelMention(config.welcomeChannelId)}\n` +
      `**Journaux :** ${channelMention(config.logChannelId)}\n` +
      `**Candidatures :** ${channelMention(
        config.applicationChannelId,
      )}\n` +
      `**Catégorie des tickets :** ${channelMention(
        config.ticketCategoryId,
      )}\n\nSélectionne uniquement les éléments que tu veux modifier.`,
    );

  return {
    embeds: [embed],
    components: [
      channelSelect(
        'configuration:channel:welcomeChannelId',
        'Choisir le salon de bienvenue',
        [ChannelType.GuildText, ChannelType.GuildAnnouncement],
      ),
      channelSelect(
        'configuration:channel:logChannelId',
        'Choisir le salon des journaux',
        [ChannelType.GuildText, ChannelType.GuildAnnouncement],
      ),
      channelSelect(
        'configuration:channel:applicationChannelId',
        'Choisir le salon des candidatures',
        [ChannelType.GuildText, ChannelType.GuildAnnouncement],
      ),
      channelSelect(
        'configuration:channel:ticketCategoryId',
        'Choisir la catégorie des tickets',
        [ChannelType.GuildCategory],
      ),
      backButton(),
    ],
  };
}

function rolesPayload(config) {
  const memberSelect = new RoleSelectMenuBuilder()
    .setCustomId('configuration:role:memberRoleId')
    .setPlaceholder('Choisir le rôle donné aux nouveaux membres')
    .setMinValues(1)
    .setMaxValues(1);

  const staffSelect = new RoleSelectMenuBuilder()
    .setCustomId('configuration:role:staffRoleIds')
    .setPlaceholder('Choisir de 1 à 5 rôles du staff')
    .setMinValues(1)
    .setMaxValues(5);

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle('🏷️ Configuration des rôles')
    .setDescription(
      `**Rôle membre :** ${roleMention(config.memberRoleId)}\n` +
      `**Rôles du staff :** ${staffRoles(config)}\n\n` +
      'Le rôle de Miku Bot doit être placé au-dessus du rôle membre.',
    );

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(memberSelect),
      new ActionRowBuilder().addComponents(staffSelect),
      backButton(),
    ],
  };
}

function moduleButton(config, key) {
  const enabled = config.modules[key];

  return new ButtonBuilder()
    .setCustomId(`configuration:toggle:${key}`)
    .setLabel(moduleLabels[key])
    .setEmoji(enabled ? '✅' : '❌')
    .setStyle(enabled ? ButtonStyle.Success : ButtonStyle.Danger);
}

function modulesPayload(config) {
  const keys = Object.keys(moduleLabels);

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle('🧩 Activation des modules')
    .setDescription(
      keys
        .map(
          (key) => `**${moduleLabels[key]} :** ${moduleStatus(config, key)}`,
        )
        .join('\n'),
    );

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        ...keys.slice(0, 4).map((key) => moduleButton(config, key)),
      ),
      new ActionRowBuilder().addComponents(
        ...keys.slice(4, 8).map((key) => moduleButton(config, key)),
      ),
      backButton(),
    ],
  };
}

function appearanceModal(config) {
  const nameInput = new TextInputBuilder()
    .setCustomId('brandName')
    .setLabel('Nom affiché par le bot')
    .setStyle(TextInputStyle.Short)
    .setMinLength(2)
    .setMaxLength(50)
    .setRequired(true)
    .setValue(config.brandName);

  const colorInput = new TextInputBuilder()
    .setCustomId('embedColor')
    .setLabel('Couleur hexadécimale')
    .setPlaceholder('Exemple : 6D5DFC')
    .setStyle(TextInputStyle.Short)
    .setMinLength(6)
    .setMaxLength(7)
    .setRequired(true)
    .setValue(colorHex(config.embedColor));

  return new ModalBuilder()
    .setCustomId('configuration:appearance:submit')
    .setTitle('Apparence de Miku Bot')
    .addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(colorInput),
    );
}

export function getCommandModule(commandName) {
  return commandModules[commandName] || null;
}

export function isConfigurationInteraction(interaction) {
  return Boolean(
    interaction.customId?.startsWith('configuration:'),
  );
}

export async function handleConfigurationInteraction(
  interaction,
  context,
) {
  if (!canConfigure(interaction)) {
    return replyError(
      interaction,
      'Tu dois avoir la permission Gérer le serveur.',
    );
  }

  const { config } = context;

  if (interaction.customId === 'configuration:home') {
    return interaction.update(dashboardPayload(config));
  }

  if (interaction.customId === 'configuration:refresh') {
    const refreshed = await context.getGuildConfig(interaction.guildId);
    return interaction.update(dashboardPayload(refreshed));
  }

  if (interaction.customId === 'configuration:page:channels') {
    return interaction.update(channelsPayload(config));
  }

  if (interaction.customId === 'configuration:page:roles') {
    return interaction.update(rolesPayload(config));
  }

  if (interaction.customId === 'configuration:page:modules') {
    return interaction.update(modulesPayload(config));
  }

  if (interaction.customId === 'configuration:appearance') {
    return interaction.showModal(appearanceModal(config));
  }

  if (interaction.customId.startsWith('configuration:channel:')) {
    const field = interaction.customId.split(':')[2];
    const allowedFields = new Set([
      'welcomeChannelId',
      'logChannelId',
      'applicationChannelId',
      'ticketCategoryId',
    ]);

    if (!allowedFields.has(field)) {
      return replyError(interaction, 'Réglage de salon inconnu.');
    }

    const updated = await context.updateGuildConfig(
      interaction.guildId,
      { [field]: interaction.values[0] },
    );

    return interaction.update(channelsPayload(updated));
  }

  if (interaction.customId === 'configuration:role:memberRoleId') {
    const updated = await context.updateGuildConfig(
      interaction.guildId,
      { memberRoleId: interaction.values[0] },
    );

    return interaction.update(rolesPayload(updated));
  }

  if (interaction.customId === 'configuration:role:staffRoleIds') {
    const updated = await context.updateGuildConfig(
      interaction.guildId,
      { staffRoleIds: interaction.values },
    );

    return interaction.update(rolesPayload(updated));
  }

  if (interaction.customId.startsWith('configuration:toggle:')) {
    const key = interaction.customId.split(':')[2];

    if (!(key in moduleLabels)) {
      return replyError(interaction, 'Module inconnu.');
    }

    const updated = await context.updateGuildConfig(
      interaction.guildId,
      (current) => ({
        modules: {
          [key]: !current.modules[key],
        },
      }),
    );

    return interaction.update(modulesPayload(updated));
  }

  if (interaction.customId === 'configuration:appearance:submit') {
    const brandName = interaction.fields
      .getTextInputValue('brandName')
      .trim();
    const color = interaction.fields
      .getTextInputValue('embedColor')
      .trim()
      .replace('#', '');

    if (!/^[0-9A-Fa-f]{6}$/.test(color)) {
      return replyError(
        interaction,
        'La couleur doit contenir exactement 6 caractères hexadécimaux.',
      );
    }

    const updated = await context.updateGuildConfig(
      interaction.guildId,
      {
        brandName,
        embedColor: Number.parseInt(color, 16),
      },
    );

    return interaction.reply({
      ...dashboardPayload(updated),
      content: '✅ Apparence enregistrée.',
      flags: MessageFlags.Ephemeral,
    });
  }

  return replyError(interaction, 'Action de configuration inconnue.');
}

export const configurationCommand = {
  data: new SlashCommandBuilder()
    .setName('configuration')
    .setDescription('Configure Miku Bot directement depuis Discord')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, { config }) {
    if (!canConfigure(interaction)) {
      return replyError(
        interaction,
        'Tu dois avoir la permission Gérer le serveur.',
      );
    }

    return interaction.reply({
      ...dashboardPayload(config),
      flags: MessageFlags.Ephemeral,
    });
  },
};
