'use strict';

/**
 * Discord Bot
 * Connects Github with Discord Server and relays messages.
 */
const Bunyan = require('bunyan');
const Path = require('path');

const Log = Bunyan.createLogger({
    name: 'discord.bot',
    streams: [
        {
            level: 'debug',
            stream: process.stdout,
        },
        {
            level: 'debug',
            type: 'rotating-file',
            path: Path.join('logs/', 'info.log'),
            period: '4h',
            count: 12,
        },
        {
            level: 'error',
            type: 'rotating-file',
            path: Path.join('logs/', 'error.log'),
            period: '1d',
            count: 3,
        },
    ],
});

module.exports = Log;
