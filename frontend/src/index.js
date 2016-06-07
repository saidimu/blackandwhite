import React, { Component } from 'react';
import { render } from 'react-dom';

import AppBar from 'material-ui/AppBar';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
// import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import darkBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';


import { getTopImages } from './firebase.js';
import TopImage from '../components/TopImage.js';

class Example extends Component {
  constructor(props) {
    super(props);
    this.state = {
      topImages: {},
    };// state
  }// constructor

  componentWillMount() {
    getTopImages(5, (err, topImages) => {
      if (!err) {
        // console.log(topImages);
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
    console.log(topImages);
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
                const topImageUrl = url.top_image_url;
                const faces = url.emotions_object;
                console.log(topImageUrl);
                console.log(faces);
                return (
                  <TopImage
                    url={topImageUrl}
                    faces={faces}
                  />
                );
              });// Object.keys(tweetUrls)
            })// Object.keys(topImages)
          }
        </div>
      </MuiThemeProvider>
    );
  }// render
}// Example

render(<Example />, document.getElementById('react-app'));
