"""A basic (single function) API written using hug"""
import hug

from analysis import url_handler

@hug.cli()
@hug.local()
@hug.get('/top_image', output=hug.output_format.json)
def top_image(url:hug.types.longer_than(7)):
    """Returns a URL's top image"""
    return url_handler(url, True)
