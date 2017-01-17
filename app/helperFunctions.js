var db = require('./config');
var express = require('express');
var path = require('path');
var session = require('express-session');
var bluebird = require('bluebird');
var bcrypt = require('bcrypt-nodejs');
var User = require('./models/user');
var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../db/shortly.sqlite')
  },
  useNullAsDefault: true
});

// exports.checkUserAuthorization = function(req, res) {
//   if (req.session.authentication) {
//     console.log('Send to index');
//   } else {
//     console.log('session error');
//     req.session.error = 'Access denied!';
//     res.redirect('/login');
//   }
// };

exports.checkUserInDb = function(req, res) {
  db.knex('users')
  .where('username', '=', req.body.username)
  .then(function(username) {
    if (username['0'] && username['0']['username']) {
      return new Promise(function(resolve, rej) {
        bcrypt.compare(req.body.password, username['0']['password'], function(err, bool) {
          if (err) {
            rej(err);
          }
          console.log('res', res.session);
          req.session.authentication = true;
          res.redirect('/index');
        });
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

exports.checkForDuplicates = function(req, res) {
  db.knex('users')
  .where('username', '=', req.body.username)
  .then(function(username) {
    if (username['0'] && username['0']['username']) {
      console.log('USERNAME EXISTS');
      res.redirect('/signup');
    } else {
      exports.makeUser(req, res);
    }
  });
};

exports.makeUser = function(req, res) {
  return new Promise(function(resolve, reject) {
    bcrypt.genSalt(10, function(err, salt) {  
      bcrypt.hash(req.body.password, salt, null, function(err, hash) {
        if (err) {
          console.log('hashing the password failed' + err);
          reject(err);
        } else {
          console.log('hash was successful');
          resolve(hash);
        }
      });
    });
  })
  .then(function(hash) {
    // return db.createUser(username, hash);
    console.log('storeUser');
    req.session.authentication = true;
    new User({
      username: req.body.username,
      password: hash
    }).save();
    res.redirect('/');
  })
  .catch(function(err) {
    console.log('error in makeUser', err);
  });
};



