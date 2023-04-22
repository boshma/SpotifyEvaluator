//app.js
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const { User } = require('./models');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const forumRouter = require('./routes/forum');




var app = express();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());
// Makes user viewable to all views. 
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(new SpotifyStrategy({
  clientID: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  callbackURL: process.env.NODE_ENV === 'production' ? process.env.SPOTIFY_CALLBACK_URL_PROD : process.env.SPOTIFY_CALLBACK_URL_LOCAL
},
  async function(accessToken, refreshToken, expires_in, profile, done) {
    try {
      const [user, created] = await User.findOrCreate({
        where: { spotifyId: profile.id },
        defaults: {
          displayName: profile.displayName,
          email: profile.emails ? profile.emails[0].value : null,
          profileImage: profile.photos ? JSON.stringify(profile.photos[0]) : null
        }
      });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/forum', forumRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

const { sequelize } = require('./models');

sequelize.sync({ force: true }) 
  .then(() => {
    console.log('Database tables created.');
  })
  .catch((err) => {
    console.error('Unable to create tables:', err);
  });

  sequelize.showAllSchemas()
  .then((tableList) => {
    console.log('Tables:', tableList);
  })
  .catch((err) => {
    console.error('Unable to show tables:', err);
  });


