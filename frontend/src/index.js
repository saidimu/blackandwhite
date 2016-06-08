import React, { Component } from 'react';
import { render } from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';

import AppBar from 'material-ui/AppBar';
import {
  deepPurple500 as primary1Color,
  deepPurple700 as primary2Color,
} from 'material-ui/styles/colors';
import { GridList, GridTile } from 'material-ui/GridList';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import IconButton from 'material-ui/IconButton';

import { getTopImages } from './firebase.js';
import ArticleTitle from '../components/ArticleTitle.js';
import ArticleSource from '../components/ArticleSource.js';

// http://www.material-ui.com/#/customization/themes
// https://github.com/callemall/material-ui/blob/master/src/styles/colors.js
// https://github.com/callemall/material-ui/blob/master/src/styles/baseThemes/lightBaseTheme.js
const muiTheme = getMuiTheme({
  palette: {
    primary1Color,
    primary2Color,
    pickerHeaderColor: primary1Color,
  },
});// muiTheme

const styles = {
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  gridList: {
    // width: 800,
    // height: 500,
    overflowY: 'auto',
    marginBottom: 24,
  },
};// styles

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
            style={{
              position: 'fixed',
            }}
            title="get played"
            zDepth={5}
            iconElementLeft={
              <IconButton iconClassName="material-icons">
                play_circle_outline
              </IconButton>
            }
            iconElementRight={
              <IconButton iconClassName="material-icons">
                more_vert
              </IconButton>
            }
          />
          <div style={styles.root}>
            <GridList
              cols={5}
              cellHeight={200}
              style={styles.gridList}
            >
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
                      <GridTile
                        title={<ArticleTitle tweetId={tweetId} />}
                        subtitle={<ArticleSource tweetId={tweetId} />}
                      >
                        <img src={topImageUrl} role="presentation" />
                      </GridTile>
                    );
                  });// Object.keys(tweetUrls)
                })// Object.keys(topImages)
              }
            </GridList>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }// render
}// Example

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

render(<Example />, document.getElementById('react-app'));
