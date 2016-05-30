var path = require('path');
var appname = path.basename(__filename, '.js');
var log = require('./logging.js')(appname);

var StatsD = require('hot-shots');
export var stats = new StatsD({
  host: process.env.STATSD_PORT_8125_UDP_ADDR,
  port: process.env.STATSD_PORT_8125_UDP_POR,
  globalTags: [require('os').hostname()],
  errorHandler: function(err) {
    log.error({err}, "StatsD error.");
  }
});
// Catch socket errors so they don't go unhandled, as explained
// in the Errors section below
stats.socket.on('error', function(err) {
  log.error({err}, "Error in STATSD socket.");
});// stats.socket
