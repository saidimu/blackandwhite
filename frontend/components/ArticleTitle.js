import React, { PropTypes } from 'react';
import CircularProgress from 'material-ui/CircularProgress';

import { getArticle } from '../src/firebase.js';

class ArticleTitle extends React.Component {
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
      <CircularProgress size={0.5} color="#E3F2FD" />
    );// return
  }// _renderLoadingIndicator

  render() {
    const { article } = this.state;

    if (!article) {
      return this._renderLoadingIndicator();
    }// if

    return (
      <div>{article.title}</div>
    );// return
  }// render
}// ArticleTitle

export default ArticleTitle;

ArticleTitle.propTypes = {
  tweetId: PropTypes.string.isRequired,
};// ArticleTitle.propTypes
