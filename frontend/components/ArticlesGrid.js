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

const ArticlesGrid = ({ articles, blackwhite, onClickHandler }) => (
  <GridList
    cols={NUM_GRID_COLUMNS}
    cellHeight={200}
    style={styles.gridList}
  >
    {
      blackwhite.map((blackwhiteTweetIdsList) => {
        const blackTweetId = blackwhiteTweetIdsList[0];
        const whiteTweetId = blackwhiteTweetIdsList[1];

        if (!blackTweetId) return <GridTile />;
        if (!whiteTweetId) return <GridTile />;

        const blackArticleKey = Object.keys(articles[blackTweetId]);
        const blackArticle = articles[blackTweetId][blackArticleKey];
        const whiteArticleKey = Object.keys(articles[whiteTweetId]);
        const whiteArticle = articles[whiteTweetId][whiteArticleKey];

        console.log(blackArticle);
        console.log(whiteArticle);

        // avoid undefined errors on article.article
        if (!blackArticle.article) blackArticle.article = {};
        if (!whiteArticle.article) whiteArticle.article = {};

        return (
          <div>
            <GridTile
              key={blackArticleKey}
              title={blackArticle.article.title}
              subtitle={blackArticle.article.source_url}
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
                blackTweetId, blackArticleKey, blackArticle.site_alignment
              )}
            >
              <img src={blackArticle.article.top_image} role="presentation" />
            </GridTile>
            <GridTile
              key={whiteArticleKey}
              title={whiteArticle.article.title}
              subtitle={whiteArticle.article.source_url}
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
                whiteTweetId, whiteArticleKey, whiteArticle.site_alignment
              )}
            >
              <img src={whiteArticle.article.top_image} role="presentation" />
            </GridTile>
          </div>
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
