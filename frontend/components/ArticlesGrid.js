import React, { PropTypes } from 'react';
import { GridList, GridTile } from 'material-ui/GridList';
import IconButton from 'material-ui/IconButton';

const NUM_GRID_COLUMNS = 2;

const styles = {
  gridList: {
    width: 800,
    // height: 500,
    overflowY: 'auto',
    marginBottom: 24,
  },
};// styles

const ArticlesGrid = ({ articles, onClickHandler }) => (
  <GridList
    cols={NUM_GRID_COLUMNS}
    cellHeight={200}
    style={styles.gridList}
  >
    {
      Object.keys(articles).map((tweetId) => {
        const tweetIdArticles = articles[tweetId];

        // FIXME: TODO: BUG: are Articles in array identical??
        const articleKey = Object.keys(tweetIdArticles)[0];
        const article = tweetIdArticles[articleKey];

        if (!article.article) article.article = {}; // avoid undefined errors on article.article

        return (
          <GridTile
            key={articleKey}
            title={article.article.title}
            subtitle={article.article.source_url}
            actionIcon={
              <IconButton
                touch={true}
                iconStyle={{ color: 'white' }}
                iconClassName="material-icons"
              >
                assignment_ind
              </IconButton>
            }
            onTouchTap={() => onClickHandler(tweetId, articleKey, article.site_alignment)}
          >
            <img src={article.article.top_image} role="presentation" />
          </GridTile>
        );
      })// Object.keys(articles)
    }
  </GridList>
);// ArticlesGrid

            // onTouchTap={() => onClickHandler(tweetId, articleKey)}

ArticlesGrid.propTypes = {
  articles: PropTypes.object.isRequired,
  onClickHandler: PropTypes.func.isRequired,
};// ArticlesGrid.propTypes

export default ArticlesGrid;
