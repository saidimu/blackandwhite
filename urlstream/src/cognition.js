const oxford = require('project-oxford');

export const face_client = new oxford.Client(process.env.MICROSOFT_FACE_API_KEY);
export const emotion_client = new oxford.Client(process.env.MICROSOFT_EMOTION_API_KEY);

var path = require('path');
var appname = path.basename(__filename, '.js');
var log = require('./logging.js')(appname);

var now = require("performance-now");

import {
  stats
} from './statsd.js';

export function analyze_emotion(options) {
  log.info(options, 'Emotion API options');
  stats.increment('article.top_image.emotion.detection.count');

  var start = now();
  var end, duration;

  return emotion_client.emotion.analyzeEmotion(options).then(function(response) {
    end = now();
    duration = end - start;
    stats.histogram('article.top_image.emotion.detection.duration.ok', duration);
    stats.increment('article.top_image.emotion.detection.count.ok');

    log.debug({response, options}, 'Emotion API response');
    return response;

  }).catch(function(err)  {
    end = now();
    duration = end - start;
    stats.histogram('article.top_image.emotion.detection.duration.error', duration);
    stats.increment('article.top_image.emotion.detection.count.error');

    log.error({err, options}, 'Emotion API error');
  });// emotion_client.emotion.analyzeEmotion
}// analyze_emotion

export function face_detect(options) {
  log.info(options, 'Face API options');
  stats.increment('article.top_image.face.detection.count');

  var start = now();
  var end, duration;

  return face_client.face.detect(options).then(function(response) {
    end = now();
    duration = end - start;
    stats.histogram('article.top_image.face.detection.duration.ok', duration);
    stats.increment('article.top_image.face.detection.count.ok');

    log.debug({response, options}, 'Face API response');
    return response;

  }).catch(function(err)  {
    end = now();
    duration = end - start;
    stats.histogram('article.top_image.face.detection.duration.error', duration);
    stats.increment('article.top_image.face.detection.count.error');

    log.error({err, options}, 'Face API error');
  });// face_client.face.detect
}// face_detect
