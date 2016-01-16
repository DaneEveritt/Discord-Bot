'use strict';

/**
 * Discord Bot
 * Connects Github with Discord Server and relays messages.
 */
const Async = require('async');
const Log = require('./logger.js');
const Util = require('util');
const _ = require('underscore');

class Github {
    constructor(bot, channel) {
        this.bot = bot;
        this.channel = channel;
        this.channelID = this.findChannelID();
    }

    findChannelID() {
        this._response = undefined;
        const self = this;
        Log.info('Looking for the channel ID across all active connections...');
        _.each(this.bot.servers, function (element) {
            _.each(element.channels, function (channel, index) {
                if (channel.name === self.channel) {
                    Log.info({ channel: index }, 'Found the channel!');
                    self._response = index;
                }
            });
        });
        return this._response;
    }

    sendMessage(msg, next) {
        this.bot.sendMessage({
            to: this.channelID,
            message: msg,
            tts: false,
            typing: true,
        }, function (resp) {
            return next(null, resp);
        });
    }

    pushed(data, next) {
        const self = this;
        this._shortURL = undefined;
        Async.series([
            function (callback) {
                const message = Util.format('[%s/%s] %s pushed %s new commit(s) to %s (+%s -%s +-%s) %s',
                    data.repository.name,
                    data.ref.split('/').pop(),
                    data.head_commit.author.username,
                    data.commits.length,
                    data.ref.split('/').pop(),
                    data.head_commit.added.length,
                    data.head_commit.removed.length,
                    data.head_commit.modified.length,
                    data.compare
                );
                self.sendMessage(message, callback);
            },
        ], function (err) {
            if (err) {
                Log.error(err);
                return next(err);
            }
            Async.eachSeries(data.commits, function asyncEachSeries(commit, callback) {
                let commitMessage;
                if (commit.message.indexOf('\n') > -1) {
                    commitMessage = (commit.message.split('\n'))[0].substr(0, 150) + '...';
                } else {
                    commitMessage = commit.message.substr(0, 150);
                }
                self.sendMessage('        --> ' + commitMessage, callback);
            }, function (eachErr) {
                return next(eachErr);
            });
        });
    }

    create(data, next) {
        const message = Util.format('[%s] %s created %s %s',
            data.repository.name,
            data.sender.login,
            data.ref_type,
            data.ref
        );
        self.sendMessage(message, next);
    }

    delete(data, next) {
        const message = Util.format('[%s] %s deleted %s %s',
            data.repository.name,
            data.sender.login,
            data.ref_type,
            data.ref
        );
        self.sendMessage(message, next);
    }

    issue(data, next) {
        const self = this;
        this._shortURL = undefined;
        const IgnoredIssues = [
            'assigned',
            'unassigned',
            'labeled',
            'unlabeled',
        ];

        // Don't want to spam it up when things happen.
        if (IgnoredIssues.indexOf(data.action) > -1) return next();

        Async.series([
            function (callback) {
                const message = Util.format('[%s] %s %s Issue #%s: %s %s',
                    data.repository.name,
                    data.sender.login,
                    data.action,
                    data.issue.number,
                    data.issue.title,
                    data.issue.html_url
                );
                self.sendMessage(message, callback);
            },
        ], function (err) {
            return next(err);
        });
    }

    pull(data, next) {
        const self = this;
        this._shortURL = undefined;
        const IgnoredPR = [
            'assigned',
            'unassigned',
            'labeled',
            'unlabeled',
            'synchronize',
        ];

        // Don't want to spam it up when things happen.
        if (IgnoredPR.indexOf(data.action) > -1) return next();

        Async.series([
            function (callback) {
                const message = Util.format('[%s/%s] %s %s Pull Request #%s: %s %s',
                    data.pull_request.base.repo.name,
                    data.pull_request.base.ref,
                    data.sender.login,
                    data.action,
                    data.pull_request.number,
                    data.pull_request.title,
                    data.pull_request.html_url
                );
                self.sendMessage(message, callback);
            },
        ], function (err) {
            return next(err);
        });
    }

    release(data, next) {
        const self = this;
        this._shortURL = undefined;

        Async.series([
            function (callback) {
                const message = Util.format('[%s] %s published release %s: %s %s',
                    data.repository.name,
                    data.respository.sender.login,
                    data.release.tag_name,
                    data.release.name,
                    data.release.html_url
                );
                self.sendMessage(message, callback);
            },
        ], function (err) {
            return next(err);
        });
    }
}

module.exports = Github;
