from newspaper import Article

def url_handler(url=None):
    if not url:
        return False
    ## if
    article = Article(url)
    article.download()
    article.parse()
    print(article.top_image)
    return article.top_image
