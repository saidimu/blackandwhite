import React, { Component } from 'react';

import {
  VictoryPie,
} from 'victory';

const zip = require('lodash.zip');
const shuffle = require('lodash.shuffle');
const flattenDeep = require('lodash.flattendeep');

import AppBar from 'material-ui/AppBar';
import {
  deepPurple500 as primary1Color,
  deepPurple700 as primary2Color,
  // red900 as veryConservativeColor,
  // red400 as conservativeColor,
  // blue900 as veryLiberalColor,
  // blue400 as liberalColor,
  // indigo600 as unaffiliatedColor,
} from 'material-ui/styles/colors';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import CircularProgress from 'material-ui/CircularProgress';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';

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
    height: 250,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    // width: '100%',
    maxWidth: 600,
  },
};// styles

import { getArticles } from '../src/firebase.js';
import ArticlesGrid from '../components/ArticlesGrid.js';

const NUM_FIREBASE_ARTICLES = 350;
const NUM_DISPLAY_ARTICLES = 20;

const ARTICLE_THRESHOLDS = {
  VERY_CONSERVATIVE: 0.15,
  VERY_LIBERAL: 0.3,
};// ARTICLE_THRESHOLDS

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      articles: {},
      // black: [],
      // white: [],
      blackwhite: [],
      article: {},
      showDialog: false,
    };// state

    this._handleArticleGridTileClick = this._handleArticleGridTileClick.bind(this);
  }// constructor

  componentWillMount() {
    getArticles(NUM_FIREBASE_ARTICLES, (err, articles) => {
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
      return siteAlignment[0].r2 >= ARTICLE_THRESHOLDS.VERY_CONSERVATIVE;
    });// black

    let white = Object.keys(articles).filter((tweetId) => {
      const tweetIdArticles = articles[tweetId];

      // FIXME: TODO: BUG: are Articles in array identical??
      const articleKey = Object.keys(tweetIdArticles)[0];
      const article = tweetIdArticles[articleKey];
      const siteAlignment = article.site_alignment;
      return siteAlignment[0].l2 >= ARTICLE_THRESHOLDS.VERY_LIBERAL;
    });// white

    // black.sort((a, b) => b - a);
    black = shuffle(black);
    black.splice(NUM_DISPLAY_ARTICLES);

    // white.sort((a, b) => b - a);
    white = shuffle(white);
    white.splice(NUM_DISPLAY_ARTICLES);

    const blackwhite = flattenDeep(zip(black, white));
    // this.setState({ articles, black, white, blackwhite });
    this.setState({ articles, blackwhite });
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
    const { articles } = this.state;
    const article = articles[tweetId][articleKey].article || {};

    console.log(tweetId, articleKey, article, siteAlignment);

    article.siteAlignment = siteAlignment;
    this.setState({ showDialog: true, article });
  }// _handleArticleGridTileClick

  _renderPageHeader() {
    return (
      <AppBar
        style={{
          // position: 'fixed',
          backgroundColor: 'transparent',
        }}
        showMenuIconButton={false}
        title="black & white"
        titleStyle={{
        }}
        zDepth={2}
      />
    );// return
  }// _renderPageHeader

  _renderChart(chartData) {
    return (
      <div>
        <VictoryPie
          data={chartData}
          // colorScale={[
          //   '#D85F49',
          //   '#F66D3B',
          //   '#D92E1D',
          //   '#D73C4C',
          //   '#FFAF59',
          // ]}
        />
      </div>
    );// return
  }

  _renderDialog() {
    const { article } = this.state;

    const actions = [
      <FlatButton
        label="Close"
        primary={true}
        onTouchTap={() => this.setState({ showDialog: !this.state.showDialog })}
      />,
    ];

    const siteData = article.siteAlignment[0];
    const chartData = [
      { x: 'CONSERVATIVE', y: siteData.r1 },
      { x: 'VERY CONSERVATIVE', y: siteData.r2 },
      { x: 'UNAFFILIATED', y: siteData.n },
      { x: 'LIBERAL', y: siteData.l1 },
      { x: 'VERY LIBERAL', y: siteData.l2 },
    ];// pieData

    function getSiteTitle() {
      return (
        <div>
          <img src={`http://www.google.com/s2/favicons?domain=${siteData.domain}`} role="presentation" />
          {` ${siteData.domain}`}
        </div>
      );// return
    }// getSiteTitle

    return (
      <div>
        <Dialog
          title={getSiteTitle()}
          actions={actions}
          modal={false}
          autoScrollBodyContent={true}
          contentStyle={styles.dialog}
          open={this.state.showDialog}
          onRequestClose={() => this.setState({ showDialog: !this.state.showDialog })}
        >
          {
            this._renderChart(chartData)
          }
        </Dialog>
      </div>
    );// return
  }// _renderDialog

  render() {
    const { articles, blackwhite, showDialog } = this.state;
    let Articles;
    let ArticleSummary;

    // Articles = this._renderLoadingIndicator();
    if (Object.keys(articles).length === 0) {
      Articles = this._renderLoadingIndicator();
    } else {
      Articles = this._renderArticles(articles, blackwhite);
      // Articles = <ArticlesGrid articles={articles} />;
    }// if-else

    if (showDialog) {
      ArticleSummary = this._renderDialog();
    }// if

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          {ArticleSummary}
          {this._renderPageHeader()}
          {Articles}
        </div>
      </MuiThemeProvider>
    );// return
  }// render
}// App

export default App;
