var fetch = require('node-fetch');
var urlparse = require('url').parse;

var path = require('path');
var appname = path.basename(__filename, '.js');
var log = require('./logging.js')(appname);

var now = require("performance-now");

import {
  init_writer,
  init_reader,
  publish as publish_message
} from './messaging.js';

import {
  stats
} from './statsd.js';

import {
  analyze_emotion
} from './cognition.js';

import {
  Urls,
  Articles,
  TopImages
} from './datastore.js';

init_writer();

const IGNORE_HOSTNAMES = process.env.IGNORE_HOSTNAMES.split(',') || [];
log.info({
  ignore_hostnames: IGNORE_HOSTNAMES
}, 'Hostnames to avoid Article processing');

const host = process.env.NEWSPAPER_PORT_8000_TCP_ADDR;
const port = process.env.NEWSPAPER_PORT_8000_TCP_PORT;

const endpoint = `http://${host}:${port}/article`;

export function process_tweets() {
  init_reader(
    process.env.TWEETS_TOPIC,
    process.env.TWEETS_PROCESS_CHANNEL,
    {
      message: on_tweet,
      discard: on_discard_message
    }
  );// init_reader

  function on_tweet(message)  {
    const tweet = message.json();
    const tweet_id = tweet.id_str;

    const tweet_urls_topic = process.env.TWEET_URLS_TOPIC;

    log.debug({tweet_id, tweet}, 'Tweet message object');

    tweet.entities.urls.forEach((url) => {
      if(url) {
        log.info({tweet_urls_topic, tweet_id, url}, 'Publishing urls in tweet');
        publish_message(tweet_urls_topic, {
          tweet_id: tweet_id,
          urls: url
        });// publish_message
      }// if
    });// forEach

    message.finish();
  }// on_tweet
}// process_tweets

export function process_urls() {
  const topic = process.env.TWEET_URLS_TOPIC;
  const channel = process.env.TWEET_URLS_PROCESS_CHANNEL;

  init_reader(topic, channel, {
    message: on_url,
    discard: on_discard_message
  });// init_reader

  function on_url(message)  {
    const message_object = message.json();
    const tweet_id = message_object.tweet_id;
    const url_object = message_object.url || message_object.urls || {}; // FIXME TODO check for empty url object
    const expanded_url = url_object.expanded_url || null; // FIXME TODO check for empty url object

    log.debug({topic, channel, tweet_id, url_object}, 'Urls message object');

    if(!expanded_url)  {
      stats.increment('${topic}.${channel}.error.expanded_url');
      log.error({topic, channel, tweet_id, url_object}, "Missing a valid expanded_url object in message");
      message.finish();
      return;
    }//if

    var start = now();
    var end, duration;

    // check if an Article with this url already exists in Firebase
    // if not, create an Article from these urls and publish a message
    Articles.child(tweet_id).orderByChild("expanded_url").equalTo(expanded_url).once("value").then(function(snapshot)  {
      end = now();
      duration = end - start;
      stats.histogram('firebase.articles.equalTo.tweet_urls.process', duration);

      const value = snapshot.val();
      if(!value)  {
        log.info({topic, channel, expanded_url, value}, "Article NOT found in Firebase. Creating one...");

        // https://github.com/dudleycarr/nsqjs#message
        // Tell nsqd that you want extra time to process the message. It extends the soft timeout by the normal timeout amount.
        message.touch();

        const article_topic = process.env.ARTICLES_TOPIC;

        start = now();

        get_article(expanded_url)
          .then(function(article)  {
            end = now();
            duration = end - start;
            stats.histogram('get_article.tweet_urls.process.then', duration);

            if(article) {
              const article_message = { tweet_id, expanded_url, article };

              log.info({
                topic,
                channel,
                tweet_id,
                expanded_url,
                article_title: article.title,
                source_url: article.source_url
              }, 'Article metadata');

              log.debug({ topic, channel, article_message }, 'Article message');
              log.info({article_topic, tweet_id, expanded_url}, 'Publishing Article related to url.');

              publish_message(article_topic, article_message);

              message.finish();

            } else {
              stats.increment('${topic}.${channel}.error.article_empty');
              log.error({ topic, channel, tweet_id, url_object, article }, 'Article is empty.');
              // requeue message in case transient issues are responsible for empty Article
              // DO NOT treat the requeue as an error ## https://github.com/dudleycarr/nsqjs#message
              message.requeue(null, false);

            }// if-else
          }).catch(function(err)  {
            end = now();
            duration = end - start;
            stats.histogram('get_article.tweet_urls.process.catch', duration);

            stats.increment('${topic}.${channel}.error.get_request');
            log.error({topic, channel, err, tweet_id, expanded_url}, 'Error executing get_article API request');
            message.finish();

          });// get_article
      } else {
        log.info({topic, channel, expanded_url}, "Article FOUND in Firebase.");
        message.finish();
      }// if-else
    });//Articles.child`

  }// on_url
}// process_urls

