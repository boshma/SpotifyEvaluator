//app.js
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const { User, SpotifyData } = require('./models');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const SpotifyWebApi = require('spotify-web-api-node');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const forumRouter = require('./routes/forum');

const SequelizeStore = require('connect-session-sequelize')(session.Store);

const { sequelize } = require('./models');


const sessionStore = new SequelizeStore({
  db: sequelize
});


var app = express();


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  store: sessionStore,
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
      // Fetch top 5 songs and top 5 artists from Spotify API
      const spotifyApi = new SpotifyWebApi();
      spotifyApi.setAccessToken(accessToken);

      const [topArtists, topTracks] = await Promise.all([
        spotifyApi.getMyTopArtists({ limit: 5 }),
        spotifyApi.getMyTopTracks({ limit: 5 })
      ]);

      // Extract relevant information from API response
      const topArtistNames = topArtists.body.items.map(artist => artist.name);
      const topTrackNames = topTracks.body.items.map(track => ({
        artist: track.artists[0].name,
        track: track.name
      }));

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const listeningHistory_30days = await spotifyApi.getMyRecentlyPlayedTracks({ after: Math.floor(thirtyDaysAgo.getTime() / 1000) });
      const history_30days = listeningHistory_30days.body.items.map(item => ({
        artist: item.track.artists[0].name,
        track: item.track.name,
        album: item.track.album.name,
        albumImage: item.track.album.images[0].url // Get the URL of the first album image
      }));
      const topGenres = {};
  
      // Loop through each item in the listening history
      for (const item of history_30days) {
        // Retrieve artist details using artist name
        const artistDetails = await spotifyApi.searchArtists(item.artist);
        const artists = artistDetails.body.artists.items;
  
        // Loop through the artists of the item
        for (const artist of artists) {
          const genres = artist.genres;
  
          // Loop through the genres of the artist
          for (const genre of genres) {
            // Check if the genre is already in the topGenres object, if not, add it with a count of 1
            if (!topGenres[genre]) {
              topGenres[genre] = 1;
            } else {
              // If the genre is already in the topGenres object, increment the count by 1
              topGenres[genre]++;
            }
          }
        }
      }
      const genreData = Object.entries(topGenres).map(([genre, count]) => ({
        label: genre,
        value: count
      }));
  
      // Sort the genreData array in descending order based on the value (count)
      genreData.sort((a, b) => b.value - a.value);
  
      // Get the top 5 genres
      const topGenreNames = genreData.slice(0, 5);
      const listeningHistory = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 10 });
      const history = listeningHistory.body.items.map(item => ({
        artist: item.track.artists[0].name,
        track: item.track.name,
        album: item.track.album.name,
        albumImage: item.track.album.images[0].url // Get the URL of the first album image
      }));
      const [spotifyData, alreadycreated] = await SpotifyData.findOrCreate({
        where: { userId: user.id },
        defaults: {
          topArtists: JSON.stringify(topArtistNames), // Serialize array to JSON string
          topSongs: JSON.stringify(topTrackNames), // Serialize array to JSON string
          topGenres: JSON.stringify(topGenreNames),
          listeningHistory: JSON.stringify(history)
        }
      });
      
      if (!alreadycreated) {
        // If an existing instance was found and updated, log a message
        console.log(`Spotify data for user ${user.id} updated.`);
      }
      //await user.setSpotifyData(spotifyData);

      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      await user.save();

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


sequelize.sync({ force: true }) 
  .then(() => {
    console.log('Database tables created.');
  })
  .catch((err) => {
    console.error('Unable to create tables:', err);
  });

  sessionStore.sync();

  sequelize.showAllSchemas()
  .then((tableList) => {
    console.log('Tables:', tableList);
  })
  .catch((err) => {
    console.error('Unable to show tables:', err);
  });


