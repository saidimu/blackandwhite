import React, { PropTypes } from 'react';
import CircularProgress from 'material-ui/CircularProgress';

import { getArticle } from '../src/firebase.js';

class ArticleSource extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      article: null,
    };// state
  }// constructor

  componentDidMount() {
    const { tweetId } = this.props;
    getArticle(tweetId, (err, article) => {
      if (err) {
        console.error(err);
      } else {
        console.log(article.title);
        this.setState({ article });
      }// if-else
    });// getArticle
  }// componentDidMount

  _renderLoadingIndicator() {
    return (
      <CircularProgress size={0.5} />
    );// return
  }// _renderLoadingIndicator

  render() {
    const { article } = this.state;

    if (!article) {
      return this._renderLoadingIndicator();
    }// if

    return (
      <div>{article.article.source_url}</div>
    );// return
  }// render
}// ArticleSource

export default ArticleSource;

ArticleSource.propTypes = {
  tweetId: PropTypes.string.isRequired,
};// ArticleSource.propTypes
