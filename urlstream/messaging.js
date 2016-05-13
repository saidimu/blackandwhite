var nsq = require('nsqjs');

let reader;
let writer;

export function init_writer(ready, error, closed) {
  writer = new nsq.Writer(
    process.env.NSQD_1_PORT_4150_TCP_ADDR,
    process.env.NSQD_1_PORT_4150_TCP_PORT
  );// nsq.Writer

  writer.connect();

  ready = ready || function () {
    console.log();
  };// ready
  writer.on('ready', ready);

  error = error || function (err) {
    console.error(err);
    process.exit(1);  // exit with an error so Docker can handle restarts
  };// error
  writer.on('error', error);

  closed = closed || function () {
    console.warn('Writer closed');
    process.exit(1);  // exit with an error so Docker can handle restarts
  };// closed
  writer.on('closed', closed);
}// init_writer

export function init_reader(topic, channel) {
  const host = `${process.env.NSQD_1_PORT_4150_TCP_ADDR}:${process.env.NSQD_1_PORT_4150_TCP_PORT}`;
  console.log('NSQD host: ', host);
  reader = new nsq.Reader(
    topic,
    channel, {
      nsqdTCPAddresses: host,
    }
  );// nsq.Reader

  reader.connect();
}// init_reader

export function publish(topic, message, callback) {
  callback = callback || function(err)  {
    if(err) {
      console.error(err);
    }//if
  };// callback

  writer.publish(topic, message, callback);// writer.publish
}// publish

export function subscribe(message, discard, error, nsqd_connected, nsqd_closed)  {
  if(!message)  {
    throw new Error('A "on message" handler was not specified!');
  }//if
  reader.on('message', message);

  if(!discard)  {
    throw new Error('A "on discard" handler was not specified!');
  }//if
  reader.on('discard', discard);

  error = error || function (err) {
    console.error(err);
    process.exit(1);  // exit with an error so Docker can handle restarts
  };// error
  reader.on('error', error);

  nsqd_connected = nsqd_connected || function (host, port) {
    console.log(`NSQD Reader CONNECTED: ${host}:${port}`);
  };// nsqd_connected
  reader.on('nqsd_connected', nsqd_connected);

  nsqd_closed = nsqd_closed || function (host, port) {
    console.warn(`NSQD Reader CLOSED: ${host}:${port}`);
    process.exit(1);  // exit with an error so Docker can handle restarts
  };// nsqd_closed
  reader.on('nsqd_closed', nsqd_closed);
}// subscribe
