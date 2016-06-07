import React, { PropTypes } from 'react';

const FaceEmotions = ({ faces }) => (
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
);// FaceEmotions

FaceEmotions.propTypes = {
  faces: PropTypes.array.isRequired,
};// FaceEmotions.propTypes

export default FaceEmotions;
