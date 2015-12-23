# Discord Github Relay Bot
This is a simple NodeJS bot that listens for Github Webhook requests and forwards them to a Discord channel on a server. Its on you to make a Discord account for the bot and add it to a specific server. The bot can listen to multiple servers, but only one named channel is supported (currently).

To set this bot up you will need to have NodeJS `v4.2` or higher. After that, simply run the commands below.

```
cd /home
git clone https://github.com/DaneEveritt/Discord-Bot.git discord
cd discord
npm install --production
mv config.json.dist config.json
```

You'll need to edit the `config.json` file using your favorite editor and then run `node index.js | node_modules/bunyan/bin/bunyan -o short` to start the bot and view the output. If you want to keep the bot running in the background, look into using something like [`forever`](https://github.com/foreverjs/forever).

Enjoy.

# License
```
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org>
```
