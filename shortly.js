var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var helpers = require('./app/helperFunctions');
// var cookieParser = require('cookie-parser');
var session = require('express-session');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
// app.use(cookieParser());
app.use(session({
  secret: 'identity',
  resave: true,
  saveUninitialized: true
}));

app.get('/', 
function(req, res) {
  console.log('rootsession', req.session);
  if (req.session.authentication) {
    console.log('Send to index');
    res.render('index');
  } else {
    console.log('root session error');
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
});

app.get('/create', 
function(req, res) {
  if (req.session.authentication) {
    console.log('send to create');
    res.render('index');
  } else {
    console.log('create session error');
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
});

app.get('/links', 
function(req, res) {
  if (req.session.authentication) {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req, res) {
  console.log('login session', req.session);
  res.render('login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/login', function(req, res) {
  helpers.checkUserInDb(req, res);
});

app.post('/signup', function(req, res) {
  helpers.checkForDuplicates(req, res);
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
