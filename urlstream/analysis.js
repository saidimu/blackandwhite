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
  Urls,
  Articles
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

    const topic = process.env.TWEET_URLS_TOPIC;

    log.debug({tweet_id, tweet}, 'Tweet message object');

    tweet.entities.urls.forEach((url) => {
      if(url) {
        log.info({topic, tweet_id, url}, 'Publishing urls in tweet');
        publish_message(topic, {
          tweet_id: tweet_id,
          urls: url
        });// publish_message
      }// if
    });// forEach

    message.finish();
  }// on_tweet
}// process_tweets

export function process_urls() {
  init_reader(
    process.env.TWEET_URLS_TOPIC,
    process.env.TWEET_URLS_PROCESS_CHANNEL,
    {
      message: on_url,
      discard: on_discard_message
    }
  );// init_reader

  function on_url(message)  {
    const message_object = message.json();
    const tweet_id = message_object.tweet_id;
    const url_object = message_object.url || message_object.urls || {}; // FIXME TODO check for empty url object
    const expanded_url = url_object.expanded_url || null; // FIXME TODO check for empty url object

    log.debug({tweet_id, url_object}, 'Urls message object');

    if(!expanded_url)  {
      log.error({tweet_id, url_object}, "Missing a valid expanded_url object in message");
      message.finish();
      return;
    }//if

    var start = now();
    var end, duration;

    // check if an Article with this url already exists in Firebase
    // if not, create an Article from these urls and publish a message
    Articles.child(tweet_id)
      .orderByChild("expanded_url")
      .equalTo(expanded_url)
      .on("child_changed", function(child) {
        end = now();
        duration = start - end;
        stats.histogram('firebase.articles.equalTo.tweet_urls.process', duration);

        const child_urls = child.val() || {};
        if(child_urls && (expanded_url !== child_urls.expanded_url))  {

          log.info({expanded_url, child_urls}, "Article NOT found in Firebase. Creating one...");

          // https://github.com/dudleycarr/nsqjs#message
          // Tell nsqd that you want extra time to process the message. It extends the soft timeout by the normal timeout amount.
          message.touch();

          const topic = process.env.ARTICLES_TOPIC;

          start = now();

          get_article(expanded_url)
            .then(function(article)  {
              end = now();
              duration = start - end;
              stats.histogram('get_article.tweet_urls.process.then', duration);

              if(article) {
                const article_message = { tweet_id, expanded_url, article };

                log.info({
                  tweet_id,
                  expanded_url,
                  article_title: article.title,
                  source_url: article.source_url
                }, 'Article metadata');

                log.debug({ article_message }, 'Article message');
                log.info({topic, tweet_id, expanded_url}, 'Publishing Article related to url.');

                publish_message(topic, article_message);

                message.finish();

              } else {

                log.warn({ tweet_id, url_object }, 'Article is empty.');
                // requeue message in case transient issues are responsible for empty Article
                message.requeue(null, true);

              }// if-else
            }).catch(function(err)  {
              end = now();
              duration = start - end;
              stats.histogram('get_article.tweet_urls.process.catch', duration);

              log.error({err, tweet_id, expanded_url});
              message.finish();
              // message.requeue(null, true);

            });// get_article
        } else {
          log.info({expanded_url, child_urls}, "Article FOUND in Firebase.");
          message.finish();
        }// if-else
      });//Articles.child`

  }// on_url
}// process_urls

export function save_urls() {
  init_reader(
    process.env.TWEET_URLS_TOPIC,
    process.env.TWEET_URLS_SAVE_CHANNEL,
    {
      message: on_url,
      discard: on_discard_message
    }
  );// init_reader

  function on_url(message)  {
    const message_object = message.json();
    const tweet_id = message_object.tweet_id;
    const url_object = message_object.url || message_object.urls || {}; // FIXME TODO check for empty url object
    const expanded_url = url_object.expanded_url || null; // FIXME TODO check for empty url object

    if(!expanded_url)  {
      log.error({tweet_id, url_object}, "Missing a valid expanded_url object in message");
      message.finish();
      return;
    }//if

    var start = now();
    var end, duration;

    Urls.child(tweet_id).push(url_object).then(function(value) {
      end = now();
      duration = start - end;
      stats.histogram('firebase.urls.push.tweet_urls.save.then', duration);

      log.info({tweet_id, url_object, firebase_key: value.key}, 'Tweet URL object saved.');
      message.finish();
    }).catch(function(err)  {
      end = now();
      duration = start - end;
      stats.histogram('firebase.urls.push.tweet_urls.save.catch', duration);

      log.error({err, tweet_id, url_object});
    });// Urls.child

  }// on_url
}// save_urls

export function process_articles() {
  init_reader(
    process.env.ARTICLES_TOPIC,
    process.env.ARTICLES_PROCESS_CHANNEL,
    {
      message: on_article,
      discard: on_discard_message
    }
  );// init_reader

  function on_article(message)  {
    console.log(message.id);
  }// on_article
}// process_articles

export function save_articles() {
  init_reader(
    process.env.ARTICLES_TOPIC,
    process.env.ARTICLES_SAVE_CHANNEL,
    {
      message: on_article,
      discard: on_discard_message
    }
  );// init_reader

  function on_article(message)  {
    const message_object = message.json();
    const tweet_id = message_object.tweet_id;
    const expanded_url = message_object.expanded_url;
    const article = message_object.article;

    log.debug({tweet_id, expanded_url}, 'Article related to url.');

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

    return Articles.child(tweet_id).push(article_object).then(function(value) {
      end = now();
      duration = start - end;
      stats.histogram('firebase.articles.push.articles.save.then', duration);

      log.info({tweet_id, expanded_url, firebase_key: value.key}, 'Article object saved.');
      message.finish();
    }).catch(function(err)  {
      end = now();
      duration = start - end;
      stats.histogram('firebase.articles.push.articles.save.catch', duration);

      log.error({err, tweet_id, article_object});
      message.finish();
    });// Articles.child
  }// on_article
}// save_articles

function on_discard_message(message)  {
  const topic = process.env.DISCARDED_MESSAGES_TOPIC;
  log.warn({topic}, 'Publishing Message DISCARD event.');
  publish_message(topic, message.json());
}// on_discard_message

function get_article(expanded_url)  {
  var link_hostname = urlparse(expanded_url).hostname || null;
  log.info({link_hostname});

  if(IGNORE_HOSTNAMES.includes(link_hostname)) {
    log.warn({
      link_hostname,
      ignore_hostnames: IGNORE_HOSTNAMES
    }, 'Ignore link hostname b/c it is in list of IGNORED HOSTNAMES');
    return null;
  }//if

  if(expanded_url) {
    log.info({expanded_url}, 'Fetching Article for url.');
    return fetch(`${endpoint}?url=${expanded_url}`)
      .then(function(response)  {
        return response.json();
      }).then(function(json)  {
        return json;
      });// fetch
  } else {
    log.error({expanded_url}, 'Not a valid url');
    return null;
  }// if-else
}// get_article
