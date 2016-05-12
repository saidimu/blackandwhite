var Twit = require('twit');

var twitter = new Twit({
  consumer_key:         process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
  access_token:         process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});//twitter

var stream = twitter.stream('statuses/filter', {
  track: process.env.TWITTER_STREAMING_TRACK_KEYWORDS,
  language: process.env.TWITTER_STREAMING_LANGUAGE
});// stream

export function stream(tweet, disconnect, error) {
  tweet = tweet || function (tweet) {
    // console.log(tweet.text);
    // console.log(tweet.entities.urls[0].expanded_url);
    console.log(tweet.entities.urls);

    get_top_image(tweet.entities.urls);

    writer.publish(process.env.TWITTER_URLS_NSQ_TOPIC, tweet.entities.urls, function(err)  {
      if(err) {
        console.error(err);
      }//if
    });// writer.publish
  };// tweet

  stream.on('tweet', tweet);// stream.on('tweet')

  disconnect = disconnect || function (disconnectMessage) {
    console.error(disconnectMessage);
    process.exit(1);  // exit with an error so Docker can handle restarts
  };// disconnect

  stream.on('disconnect', disconnect);// stream.on('disconnect')

  error = error || function (error) {
    console.error(error);
    process.exit(1);  // exit with an error so Docker can handle restarts
  };// error

  stream.on('error', error);// stream.on('error')
}// start