export function save_urls() {
  const topic = process.env.TWEET_URLS_TOPIC;
  const channel = process.env.TWEET_URLS_SAVE_CHANNEL;

  init_reader(topic, channel, {
    message: on_url,
    discard: on_discard_message
  });// init_reader

  function on_url(message)  {
    const message_object = message.json();
    const tweet_id = message_object.tweet_id;
    const url_object = message_object.url || message_object.urls || {}; // FIXME TODO check for empty url object
    const twitter_short_url = url_object.url || null; // FIXME TODO check for empty url object
    const expanded_url = url_object.expanded_url || null; // FIXME TODO check for empty url object

    if(!expanded_url)  {
      stats.increment('${topic}.${channel}.error.expanded_url');
      log.error({topic, channel, tweet_id, url_object}, "Missing a valid expanded_url object in message");
      message.finish();
      return;
    }//if

    var start = now();
    var end, duration;

    // find existing url (the twitter short link)
    // else create a new Urls object
    // the assumption is the same tweet cannot have multiple identical 'twitter short links' (t.co)
    Urls.child(tweet_id).orderByChild("url").equalTo(twitter_short_url).once("value").then(function(snapshot)  {
      const value = snapshot.val();
      if(!value)  {

        Urls.child(tweet_id).push(url_object).then(function(value) {
          end = now();
          duration = end - start;
          stats.histogram('firebase.urls.push.tweet_urls.save.then', duration);

          log.info({topic, channel, tweet_id, url_object, firebase_key: value.key}, 'Tweet URL object saved.');
          message.finish();
        }).catch(function(err)  {
          end = now();
          duration = end - start;
          stats.histogram('firebase.urls.push.tweet_urls.save.catch', duration);

          log.error({topic, channel, err, tweet_id, url_object});
        });// Urls.child

      }//if
    });//Urls.child

  }// on_url
}// save_urls

export function process_articles() {
  const topic = process.env.ARTICLES_TOPIC;
  const channel = process.env.ARTICLES_PROCESS_CHANNEL;

  init_reader(topic, channel, {
    message: on_article,
    discard: on_discard_message
  });// init_reader

  function on_article(message)  {
    const article_object = message.json();
    const tweet_id = article_object.tweet_id;
    const article = article_object.article || null;
    const expanded_url = article_object.expanded_url || null;

    log.debug({topic, channel, tweet_id, article_keys: Object.keys(article)}, 'Article message object');

    if(!article)  {
      stats.increment('${topic}.${channel}.error.empty_article');
      log.error({topic, channel, tweet_id, article}, "Empty Article object in message");
      message.finish();
      return;
    }//if

    const top_image_url = article.top_image || null;

    if(!top_image_url)  {
      stats.increment('${topic}.${channel}.error.top_image_url');
      log.error({topic, channel, tweet_id}, "Empty top_image_url object in message");
      message.finish();
      return;
    }//if

    var start = now();
    var end, duration;

    // check if a TopImages object with this url already exists in Firebase
    // else create a new TopImages object
    TopImages.child(tweet_id).orderByChild("top_image_url").equalTo(top_image_url).once("value").then(function(snapshot)  {
      end = now();
      duration = end - start;
      stats.histogram('firebase.top_images.equalTo.top_image_url.process', duration);

      const value = snapshot.val();
      if(!value)  {
        log.info({topic, channel, top_image_url, expanded_url, value}, "TopImage NOT found in Firebase. Creating one...");

        // https://github.com/dudleycarr/nsqjs#message
        // Tell nsqd that you want extra time to process the message. It extends the soft timeout by the normal timeout amount.
        message.touch();

        start = now();

        const emotion_api_options = { url: top_image_url };
        analyze_emotion(emotion_api_options).then(function(emotions_object)  {
          end = now();
          duration = end - start;
          stats.histogram('analyze_emotion.top_image_url.process.then', duration);

          start = now();

          if(emotions_object) {
            // create new TopImages Firebase object
            TopImages.child(tweet_id).push({expanded_url, top_image_url, emotions_object}).then(function(value) {
              end = now();
              duration = end - start;
              stats.histogram('firebase.articles.push.top_images.save.then', duration);
              stats.increment('${topic}.${channel}.firebase.top_images.save');
              log.info({topic, channel, tweet_id, top_image_url, firebase_key: value.key}, 'TopImage object saved.');
              message.finish();
            }).catch(function(err)  {
              end = now();
              duration = end - start;
              stats.histogram('firebase.articles.push.top_images.save.catch', duration);
              log.error({topic, channel, err, tweet_id, emotions_object});
              message.finish();
            });// TopImages.child

          } else {
            stats.increment('${topic}.${channel}.empty.analyze_emotion');
            log.info({topic, channel, tweet_id, top_image_url, expanded_url}, 'Error. Empty analyze_emotion API response');
            message.finish();
          }// if-else

        }).catch(function(err)  {
          end = now();
          duration = end - start;
          stats.histogram('analyze_emotion.top_image_url.process.catch', duration);

          stats.increment('${topic}.${channel}.error.analyze_emotion');
          log.error({topic, channel, err, tweet_id, top_image_url, expanded_url}, 'Error executing analyze_emotion API request');
          message.finish();
        });// analyze_emotion

      } else {
        log.info({topic, channel, top_image_url, expanded_url}, "TopImage FOUND in Firebase.");
        message.finish();
      }// if-else
    });//TopImages.child`

  }// on_article
}// process_articles

