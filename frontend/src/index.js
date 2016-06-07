import React, { Component } from 'react';
import { render } from 'react-dom';

import AppBar from 'material-ui/AppBar';
import {
  deepPurple500 as primary1Color,
  deepPurple700 as primary2Color,
} from 'material-ui/styles/colors';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';


import { getTopImages } from './firebase.js';
import TopImage from '../components/TopImage.js';

// http://www.material-ui.com/#/customization/themes
// https://github.com/callemall/material-ui/blob/master/src/styles/colors.js
// https://github.com/callemall/material-ui/blob/master/src/styles/baseThemes/lightBaseTheme.js
const muiTheme = getMuiTheme({
  palette: {
    primary1Color,
    primary2Color,
    pickerHeaderColor: primary1Color,
  },
  appBar: {
    height: 50,
  },
});// muiTheme

class Example extends Component {
  constructor(props) {
    super(props);
    this.state = {
      topImages: {},
    };// state
  }// constructor

  componentWillMount() {
    getTopImages(25, (err, topImages) => {
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

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          <AppBar
            title="newscuria"
            iconClassNameRight="muidocs-icon-navigation-expand-more"
          />
          {
            Object.keys(topImages).map((tweetId) => {
              const tweetUrls = topImages[tweetId];
              // console.log(tweetId);
              return Object.keys(tweetUrls).map((urlKey) => {
                const url = tweetUrls[urlKey];
                const topImageUrl = url.top_image_url;
                const faces = url.emotions_object;
                console.log(topImageUrl);
                console.log(faces);
                return (
                  <TopImage
                    url={topImageUrl}
                    faces={faces || []}
                    tweetId={tweetId}
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
