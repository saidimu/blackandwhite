const LimitdClient = require('limitd-client');

const host = process.env.LIMITD_PORT_9231_TCP_ADDR;
const port = process.env.LIMITD_PORT_9231_TCP_PORT;

const limitd = new LimitdClient(`limitd://${host}:${port}`);

// bucket key
// https://github.com/auth0/limitd#server-options
const KEY = 'newscuria';

export function get_emotion_api_token(callback)  {
  limitd.take('emotion_api', KEY, 1, callback);
}// get_emotion_api_token
