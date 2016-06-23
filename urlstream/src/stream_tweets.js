import {
  get_tweet_stream,
} from './twitter.js';

import {
  init_writer,
  publish,
} from './messaging.js';

import {
  stats,
} from './statsd.js';

const path = require('path');
const appname = path.basename(__filename, '.js');
const log = require('./logging.js')(appname);

init_writer();

get_tweet_stream((tweet) => {
  const topic = process.env.TWEETS_TOPIC;
  log.info({ tweet_id: tweet.id_str, topic }, 'Publishing received tweet.');
  stats.increment(`${topic}.count`);
  publish(topic, tweet);
});// get_tweet_stream
