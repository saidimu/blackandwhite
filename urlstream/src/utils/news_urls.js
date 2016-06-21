/**
 * Derived from 'Replication Data for: Exposure to Ideologically Diverse News & Opinion on Facebook'
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

const filter = require('lodash.filter');
const parseDomain = require('parse-domain');

/**
 * ... mapping the 500 most common ideological affiliations listed in individuals' profile
 * .. to a five-point {-2, -1, 0, 1, 2} numerical representation
 */
const SITE_ALIGNMENT_MAPPING = {
  '0': 'independent',
  '1': 'conservative',
  '2': 'very conservative',
  '-2': 'very liberal',
  '-1': 'liberal',
};// alignment

const SHORT_DOMAIN_TO_LONG_DOMAIN_MAPPING = {
  'fxn.ws': 'foxnews.com',
  'nyti.ms': 'nytimes.com',
  'wapo.st': 'washingtonpost.com',
  'gu.com': 'theguardian.com',
  'politi.co': 'politico.com',
};// SHORT_DOMAIN_TO_LONG_DOMAIN_MAPPING

function short_domain_to_long_domain(short_domain) {
  const long_domain = SHORT_DOMAIN_TO_LONG_DOMAIN_MAPPING[short_domain];
  return long_domain || short_domain;
}// short_domain_to_long_domain

export function get_site_alignment(site_url, top500) {
  if (!site_url) {
    return [];
  }// if

  const { domain, tld } = parseDomain(site_url);
  let hostname = `${domain}.${tld}`;

  if (!hostname) {
    return [];
  }// if

  // convert potentially short domain into long form (e.g. gu.com into theguardian.com)
  hostname = short_domain_to_long_domain(hostname);

  const raw_alignment = filter(top500, (site) => site.domain.includes(hostname));

  return raw_alignment;
}// get_site_alignment

export function site_in_top500(site_url, top500) {
  return (get_site_alignment(site_url, top500).length > 0);
}// site_in_top500

export function site_in_ignore_list(expanded_url, ignore_list) {
  const { domain, tld } = parseDomain(expanded_url);
  const link_hostname = `${domain}.${tld}`;
  return ignore_list.includes(link_hostname);
}// site_in_ignore_list

export function process_url(expanded_url, ignore_list, top500) {
  if (!ignore_list) {
    throw new Error('"ignore_list" must be provided.');
  }// if

  if (!top500) {
    throw new Error('"top500" list must be provided.');
  }// if

  return (
    !site_in_ignore_list(expanded_url, ignore_list)
      &&
    site_in_top500(expanded_url, top500)
  );// return
}// process_url
