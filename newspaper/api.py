"""A basic (single function) API written using hug"""
import hug

from analysis import article_handler
from logging import loggly

@hug.cli()
@hug.local()
@hug.get('/article', output=hug.output_format.json)
def article(url:hug.types.longer_than(7)):
    """Returns a URL's article data"""
    loggly.info("Analyzing '%s'", url)
    return article_handler(url, True)
