const expect = require('chai').expect;

import { get_urls } from '../src/tweets';

describe('Process Tweets', function() {
  let urls;
  let tweet;

  before(function() {
    tweet = require('./tweet.json');
    urls = get_urls(tweet);
  });// before

  describe('Extract urls from tweet', function() {
    it('should return a list of urls', function() {
      expect(urls).to.be.an('array');
    });// should return a list of urls

    it('should return a list of url objects', function() {
      expect(urls[0]).to.be.an('object');
    });// should return a list of url objects

    it('should return a list of url objects with an "url" key', function() {
      expect(urls[0]).to.include.keys('url');
    });// should return a list of url objects with an "url" key

    it('should return a list of url objects with an "expanded_url" key', function() {
      expect(urls[0]).to.include.keys('display_url');
    });// should return a list of url objects with an "expanded_url" key

    it('should return a list of url objects with a "display_url" key', function() {
      expect(urls[0]).to.include.keys('display_url');
    });// should return a list of url objects with a "display_url" key
  });// Extract urls from tweet
});// Process Tweets
