var credentials = require('./twitter_credentials.json');
var twit = require('twit');
var Twitter = new twit(credentials);

module.exports = Twitter;