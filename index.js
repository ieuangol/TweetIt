var bot = require('./discord/bot.js');
var bot_settings = require('./discord/discord_settings.json');
var twitter = require('./twitter/twitter.js');

var cooldowns = new Map();

var log = function(message) {
    bot.channels.get(bot_settings['log_channel']).send(message);
};

var startCooldown = function(userID) {
    cooldowns.set(userID, Date.now() + 3600000);
}

var isCooldown = function(userID) {
    return cooldowns.get(userID) != undefined;
}

var cooldownRemoverTask = function() {
    var now = Date.now();

    cooldowns.forEach(function (val, key, map) {
        if (val <= now) {
            cooldowns.delete(key);
        }
    });

    setTimeout(cooldownRemoverTask, 1000 * 60);
}

bot.on('ready', () => {
    console.log('[OriginalBot] Logged in as ' + bot.user.tag);
    bot.user.setGame('>tweetit');
    cooldownRemoverTask();
});

bot.on('guildCreate', (guild) => {
    log('**JOINED GUILD>** ' + guild.name + " (" + guild.id + ")");
});

bot.on('guildDelete', (guild) => {
    log('**LEFT GUILD>** ' + guild.name + " (" + guild.id + ")");
});

bot.on('message', (message) => {
    var args = message.cleanContent.split(' ');
    var msg = message.cleanContent.replace('>tweetit ', '');

    if (args[0].toLowerCase() === '>tweetit') {
        if (!message.author.bot) {
            if (args.length == 1) {
                message.reply('Use `>tweetit message` to publicly post a message to `twitter.com/DiscordTweetIt`. You can only do this once an hour, so choose your message wisely.');
            } else {
                if (msg.length > 140) {
                    message.reply("I can't tweet that! It's over 140 characters D:");
                } else {
                    if (isCooldown(message.author.id)) {
                        var mins = new Date(cooldowns.get(message.author.id) - Date.now()).getMinutes();
                        message.reply("You can send a tweet again in " + mins + (mins === 1 ? " minute" : " minutes"));
                    } else {
                        twitter.post('statuses/update', {status: msg}, function(err, data) {
                            if (err === undefined) {
                                var url = 'https://twitter.com/DiscordTweetIt/status/' + data.id_str; 
                               log('**POST>** ' + message.author.tag + ": " + msg + ' (`' + url + '`)');
                                message.reply('Tweet sent, you can view it at ' + url);
                                startCooldown(message.author.id);
                            } else {
                                message.reply("Something went wrong while posting your tweet. " + err);
                                    log('**ERROR>** @everyone ' + message.author.tag + ": " + msg + ' -> `' + err + '`'); 
                            }
                        });      
                    }
                }
            }

        }
    }  
});