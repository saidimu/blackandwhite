var nsq = require('nsqjs');

var Twit = require('twit');

var twitter = new Twit({
  consumer_key:         process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
  access_token:         process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});//twitter

var writer = new nsq.Writer(process.env.NSQD_1_PORT_4150_TCP_ADDR, process.env.NSQD_1_PORT_4150_TCP_PORT);
writer.connect();

writer.on('ready', function () {
  var stream = twitter.stream('statuses/filter', {
    track: process.env.TWITTER_STREAMING_TRACK_KEYWORDS,
    language: process.env.TWITTER_STREAMING_LANGUAGE
  });// stream

  stream.on('tweet', function (tweet) {
    // console.log(tweet.text);
    console.log(tweet.entities.urls[0].expanded_url);
    writer.publish(process.env.TWEET_URL_NSQ_TOPIC, tweet.entities.urls[0].expanded_url, function(err)  {
      if(err) {
        console.error(err);
      }//if
    });// writer.publish
  });// stream.on('tweet')

  stream.on('disconnect', function (disconnectMessage) {
    console.error(disconnectMessage);
  });// stream.on('disconnect')

  stream.on('error', function (error) {
    console.error(error);
  });// stream.on('error')
});// writer.on('ready')

writer.on('error', function (err) {
  console.error(err);
});// writer.on('error')

writer.on('closed', function () {
  console.warn('Writer closed');
});// writer.on('closed')
