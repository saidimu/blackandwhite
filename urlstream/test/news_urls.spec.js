import 'babel-polyfill';
const expect = require('chai').expect;

import {
  process_url,
  site_in_ignore_list,
  site_in_top500
} from '../src/utils/news_urls';

const top500 = require('./top500.json');

describe('News Urls', function() {
  const ignore_list = [
    'twitter.com',
    'youtube.com',
    'google.com',
    'facebook.com',
  ];// ignore_list

  let expanded_url;

  it('should ignore expanded_url in ignore_list', function() {
    expanded_url = 'https://twitter.com/tkdmike/status/742556836864262145';
    const status = site_in_ignore_list(expanded_url, ignore_list);
    expect(status).to.be.true;
  });// should ignore expanded_url in ignore_list

  it('should allow expanded_url not in ignore_list', function() {
    expanded_url = 'http://chaijs.com/api/bdd/';
    const status = site_in_ignore_list(expanded_url, ignore_list);
    expect(status).to.be.false;
  });// should allow expanded_url not in ignore_list

  it('should allow expanded_url in top500 list', function() {
    expanded_url = 'https://www.foxnews.com/politics/2016/03/17/analysis-media-beltway-warnings-about-trump-throwback-to-1980.html?intcmp=hpbt1';
    const status = site_in_top500(expanded_url, top500);
    expect(status).to.be.true;
  });// should allow expanded_url in top500 list

  it('should ignore expanded_url not in top500 list', function() {
    expanded_url = 'https://www.facebook.com/';
    const status = site_in_top500(expanded_url, top500);
    expect(status).to.be.false;
  });// should ignore expanded_url not in top500 list

  it('should throw an Error if no ignore_list is provided', function() {
    expanded_url = 'https://www.foxnews.com/politics/2016/03/17/analysis-media-beltway-warnings-about-trump-throwback-to-1980.html?intcmp=hpbt1';
    const status = () => process_url(expanded_url, null, top500);
    expect(status).to.throw(Error);
  });// should throw an Error if no ignore_list is provided

  it('should throw an Error if no top500 list is provided', function() {
    expanded_url = 'https://www.foxnews.com/politics/2016/03/17/analysis-media-beltway-warnings-about-trump-throwback-to-1980.html?intcmp=hpbt1';
    const status = () => process_url(expanded_url, ignore_list, null);
    expect(status).to.throw(Error);
  });// should throw an Error if no top500 list is provided

  it('should allow expanded_url in top500 list AND not in ignore_list', function() {
    expanded_url = 'https://www.foxnews.com/politics/2016/03/17/analysis-media-beltway-warnings-about-trump-throwback-to-1980.html?intcmp=hpbt1';
    const status = process_url(expanded_url, ignore_list, top500);
    expect(status).to.be.true;
  });

  it('should reject expanded_url in top500 list AND also in ignore_list', function() {
    expanded_url = 'https://twitter.com/tkdmike/status/742556836864262145';
    const status = process_url(expanded_url, ignore_list, top500);
    expect(status).to.be.false;
  });

  it('should reject expanded_url NOT in top500 list AND also in ignore_list');

  it('should reject expanded_url NOT in top500 list AND not in ignore_list', function() {
    expanded_url = 'http://chaijs.com/api/bdd/';
    const status = process_url(expanded_url, ignore_list, top500);
    expect(status).to.be.false;
  });
});// News Urls
