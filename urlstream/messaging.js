var nsq = require('nsqjs');

var path = require('path');
var appname = path.basename(__filename, '.js');
var log = require('./logging.js')(appname);

let reader;
let writer;

const nsqd_host = process.env.NSQD_ENV_DOCKERCLOUD_SERVICE_HOSTNAME;
const nsqd_port = 4150;

export function init_writer(ready, error, closed) {
  writer = new nsq.Writer(nsqd_host, nsqd_port);

  writer.connect();

  ready = ready || function () {
    log.info({
      nsqd_host, nsqd_port
    }, "NSQ Writer ready.");
  };// ready
  writer.on('ready', ready);

  error = error || function (err) {
    console.error(err);
    log.error({ err });
    process.exit(1);  // exit with an error so Docker can handle restarts
  };// error
  writer.on('error', error);

  closed = closed || function () {
    log.warn({nsqd_host, nsqd_port}, 'Writer closed');
    process.exit(1);  // exit with an error so Docker can handle restarts
  };// closed
  writer.on('closed', closed);
}// init_writer

export function publish(topic, message, callback) {
  callback = callback || function(err)  {
    if(err) {
      log.error({ err });
    }//if
  };// callback

  writer.publish(topic, message, callback);// writer.publish
}// publish

export function init_reader(topic, channel, handlers) {
  const options = {
    // https://github.com/dudleycarr/nsqjs#new-readertopic-channel-options
    nsqdTCPAddresses: `${nsqd_host}:${nsqd_port}`,
    maxAttempts: parseInt(process.env.NSQD_READER_MAX_ATTEMPTS) || 0,
    maxInFlight: parseInt(process.env.NSQD_READER_MAX_IN_FLIGHT) || 10
  };// options

  log.info({options}, "NSQ Reader options");

  reader = new nsq.Reader(
    topic,
    channel,
    options
  );// nsq.Reader

  reader.connect();

  let { message, discard, error, nsqd_connected, nsqd_closed } = handlers;

  if(!message)  {
    let err = new Error('A "on message" handler was not specified!');
    log.error({err});
    throw err;
  }//if
  reader.on('message', message);

  if(!discard)  {
    let err = new Error('A "on discard" handler was not specified!');
    log.error({err});
    throw err;
  }//if
  reader.on('discard', discard);

  error = error || function (err) {
    log.error({err});
    process.exit(1);  // exit with an error so Docker can handle restarts
  };// error
  reader.on('error', error);

  nsqd_connected = nsqd_connected || function (host, port) {
    log.info({host, port}, "NSQD Reader CONNECTED");
  };// nsqd_connected
  reader.on('nqsd_connected', nsqd_connected);

  nsqd_closed = nsqd_closed || function (host, port) {
    log.info({host, port}, "NSQD Reader CLOSED");
    process.exit(1);  // exit with an error so Docker can handle restarts
  };// nsqd_closed
  reader.on('nsqd_closed', nsqd_closed);

  return reader;
}// init_reader
