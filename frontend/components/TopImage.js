import React, { PropTypes } from 'react';
import { Card, CardHeader, CardMedia, CardTitle, CardText } from 'material-ui/Card';

import FaceEmotions from './FaceEmotions.js';
import ArticleTitle from './ArticleTitle.js';

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
    <CardTitle title={<ArticleTitle tweetId={tweetId} />} subtitle="Card subtitle" />
    <CardText expandable={true} >
      <FaceEmotions faces={faces} />
      <ArticleTitle tweetId={tweetId} />
    </CardText>
  </Card>
);// TopImage

TopImage.propTypes = {
  url: PropTypes.string.isRequired,
  faces: PropTypes.array.isRequired,
  tweetId: PropTypes.string.isRequired,
};// TopImage.propTypes

export default TopImage;
