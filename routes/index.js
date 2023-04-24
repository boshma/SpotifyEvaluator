// routes/index.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');
const { SpotifyData } = require('../models');

/* GET home page. */
router.get('/', function (req, res, next) {
  // Extract profile image URL from req.user object
  const profileImageUrl = req.user ? req.user.profileImage[0].url : null;

  res.render('index', { title: 'Express', user: req.user, profileImageUrl: profileImageUrl });
});

router.get('/auth/spotify',
  passport.authenticate('spotify', {
    scope: [
      'user-read-email',
      'user-read-private',
      'user-top-read',
      'user-read-recently-played',
      'user-read-playback-state',
      'user-library-read',
      'user-read-playback-position'
    ],
    showDialog: true
  }),
  function (req, res) {
    // The request will be redirected to Spotify for authentication, so this
    // function will not be called.
  }
);
router.get('/auth/spotify/callback', passport.authenticate('spotify', { failureRedirect: '/' }), async (req, res) => {
  try {
    // Fetch the user's Spotify data from the database
    const spotifyData = await SpotifyData.findOne({ where: { userId: req.user.id } });
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      accessToken: req.user.accessToken, // Use the access token from req.user
      refreshToken: req.user.refreshToken // Use the refresh token from req.user
    });
    const userData = await spotifyApi.getMe();  
    // Parse the JSON data from the database
    const topArtists = JSON.parse(spotifyData.topArtists);
    const topSongs = JSON.parse(spotifyData.topSongs);
    const topGenres = JSON.parse(spotifyData.topGenres);
    const history = JSON.parse(spotifyData.listeningHistory);
    
    res.render('spotify-info', {
      title: 'Spotify Evaluator',
      userData: userData.body, // Use the user object from passport.authenticate
      artists: topArtists,
      tracks: topSongs,
      history: history,
      genreData: topGenres
    });

  } catch (err) {
    console.error('Error retrieving Spotify data from database:', err);
    res.status(500).send('Error retrieving Spotify data from database');
  }
});

router.get('/logout', function (req, res) {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});



router.get('/', (req, res) => {
  res.send('Welcome to Spotify Evaluator!');
});

module.exports = router;
