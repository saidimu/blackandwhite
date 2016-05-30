from newspaper import Article
from logger import loggly

def article_handler(url=None, nlp=False):
    response = {
        'publish_date': None,
        'html': None,
        'title': None,
        'top_image': None,
        'source_url': None,
        'images': None,
        'authors': None,
        'text': None,
        'canonical_link': None,
        'movies': None,
        'keywords': None,
        'summary': None
    }

    if not url:
        loggly.error("Cannot parse empty URL")
        return response
    ## if
    try:
        article = Article(url)
        if not article.is_downloaded:
            loggly.info("Downloading article: '%s'", url)
            article.download()
        ##if

        response['html'] = article.html

        if not article.is_parsed:
            loggly.info("Parsing article: '%s'", url)
            article.parse()
        ##if

        response['title'] = article.title

        if article.has_top_image() is True:
            loggly.info("Getting top_image: : '%s'", url)
            response['top_image'] = article.top_image
        ##if-else

        if nlp is True:
            loggly.info("Doing NLP processing: '%s'", url)
            article.nlp()
            response['summary'] = article.summary
            response['keywords'] = article.keywords
        ##if

        response['movies'] = article.movies
        response['images'] = article.images
        response['authors'] = article.authors
        response['text'] = article.text
        response['publish_date'] = article.publish_date
        response['source_url'] = article.source_url
        response['canonical_link'] = article.canonical_link

        return response
    except Exception as e:
        loggly.error(e)
        return response
    ##try-except
##article_handler
