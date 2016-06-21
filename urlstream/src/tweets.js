export function get_urls(tweet) {
  const urls = [];

  tweet.entities.urls.forEach((url) => {
    if (url) {
      urls.push(url);
    }// if
  });// forEach

  return urls;
}// get_urls
