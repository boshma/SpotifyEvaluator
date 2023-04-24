// routes/profile.js

const express = require('express');
const router = express.Router();
const { User, SpotifyData } = require('../models');


// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }
  
  router.get('/', isAuthenticated, async (req, res, next) => {
    try {
      // Query the database to see if the user has already submitted a survey
      const spotifyData = await SpotifyData.findOne({ where: { userId: req.user.id } });

      // Parse the JSON data from the database
      const topArtists = JSON.parse(spotifyData.topArtists);
      const topSongs = JSON.parse(spotifyData.topSongs);
      const topGenres = JSON.parse(spotifyData.topGenres);
      const history = JSON.parse(spotifyData.listeningHistory);

        // Render the profile page with the alreadySubmitted variable
        res.render('profile', {user: req.user, topArtists: topArtists, topSongs: topSongs, topGenres: topGenres, history: history});
    } catch (err) {
      next(err);
    }
  });



module.exports = router;
