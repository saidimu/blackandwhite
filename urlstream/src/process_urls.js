const appname = require('path').basename(__filename, '.js');
const log = require('./logging.js')(appname);

const fetch = require('node-fetch');

import {
  stats,
} from './statsd.js';

import {
  init_writer,
  init_reader,
  publish as publish_message,
} from './messaging.js';

const now = require('performance-now');

import {
  Articles,
} from './datastore.js';

import {
  site_in_ignore_list,
  process_url,
  get_site_alignment,
} from './utils/news_urls.js';

const host = process.env.NEWSPAPER_PORT_8000_TCP_ADDR;
const port = process.env.NEWSPAPER_PORT_8000_TCP_PORT;
const NEWSPAPER_ENDPOINT = `http://${host}:${port}/article`;

const IGNORE_HOSTNAMES = process.env.IGNORE_HOSTNAMES.split(',') || [];
const top500_sites = require('./utils/news_top500.json');

export function process_urls() {
  const topic = process.env.TWEET_URLS_TOPIC;
  const channel = process.env.TWEET_URLS_PROCESS_CHANNEL;

  init_reader(topic, channel, {
    message: on_url,
    discard: on_discard_message,
  });// init_reader

  function on_url(message) {
    const message_object = message.json();
    const tweet_id = message_object.tweet_id;

    // FIXME TODO check for empty url object
    const url_object = message_object.url || message_object.urls || {};
    const expanded_url = url_object.expanded_url || null; // FIXME TODO check for empty url object

    log.debug({ topic, channel, tweet_id, url_object }, 'Urls message object');

    if (!expanded_url) {
      stats.increment(`${topic}.${channel}.error.expanded_url`);
      log.error({
        topic, channel, tweet_id, url_object,
      }, 'Missing a valid expanded_url object in message');
      message.finish();
      return;
    }// if

    if (site_in_ignore_list(expanded_url, IGNORE_HOSTNAMES)) {
      stats.increment('get_article.warn.ignore_hostname');
      log.warn({
        expanded_url,
        ignore_hostnames: IGNORE_HOSTNAMES,
      }, 'Ignore link hostname b/c it is in list of IGNORED HOSTNAMES');
      return;
    }// if

    let start = now();
    let end;
    let duration;

    // check if an Article with this url already exists in Firebase
    // if not, create an Article from these urls and publish a message
    Articles
      .child(tweet_id)
      .orderByChild('expanded_url')
      .equalTo(expanded_url)
      .once('value')
      .then((snapshot) => {
        end = now();
        duration = end - start;
        stats.histogram('firebase.articles.equalTo.tweet_urls.process', duration);

        const value = snapshot.val();
        if (!value) {
          log.info({
            topic, channel, expanded_url, value,
          }, 'Article NOT found in Firebase. Creating one...');

          // https://github.com/dudleycarr/nsqjs#message
          // Tell nsqd that you want extra time to process the message.
          // It extends the soft timeout by the normal timeout amount.
          message.touch();

          const article_topic = process.env.ARTICLES_TOPIC;

          start = now();

          get_article(expanded_url)
            .then((article) => {
              message.touch(); // ask for extra time to process message
              end = now();
              duration = end - start;
              stats.histogram('get_article.tweet_urls.process.then', duration);

              if (article) {
                const site_alignment = get_site_alignment(expanded_url, top500_sites);
                const article_message = { tweet_id, expanded_url, article, site_alignment };

                log.info({
                  topic,
                  channel,
                  tweet_id,
                  expanded_url,
                  article_title: article.title,
                  source_url: article.source_url,
                  site_alignment,
                }, 'Article metadata');

                log.debug({ topic, channel, article_message }, 'Article message');
                log.info({
                  article_topic, tweet_id, expanded_url, site_alignment,
                }, 'Publishing Article related to url.');

                publish_message(article_topic, article_message);

                message.finish();
              } else {
                stats.increment(`${topic}.${channel}.error.article_empty`);
                log.error({ topic, channel, tweet_id, url_object, article }, 'Article is empty.');

                // // requeue message in case transient issues are responsible for empty Article
                // // DO NOT treat the requeue as an error ## https://github.com/dudleycarr/nsqjs#message
                // message.requeue(null, false);

                // previous policy resulted in too many requeues and subsequent message discards
                // now finish()ing the message regardless of the cause of the empty article response
                message.finish();
              }// if-else
            }).catch((err) => {
              end = now();
              duration = end - start;
              stats.histogram('get_article.tweet_urls.process.catch', duration);

              stats.increment(`${topic}.${channel}.error.get_request`);
              log.error({
                topic, channel, err, tweet_id, expanded_url,
              }, 'Error executing get_article API request');
              message.finish();
            });// get_article
        } else {
          log.info({ topic, channel, expanded_url }, 'Article FOUND in Firebase.');
          message.finish();
        }// if-else
      });// Articles.child
  }// on_url

  function on_discard_message(message) {
    const discard_topic = `${topic}.${channel}.discarded`;
    stats.increment(discard_topic);
    log.warn({ discard_topic, num_attempts: message.attempts }, 'Discarded message.');
    publish_message(discard_topic, message.json());
  }// on_discard_message
}// process_urls

function get_article(expanded_url) {
  if (process_url(expanded_url, IGNORE_HOSTNAMES, top500_sites)) {
    stats.increment('get_article.warn.not_top500');
    log.warn({
      expanded_url,
    }, 'Ignore url b/c it is not in list of news domains to fetch articles from.');
    return null;
  }// if

  if (expanded_url) {
    stats.increment('get_article.info.fetch_article');
    log.info({ expanded_url }, 'Fetching Article for url.');
    return fetch(`${NEWSPAPER_ENDPOINT}?url=${expanded_url}`)
      .then((response) => response.json())
      .then((json) => json);
  } else {
    stats.increment('get_article.error.invalid_url');
    log.error({ expanded_url }, 'Not a valid url');
    return null;
  }// if-else
}// get_article

init_writer();
process_urls();
