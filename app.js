const express = require('express');
const app = express();
const methodOverride = require('method-override')
const pgp = require('pg-promise')();
const mustacheExpress = require('mustache-express');
const bodyParser = require("body-parser");
const session = require('express-session');
const imgur = require('imgur-node-api');
const path = require('path');


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
  if(req.session.user){
    let data = {
      "logged_in": true,
      "email": req.session.user.email
    };

    res.render('index', data);
  } else {
    res.render('index');
  }
});

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
          res.redirect("/");
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
        "INSERT INTO users (email, nickname, level, favorite_method, password_digest) VALUES ($1, $2, $3, $4, $5)",
        [data.email, data.nickname, data.level, data.method, hash]
      ).catch(function(e){
        res.send('Failed to create user: ' + e);
      }).then(function(){
        res.send('User created!');
      });
    });
});

app.post('/painting_upload', function(req, res){
  let data = req.body;
  //  db.none(
  //   "INSERT INTO users (email, nickname, level, favorite_method, password_digest) VALUES ($1, $2, $3, $4, $5)",
  //   [data.email, data.nickname, data.level, data.method, hash]
  // ).catch(function(e){
  //   res.send('Failed to create user: ' + e);
  // }).then(function(){
  //   res.send('User created!')
  // })
    console.log(data);
    res.send(200);

});

app.get('/painting_upload', function(req, res){
     //
    //  image: imgur.setClientID('054a9a88eceb2d5');
    //  imgur.upload(path.join(__dirname, 'images/korablik.JPG'), function (err, res) {
    //    console.log(res.data.link); //http://i.imgur.com/QBh5qqv.jpg
    //  })

  res.render('painting_upload/index');
});

// imgur.setClientID('');
// imgur.upload(path.join(__dirname, 'images/korablik.JPG'), function (err, res) {
//   console.log(res.data.link); // Log the imgur url
// });



// app.get('/painting_upload', function(req, res){
//   var url = 'https://api.imgur.com/3/upload';
//  //  var route = 'movie/now_playing?'
//   var page = 'page=' + "1" +'&';
//   var key = '';
//   request(url + route + page + key, function(error, response, body){
//     console.log("error: ", error);
//     console.log("statusCode: ", response && response.statusCode);
//     console.log('body', body);
//     var data = JSON.parse(body);
//     res.render("index", {
//       movies: data.results
//     })
//   })
// })


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
