var fetch = require('node-fetch');
var urlencode = require('urlencode');

import {
  init_writer,
  init_reader,
  publish as publish_message
} from './messaging.js';


import {
  Urls,
  TopImage
} from './datastore.js';

init_writer();

const host = process.env.NEWSPAPER_PORT_8000_TCP_ADDR;
const port = process.env.NEWSPAPER_PORT_8000_TCP_PORT;

const endpoint = `http://${host}:${port}/top_image`;
// const endpoint = `${host}/top_image`;

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
          get_top_image(expanded_url)
            .then(function(article)  {
              const {
                publish_date,
                html,
                title,
                top_image,
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
              if(top_image) {
                const article_message = {
                  tweet_id: tweet_id,
                  expanded_url: expanded_url,
                  article: article
                };// article_message
                // console.log('Publishing message: %s', JSON.stringify(top_image_message));
                publish_message(process.env.TOPIMAGE_TOPIC, article_message);
                message.finish();
              } else {
                message.requeue(null, false);
              }// if-else
            }).catch(function(err)  {
              console.error(err);
              message.requeue(null, false);
            });// get_top_image
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

export function process_top_image() {
  init_reader(
    process.env.TOPIMAGE_TOPIC,
    process.env.TOPIMAGE_PROCESS_CHANNEL,
    {
      message: on_top_image,
      discard: on_discard_message
    }
  );// init_reader

  function on_top_image(message)  {
    console.log(message.id);
  }// on_top_image
}// process_top_image

export function save_top_image() {
  init_reader(
    process.env.TOPIMAGE_TOPIC,
    process.env.TOPIMAGE_SAVE_CHANNEL,
    {
      message: on_top_image,
      discard: on_discard_message
    }
  );// init_reader

  function on_top_image(message)  {
    const top_image_object = message.json();
    const tweet_id = top_image_object.tweet_id;
    const top_image = top_image_object.top_image;

    return TopImage.create({
      top_image: top_image
    }).then(function(top_image) {
      console.log('TopImage URL saved!');

      // Find a related Urls object and associate with newly-created TopImage object
      Urls.findOne({
        attributes: ['tweet_id'],
        where: {
          tweet_id: tweet_id
        }
      }).then(function(urls_object) {
        // associate newly-created Urls object with a Tweet object
        urls_object.setTopimage(top_image).then(function() {
          console.log(
            'Associated Urls["%s"] with TopImage["%s"]',
            urls_object.get('tweet_id'), top_image.get('tweet_id')
          );// console.log

          message.finish();

        }).catch(function(err)  {
          console.error(err);
          console.error(
            'ERROR associating Urls["%s"] with TopImage["%s"]',
            urls_object.get('tweet_id'), top_image.get('tweet_id')
          );// console.error
        });// url_object.addTopImage
      }).catch(function(err)  {
        console.error(err);
      });// Urls.findOne

    }).catch(function(err)  {
      console.error(err);
      message.requeue(null, false); // https://github.com/dudleycarr/nsqjs#new-readertopic-channel-options
    });// TopImage.create
  }// on_url
}// save_top_image

function on_discard_message(message)  {
  // FIXME TODO publish to a 'special' error topic?
  console.error('Received Message DISCARD event.');
  console.error(message);
}// on_discard_message

function get_top_image(expanded_url)  {
  if(expanded_url) {
    return fetch(`${endpoint}?url=${expanded_url}`)
      .then(function(response)  {
        // return response.text();
        return response.json();
      }).then(function(json)  {
        // const top_image = body;
        // console.log(top_image);
        // return top_image;
        return json;
      });// fetch
  } else {
    console.error('Not a valid url : %s', expanded_url);
    return null;
  }// if-else
}// get_top_image
