var db = require('./app/config');
var express = require('express');
var path = require('path');
var session = require('express-session');
var bluebird = require('bluebird');
var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../db/shortly.sqlite')
  },
  useNullAsDefault: true
});

exports.checkUserAuthorization = function(req, res) {
  if (req.session.authentication) {
    console.log('Send to index');
  } else {
    console.log('session error');
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
};

exports.checkUserInDb = function(req, res) {
  console.log('inside checkDB', req.body.username);
  db.knex('users')
  .where('username', '=', req.body.username)
  .then(function(username) {
    console.log('USER', username);
    if (username['0'] && username['0']['username']) {
      db.knex('users')
      .where('password', '=', req.body.password)
      .then(function(password) {
        console.log('PASSWORD', password);
        if (password['0'] && password['0']['password']) {
          console.log('password found');
          req.session.authentication = true;
          res.redirect('/index');
        } else {
          req.session.error = 'Access denied!';
          res.redirect('/login');
        }
      });
    } else {
      req.session.error = 'Access denied!';
      res.redirect('/login');
    }
  })
  .catch(function(error) {
    throw {
      type: 'DatabaseError',
      message: 'Failed to create test setup data'
    };
  });
};
