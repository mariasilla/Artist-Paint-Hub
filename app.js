//NPM packages
const express = require('express');
const app = express();
const methodOverride = require('method-override')
const pgp = require('pg-promise')();
const mustacheExpress = require('mustache-express');
const bodyParser = require("body-parser");
const session = require('express-session');
const path = require('path');
const axios = require('axios');

//Multer
const multer  = require('multer');

// //Multiparty
// var multiparty = require('multiparty');
// var http = require('http');
// var util = require('util');

//Bcrypt
const bcrypt = require('bcrypt');
const salt = bcrypt.genSalt(10);

//configuration of packages
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use("/", express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'))
app.use(express.static('uploads'))


//configuration of session package
app.use(session({
  secret: 'ART',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))



//connect to art_port_db database
var db = pgp('postgres://kuzia@localhost:5432/art_port_db');

//render Home page
app.get('/', function(req, res){
  res.render('home/index');
});

// User Authentication
app.post('/login', function(req, res){
  var data = req.body;
  var auth_error = "Authorization Failed: Invalid email/password";

  db
    .one("SELECT * FROM users WHERE email = $1", [data.email])
    .catch(function(){
      res.send(auth_error);
    })
    .then(function(user){
      bcrypt.compare(data.password, user.password_digest, function(err, cmp){
        if(cmp){
          // console.log(user);
          req.session.user = user;
          res.redirect("/profile/");
        } else {
          res.send(auth_error);
        }
      });
    });
 });


 //render Profile page
 app.get('/profile/', function(req, res){
   var data ;
   if(req.session.user){
     data = {
       "logged_in": true,
       "email": req.session.user.email,
       "zipcode": req.session.user.zipcode,
       "nickname": req.session.user.nickname
     };
    //  console.log(data.zipcode);
     //https://api.meetup.com/2/open_events?key=125567365e1835372f462b14a4a2d41&sign=true&photo-host=public&zip=10003&text=painter&page=20
     var url = 'https://api.meetup.com/2/open_events?key=125567365e1835372f462b14a4a2d41&sign=true&photo-host=public&zip=';
     var search = '&text=painting&page=20';
    //  var url = 'https://api.meetup.com/find/events?key=125567365e1835372f462b14a4a2d41&sign=true&photo-host=public&text=painter&page=20';
    //display API's data according to user's zipcode
     axios.get(url+data.zipcode+search)
     .then(function(response){
      //  data.meetup = response.data
       data.meetup = response.data.results
     //  console.log(data.meetup);
     res.render('profile/user', data);
   })
   } else {
     res.render('home/index');
   }
 })


//render user sign-up
app.get('/signup', function(req, res){
  res.render('signup/index');
});

//User sign-up
app.post('/signup', function(req, res){
  var data = req.body;
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

//Render portfolio html
app.get('/portfolio', function(req, res){
  var data;
  if(req.session.user){
       data = {
      "logged_in": true,
      "email": req.session.user.email,
      "nickname": req.session.user.nickname
      };
     //select paintings specific to the user logged in
     var user_id = req.session.user.id
    // db
    //   .any("SELECT * FROM comments WHERE ")

    db
       .any("SELECT * FROM paintings WHERE user_id = $1", user_id)
       .then(function(info){
         console.log(info);
          paintings_array = {
           paintings: info,
           security: data
          }

        res.render('profile/portfolio', paintings_array)
     })
    // res.render('profile/portfolio', data);
  } else {
    res.render('home/index');
  }

})

//Render all paintings to one page
app.get('/allpaintings', function(req, res){
  var data;

  if(req.session.user){
       data = {
      "logged_in": true,
      "email": req.session.user.email,
      "nickname": req.session.user.nickname
      };

    db
       .any("SELECT * FROM paintings")
       .then(function(info){
          paintings_array = {
           paintings: info,
           security: data
          }

        res.render('profile/allpaintings', paintings_array)
     })
    // res.render('profile/portfolio', data);
  } else {
    res.render('home/index');
  }
})


//Multer upload
// followed this tutorial: https://www.codementor.io/tips/9172397814/setup-file-uploading-in-an-express-js-application-using-multer-js
app.post('/new_painting_upload', multer({ dest: './uploads/images/'}).single('image'), function(req,res){
  var data;
  if(req.session.user){
    // console.log(req.body);
    data = req.body;
    // console.log(req.file.path);
    var imagePath =  req.file.path.substring(8);
    // console.log(imagePath);
    // res.status(204).end();

                db.none(
                  "INSERT INTO paintings (name, description, type, image, user_id) VALUES ($1, $2, $3, $4, $5)",
                  [data.name, data.description, data.type, imagePath, req.session.user.id]
                ).catch(function(e){
                  res.send('Failed to upload: ' + e);

                }).then(function(){
                  // res.render('profile/portfolio', data);
                  res.redirect("/portfolio");
                });

       } else {
          res.render('home/index');
       }
  });


//Render painting upload form
app.get('/new_painting_upload', function(req, res){
  var data ;
  if(req.session.user){
    data = {
      "logged_in": true,
      "email": req.session.user.email,
      "nickname": req.session.user.nickname
    };
    res.render('profile/new_painting_upload', data);
  } else {
    res.render('home/index');
  }
});


// Delete a painting
app.delete('/deletepainting/:id', function(req, res){
  console.log(req.params.id)
      var id = req.params.id;
      console.log(req.body);
      if(req.session.user){
        db.none(
            "DELETE FROM paintings WHERE id = $1", id
        ).then(function(){
        res.redirect("/portfolio");
        });

      } else {
        res.render('home/index');
      }
})


//Delete user's profile


//Update  user info
app.put('/user', function(req, res){
  db
    .none("UPDATE users SET email = $1 WHERE email = $2",
      [req.body.email, req.session.user.email]
    ).catch(function(){
      res.send('Failed to update user.');
    }).then(function(){
      res.redirect("/profile");
      // res.send('User updated.');
    });

});

//Render update user page
app.get('/updateprofile', function(req, res){
    res.render('profile/updateprofile');
});

//Post user's comments
app.post('/comment', function(req,res){
  var data = req.body;
  if(req.session.user){

                db.none(
                  "INSERT INTO comments (description, painting_id, user_id) VALUES ($1, $2, $3)",
                  [data.description, data.painting_id, req.session.user.id]
                ).catch(function(e){
                  res.send('Failed to post comment: ' + e);

                }).then(function(){
                  // res.render('profile/portfolio', data);
                  res.redirect("/portfolio");
                });

       } else {
          res.render('home/index');
              }
  });


//Logout
app.get('/logout', function(req, res){
  req.session.user = false;
  res.redirect("/");
});

// Starting the server
app.listen(3000, function () {
  console.log('Server running, listening on port 3000!');
});
