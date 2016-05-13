// var nsq = require('nsqjs');
// var Twit = require('twit');

import {
  init_writer,
  init_reader,
  publish,
  subscribe
} from './messaging.js';

import {
  start as stream_tweets
} from './twitter.js';

import {
  get_top_image
} from './analysis.js';

init_writer(
  null,
  null,
  null
);// init_writer

init_reader(
  process.env.TWITTER_URLS_NSQ_TOPIC,
  process.env.TWITTER_URLS_NSQ_CHANNEL
);// init_reader

stream_tweets(on_tweet, null, null);

function on_tweet(tweet) {
  // console.log(tweet.text);
  // console.log(tweet.entities.urls[0].expanded_url);
  tweet.entities.urls.forEach((url) => {
    if(url) {
      console.log('Publishing message: %s', JSON.stringify(url));
      publish(process.env.TWITTER_URLS_NSQ_TOPIC, url);
    }// if
  });// forEach
}// on_tweet

subscribe(on_url, on_discard, null, null, null);

function on_url(message)  {
  // const url = message.body.toString();
  const url = message.json();
  console.log('Received message [%s]: %s', message.id, JSON.stringify(url));
  process_url(url.url);
  message.finish();
}// on_url

function process_url(url) {
  const top_image = get_top_image(url);
  publish(process.env.TOPIMAGE_URLS_NSQ_TOPIC, {
    url: url,
    top_image: url
  });// publish
}// process_url

function on_discard(message)  {
  console.error('Received Message DISCARD event.');
  console.error(message);
}// on_discard
