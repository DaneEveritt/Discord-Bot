'use strict';

/**
 * Discord Bot
 * Connects Github with Discord Server and relays messages.
 */
const Async = require('async');
const Log = require('./logger.js');
const Util = require('util');
const Gitio = require('node-gitio');

class Github {
    constructor(bot, next) {
        if (!bot || typeof bot !== 'object') {
            if (typeof next === 'function') return next(new Error('Instance of `bot` passed to Github must be a DiscordBot instance.'));
        }
        this.bot = bot;
    }

    pushed(data, next) {
        const self = this;
        this._shortURL = undefined;
        Async.waterfall([
            function (callback) {
                Gitio.shrink({
                    url: data.compare,
                }, (err, result) => {
                    if (err) {
                        return callback(null, data.compare);
                    }
                    return callback(null, result);
                });
            },
            function (url, callback) {
                const message = Util.format('[%s/%s] %s pushed %s new commit(s) to %s (+%s -%s +-%s) %s',
                    data.repository.name,
                    data.ref.split('/').pop(),
                    data.head_commit.author.username,
                    data.commits.length,
                    data.ref.split('/').pop(),
                    data.head_commit.added.length,
                    data.head_commit.removed.length,
                    data.head_commit.modified.length,
                    url
                );
                self.bot.send(message, callback);
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
                self.bot.send('        --> ' + commitMessage, callback);
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
        this.bot.send(message, next);
    }

    delete(data, next) {
        const message = Util.format('[%s] %s deleted %s %s',
            data.repository.name,
            data.sender.login,
            data.ref_type,
            data.ref
        );
        this.bot.send(message, next);
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

        Async.waterfall([
            function (callback) {
                Gitio.shrink({
                    url: data.issue.html_url,
                }, (err, result) => {
                    if (err) {
                        return callback(null, data.compare);
                    }
                    return callback(null, result);
                });
            },
            function (url, callback) {
                const message = Util.format('[%s] %s %s Issue #%s: %s %s',
                    data.repository.name,
                    data.sender.login,
                    data.action,
                    data.issue.number,
                    data.issue.title,
                    url
                );
                self.bot.send(message, callback);
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

        Async.waterfall([
            function (callback) {
                Gitio.shrink({
                    url: data.pull_request.html_url,
                }, (err, result) => {
                    if (err) {
                        return callback(null, data.compare);
                    }
                    return callback(null, result);
                });
            },
            function (url, callback) {
                const message = Util.format('[%s/%s] %s %s Pull Request #%s: %s %s',
                    data.pull_request.base.repo.name,
                    data.pull_request.base.ref,
                    data.sender.login,
                    data.action,
                    data.pull_request.number,
                    data.pull_request.title,
                    url
                );
                self.bot.send(message, callback);
            },
        ], function (err) {
            return next(err);
        });
    }

    release(data, next) {
        const self = this;
        this._shortURL = undefined;

        Async.waterfall([
            function (callback) {
                Gitio.shrink({
                    url: data.pull_request.html_url,
                }, (err, result) => {
                    if (err) {
                        return callback(null, data.compare);
                    }
                    return callback(null, result);
                });
            },
            function (url, callback) {
                const message = Util.format('[%s] %s published release %s: %s %s',
                    data.repository.name,
                    data.respository.sender.login,
                    data.release.tag_name,
                    data.release.name,
                    url
                );
                self.bot.send(message, callback);
            },
        ], function (err) {
            return next(err);
        });
    }
}

module.exports = Github;
