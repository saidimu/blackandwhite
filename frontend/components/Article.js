import { PropTypes } from 'react';

const Article = ({ article }) => {
  console.log(article);
  return (null);
};// Article

Article.propTypes = {
  article: PropTypes.object.isRequired,
};// Article.propTypes

export default Article;
