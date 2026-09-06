import { randomUUID } from 'node:crypto';
import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises';

import path from 'node:path';

const dataDirectory = path.join(
  process.cwd(),
  'data',
);

const warningsFile = path.join(
  dataDirectory,
  'warnings.json',
);

async function readWarnings() {
  await mkdir(dataDirectory, {
    recursive: true,
  });

  try {
    const content = await readFile(
      warningsFile,
      'utf8',
    );

    const warnings = JSON.parse(content);

    return Array.isArray(warnings)
      ? warnings
      : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function writeWarnings(warnings) {
  await mkdir(dataDirectory, {
    recursive: true,
  });

  const temporaryFile =
    `${warningsFile}.tmp`;

  await writeFile(
    temporaryFile,
    `${JSON.stringify(warnings, null, 2)}\n`,
    'utf8',
  );

  await rename(
    temporaryFile,
    warningsFile,
  );
}

export async function addWarning({
  guildId,
  userId,
  moderatorId,
  reason,
}) {
  const warnings = await readWarnings();

  const warning = {
    id: randomUUID(),
    guildId,
    userId,
    moderatorId,
    reason,
    createdAt: new Date().toISOString(),
  };

  warnings.push(warning);
  await writeWarnings(warnings);

  return warning;
}

export async function listWarnings(
  guildId,
  userId,
) {
  const warnings = await readWarnings();

  return warnings.filter(
    (warning) =>
      warning.guildId === guildId &&
      warning.userId === userId,
  );
}

export async function clearWarnings(
  guildId,
  userId,
) {
  const warnings = await readWarnings();

  const remaining = warnings.filter(
    (warning) =>
      !(
        warning.guildId === guildId &&
        warning.userId === userId
      ),
  );

  const removed =
    warnings.length - remaining.length;

  await writeWarnings(remaining);

  return removed;
}