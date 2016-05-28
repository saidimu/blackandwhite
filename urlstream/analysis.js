var fetch = require('node-fetch');

var path = require('path');
var appname = path.basename(__filename, '.js');
var log = require('./logging.js')(appname);

import {
  init_writer,
  init_reader,
  publish as publish_message
} from './messaging.js';


import {
  Urls,
  Articles
} from './datastore.js';

init_writer();

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
    tweet.entities.urls.forEach((url) => {
      if(url) {
        log.debug({tweet_id, url}, 'Urls in tweet');
        publish_message(process.env.TWEET_URLS_TOPIC, {
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
    // const url_object = message.json();
    // const tweet_id = url_object.tweet_id;
    // console.log('Received message [%s]: %s', message.id, JSON.stringify(url));

    const message_object = message.json();
    const tweet_id = message_object.tweet_id;
    const url_object = message_object.url || message_object.urls || {}; // FIXME TODO check for empty url object
    const expanded_url = url_object.expanded_url || null; // FIXME TODO check for empty url object

    log.debug({tweet_id, url_object}, 'Urls message object');

    if(!expanded_url)  {
      log.error({url_object}, "Missing a valid expanded_url object in message");
      message.requeue(null, true); // https://github.com/dudleycarr/nsqjs#new-readertopic-channel-options
      return;
    }//if

    Urls.child(tweet_id)
      .orderByChild("expanded_url")
      .equalTo(expanded_url)
      .on("child_changed", function(child) {
        const child_urls = child.val();
        if(expanded_url !== child_urls.expanded_url)  {
          log.info({expanded_url}, "Child url not found in Firebase. Starting processing...");
          get_article(expanded_url)
            .then(function(article)  {
              if(article) {
                const article_message = {
                  tweet_id: tweet_id,
                  expanded_url: expanded_url,
                  article: article
                };// article_message
                // console.log('Publishing message: %s', JSON.stringify(article_message));
                log.debug({
                  article_message
                }, 'Article message');
                publish_message(process.env.ARTICLES_TOPIC, article_message);
                message.finish();
              } else {
                log.warn({
                  tweet_id, url_object
                }, 'Article is empty.');
                message.requeue(null, true);
              }// if-else
            }).catch(function(err)  {
              log.error({err});
              message.requeue(null, true);
            });// get_article
        }//if
      });//Urls.child`

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
      log.error({url_object}, "Missing a valid expanded_url object in message");
      message.requeue(null, true); // https://github.com/dudleycarr/nsqjs#new-readertopic-channel-options
      return;
    }//if

// var x = f.Urls.child('twitter_url').child(id_str).orderByChild("expanded_url").equalTo(expanded_url).on("value", function(snap) { console.log(snap.key, snap.val()); })
// var x = f.Urls.child(id_str).orderByChild("expanded_url").equalTo(expanded_url).on("value", function(snap) { console.log(snap.key, snap.val()); })

    Urls.child(tweet_id).push(url_object).then(function(value) {
      log.debug({tweet_id, url_object}, 'Tweet URL object saved. Firebase key:"%s"', value.key);
      message.finish();
    }).catch(function(err)  {
      log.error({err});
      message.requeue(null, true); // https://github.com/dudleycarr/nsqjs#new-readertopic-channel-options
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

    return Articles.child(tweet_id).push(article_object).then(function(value) {
      log.debug({tweet_id, expanded_url}, 'Article object saved. Firebase key:"%s"', value.key);
      message.finish();
    }).catch(function(err)  {
      log.error({err});
      message.requeue(null, true); // https://github.com/dudleycarr/nsqjs#new-readertopic-channel-options
    });// Articles.child
  }// on_article
}// save_articles

function on_discard_message(message)  {
  console.error('Received Message DISCARD event.');
  publish_message(process.env.DISCARDED_MESSAGES_TOPIC, message.json());
}// on_discard_message

function get_article(expanded_url)  {
  if(expanded_url) {
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
