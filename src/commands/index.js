import {
  announceCommand,
} from './announce.js';

import {
  applicationPanelCommand,
} from './applicationPanel.js';

import {
  banCommand,
} from './ban.js';

import {
  clearCommand,
} from './clear.js';

import {
  helpCommand,
} from './help.js';

import {
  kickCommand,
} from './kick.js';

import {
  musicCommand,
} from './music.js';

import {
  rolePanelCommand,
} from './rolePanel.js';

import {
  ticketPanelCommand,
} from './ticketPanel.js';

import {
  timeoutCommand,
} from './timeout.js';

import {
  warningsCommand,
} from './warnings.js';

export const commands = [
  helpCommand,

  clearCommand,
  kickCommand,
  banCommand,
  timeoutCommand,
  warningsCommand,

  announceCommand,

  ticketPanelCommand,
  applicationPanelCommand,
  rolePanelCommand,

  musicCommand,
];