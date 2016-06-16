import React, { Component } from 'react';

const zip = require('lodash.zip');

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
// import Article from './Article.js';
import ArticlesGrid from '../components/ArticlesGrid.js';

const NUM_ARTICLES = 10;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      articles: {},
      black: [],
      white: [],
      blackwhite: [],
    };// state

    this._handleArticleGridTileClick = this._handleArticleGridTileClick.bind(this);
  }// constructor

  componentWillMount() {
    getArticles(NUM_ARTICLES, (err, articles) => {
      // console.log(articles);
      if (!err) {
        // this.setState({ articles });
        this._sortArticlesIntoBlackAndWhite(articles);
      } else {
        console.error(err);
      }// if-else
    });// getArticles
  }// componentWillMount

  _sortArticlesIntoBlackAndWhite(articles) {
    // const { articles } = this.state;
    let black = Object.keys(articles).filter((tweetId) => {
      const tweetIdArticles = articles[tweetId];

      // FIXME: TODO: BUG: are Articles in array identical??
      const articleKey = Object.keys(tweetIdArticles)[0];
      const article = tweetIdArticles[articleKey];
      const siteAlignment = article.site_alignment;
      return siteAlignment[0].r1 >= 0.2;
    });// black

    let white = Object.keys(articles).filter((tweetId) => {
      const tweetIdArticles = articles[tweetId];

      // FIXME: TODO: BUG: are Articles in array identical??
      const articleKey = Object.keys(tweetIdArticles)[0];
      const article = tweetIdArticles[articleKey];
      const siteAlignment = article.site_alignment;
      return siteAlignment[0].l1 >= 0.2;
    });// white

    black.sort((a, b) => b - a);
    white.sort((a, b) => b - a);

    const blackwhite = zip(black, white);
    this.setState({ articles, black, white, blackwhite });
  }// _sortArticlesIntoBlackAndWhite

  _renderLoadingIndicator() {
    // console.log(styles.loading);
    return (
      <div style={styles.loading}>
        <CircularProgress size={1} />
      </div>
    );// return
  }// _renderLoadingIndicator

  _renderArticles(articles, blackwhite) {
    // console.log(styles.articles);
    return (
      <div style={styles.articles}>
        <ArticlesGrid
          articles={articles}
          blackwhite={blackwhite}
          onClickHandler={this._handleArticleGridTileClick}
        />
      </div>
    );// return
  }// _renderArticles

  _handleArticleGridTileClick(tweetId, articleKey, siteAlignment) {
    // const { articles } = this.state;
    // const article = articles[tweetId][articleKey];

    console.log(tweetId, articleKey, siteAlignment);
  }// _handleArticleGridTileClick

  render() {
    const { articles, blackwhite } = this.state;
    let Articles;

    // Articles = this._renderLoadingIndicator();
    if (Object.keys(articles).length === 0) {
      Articles = this._renderLoadingIndicator();
    } else {
      Articles = this._renderArticles(articles, blackwhite);
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
