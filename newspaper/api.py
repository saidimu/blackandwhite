"""A basic (single function) API written using hug"""
import hug

from analysis import url_handler

@hug.get('/top_image')
def top_image(url:hug.types.longer_than(7, convert='text')):
    """Returns a URL's top image"""
    return url_handler(url)
