var fetch = require('node-fetch');
var urlencode = require('urlencode');

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
// const endpoint = `${host}/article`;

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
        // console.log('Publishing message: %s', JSON.stringify(url));
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
    const url_object = message_object.url || {}; // FIXME TODO check for empty url object
    const expanded_url = url_object.expanded_url || null; // FIXME TODO check for empty url object

    if(!expanded_url)  {
      console.error("Missing a valid url object in message: %s", JSON.stringify(url_object));
      message.requeue(null, false); // https://github.com/dudleycarr/nsqjs#new-readertopic-channel-options
      return;
    }//if

    Urls.child(tweet_id)
      .orderByChild("expanded_url")
      .equalTo(expanded_url)
      .on("child_changed", function(child) {
        const child_urls = child.val();
        if(expanded_url !== child_urls.expanded_url)  {
          console.log("Child url '%s' not found in Firebase. Starting processing...", expanded_url);
          get_article(expanded_url)
            .then(function(article)  {
              const {
                publish_date,
                html,
                title,
                article,
                source_url,
                images,
                authors,
                text,
                canonical_link,
                movies,
                keywords,
                summary
              } = article;

              console.log(title);
              if(article) {
                const article_message = {
                  tweet_id: tweet_id,
                  expanded_url: expanded_url,
                  article: article
                };// article_message
                // console.log('Publishing message: %s', JSON.stringify(article_message));
                publish_message(process.env.ARTICLE_TOPIC, article_message);
                message.finish();
              } else {
                message.requeue(null, false);
              }// if-else
            }).catch(function(err)  {
              console.error(err);
              message.requeue(null, false);
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
    const url_object = message_object.url || {}; // FIXME TODO check for empty url object
    const expanded_url = url_object.expanded_url || null; // FIXME TODO check for empty url object
    const encoded_url = urlencode.encode(expanded_url);

    if(!encoded_url)  {
      console.error("Missing a valid url object in message.");
      message.requeue(null, false); // https://github.com/dudleycarr/nsqjs#new-readertopic-channel-options
      return;
    }//if

// var x = f.Urls.child('twitter_url').child(id_str).orderByChild("expanded_url").equalTo(expanded_url).on("value", function(snap) { console.log(snap.key, snap.val()); })
// var x = f.Urls.child(id_str).orderByChild("expanded_url").equalTo(expanded_url).on("value", function(snap) { console.log(snap.key, snap.val()); })

    // return Urls.child(encoded_url).child(tweet_id).push(url_object)
    return Urls.child(tweet_id).push(url_object)
    .then(function(err) {
      if(!err)  {
        console.log('Tweet URL object saved!');
        message.finish();
      } else {
        throw err;
      }//if-else
    }).catch(function(err)  {
      console.error(err);
      message.requeue(null, false); // https://github.com/dudleycarr/nsqjs#new-readertopic-channel-options
    });// Urls.child
  }// on_url
}// save_urls

export function process_articles() {
  init_reader(
    process.env.ARTICLE_TOPIC,
    process.env.ARTICLE_PROCESS_CHANNEL,
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
    process.env.ARTICLE_TOPIC,
    process.env.ARTICLE_SAVE_CHANNEL,
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

    return Articles.child(tweet_id).push(article_object)
    .then(function(err) {
      if(!err)  {
        console.log('Article object saved!');
        message.finish();
      } else {
        throw err;
      }//if-else
    }).catch(function(err)  {
      console.error(err);
      message.requeue(null, false); // https://github.com/dudleycarr/nsqjs#new-readertopic-channel-options
    });// Articles.child
  }// on_article
}// save_articles

function on_discard_message(message)  {
  // FIXME TODO publish to a 'special' error topic?
  console.error('Received Message DISCARD event.');
  console.error(message);
}// on_discard_message

function get_article(expanded_url)  {
  if(expanded_url) {
    return fetch(`${endpoint}?url=${expanded_url}`)
      .then(function(response)  {
        // return response.text();
        return response.json();
      }).then(function(json)  {
        // const article = body;
        // console.log(article);
        // return article;
        return json;
      });// fetch
  } else {
    console.error('Not a valid url : %s', expanded_url);
    return null;
  }// if-else
}// get_article
