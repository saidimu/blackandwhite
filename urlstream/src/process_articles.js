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
  analyze_emotion,
} from './cognition.js';

import {
  TopImages,
} from './datastore.js';

import {
  get_emotion_api_token,
} from './ratelimit.js';

const now = require('performance-now');

export function process_articles() {
  const topic = process.env.ARTICLES_TOPIC;
  const channel = process.env.ARTICLES_PROCESS_CHANNEL;

  const process_articles_reader = init_reader(topic, channel, {
    message: on_article,
    discard: on_discard_message,
  });// init_reader

  function on_article(message) {
    const article_object = message.json();
    const tweet_id = article_object.tweet_id;
    const article = article_object.article || null;
    const expanded_url = article_object.expanded_url || null;

    log.debug({
      topic, channel, tweet_id, article_keys: Object.keys(article),
    }, 'Article message object');

    if (!article) {
      stats.increment(`${topic}.${channel}.error.empty_article`);
      log.error({
        topic, channel, tweet_id, article,
      }, 'Empty Article object in message');
      message.finish();
      return;
    }// if

    const top_image_url = article.top_image || null;

    if (!top_image_url) {
      stats.increment(`${topic}.${channel}.error.top_image_url`);
      log.error({
        topic, channel, tweet_id,
      }, 'Empty top_image_url object in message');
      message.finish();
      return;
    }// if

    let start = now();
    let end;
    let duration;

    // check if a TopImages object with this url already exists in Firebase
    // else create a new TopImages object
    TopImages
      .child(tweet_id)
      .orderByChild('top_image_url')
      .equalTo(top_image_url)
      .once('value')
      .then((snapshot) => {
        end = now();
        duration = end - start;
        stats.histogram('firebase.top_images.equalTo.top_image_url.process', duration);

        const value = snapshot.val();
        if (!value) {
          log.info({
            topic, channel, top_image_url, expanded_url, value,
          }, 'TopImage NOT found in Firebase. Creating one...');

          // https://github.com/dudleycarr/nsqjs#message
          // Tell nsqd that you want extra time to process the message.
          // It extends the soft timeout by the normal timeout amount.
          message.touch();

          start = now();

          const emotion_api_options = { url: top_image_url };
          const emotion_api = () => {
            analyze_emotion(emotion_api_options)
              .then((emotions_object) => {
                end = now();
                duration = end - start;
                stats.histogram('analyze_emotion.top_image_url.process.then', duration);

                start = now();

                if (emotions_object) {
                  // create new TopImages Firebase object
                  TopImages
                    .child(tweet_id)
                    .push({ expanded_url, top_image_url, emotions_object })
                    .then((firebase_object) => {
                      end = now();
                      duration = end - start;
                      stats.histogram('firebase.articles.push.top_images.save.then', duration);
                      stats.increment(`${topic}.${channel}.firebase.top_images.save`);
                      log.info({
                        topic, channel, tweet_id, top_image_url, firebase_key: firebase_object.key,
                      }, 'TopImage object saved.');
                      message.finish();
                    })
                    .catch((err) => {
                      end = now();
                      duration = end - start;
                      stats.histogram('firebase.articles.push.top_images.save.catch', duration);
                      log.error({
                        topic, channel, err, tweet_id, emotions_object,
                      }, 'Error saving TopImage object');
                      message.finish();
                    });// TopImages.child
                } else {
                  stats.increment(`${topic}.${channel}.empty.analyze_emotion`);
                  log.info({
                    topic, channel, tweet_id, top_image_url, expanded_url,
                  }, 'Error. Empty analyze_emotion API response');
                  message.finish();
                }// if-else
              })
              .catch((err) => {
                end = now();
                duration = end - start;
                stats.histogram('analyze_emotion.top_image_url.process.catch', duration);
                stats.increment(`${topic}.${channel}.error.analyze_emotion`);
                log.error({
                  topic, channel, err, tweet_id, top_image_url, expanded_url,
                }, 'Error executing analyze_emotion API request');
                message.finish();
              });// analyze_emotion
          };// emotion_api

          get_emotion_api_token(function (err, response) {
            if (err) {
              log.error({
                err, topic, channel, tweet_id, top_image_url, expanded_url,
              }, 'Error getting Emotion API tokens from the rate-limiter');
            } else if (response.conformant) {
              emotion_api();
            } else {
              const reset_timestamp = response.reset;
              const message_delay_in_milliseconds = (reset_timestamp * 1000) - Date.now();
              const message_delay_in_seconds = parseInt(message_delay_in_milliseconds / 1000, 10);
              log.info({
                message_delay_in_seconds,
                reset_timestamp,
                topic,
                channel,
                tweet_id,
                top_image_url,
                expanded_url,
              }, 'Emotion API tokens: not enough tokens from the rate-limiter');

              // Requeue the messsage until the time tokens are available
              // https://github.com/dudleycarr/nsqjs#message
              message.requeue(message_delay_in_seconds, false);

              log.info({
                topic, channel, message_delay_in_seconds,
              }, 'Pausing the NSQ Reader after being rate-limited.');

              // Pause the channel until the time tokens are available
              // https://github.com/dudleycarr/nsqjs#new-readertopic-channel-options
              process_articles_reader.pause();

              // Unpause the channel after tokens are available
              setTimeout(() => {
                log.info({
                  topic, channel, message_delay_in_milliseconds,
                }, 'Unpausing the NSQ Reader after being rate-limited.');
                process_articles_reader.unpause();
              }, message_delay_in_milliseconds);
            }// if-else
          });// get_emotion_api_token
        } else {
          log.info({
            topic, channel, top_image_url, expanded_url,
          }, 'TopImage FOUND in Firebase.');
          message.finish();
        }// if-else
      });// TopImages.child`
  }// on_article

  function on_discard_message(message) {
    const discard_topic = `${topic}.${channel}.discarded`;
    stats.increment(discard_topic);
    log.warn({ discard_topic, num_attempts: message.attempts }, 'Discarded message.');
    publish_message(discard_topic, message.json());
  }// on_discard_message
}// process_articles

init_writer();
process_articles();
