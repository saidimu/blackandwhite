# `black & white` [![Build Status](https://travis-ci.org/saidimu/blackandwhite.svg?branch=dev)](https://travis-ci.org/saidimu/blackandwhite)

In the wake of Facebook's news feed [controversy](http://www.wsj.com/articles/five-things-to-know-about-facebooks-trending-controversy-1462915385), The Wall Street Journal created [`Blue Feed, Red Feed`](http://graphics.wsj.com/blue-feed-red-feed/):

> To demonstrate how reality may differ for different Facebook users, The Wall Street Journal created two feeds, one “blue” and the other “red.” If a source appears in the red feed, a majority of the articles shared from the source were classified as “very conservatively aligned” in a large 2015 Facebook study. For the blue feed, a majority of each source’s articles aligned “very liberal.” These aren't intended to resemble actual individual news feeds. Instead, they are rare side-by-side looks at real conversations from different perspectives.

[`black & white`](https://newscuria.firebaseapp.com/) is a similar effort but targetting Twitter instead of Facebook news feeds.

## Monorepo Organization
There are 3 main parts to the project, each in its own subfolder:

 - a [ReactJS frontend](https://github.com/saidimu/blackandwhite/tree/dev/frontend)
 - a [NodeJS backend](https://github.com/saidimu/blackandwhite/tree/dev/urlstream)
 - a [Python backend](https://github.com/saidimu/blackandwhite/tree/dev/newspaper)

### ReactJS frontend
This is what is live at https://newscuria.firebaseapp.com/

The [`reactpack`](https://github.com/olahol/reactpack)-based app loads data from a Firebase database and displays a side-by-side `black & white` grid of conservative and liberal news.

### NodeJS backend
This is the heart of the project. It is composed of a series of [Docker containers](https://github.com/saidimu/blackandwhite/blob/dev/urlstream/Dockerfile) operating independently of each other. The containers communicate via [NSQ](http://nsq.io/) (a message queue) to publish and consume messages relevant to their operation.

 1. [stream_tweets.js](https://github.com/saidimu/blackandwhite/blob/dev/urlstream/src/stream_tweets.js):
   - connects to the Twitter Streaming API
   - tracks a series of keywords
   - publishes received tweets to a [topic on NSQ](http://nsq.io/overview/design.html#simplifying-configuration-and-administration).
 2.  [process_tweets.js](https://github.com/saidimu/blackandwhite/blob/dev/urlstream/src/process_tweets.js):
  - consumes the tweets published from #1
  - extracts the urls in each tweet
  - publishes the individual urls to a new [topic](http://nsq.io/overview/design.html#simplifying-configuration-and-administration) on the message queue.
 3. [process_urls.js](https://github.com/saidimu/blackandwhite/blob/dev/urlstream/src/process_urls.js):
   - consumes the url messages published in #2
   - for each url:
	 - checks if the url is from a list of [approved sites](https://github.com/saidimu/blackandwhite/blob/dev/urlstream/src/utils/news_top500.json) to fetch data from
	 - connects to an API on the [Python backend](https://github.com/saidimu/blackandwhite/tree/dev/newspaper) to get the fulltext, html and metadata for the url
	 - publishes the results to a new [topic](http://nsq.io/overview/design.html#simplifying-configuration-and-administration) on the message queue.
 4. [save_urls.js](https://github.com/saidimu/blackandwhite/blob/dev/urlstream/src/save_urls.js):
   - consumes the url messages published in #2
   - saves the urls to an `Urls` Firebase collection
 5. [process_articles.js](https://github.com/saidimu/blackandwhite/blob/dev/urlstream/src/process_articles.js)
   - consumes the article messages published in #3
   - using `topimage` metadata from the [Python backend](https://github.com/saidimu/blackandwhite/tree/dev/newspaper), connects to the Microsoft [Face API](https://www.microsoft.com/cognitive-services/en-us/face-api) and [Emotion API](https://www.microsoft.com/cognitive-services/en-us/emotion-api) to detect the range of feelings in the top image associated with an article
   - saves the Face & Emotion results to a `TopImage` Firebase collection
 6. [save_articles.js](https://github.com/saidimu/blackandwhite/blob/dev/urlstream/src/save_articles.js):
   - consumes the article messages published in #3
   - saves the articles to an `Articles` Firebase collection

##### Other NodeJS-based supporting containers:

  - [logging.js](https://github.com/saidimu/blackandwhite/blob/dev/urlstream/src/logging.js): forwards app logs to [Loggly](https://www.loggly.com/), a log management service
  - [statsd.js](https://github.com/saidimu/blackandwhite/blob/dev/urlstream/src/statsd.js): forwards app metrics to [Datadog](https://www.datadoghq.com/), a metrics monitoring service
  - [ratelimit.js](https://github.com/saidimu/blackandwhite/blob/dev/urlstream/src/ratelimit.js): a rate limiter for throttling API requests. A client for https://github.com/saidimu/limitd-docker


### Python backend
Runs in a [Docker container](https://github.com/saidimu/blackandwhite/blob/dev/newspaper/Dockerfile).

Provides a REST API exposing some methods from [`newspaper3k`](http://newspaper.readthedocs.io/en/latest/), a Python module for article scraping.

## Discuss

You can submit issues using [Github Issues](https://github.com/saidimu/blackandwhite/issues).

## Contributing

1. Fork it
2. Create your branch (`git checkout -b my-submission`)
3. Commit your changes (`git commit -am "Proposed Change"`)
4. Push your branch (`git push origin my-submission`)
5. Send a pull request

> Written with [StackEdit](https://stackedit.io/).
