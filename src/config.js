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
  const normalized = (value || '6D5DFC').replace('#', '');

  if (/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return Number.parseInt(normalized, 16);
  }

  return 0x6d5dfc;
};

export const config = Object.freeze({
  token: required('MTU0MTUzOTg1NTQyMTUzODMxNA.GpZbrw.okVslb1ohWbfyTaib9swltFiahmstKLzUE-E8s'),
  guildId: required('915282609259577424'),

  logChannelId: optional('1541579327131623436'),
  welcomeChannelId: optional('1541579459340009553'),
  memberRoleId: optional('1512174301229482015'),
  ticketCategoryId: optional('1144952614975443028'),
  staffRoleId: optional('1539622966571044874', '1539622914104762489', '1125543345033318541', '1125544884678426774', '1539622644326867067', '1144949401559781398', '1144945610244505650'),
  applicationChannelId: optional('1541581547227058256'),

  brandName: optional('BOT_NAME') || 'Miku bot',
  embedColor: parseColor(optional('EMBED_COLOR')),
});