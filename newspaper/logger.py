import os
import logging
from restapi_logging_handler import LogglyHandler

logglyHandler = LogglyHandler(
    custom_token=os.environ['LOGGLY_TOKEN'],    ## throw error if key doesn't exist
    app_tags=[],
    max_attempts=5
)##logglyHandler

loggly = logging.getLogger(__name__)
loggly.addHandler(logglyHandler)
loggly.setLevel(logging.INFO)
