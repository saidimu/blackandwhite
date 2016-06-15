import React, { Component } from 'react';

import AppBar from 'material-ui/AppBar';
import {
  deepPurple500 as primary1Color,
  deepPurple700 as primary2Color,
} from 'material-ui/styles/colors';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import IconButton from 'material-ui/IconButton';
import CircularProgress from 'material-ui/CircularProgress';

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
  articles: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  loading: {
    height: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};// styles

import { getArticles } from '../src/firebase.js';
import Article from './Article.js';
import ArticlesGrid from '../components/ArticlesGrid.js';

const NUM_ARTICLES = 25;
const NUM_GRID_COLUMNS = 5;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      articles: {},
    };// state

    this._handleArticleGridTileClick = this._handleArticleGridTileClick.bind(this);
  }// constructor

  componentWillMount() {
    getArticles(NUM_ARTICLES, (err, articles) => {
      // console.log(articles);
      if (!err) {
        this.setState({ articles });
      } else {
        console.error(err);
      }// if-else
    });// getArticles
  }// componentWillMount

  _renderLoadingIndicator() {
    // console.log(styles.loading);
    return (
      <div style={styles.loading}>
        <CircularProgress size={1} />
      </div>
    );// return
  }// _renderLoadingIndicator

  _renderArticles(articles) {
    // console.log(styles.articles);
    return (
      <div style={styles.articles}>
        <ArticlesGrid
          articles={articles}
          gridColumns={NUM_GRID_COLUMNS}
          onClickHandler={this._handleArticleGridTileClick}
        />
      </div>
    );// return
  }// _renderArticles

  _handleArticleGridTileClick(tweetId, articleKey, site_alignment) {
    const { articles } = this.state;
    // const article = articles[tweetId][articleKey];

    console.log(tweetId, articleKey, site_alignment);
  }// _handleArticleGridTileClick

  render() {
    const { articles } = this.state;
    let Articles;

    // Articles = this._renderLoadingIndicator();
    if (Object.keys(articles).length === 0) {
      Articles = this._renderLoadingIndicator();
    } else {
      Articles = this._renderArticles(articles);
      // Articles = <ArticlesGrid articles={articles} />;
    }// if-else

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
          {Articles}
        </div>
      </MuiThemeProvider>
    );// return
  }// render
}// App

export default App;