export function save_articles() {
  const topic = process.env.ARTICLES_TOPIC;
  const channel = process.env.ARTICLES_SAVE_CHANNEL;

  init_reader(topic, channel, {
    message: on_article,
    discard: on_discard_message
  });// init_reader

  function on_article(message)  {
    const message_object = message.json();
    const tweet_id = message_object.tweet_id;
    const expanded_url = message_object.expanded_url;
    const article = message_object.article;

    log.debug({topic, channel, tweet_id, expanded_url}, 'Article related to url.');

    const {
      publish_date,
      html,
      title,
      source_url,
      images,
      authors,
      text,
      canonical_link,
      movies,
      keywords,
      summary
    } = article;

    const article_object = {
      expanded_url,
      article,
      images,
      publish_date,
      title,
      authors,
      keywords,
      summary
    };// article_object

    var start = now();
    var end, duration;

    Articles.child(tweet_id).push(article_object).then(function(value) {
      end = now();
      duration = end - start;
      stats.histogram('firebase.articles.push.articles.save.then', duration);
      stats.increment('${topic}.${channel}.firebase.article.save');
      log.info({topic, channel, tweet_id, expanded_url, firebase_key: value.key}, 'Article object saved.');
      message.finish();
    }).catch(function(err)  {
      end = now();
      duration = end - start;
      stats.histogram('firebase.articles.push.articles.save.catch', duration);
      log.error({topic, channel, err, tweet_id, article_object});
      message.finish();
    });// Articles.child
  }// on_article
}// save_articles

function on_discard_message(message)  {
  const topic = process.env.DISCARDED_MESSAGES_TOPIC;
  stats.increment('${topic}.message_discard');
  log.warn({topic, num_attempts: message.attempts}, 'Publishing Message DISCARD event.');
  publish_message(topic, message.json());
}// on_discard_message

function get_article(expanded_url)  {
  var link_hostname = urlparse(expanded_url).hostname || null;
  log.info({link_hostname});

  if(IGNORE_HOSTNAMES.includes(link_hostname)) {
    stats.increment('get_article.warn.ignore_hostname');
    log.warn({
      link_hostname,
      ignore_hostnames: IGNORE_HOSTNAMES
    }, 'Ignore link hostname b/c it is in list of IGNORED HOSTNAMES');
    return null;
  }//if

  if(expanded_url) {
    stats.increment('get_article.info.fetch_article');
    log.info({expanded_url}, 'Fetching Article for url.');
    return fetch(`${endpoint}?url=${expanded_url}`)
      .then(function(response)  {
        return response.json();
      }).then(function(json)  {
        return json;
      });// fetch
  } else {
    stats.increment('get_article.error.invalid_url');
    log.error({expanded_url}, 'Not a valid url');
    return null;
  }// if-else
}// get_article
