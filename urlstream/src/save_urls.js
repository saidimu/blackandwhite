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
  Urls,
} from './datastore.js';

const now = require('performance-now');

export function save_urls() {
  const topic = process.env.TWEET_URLS_TOPIC;
  const channel = process.env.TWEET_URLS_SAVE_CHANNEL;

  init_reader(topic, channel, {
    message: on_url,
    discard: on_discard_message,
  });// init_reader

  function on_url(message) {
    const message_object = message.json();
    const tweet_id = message_object.tweet_id;

    // FIXME TODO check for empty url object
    const url_object = message_object.url || message_object.urls || {};
    const twitter_short_url = url_object.url || null; // FIXME TODO check for empty url object
    const expanded_url = url_object.expanded_url || null; // FIXME TODO check for empty url object

    if (!expanded_url) {
      stats.increment(`${topic}.${channel}.error.expanded_url`);
      log.error({
        topic, channel, tweet_id, url_object,
      }, 'Missing a valid expanded_url object in message');
      message.finish();
      return;
    }// if

    const start = now();
    let end;
    let duration;

    // find existing url (the twitter short link)
    // else create a new Urls object
    // the assumption is the same tweet cannot have multiple identical 'twitter short links' (t.co)
    Urls
      .child(tweet_id)
      .orderByChild('url')
      .equalTo(twitter_short_url)
      .once('value')
      .then((snapshot) => {
        const value = snapshot.val();
        if (!value) {
          log.info({
            topic, channel, twitter_short_url, value,
          }, 'URL NOT found in Firebase. Creating one...');

          // https://github.com/dudleycarr/nsqjs#message
          // Tell nsqd that you want extra time to process the message.
          // This extends the soft timeout by the normal timeout amount.
          message.touch();

          Urls
            .child(tweet_id)
            .push(url_object)
            .then(() => { // not using return (Firebase-saved) value
              end = now();
              duration = end - start;
              stats.histogram('firebase.urls.push.tweet_urls.save.then', duration);

              log.info({
                topic, channel, tweet_id, url_object, firebase_key: value.key,
              }, 'Tweet URL object saved.');
              message.finish();
            })
            .catch((err) => {
              end = now();
              duration = end - start;
              stats.histogram('firebase.urls.push.tweet_urls.save.catch', duration);
              log.error({ topic, channel, err, tweet_id, url_object });
              message.finish();
            });// Urls.child
        } else {
          log.info({ topic, channel, twitter_short_url }, 'Url FOUND in Firebase.');
          message.finish();
        }// if-else
      });// Urls.child
  }// on_url

  function on_discard_message(message) {
    const discard_topic = `${topic}.${channel}.discarded`;
    stats.increment(discard_topic);
    log.warn({ discard_topic, num_attempts: message.attempts }, 'Discarded message.');
    publish_message(discard_topic, message.json());
  }// on_discard_message
}// save_urls
