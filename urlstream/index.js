import {
  get_tweet_stream
} from './twitter.js';

import {
  init_writer,
  publish
} from './messaging.js';

import {
  process_tweets,
  process_urls,
  save_urls,
  process_articles,
  save_articles
} from './analysis.js';

var path = require('path');
var appname = path.basename(__filename, '.js');
var log = require('./logging.js')(appname);

var StatsD = require('hot-shots');
var stats = new StatsD({
  host: process.env.STATSD_PORT_8125_UDP_ADDR,
  port: process.env.STATSD_PORT_8125_UDP_POR
});
// Catch socket errors so they don't go unhandled, as explained
// in the Errors section below
stats.socket.on('error', function(err) {
  log.error({err}, "Error in STATSD socket: ");
});// stats.socket

init_writer();

get_tweet_stream((tweet) => {
  const topic = process.env.TWEETS_TOPIC;
  stats.increment('tweets');
  log.info({ tweet_id: tweet.id_str, topic }, 'Publishing received tweet.');
  publish(topic, tweet);
});// get_tweet_stream

process_tweets();
process_urls();
save_urls();
// process_articles();
save_articles();
