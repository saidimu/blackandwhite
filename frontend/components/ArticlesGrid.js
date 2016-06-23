import React, { PropTypes } from 'react';
import { GridList, GridTile } from 'material-ui/GridList';
import IconButton from 'material-ui/IconButton';

const NUM_GRID_COLUMNS = 2;

const styles = {
  gridList: {
    width: 1200,
    // height: 500,
    // overflowY: 'auto',
    marginBottom: 24,
  },
  gridTile: {
    marginTop: 25,
    marginRight: 25,
    marginLeft: 25,
    // marginBottom: 50,
  },
  gridTileHeader: {
    margin: 0,
  },
};// styles

const ArticlesGrid = ({ articles, blackwhite, onClickHandler }) => (
  <GridList
    cols={NUM_GRID_COLUMNS}
    cellHeight={300}
    padding={25}
    style={styles.gridList}
  >
    {
    // <GridTile>
    //   <img src="https://placehold.it/350x150/000000/ffffff?text=black" role="presentation" />
    // </GridTile>
    // <GridTile>
    //   <img src="https://placehold.it/350x150/ffffff/000000?text=white" role="presentation" />
    // </GridTile>
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
            titleBackground="rgba(0, 0, 0, 1)"
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
