// var nsq = require('nsqjs');
// var Twit = require('twit');

import {
  init_writer,
  init_reader,
  publish,
  susbcribe
} from './messaging.js';

import {
  stream as stream_tweets
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
  console.log(tweet.entities.urls);
  publish(process.env.TWITTER_URLS_NSQ_TOPIC, tweet.entities.urls);
}// on_tweet

subscribe(on_url, on_discard, null, null, null);

function on_url(message)  {
  const url = msg.body.toString();
  console.log('Received message [%s]: %s', msg.id, url);
  process_url(url);
  msg.finish();
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

// var twitter = new Twit({
//   consumer_key:         process.env.TWITTER_CONSUMER_KEY,
//   consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
//   access_token:         process.env.TWITTER_ACCESS_TOKEN,
//   access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
//   timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
// });//twitter
//
// var writer = new nsq.Writer(process.env.NSQD_1_PORT_4150_TCP_ADDR, process.env.NSQD_1_PORT_4150_TCP_PORT);
// writer.connect();
//
// writer.on('ready', function () {
//   var stream = twitter.stream('statuses/filter', {
//     track: process.env.TWITTER_STREAMING_TRACK_KEYWORDS,
//     language: process.env.TWITTER_STREAMING_LANGUAGE
//   });// stream
//
//   stream.on('tweet', function (tweet) {
//     // console.log(tweet.text);
//     // console.log(tweet.entities.urls[0].expanded_url);
//     console.log(tweet.entities.urls);
//
//     get_top_image(tweet.entities.urls);
//
//     writer.publish(process.env.TWITTER_URLS_NSQ_TOPIC, tweet.entities.urls, function(err)  {
//       if(err) {
//         console.error(err);
//       }//if
//     });// writer.publish
//   });// stream.on('tweet')
//
//   stream.on('disconnect', function (disconnectMessage) {
//     console.error(disconnectMessage);
//     process.exit(1);  // exit with an error so Docker can handle restarts
//   });// stream.on('disconnect')
//
//   stream.on('error', function (error) {
//     console.error(error);
//     process.exit(1);  // exit with an error so Docker can handle restarts
//   });// stream.on('error')
// });// writer.on('ready')
//
// writer.on('error', function (err) {
//   console.error(err);
//   process.exit(1);  // exit with an error so Docker can handle restarts
// });// writer.on('error')
//
// writer.on('closed', function () {
//   console.warn('Writer closed');
//   process.exit(1);  // exit with an error so Docker can handle restarts
// });// writer.on('closed')
