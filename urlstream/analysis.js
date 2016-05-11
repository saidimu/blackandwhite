var fetch = require('node-fetch');

const host = `${process.env.NEWSPAPER_PORT_8000_TCP_ADDR}:${NEWSPAPER_PORT_8000_TCP_PORT}`;
const endpoint = `${host}/top_image`;

export async function get_top_image(url_object)  {
  try {
    const url = url_object[0].expanded_url || url_object[0].url;
    const top_image = await fetch(`${endpoint}?url=${url}`);
    console.log(top_image);
    return top_image;
  } catch (e) {
    console.error(e);
    return null;
  }// try-catch
}// get_top_image