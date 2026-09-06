import { PermissionFlagsBits } from '../discord.js';

export function isStaff(member, config) {
  if (!member) return false;

  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return true;
  }

  const staffRoleIds = config.staffRoleIds?.length
    ? config.staffRoleIds
    : config.staffRoleId
      ? [config.staffRoleId]
      : [];

  return staffRoleIds.some((roleId) =>
    member.roles.cache.has(roleId),
  );
}

export function canManageRole(guild, role) {
  const botMember = guild.members.me;

  return Boolean(
    botMember &&
    role &&
    !role.managed &&
    role.id !== guild.id &&
    botMember.roles.highest.comparePositionTo(role) > 0
  );
}
