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

init_writer();

get_tweet_stream((tweet) => {
  log.info({
    tweet_id: tweet.id_str
  }, 'Received Tweet.');
  publish(process.env.TWEETS_TOPIC, tweet);
});// get_tweet_stream

process_tweets();
process_urls();
save_urls();
// process_articles();
save_articles();
