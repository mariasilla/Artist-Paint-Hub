const express = require('express');
const app = express();
const methodOverride = require('method-override')
const pgp = require('pg-promise')();
const mustacheExpress = require('mustache-express');
const bodyParser = require("body-parser");
const session = require('express-session');
const imgur = require('imgur-node-api');
const path = require('path');
const axios = require('axios');

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
  secret: 'ART',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

var db = pgp('postgres://kuzia@localhost:5432/art_port_db');


app.get('/', function(req, res){
  res.render('home/index');
});


app.get('/profile', function(req, res){
  let data ;
  if(req.session.user){
    data = {
      "logged_in": true,
      "email": req.session.user.email,
      "zipcode": req.session.user.zipcode
    };
    var url = 'https://api.meetup.com/2/open_events?key=125567365e1835372f462b14a4a2d41&sign=true&photo-host=public&zip=10003&text=painter&page=20';
    // var route = 'movie/now_playing?'
    // var key = '125567365e1835372f462b14a4a2d41';

    axios.get(url)
    .then(function(response){
      data.meetup = response.data.results
    //  console.log(data.meetup);
    res.render('profile/index', data);
  })
  } else {
    res.render('home/index');
  }
})

app.post('/login', function(req, res){
  let data = req.body;
  let auth_error = "Authorization Failed: Invalid email/password";

  db
    .one("SELECT * FROM users WHERE email = $1", [data.email])
    .catch(function(){
      res.send(auth_error);
    })
    .then(function(user){
      bcrypt.compare(data.password, user.password_digest, function(err, cmp){
        if(cmp){
          req.session.user = user;
          res.redirect("/profile");
        } else {
          res.send(auth_error);
        }
      });
    });
 });


app.get('/signup', function(req, res){
  res.render('signup/index');
});

app.post('/signup', function(req, res){
  let data = req.body;
  bcrypt
    .hash(data.password, 10, function(err, hash){
      db.none(
        "INSERT INTO users (email, nickname, level, zipcode, password_digest) VALUES ($1, $2, $3, $4, $5)",
        [data.email, data.nickname, data.level, data.zipcode, hash]
      ).catch(function(e){
        res.send('Failed to create user: ' + e);

      }).then(function(){
        // res.send('User created!');
        res.redirect("/");
      });
    });
});

// app.post('/painting_upload', function(req, res){
  // let data = req.body;
  //
  // db.none(
  //   "INSERT INTO paintings (name, description, type, image_url, user_id) VALUES ($1, $2, $3, $4)",
  //   [data.name, data.description, data.]
  // )
  //  db.none(
  //   "INSERT INTO users (email, nickname, level, favorite_method, password_digest) VALUES ($1, $2, $3, $4, $5)",
  //   [data.email, data.nickname, data.level, data.method, hash]
  // ).catch(function(e){
  //   res.send('Failed to create user: ' + e);
  // }).then(function(){
  //   res.send('User created!')
  // })
//     console.log(data);
//     res.send(200);
//
// });

app.get('/painting_upload', function(req, res){

  //API KEY 125567365e1835372f462b14a4a2d41

  res.render('painting_upload/index');
});

// imgur.setClientID('');
// imgur.upload(path.join(__dirname, 'images/korablik.JPG'), function (err, res) {
//   console.log(res.data.link); // Log the imgur url
// });




app.put('/user', function(req, res){
  db
    .none("UPDATE users SET email = $1 WHERE email = $2",
      [req.body.email, req.session.user.email]
    ).catch(function(){
      res.send('Failed to update user.');
    }).then(function(){
      res.send('User updated.');
    });
});

app.get('/logout', function(req, res){
  req.session.user = false;
  res.redirect("/");
});

app.listen(3000, function () {
  console.log('Server running, listening on port 3000!');
});
