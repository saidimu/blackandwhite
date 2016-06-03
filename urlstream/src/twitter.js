var Twit = require('twit');

var path = require('path');
var appname = path.basename(__filename, '.js');
var log = require('./logging.js')(appname);

var twitter = new Twit({
  consumer_key:         process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
  access_token:         process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});//twitter

const terms = process.env.TWITTER_STREAMING_TRACK_KEYWORDS.split(',');

log.info({terms}, 'Twitter Streaming tracking terms');

var stream = twitter.stream('statuses/filter', {
  track: terms,
  language: process.env.TWITTER_STREAMING_LANGUAGE
});// stream

export function get_tweet_stream(tweet, disconnect, error) {
  tweet = tweet || function (tweet) {
    log.debug({tweet});
  };// tweet

  stream.on('tweet', tweet);// stream.on('tweet')

  disconnect = disconnect || function (disconnectMessage) {
    log.error({err: disconnectMessage});
    process.exit(1);  // exit with an error so Docker can handle restarts
  };// disconnect

  stream.on('disconnect', disconnect);// stream.on('disconnect')

  error = error || function (error) {
    log.error({err: error});
    process.exit(1);  // exit with an error so Docker can handle restarts
  };// error

  stream.on('error', error);// stream.on('error')
}// get_tweet_stream
