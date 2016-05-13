var fetch = require('node-fetch');

const host = process.env.NEWSPAPER_PORT_8000_TCP_ADDR;
const port = process.env.NEWSPAPER_PORT_8000_TCP_PORT;

const endpoint = `http://${host}:${port}/top_image`;
// const endpoint = `${host}/top_image`;

export function get_top_image(url_object)  {
  try {
    const url = url_object.url; // FIXME TODO HACK
    if(url) {
      fetch(`${endpoint}?url=${url}`)
        .then(function(response)  {
          return response.text();
        }).then(function(body)  {
          const top_image = body;
          console.log(top_image);
          return top_image;
        });// fetch
    } else {
      return null;
    }// if-else
  } catch (e) {
    console.error(e);
    return null;
  }// try-catch
}// get_top_image
