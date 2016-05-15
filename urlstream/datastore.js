var Sequelize = require('sequelize');
var sequelize = new Sequelize(
  process.env.DBNAME,
  process.env.DBUSER,
  process.env.DBPASSWD,
  {
    host: process.env.DB_ENV_DOCKERCLOUD_SERVICE_HOSTNAME,
    dialect: 'postgres',
    define: {
      timestamps: true // true by default
    }
  }
);// sequelize

export var Tweet = sequelize.define('tweet', {
  // id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  tweet: { type: Sequelize.JSONB }
});// User

export var Urls = sequelize.define('url', {
  urls: { type: Sequelize.JSONB }
});// Url

export var TopImage = sequelize.define('topimage', {
  top_image: { type: Sequelize.TEXT }
});// TopImage

Tweet.belongsToMany(Urls, {through: 'TweetUrls'});
Urls.belongsToMany(Tweet, {through: 'TweetUrls'});
Urls.belongsTo(TopImage);
TopImage.belongsToMany(Urls, {through: 'TopImageUrls'});

sequelize.sync().then(function() {
  console.log('Sequelize SYNC all good.');
}).catch(function(error) {
  console.error(error);
});// sequelize.sync

// var knex = require('knex')({
//   client: 'pg',
//   connection: {
//     host     : process.env.DB_ENV_DOCKERCLOUD_SERVICE_HOSTNAME,
//     user     : process.env.DBUSER,
//     password : process.env.DBPASSWD,
//     database : process.env.DBNAME,
//     charset  : 'utf8'
//   }
// });// knex
//
// knex.schema.createTableIfNotExists('tweets', function(table) {
//   table.increments();
//   table.string('username');
//   table.jsonb('tweet');
//   table.timestamps();
// });// tweets
//
// knex.schema.createTableIfNotExists('urls', function(table) {
//   table.increments();
//   table.string('url');
//   table.timestamps();
// });// urls
//
// export default var bookshelf = require('bookshelf')(knex);
//
// var Tweet = bookshelf.Model.extend({
//   tableName: 'tweets',
//   hasTimestamps: true,
//   text: function()  {
//     return this.get('tweet')
//   },
//   urls: function()  {
//     return this.hasMany(Url);
//   }// urls
// });// Tweet
//
// var Url = bookshelf.Model.extend({
//   tableName: 'urls',
//   hasTimestamps: true,
//   tweet: function() {
//     return this.belongsTo(Tweet)
//   }// tweet
// });// Url
