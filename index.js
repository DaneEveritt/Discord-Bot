'use strict';

/**
 * Discord Bot
 * Connects Github with Discord Server and relays messages.
 */
const rfr = require('rfr');
const moment = require('moment');
const Async = require('async');
const RestifyServer = require('restify');
const IPAddr = require('ipaddr.js');

const Config = rfr('config.json');
const Log = rfr('src/logger.js');

const Bot = rfr('src/bot.js').Bot;
const BotHandler = rfr('src/bot.js').BotHandler;
const GithubHandler = rfr('src/github.js');

const Restify = RestifyServer.createServer({
    name: 'Discord Bot',
});

const Handler = new BotHandler();
let Github;

Async.series([
    function (callback) {
        // Login to BotHandler
        Handler.login((err) => {
            return callback(err);
        });
    },
    function (callback) {
        Github = new GithubHandler(Handler, (err) => {
            return callback(err);
        });
    },
    // function (callback) {
    //     Bot.setStatus('online', 'Github Messenger', (err) => {
    //         return callback(err);
    //     });
    // },
    function (callback) {
        Restify.post('/github', function restifyPostGithub(req, res) {
            let IP;
            Async.series([
                function (next) {
                    IP = req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
                    const Addr = IPAddr.parse(IP);

                    if (Addr.match(IPAddr.parseCIDR('192.30.252.0/22')) === true) {
                        return next();
                    }
                    return next(new Error('Request originated from an invalid IP CIDR range.'));
                },
                function (next) {
                    Log.info('Accepted request from ' + IP + ' for ' + req.headers['x-github-event']);
                    return next();
                },
                function (next) {
                    switch (req.headers['x-github-event']) {
                    case 'push':
                        Github.pushed(req.params, next);
                        break;
                    case 'create':
                        Github.create(req.params, next);
                        break;
                    case 'delete':
                        Github.delete(req.params, next);
                        break;
                    case 'issues':
                        Github.issue(req.params, next);
                        break;
                    case 'pull_request':
                        Github.pull(req.params, next);
                        break;
                    case 'release':
                        Github.release(req.params, next);
                        break;
                    default:
                        next();
                        break;
                    }
                },
            ], function (err) {
                if (err) {
                    Log.error(err);
                    return res.send(503, { 'error': err.message });
                }
                return res.send(204);
            });
        });
        return callback();
    },
], (err) => {
    if (err) {
        Log.fatal(err);
        process.exit(1);
    }
    Restify.listen(9080, '0.0.0.0', function restifyListen() {
        Log.info('Server now listening on :9080');
    });
});

Restify.use(RestifyServer.bodyParser());
Restify.use(RestifyServer.authorizationParser());
Restify.use(RestifyServer.queryParser());

Restify.opts(/.*/, function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', req.header('Access-Control-Request-Method'));
    res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));
    res.send(200);

    return next();
});

Restify.on('uncaughtException', function (req, res, route, err) {
    Log.fatal({ path: route.spec.path, method: route.spec.method }, err.stack);
    return res.send(500, { 'error': err.message });
});

Restify.get('/', function getIndex(req, res) {
    res.send('Github --> Discord Bot Server --> Discord');
});

// listeners
Bot.on('ready', () => {
    Log.info('Discord bot is ready for action!');
    Handler.findChannel((err) => {
        if (err) {
            Log.fatal(err);
            process.exit(1);
        }
    });
});

Bot.on('message', (msg) => {
    if (typeof msg.author.id !== 'string' || Config.admins.indexOf(msg.author.id) < 0) {
        return false;
    }
    if (msg.content === '!ping') Handler.replyMsg(msg, 'pong');
});

Bot.on('disconnected', () => {
    if (moment.isMoment(Handler.lastDisconnect())) {
        if (moment(Handler.lastDisconnect()).add(60, 'seconds').isAfter(moment())) {
            setTimeout(() => {
                Handler.login((err) => {
                    if (err) {
                        Log.fatal(err);
                        process.exit(1);
                    }
                });
            }, 120000);
        } else {
            Handler.login((err) => {
                if (err) {
                    Log.fatal(err);
                    process.exit(1);
                }
            });
        }
    }
    Handler.lastDisconnect(moment());
});
