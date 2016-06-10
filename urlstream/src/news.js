/**
 * Derived from 'Replication Data for: Exposure to Ideologically Diverse News and Opinion on Facebook'
 * https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/LDJ7MS
 *
 * domain: domain
 * avg_alignment: Average alignment
 * l2: proportion of shares with very liberal alignment from domain
 * l1: proportion of shares with liberal alignment from domain
 * m: proportion of shares with moderate alignment from domain
 * r1: proportion of shares with conservative alignment from domain
 * r2: proportion of shares with very conservative alignment from domain *
 *
 */

var filter = require('lodash.filter');
var urlparse = require('url').parse;

var top500_sites = require('./news_top500.json');

/**
 * ... mapping the 500 most common ideological affiliations listed in individuals' profile
 * .. to a five-point {-2, -1, 0, 1, 2} numerical representation
 */
var SITE_ALIGNMENT_MAPPING = {
  '0': 'independent',
  '1': 'conservative',
  '2': 'very conservative',
  '-2': 'very liberal',
  '-1': 'liberal',
}// alignment

export function get_site_alignment(site_url) {
  if(!site_url) {
    return [];
  }// if

  var hostname = urlparse(site_url).hostname || null;

  if(!hostname) {
    return [];
  }// if

  var raw_alignment = filter(top500_sites, function(site)  {
    return site.domain.includes(hostname);
  });// find

  // var alignment = raw_alignment.map((site) => {
  //   const avg_align_rounded = Math.round(site.avg_align);
  //   site.avg_align_text = SITE_ALIGNMENT_MAPPING[avg_align_rounded];
  //   return site;
  // });// raw_alignment.forEach
  // return alignment;

  return raw_alignment;
}// get_site_alignment

export function filter_site(site_url) {
  if(get_site_alignment(site_url).length) {
    return true;
  } else {
    return false;
  }// if
}// filter_site
