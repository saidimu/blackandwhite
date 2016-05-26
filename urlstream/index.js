import {
  get_tweet_stream
} from './twitter.js';

import {
  init_writer,
  publish
} from './messaging.js';

import {
  process_tweets,
  save_tweets,
  process_urls,
  save_urls,
  process_top_image,
  save_top_image
} from './analysis.js';

init_writer();

get_tweet_stream((tweet) => {
  publish(process.env.TWEETS_TOPIC, tweet);
});// get_tweet_stream

process_tweets();
// save_tweets();
process_urls();
save_urls();
// process_top_image();
// save_top_image();
