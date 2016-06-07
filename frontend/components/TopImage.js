import React, { PropTypes } from 'react';
import { Card, CardHeader, CardMedia, CardTitle, CardText } from 'material-ui/Card';

import { getArticle } from '../src/firebase.js';

const TopImage = ({ url, faces, tweetId }) => (
  <Card>
    <CardHeader
      title="URL Avatar"
      subtitle="Subtitle"
      avatar="http://lorempixel.com/100/100/nature/"
    />
    <CardMedia
      overlay={
        <CardTitle title="Overlay title" subtitle="Overlay subtitle" />
      }
    >
      <img src={url} role="presentation" />
    </CardMedia>
    <CardTitle title={<Title tweetId={tweetId} />} subtitle="Card subtitle" />
    <CardText>
      <Emotions faces={faces} />
      <Title tweetId={tweetId} />
    </CardText>
  </Card>
);// TopImage

TopImage.propTypes = {
  url: PropTypes.string.isRequired,
  faces: PropTypes.array.isRequired,
  tweetId: PropTypes.string.isRequired,
};// TopImage.propTypes

const Emotions = ({ faces }) => (
  <div>
    {
      Object.keys(faces || {}).map((key) => {
        const face = faces[key];
        console.log(face.scores);
        return Object.keys(face.scores || {}).map((emotion) => {
          const score = face.scores[emotion];
          console.log(`${emotion}: ${score}`);
          return <h6>{emotion} : {score}</h6>;
        });// Object.keys(face.scores)
      })// Object.keys(faces)
    }
  </div>
);// Emotions

Emotions.propTypes = {
  faces: PropTypes.array.isRequired,
};// Emotions.propTypes

const Title = ({ tweetId }) => (
  <div>
    {
      getArticle(tweetId, (err, article) => {
        if (err) {
          console.error(err);
          return null;
        }// if

        console.log(article.title);
        return article.title;
      })
    }
  </div>
);// Title

Title.propTypes = {
  tweetId: PropTypes.string.isRequired,
};// Title.propTypes

export default TopImage;
