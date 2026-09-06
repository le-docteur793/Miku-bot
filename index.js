import 'dotenv/config';

import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
} from './src/discord.js';

import { config } from './src/config.js';
import { commands } from './src/commands/index.js';
import { registerClientEvents } from './src/handlers/clientEvents.js';
import { handleInteraction } from './src/handlers/interactions.js';
import {
  getGuildConfig,
  updateGuildConfig,
} from './src/utils/configStore.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],

  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
  ],
});

client.commands = new Collection(
  commands.map((command) => [command.data.name, command]),
);

const context = {
  client,
  baseConfig: config,
  getGuildConfig: (guildId) =>
    getGuildConfig(guildId, config.defaultGuildConfig),
  updateGuildConfig: (guildId, changes) =>
    updateGuildConfig(
      guildId,
      changes,
      config.defaultGuildConfig,
    ),
};

registerClientEvents(client, context);

client.on(Events.InteractionCreate, (interaction) => {
  void handleInteraction(interaction, context);
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`[PRÊT] ${readyClient.user.tag} est connecté.`);

  try {
    const guilds = config.guildId
      ? [await readyClient.guilds.fetch(config.guildId)]
      : [...readyClient.guilds.cache.values()];

    for (const guild of guilds) {
      await guild.commands.set(
        commands.map((command) => command.data.toJSON()),
      );

      console.log(
        `[COMMANDES] ${commands.length} commandes installées sur ${guild.name}.`,
      );
    }
  } catch (error) {
    console.error(
      '[COMMANDES] Impossible d’installer les commandes :',
      error,
    );
  }
});

process.on('unhandledRejection', (error) => {
  console.error('[ERREUR] Promesse non gérée :', error);
});

process.on('uncaughtException', (error) => {
  console.error('[ERREUR] Exception non gérée :', error);
});

await client.login(config.token);
