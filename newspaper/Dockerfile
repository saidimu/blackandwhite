FROM python:3.5.1-alpine

MAINTAINER Said Apale (saidimu@gmail.com)
# based on Srinath Sankar <srinath@iambot.net> https://github.com/Checksum/newspaper-docker

RUN apk add --no-cache \
  python \
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
RUN \
  pip3 install --no-cache-dir newspaper3k==0.1.7 && \
  pip2 install --no-cache-dir pynsq==0.6.9

COPY . /usr/src/app

# Download corpora
RUN python3 -m nltk.downloader brown punkt maxent_treebank_pos_tagger movie_reviews wordnet stopwords averaged_perceptron_tagger
