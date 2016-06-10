import React, { PropTypes } from 'react';
import { GridList, GridTile } from 'material-ui/GridList';
import IconButton from 'material-ui/IconButton';

const styles = {
  gridList: {
    // width: 800,
    // height: 500,
    overflowY: 'auto',
    marginBottom: 24,
  },
};// styles

const ArticlesGrid = ({ articles, gridColumns, onClickHandler }) => (
  <GridList
    cols={gridColumns}
    cellHeight={200}
    style={styles.gridList}
  >
    {
      Object.keys(articles).map((tweetId) => {
        const tweetIdArticles = articles[tweetId];

        // FIXME: TODO: BUG: are Articles in array identical??
        const articleKey = Object.keys(tweetIdArticles)[0];
        const article = tweetIdArticles[articleKey];
        // console.log(article);
        return (
          <GridTile
            key={articleKey}
            title={article.title}
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
            onTouchTap={() => onClickHandler(tweetId, articleKey)}
          >
            <img src={article.article.top_image} role="presentation" />
          </GridTile>
        );
      })// Object.keys(articles)
    }
  </GridList>
);// ArticlesGrid

ArticlesGrid.propTypes = {
  articles: PropTypes.object.isRequired,
  gridColumns: PropTypes.number.isRequired,
  onClickHandler: PropTypes.func.isRequired,
};// ArticlesGrid.propTypes

export default ArticlesGrid;
