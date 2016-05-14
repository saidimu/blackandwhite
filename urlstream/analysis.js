var fetch = require('node-fetch');

import {
  init_writer,
  init_reader,
  publish as publish_message
} from './messaging.js';


import {
  Tweet,
  Url,
  TopImage
} from './datastore.js';

init_writer();

const host = process.env.NEWSPAPER_PORT_8000_TCP_ADDR;
const port = process.env.NEWSPAPER_PORT_8000_TCP_PORT;

const endpoint = `http://${host}:${port}/top_image`;
// const endpoint = `${host}/top_image`;

function get_top_image(url_object)  {
  try {
    const url = url_object.url; // FIXME TODO HACK
    if(url) {
      fetch(`${endpoint}?url=${url}`)
        .then(function(response)  {
          return response.text();
        }).then(function(body)  {
          const top_image = body;
          console.log(top_image);
          return top_image;
        });// fetch
    } else {
      return null;
    }// if-else
  } catch (e) {
    console.error(e);
    return null;
  }// try-catch
}// get_top_image

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

    tweet.entities.urls.forEach((url) => {
      if(url) {
        console.log('Publishing message: %s', JSON.stringify(url));
        publish_message(process.env.TWEET_URLS_TOPIC, url);
      }// if
    });// forEach

    message.finish();
  }// on_tweet
}// process_tweets

export function save_tweets() {
  init_reader(
    process.env.TWEETS_TOPIC,
    process.env.TWEETS_SAVE_CHANNEL,
    {
      message: on_tweet,
      discard: on_discard_message
    }
  );// init_reader

  function on_tweet(message)  {
    // console.log(message.id);
    const tweet = message.json();
    Tweet.create({
      tweet: tweet
    }).then(function(tweet) {
      console.log('Tweet saved!');
      message.finish();
    });// Tweet.create
  }// on_tweet
}// save_tweets

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
    const url = message.json();
    // console.log('Received message [%s]: %s', message.id, JSON.stringify(url));

    const top_image = get_top_image(url);
    if(top_image) {
      publish_message(process.env.TOPIMAGE_TOPIC, {
        url: url,
        top_image: top_image
      });// publish_message
    }// if

    message.finish();
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
    const url = message.json();
    Url.create({
      url: url
    }).then(function(url) {
      console.log('Tweet URL saved!');
      message.finish();
    });// Url.create
  }// on_url
}// save_urls

export function process_top_image() {
  init_reader(
    process.env.TOPIMAGE_TOPIC,
    process.env.TOPIMAGE_PROCESS_CHANNEL,
    {
      message: on_url,
      discard: on_discard_message
    }
  );// init_reader

  function on_url(message)  {
    console.log(message.id);
  }// on_url
}// process_top_image

export function save_top_image() {
  init_reader(
    process.env.TOPIMAGE_TOPIC,
    process.env.TOPIMAGE_SAVE_CHANNEL,
    {
      message: on_url,
      discard: on_discard_message
    }
  );// init_reader

  function on_url(message)  {
    const top_image = message.json();
    TopImage.create({
      top_image: top_image
    }).then(function(top_image) {
      console.log('TopImage URL saved!');
      message.finish();
    });// TopImage.create
  }// on_url
}// save_top_image

function on_discard_message(message)  {
  console.error('Received Message DISCARD event.');
  console.error(message);
}// on_discard_message
