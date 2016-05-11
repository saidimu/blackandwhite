var fetch = require('node-fetch');

const host = process.env.NEWSPAPER_PORT_8000_TCP_ADDR;
const port = process.env.NEWSPAPER_PORT_8000_TCP_PORT;

const endpoint = `http://${host}:${port}/top_image`;
// const endpoint = `${host}/top_image`;

export async function get_top_image(url_object)  {
  try {
    const url = url_object[0].expanded_url || url_object[0].url;
    const response = await fetch(`${endpoint}?url=${url}`);
    const top_image = response.json();
    console.log(top_image);
    return top_image;
  } catch (e) {
    console.error(e);
    return null;
  }// try-catch
}// get_top_image
