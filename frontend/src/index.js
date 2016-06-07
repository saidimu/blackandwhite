import React, { Component } from 'react';
import { render } from 'react-dom';

import AppBar from 'material-ui/AppBar';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
// import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import darkBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';

import { Card, CardHeader, CardMedia, CardTitle, CardText } from 'material-ui/Card';

import { getTopImages } from './firebase.js';

class Example extends Component {
  constructor(props) {
    super(props);
    this.state = {
      topImages: {},
    };// state
  }// constructor

  componentWillMount() {
    getTopImages(10, (err, topImages) => {
      if (!err) {
        console.log(topImages);
        this.setState({ topImages });
      } else {
        console.error(err);
      }// if-else
    });// getTopImages
  }// componentWillMount

  componentWillUnmount() {
  }// componentWillUnmount

  render() {
    const topImages = this.state.topImages;

    return (
      <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
        <div>
          <AppBar
            title="newscuria"
            iconClassNameRight="muidocs-icon-navigation-expand-more"
          />
          {
            Object.keys(topImages).map((tweetUrlsKey) => {
              const tweetUrls = topImages[tweetUrlsKey];
              return Object.keys(tweetUrls).map((urlKey) => {
                const url = tweetUrls[urlKey];
                console.log(url.top_image_url);
                return (
                  <Card key={urlKey} >
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
                      <img src={url.top_image_url} role="presentation" />
                    </CardMedia>
                    <CardTitle title="Card title" subtitle="Card subtitle" />
                    <CardText>
                      {
                        Object.keys(url.emotions_object || {}).map((faces) => {
                          const faceObject = url.emotions_object[faces];
                          console.log(faceObject.scores);
                          // return faceObject.scores;
                          return Object.keys(faceObject.scores || {}).map((emotion) => {
                            const score = faceObject.scores[emotion];
                            console.log(`${emotion}: ${score}`);
                            return <h6>{emotion} : {score}</h6>;
                          });
                        })
                      }
                    </CardText>
                  </Card>
                );// return
              });// forEach
            })// forEach
          }
        </div>
      </MuiThemeProvider>
    );
  }// render
}// Example

render(<Example />, document.getElementById('react-app'));
