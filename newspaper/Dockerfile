FROM python:3.5.1-alpine

MAINTAINER Said Apale (saidimu@gmail.com)
# based on Srinath Sankar <srinath@iambot.net> https://github.com/Checksum/newspaper-docker

RUN apk add --no-cache \
  python \
  py-pip \
  build-base \
  gcc \
  bash \
  python-dev \
  libxml2-dev \
  libxslt-dev \
  libjpeg-turbo-dev \
  zlib \
  zlib-dev \
  libpng-dev \
  jpeg-dev \
  ca-certificates \
  && rm -rf /var/cache/apk/*

# https://github.com/python-pillow/Pillow/issues/1763
ENV LIBRARY_PATH=/lib:/usr/lib

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY requirements.txt /usr/src/app/
RUN pip3 install --no-cache-dir -r requirements.txt && \
    python3 -m nltk.downloader brown punkt maxent_treebank_pos_tagger movie_reviews wordnet stopwords averaged_perceptron_tagger

COPY . /usr/src/app
EXPOSE 8000
# CMD hug -f api.py
CMD gunicorn -b 0.0.0.0:8000 --max-requests="$WEB_MAX_REQUESTS" --max-requests-jitter="$WEB_MAX_REQUESTS_JITTER" --preload --access-logfile=- --error-logfile=- --statsd-host="$STATSD_PORT_8125_UDP_ADDR:$STATSD_PORT_8125_UDP_PORT" --statsd-prefix="gunicorn.$HOSTNAME" api:__hug_wsgi__
