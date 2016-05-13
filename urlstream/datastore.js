var knex = require('knex')({
  client: 'pg',
  connection: {
    host     : process.env.DB_ENV_DOCKERCLOUD_SERVICE_HOSTNAME,
    user     : process.env.DBUSER,
    password : process.env.DBPASSWD,
    database : process.env.DBNAME,
    charset  : 'utf8'
  }
});// knex

export default var bookshelf = require('bookshelf')(knex);

// var Tweet = bookshelf.Model.extend({
//   tableName: 'tweets',
//   hasTimestamps: true,
//   urls: function()  {
//     return this.hasMany(Url);
//   }// urls
// });// Tweet
//
// var Url = bookshelf.Model.extend({
//   tableName: 'urls',
//   hasTimestamps: true,
//   top_image:''
// });
