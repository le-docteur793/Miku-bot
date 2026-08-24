import {
  EmbedBuilder,
  Events,
} from 'discord.js';

import {
  sendLog,
} from '../utils/logger.js';

import {
  canManageRole,
} from '../utils/permissions.js';

import {
  truncate,
} from '../utils/replies.js';

async function getTextChannel(
  guild,
  channelId,
) {
  if (!channelId) return null;

  const channel = await guild.channels
    .fetch(channelId)
    .catch(() => null);

  return channel?.isTextBased()
    ? channel
    : null;
}

export function registerClientEvents(
  client,
  { config },
) {
  client.on(
    Events.GuildMemberAdd,
    async (member) => {
      try {
        if (config.memberRoleId) {
          const role =
            await member.guild.roles
              .fetch(config.memberRoleId)
              .catch(() => null);

          if (
            role &&
            canManageRole(
              member.guild,
              role,
            )
          ) {
            await member.roles.add(
              role,
              'Rôle automatique de bienvenue',
            );
          }
        }

        const welcomeChannel =
          await getTextChannel(
            member.guild,
            config.welcomeChannelId,
          );

        if (welcomeChannel) {
          const welcomeEmbed =
            new EmbedBuilder()
              .setColor(
                config.embedColor,
              )
              .setTitle(
                `👋 Bienvenue sur ` +
                `${member.guild.name}`,
              )
              .setDescription(
                `Bienvenue ${member.toString()} ! ` +
                `Tu es notre **${member.guild.memberCount}e membre**.`,
              )
              .setThumbnail(
                member.user.displayAvatarURL(),
              )
              .setTimestamp();

          await welcomeChannel.send({
            embeds: [welcomeEmbed],
          });
        }

        const logEmbed =
          new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle(
              '📥 Membre arrivé',
            )
            .addFields(
              {
                name: 'Membre',
                value:
                  member.toString(),
                inline: true,
              },
              {
                name: 'Compte créé',
                value:
                  `<t:${Math.floor(
                    member.user
                      .createdTimestamp /
                      1000,
                  )}:R>`,
                inline: true,
              },
              {
                name: 'Identifiant',
                value: member.id,
              },
            )
            .setThumbnail(
              member.user
                .displayAvatarURL(),
            )
            .setTimestamp();

        await sendLog(
          member.guild,
          config,
          {
            embeds: [logEmbed],
          },
        );
      } catch (error) {
        console.error(
          '[ARRIVÉE] Erreur :',
          error,
        );
      }
    },
  );

  client.on(
    Events.GuildMemberRemove,
    async (member) => {
      const embed =
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle(
            '📤 Membre parti',
          )
          .addFields(
            {
              name: 'Membre',
              value: member.user.tag,
              inline: true,
            },
            {
              name: 'Identifiant',
              value: member.id,
              inline: true,
            },
          )
          .setThumbnail(
            member.user
              .displayAvatarURL(),
          )
          .setTimestamp();

      await sendLog(
        member.guild,
        config,
        {
          embeds: [embed],
        },
      );
    },
  );

  client.on(
    Events.GuildMemberUpdate,
    async (
      oldMember,
      newMember,
    ) => {
      const added =
        newMember.roles.cache.filter(
          (role) =>
            !oldMember.roles.cache.has(
              role.id,
            ),
        );

      const removed =
        oldMember.roles.cache.filter(
          (role) =>
            !newMember.roles.cache.has(
              role.id,
            ),
        );

      if (
        !added.size &&
        !removed.size
      ) {
        return;
      }

      const fields = [];

      if (added.size) {
        fields.push({
          name:
            'Rôle(s) ajouté(s)',
          value: truncate(
            added
              .map((role) =>
                role.toString(),
              )
              .join(', '),
            1000,
          ),
        });
      }

      if (removed.size) {
        fields.push({
          name:
            'Rôle(s) retiré(s)',
          value: truncate(
            removed
              .map((role) =>
                role.name,
              )
              .join(', '),
            1000,
          ),
        });
      }

      const embed =
        new EmbedBuilder()
          .setColor(
            config.embedColor,
          )
          .setTitle(
            '🏷️ Rôles modifiés',
          )
          .setDescription(
            newMember.toString(),
          )
          .addFields(fields)
          .setTimestamp();

      await sendLog(
        newMember.guild,
        config,
        {
          embeds: [embed],
        },
      );
    },
  );

  client.on(
    Events.MessageDelete,
    async (message) => {
      if (
        !message.guild ||
        message.author?.bot
      ) {
        return;
      }

      const embed =
        new EmbedBuilder()
          .setColor(0xe67e22)
          .setTitle(
            '🗑️ Message supprimé',
          )
          .addFields(
            {
              name: 'Auteur',
              value: message.author
                ? `${message.author.tag} ` +
                  `(${message.author.id})`
                : 'Auteur inconnu',
            },
            {
              name: 'Salon',
              value:
                message.channel
                  .toString(),
            },
            {
              name: 'Contenu',
              value: truncate(
                message.content ||
                '[contenu indisponible]',
                1000,
              ),
            },
          )
          .setTimestamp();

      await sendLog(
        message.guild,
        config,
        {
          embeds: [embed],
        },
      );
    },
  );

  client.on(
    Events.MessageUpdate,
    async (
      oldMessage,
      newMessage,
    ) => {
      if (
        !newMessage.guild ||
        newMessage.author?.bot
      ) {
        return;
      }

      if (
        oldMessage.content ===
        newMessage.content
      ) {
        return;
      }

      const embed =
        new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle(
            '✏️ Message modifié',
          )
          .addFields(
            {
              name: 'Auteur',
              value:
                newMessage.author
                  ? `${newMessage.author.tag} ` +
                    `(${newMessage.author.id})`
                  : 'Auteur inconnu',
            },
            {
              name: 'Salon',
              value:
                newMessage.channel
                  .toString(),
            },
            {
              name: 'Avant',
              value: truncate(
                oldMessage.content ||
                '[contenu indisponible]',
                1000,
              ),
            },
            {
              name: 'Après',
              value: truncate(
                newMessage.content ||
                '[contenu indisponible]',
                1000,
              ),
            },
            {
              name: 'Accès',
              value:
                `[Voir le message]` +
                `(${newMessage.url})`,
            },
          )
          .setTimestamp();

      await sendLog(
        newMessage.guild,
        config,
        {
          embeds: [embed],
        },
      );
    },
  );

  client.on(
    Events.GuildBanAdd,
    async (ban) => {
      const embed =
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle(
            '🔨 Bannissement détecté',
          )
          .addFields(
            {
              name: 'Utilisateur',
              value:
                `${ban.user.tag} ` +
                `(${ban.user.id})`,
            },
            {
              name: 'Raison',
              value: truncate(
                ban.reason ||
                'Non précisée',
                1000,
              ),
            },
          )
          .setTimestamp();

      await sendLog(
        ban.guild,
        config,
        {
          embeds: [embed],
        },
      );
    },
  );

  client.on(
    Events.GuildBanRemove,
    async (ban) => {
      const embed =
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle(
            '🔓 Débannissement détecté',
          )
          .setDescription(
            `${ban.user.tag} ` +
            `(${ban.user.id})`,
          )
          .setTimestamp();

      await sendLog(
        ban.guild,
        config,
        {
          embeds: [embed],
        },
      );
    },
  );
}