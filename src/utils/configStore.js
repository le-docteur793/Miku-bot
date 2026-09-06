import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const dataDirectory = path.join(process.cwd(), 'data');
const configFile = path.join(dataDirectory, 'guild-config.json');

const defaultModules = Object.freeze({
  welcome: true,
  autoRole: true,
  logs: true,
  tickets: true,
  applications: true,
  moderation: true,
  announcements: true,
  rolePanels: true,
});

let cache = null;
let mutationQueue = Promise.resolve();

function uniqueIds(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  )];
}

function normalizeColor(value, fallback = 0x6d5dfc) {
  if (
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 0xffffff
  ) {
    return value;
  }

  const normalized = String(value || '').replace('#', '');

  return /^[0-9A-Fa-f]{6}$/.test(normalized)
    ? Number.parseInt(normalized, 16)
    : fallback;
}

function normalizeGuildConfig(value = {}, defaults = {}) {
  const staffRoleIds = uniqueIds(
    value.staffRoleIds?.length
      ? value.staffRoleIds
      : defaults.staffRoleIds,
  );

  return {
    logChannelId: String(
      value.logChannelId ?? defaults.logChannelId ?? '',
    ),
    welcomeChannelId: String(
      value.welcomeChannelId ?? defaults.welcomeChannelId ?? '',
    ),
    memberRoleId: String(
      value.memberRoleId ?? defaults.memberRoleId ?? '',
    ),
    ticketCategoryId: String(
      value.ticketCategoryId ?? defaults.ticketCategoryId ?? '',
    ),
    staffRoleIds,
    staffRoleId: staffRoleIds[0] || '',
    applicationChannelId: String(
      value.applicationChannelId ??
      defaults.applicationChannelId ??
      '',
    ),
    brandName:
      String(value.brandName ?? defaults.brandName ?? 'Miku Bot')
        .trim()
        .slice(0, 50) || 'Miku Bot',
    embedColor: normalizeColor(
      value.embedColor,
      normalizeColor(defaults.embedColor),
    ),
    modules: {
      ...defaultModules,
      ...(defaults.modules || {}),
      ...(value.modules || {}),
    },
  };
}

async function loadStore() {
  if (cache) return cache;

  await mkdir(dataDirectory, { recursive: true });

  try {
    const content = await readFile(configFile, 'utf8');
    const parsed = JSON.parse(content);

    cache = parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    cache = {};
  }

  return cache;
}

async function saveStore(store) {
  await mkdir(dataDirectory, { recursive: true });

  const temporaryFile = `${configFile}.tmp`;

  await writeFile(
    temporaryFile,
    `${JSON.stringify(store, null, 2)}\n`,
    'utf8',
  );

  await rename(temporaryFile, configFile);
}

export async function getGuildConfig(guildId, defaults = {}) {
  const store = await loadStore();

  return normalizeGuildConfig(store[guildId], defaults);
}

export function updateGuildConfig(
  guildId,
  changes,
  defaults = {},
) {
  const operation = mutationQueue.then(async () => {
    const store = await loadStore();
    const current = normalizeGuildConfig(store[guildId], defaults);
    const patch =
      typeof changes === 'function'
        ? await changes(structuredClone(current))
        : changes;

    const next = normalizeGuildConfig(
      {
        ...current,
        ...(patch || {}),
        modules: {
          ...current.modules,
          ...(patch?.modules || {}),
        },
      },
      defaults,
    );

    store[guildId] = next;
    await saveStore(store);

    return structuredClone(next);
  });

  mutationQueue = operation.catch(() => undefined);

  return operation;
}
