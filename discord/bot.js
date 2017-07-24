const Discord = require("discord.js");
const client = new Discord.Client();
client.login(require('./discord_settings.json')['discord_token']);

module.exports = client;