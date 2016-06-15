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
  Articles,
} from './datastore.js';

const now = require('performance-now');

export function save_articles() {
  const topic = process.env.ARTICLES_TOPIC;
  const channel = process.env.ARTICLES_SAVE_CHANNEL;

  init_reader(topic, channel, {
    message: on_article,
    discard: on_discard_message,
  });// init_reader

  function on_article(message) {
    const message_object = message.json();
    const tweet_id = message_object.tweet_id;
    const expanded_url = message_object.expanded_url;
    const article = message_object.article;
    const site_alignment = message_object.site_alignment;

    // make sure NOT to save article html (space-saving measure)
    // article fulltext, derived from html, is however saved
    // html can always be re-downloaded if needed
    article.html = null;

    const article_object = {
      expanded_url,
      article,
      site_alignment,
    };// article_object

    log.debug({
      topic, channel, tweet_id, expanded_url, article_object,
    }, 'Article data and metada');

    const start = now();
    let end;
    let duration;

    try {
      Articles
        .child(tweet_id)
        .push(article_object)
        .then((value) => {
          end = now();
          duration = end - start;
          stats.histogram('firebase.articles.push.articles.save.then', duration);
          stats.increment(`${topic}.${channel}.firebase.article.save`);
          log.info({
            topic, channel, tweet_id, expanded_url, firebase_key: value.key,
          }, 'Article object saved to Firebase.');
          message.finish();
        })
        .catch((err) => {
          end = now();
          duration = end - start;
          stats.histogram('firebase.articles.push.articles.save.catch', duration);
          log.error({
            topic, channel, err, tweet_id, article_object,
          }, 'Promise-catch: Error saving Article object to Firebase.');
          message.finish();
        });// Articles.child
    } catch (e) {
      message.finish();
      log.error({ e }, 'Try-catch: Error saving Article object to Firebase.');
    }// try-catch
  }// on_article

  function on_discard_message(message) {
    const discard_topic = `${topic}.${channel}.discarded`;
    stats.increment(discard_topic);
    log.warn({ discard_topic, num_attempts: message.attempts }, 'Discarded message.');
    publish_message(discard_topic, message.json());
  }// on_discard_message
}// save_articles

init_writer();
save_articles();
