from datadog import initialize
from datadog import statsd

## throw an error if any of these env vars aren't set
statsd_host = os['STATSD_PORT_8125_UDP_ADDR']
statsd_port = os['STATSD_PORT_8125_UDP_PORT']

options = {
    statsd_host: statsd_host,
    statsd_port: statsd_port
}##options

initialize(**options)
