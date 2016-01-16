'use strict';

/**
 * Discord Bot
 * Connects Github with Discord Server and relays messages.
 */
const Config = require('./config.json');
const RestifyServer = require('restify');
const IPAddr = require('ipaddr.js');
const Async = require('async');
const DiscordClient = require('discord.io');
const GithubModule = require('./github.js');
const Log = require('./logger.js');

const Restify = RestifyServer.createServer({
    name: 'Discord Bot',
});

let Bot;
let Github;
let LastConnect = new Date();

Bot = new DiscordClient({
    email: Config.email,
    password: Config.password,
    autorun: true,
});

Bot.on('ready', function botReady() {
    Log.info('Bot is now ready for action (id: ' + Bot.id + ')!');
    Github = new GithubModule(Bot, Config.channel);
});

Bot.on('disconnected', function botDisconnected() {
    Log.fatal('It seems the bot has disconnected from Discord...');

    if (Math.floor(new Date().getTime() / 1000) - LastConnect < 60) {
        Log.fatal('Unable to reconnect bot due to throttling. Bot has disconnected twice in 60 seconds. Retrying again in 2 minutes.');
        setTimeout(function () {
            Bot.connect();
            LastConnect = new Date();
        }, 120000);
    } else {
        Bot.connect();
        LastConnect = new Date();
    }
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
            if (!req.params.secret || req.params.secret !== Config.secret) {
                return next(new Error('Invalid secret provided.'));
            }
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

Restify.listen(9080, '0.0.0.0', function restifyListen() {
    Log.info('Server now listening on :9080');
});
