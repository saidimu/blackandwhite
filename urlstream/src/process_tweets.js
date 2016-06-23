const appname = require('path').basename(__filename, '.js');
const log = require('./logging.js')(appname);

import {
  stats,
} from './statsd.js';

import {
  init_writer,
  init_reader,
  publish as publish_message,
} from './messaging.js';

import {
  get_urls,
} from './tweets.js';

export function process_tweets() {
  const topic = process.env.TWEETS_TOPIC;
  const channel = process.env.TWEETS_PROCESS_CHANNEL;

  init_reader(topic, channel, {
    message: on_tweet,
    discard: on_discard_message,
  });// init_reader

  function on_tweet(message) {
    const tweet = message.json();
    const tweet_id = tweet.id_str;

    const tweet_urls_topic = process.env.TWEET_URLS_TOPIC;

    log.debug({ tweet_id, tweet }, 'Tweet message object');

    const urls = get_urls(tweet);
    // tweet.entities.urls.forEach((url) => {
    urls.forEach((url) => {
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
    const discard_topic = `${topic}.${channel}.discarded`;
    stats.increment(discard_topic);
    log.warn({ discard_topic, num_attempts: message.attempts }, 'Discarded message.');
    publish_message(discard_topic, message.json());
  }// on_discard_message
}// process_tweets

init_writer();
process_tweets();
