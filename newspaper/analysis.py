from newspaper import Article

def url_handler(url=None):
    if not url:
        return False
    ## if
    try:
        article = Article(url)
        article.download()
        article.parse()
        return article.top_image
    except Exception as e:
        return False
    ##try-except
##url_handler
