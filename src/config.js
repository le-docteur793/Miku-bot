const required = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `La variable ${name} est obligatoire dans le fichier .env.`,
    );
  }

  return value;
};

const optional = (name) => {
  return process.env[name]?.trim() ?? '';
};

const parseColor = (value) => {
  const normalized =
    (value || '6D5DFC').replace('#', '');

  if (/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return Number.parseInt(normalized, 16);
  }

  return 0x6d5dfc;
};

export const config = Object.freeze({
  token: required('DISCORD_TOKEN'),
  guildId: required('GUILD_ID'),

  logChannelId: optional('LOG_CHANNEL_ID'),
  welcomeChannelId: optional('WELCOME_CHANNEL_ID'),
  memberRoleId: optional('MEMBER_ROLE_ID'),
  ticketCategoryId: optional('TICKET_CATEGORY_ID'),
  staffRoleId: optional('STAFF_ROLE_ID'),
  applicationChannelId: optional('APPLICATION_CHANNEL_ID'),

  brandName: optional('BOT_NAME') || 'Shadow Nova',
  embedColor: parseColor(
    optional('EMBED_COLOR'),
  ),
});