import React, { PropTypes } from 'react';
import { GridList, GridTile } from 'material-ui/GridList';
import IconButton from 'material-ui/IconButton';

const NUM_GRID_COLUMNS = 2;

const styles = {
  gridList: {
    width: 900,
    // height: 500,
    overflowY: 'auto',
    marginBottom: 24,
  },
  gridTile: {
    margin: 10,
  },
};// styles

const ArticlesGrid = ({ articles, blackwhite, onClickHandler }) => (
  <GridList
    cols={NUM_GRID_COLUMNS}
    cellHeight={200}
    style={styles.gridList}
  >
    {
      blackwhite.map((tweetId) => {
        if (!tweetId) return <GridTile />;

        const articleKey = Object.keys(articles[tweetId]);
        const article = articles[tweetId][articleKey] || {};

        // avoid undefined errors on article.article
        if (!article.article) article.article = {};

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
            onTouchTap={() => onClickHandler(
              tweetId, articleKey, article.site_alignment
            )}
            style={styles.gridTile}
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
  blackwhite: PropTypes.array.isRequired,
  onClickHandler: PropTypes.func.isRequired,
};// ArticlesGrid.propTypes

export default ArticlesGrid;
