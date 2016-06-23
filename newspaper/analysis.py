from newspaper import Article
from logger import loggly
from statsd import statsd

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
        statsd.increment('url_analysis.empty')
        loggly.error("Cannot parse empty URL")
        return response
    ## if
    try:
        article = Article(url)
        if not article.is_downloaded:
            statsd.increment('url_analysis.download')
            loggly.info("Downloading article")
            article.download()
        ##if

        # response['html'] = article.html

        if not article.is_parsed:
            statsd.increment('url_analysis.parse')
            loggly.info("Parsing article")
            article.parse()
        ##if

        response['title'] = article.title

        if article.has_top_image() is True:
            statsd.increment('url_analysis.get_top_image')
            loggly.info("Extracting top_image")
            response['top_image'] = article.top_image
        ##if-else

        if nlp is True:
            statsd.increment('url_analysis.nlp_process')
            loggly.info("Doing NLP processing")
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

        statsd.increment('url_analysis.ok')
        return response
    except Exception as e:
        statsd.increment('url_analysis.error')
        loggly.error(e)
        return response
    ##try-except
##article_handler
