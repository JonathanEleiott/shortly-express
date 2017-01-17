var db = require('./app/config');
var path = require('path');
var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../db/shortly.sqlite')
  },
  useNullAsDefault: true
});

exports.checkUser = function(req, res) {
  if (req.body.username) {
    db.knex('users')
    .where('username', '=', req.body.username)
    .then(function(user) {
      if (user[0].username === req.body.username && user[0].password === req.body.password) {
        res.redirect('/');
      } else {
        res.redirect('/login');
      }
    });
  } else {
    res.redirect('/login');
  }
};
