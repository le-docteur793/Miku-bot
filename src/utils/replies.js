import { MessageFlags } from 'discord.js';

export const truncate = (text, maximum = 1000) => {
  const value = String(text ?? '');

  if (value.length > maximum) {
    return `${value.slice(0, maximum - 1)}…`;
  }

  return value;
};

export async function replyPrivate(interaction, content) {
  const payload =
    typeof content === 'string'
      ? { content }
      : content;

  payload.flags = MessageFlags.Ephemeral;

  if (interaction.deferred || interaction.replied) {
    return interaction.followUp(payload);
  }

  return interaction.reply(payload);
}

export async function replyError(interaction, message) {
  return replyPrivate(interaction, `❌ ${message}`);
}