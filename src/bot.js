'use strict';

/**
 * Discord Bot
 * Connects Github with Discord Server and relays messages.
 */
const rfr = require('rfr');
const Async = require('async');
const Discord = require('discord.js');

const Config = rfr('config.json');
const Log = rfr('src/logger.js');

const Bot = new Discord.Client();

class DiscordBot {
    constructor() {
        this.disconnectTime = false;
        this.channelID = false;
    }

    login(next) {
        Bot.login(Config.email, Config.password, (err) => {
            if (err) return next(err);
            // Follow the invite:
            Log.info('Attempting to follow invite and join server.');
            if (typeof Config.invite === 'string') {
                Bot.joinServer(Config.invite, (joinErr) => {
                    if (typeof next === 'function') return next(joinErr);
                });
            } else {
                return next();
            }
        });
    }

    lastDisconnect(time) {
        if (typeof time === 'undefined') {
            return this.disconnectTime;
        }
        this.disconnectTime = time;
    }

    findChannel(next) {
        const self = this;
        Async.forEachOf(Bot.channels, function (channel, id, callback) {
            if (channel.name === Config.channel) self.channelID = Bot.channels[id].id;
            callback();
        }, () => {
            if (!self.channelID && typeof next === 'function') return next(new Error('No channel found for the bot to connect to.'));
        });
    }

    sendMsg(message, next) {
        const self = this;
        Async.series([
            function (callback) {
                Bot.startTyping(self.channelID, callback);
            },
            function (callback) {
                Bot.sendMessage(self.channelID, message, callback);
            },
            function (callback) {
                Bot.stopTyping(self.channelID, callback);
            },
        ], (err) => {
            if (typeof next === 'function') return next(err);
        });
    }

    replyMsg(message, reply, next) {
        const self = this;
        Async.series([
            function (callback) {
                Bot.startTyping(self.channelID, callback);
            },
            function (callback) {
                Bot.reply(message, reply, callback);
            },
            function (callback) {
                Bot.stopTyping(self.channelID, callback);
            },
        ], (err) => {
            if (typeof next === 'function') return next(err);
        });
    }
}

exports.BotHandler = DiscordBot;
exports.Bot = Bot;
