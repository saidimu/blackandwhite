import React, { Component } from 'react';

import AppBar from 'material-ui/AppBar';
import {
  deepPurple500 as primary1Color,
  deepPurple700 as primary2Color,
} from 'material-ui/styles/colors';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import IconButton from 'material-ui/IconButton';

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
};// styles

import { getArticles } from '../src/firebase.js';
import ArticleGrid from '../components/ArticleGrid.js';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      articles: {},
    };// state
  }// constructor

  componentWillMount() {
    getArticles(25, (err, articles) => {
      console.log(err);
      console.log(articles);
      if (!err) {
        this.setState({ articles });
      } else {
        console.error(err);
      }// if-else
    });// getArticles
  }// componentWillMount

  render() {
    const articles = this.state.articles;

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          <AppBar
            style={{
              // position: 'fixed',
            }}
            title="get played"
            zDepth={2}
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
            <ArticleGrid articles={articles} />
          </div>
        </div>
      </MuiThemeProvider>
    );// return
  }// render
}// App

export default App;
