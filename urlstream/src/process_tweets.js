const path = require('path');
const appname = path.basename(__filename, '.js');
const log = require('./logging.js')(appname);

import {
  stats,
} from './statsd.js';

import {
  init_writer,
  init_reader,
  publish as publish_message,
} from './messaging.js';

init_writer();

export function process_tweets() {
  init_reader(
    process.env.TWEETS_TOPIC,
    process.env.TWEETS_PROCESS_CHANNEL,
    {
      message: on_tweet,
      discard: on_discard_message,
    }
  );// init_reader

  function on_tweet(message) {
    const tweet = message.json();
    const tweet_id = tweet.id_str;

    const tweet_urls_topic = process.env.TWEET_URLS_TOPIC;

    log.debug({ tweet_id, tweet }, 'Tweet message object');

    tweet.entities.urls.forEach((url) => {
      if (url) {
        log.info({ tweet_urls_topic, tweet_id, url }, 'Publishing urls in tweet');
        publish_message(tweet_urls_topic, {
          tweet_id,
          urls: url,
        });// publish_message
      }// if
    });// forEach

    message.finish();
  }// on_tweet

  function on_discard_message(message) {
    // const topic = process.env.DISCARDED_MESSAGES_TOPIC + '.message_discard';
    const topic = `${process.env.TWEETS_TOPIC}.${process.env.TWEETS_PROCESS_CHANNEL}.discarded`;
    stats.increment(topic);
    log.warn({ topic, num_attempts: message.attempts }, 'Discarded message.');
    publish_message(topic, message.json());
  }// on_discard_message
}// process_tweets
