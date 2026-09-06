const optional = (name) => {
  return process.env[name]?.trim() ?? '';
};

const requiredOneOf = (...names) => {
  for (const name of names) {
    const value = optional(name);

    if (value) return value;
  }

  throw new Error(
    `Ajoute ${names.join(' ou ')} dans les variables d’environnement.`,
  );
};

const parseColor = (value) => {
  const normalized = (value || '6D5DFC').replace('#', '');

  if (/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return Number.parseInt(normalized, 16);
  }

  return 0x6d5dfc;
};

const staffRoleIds = (
  optional('STAFF_ROLE_IDS') || optional('STAFF_ROLE_ID')
)
  .split(',')
  .map((roleId) => roleId.trim())
  .filter(Boolean);

export const config = Object.freeze({
  token: requiredOneOf('DISCORD_TOKEN', 'TOKEN'),
  guildId:
    optional('DISCORD_GUILD_ID') || optional('GUILD_ID'),

  defaultGuildConfig: Object.freeze({
    logChannelId: optional('LOG_CHANNEL_ID'),
    welcomeChannelId: optional('WELCOME_CHANNEL_ID'),
    memberRoleId: optional('MEMBER_ROLE_ID'),
    ticketCategoryId: optional('TICKET_CATEGORY_ID'),
    staffRoleIds,
    applicationChannelId: optional('APPLICATION_CHANNEL_ID'),
    brandName: optional('BOT_NAME') || 'Miku Bot',
    embedColor: parseColor(optional('EMBED_COLOR')),
  }),
});
