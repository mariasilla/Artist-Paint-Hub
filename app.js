const express = require('express');
const app = express();
const methodOverride = require('method-override')
const pgp = require('pg-promise')();
const mustacheExpress = require('mustache-express');
const bodyParser = require("body-parser");
const session = require('express-session');


const bcrypt = require('bcrypt');
const salt = bcrypt.genSalt(10);

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use("/", express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'))

app.use(session({
  secret: '',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

var db = pgp('postgres://kuzia@localhost:5432/DATABASENAME');
