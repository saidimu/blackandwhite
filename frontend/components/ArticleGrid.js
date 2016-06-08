import React, { PropTypes } from 'react';
import { GridList, GridTile } from 'material-ui/GridList';

const styles = {
  gridList: {
    // width: 800,
    // height: 500,
    overflowY: 'auto',
    marginBottom: 24,
  },
};// styles

const ArticleGrid = ({ articles }) => (
  <GridList
    cols={5}
    cellHeight={200}
    style={styles.gridList}
  >
    {
      Object.keys(articles).map((tweetId) => {
        const tweetIdArticles = articles[tweetId];

        // FIXME: TODO: BUG: array Articles are identical??
        const articleKey = Object.keys(tweetIdArticles)[0];
        const article = tweetIdArticles[articleKey];
        console.log(article);
        return (
          <GridTile
            key={articleKey}
            title={article.title}
            subtitle={article.article.source_url}
          >
            <img src={article.article.top_image} role="presentation" />
          </GridTile>
        );
      })// Object.keys(articles)
    }
  </GridList>
);// ArticleGrid

ArticleGrid.propTypes = {
  articles: PropTypes.object.isRequired,
};// ArticleGrid.propTypes

export default ArticleGrid;
