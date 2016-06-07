import React, { PropTypes } from 'react';
import { Card, CardHeader, CardMedia, CardTitle, CardText } from 'material-ui/Card';

const TopImage = ({ url, faces }) => (
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
    <CardTitle title="Card title" subtitle="Card subtitle" />
    <CardText>
      <Emotions faces={faces} />
    </CardText>
  </Card>
);// TopImage

TopImage.propTypes = {
  url: PropTypes.string.isRequired,
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
  faces: PropTypes.object.isRequired,
};// TopImage.propTypes

export default TopImage;
