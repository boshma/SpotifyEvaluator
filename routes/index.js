// routes/index.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');

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
function countGenres(artists) {
  const genreCount = {};
  artists.forEach(artist => {
    artist.genres.forEach(genre => {
      if (genreCount[genre]) {
        genreCount[genre]++;
      } else {
        genreCount[genre] = 1;
      }
    });
  });
  return genreCount;
}
router.get('/auth/spotify/callback', passport.authenticate('spotify', { failureRedirect: '/' }), async (req, res) => {
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    accessToken: req.user.accessToken, // Use the access token from req.user
    refreshToken: req.user.refreshToken // Use the refresh token from req.user
  });

  try {
    // Now you can use the access token to make authorized requests to the Spotify API
    const userData = await spotifyApi.getMe(); // Example request to retrieve user data

    // Retrieve user's top 5 artists
    const topArtists = await spotifyApi.getMyTopArtists({ limit: 5 });
    const artists = topArtists.body.items;

    // Retrieve user's top 5 tracks
    const topTracks = await spotifyApi.getMyTopTracks({ limit: 5 });
    const tracks = topTracks.body.items.map(track => {
      const artists = track.artists.map(artist => artist.name).join(', ');
      return { name: track.name, artists: artists };
    });
    // Retrieve user's listening history from the last 30 days
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
    
    

    // Retrieve user's listening history
    const listeningHistory = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 10 });
    const history = listeningHistory.body.items.map(item => ({
      artist: item.track.artists[0].name,
      track: item.track.name,
      album: item.track.album.name,
      albumImage: item.track.album.images[0].url // Get the URL of the first album image
    }));

    // Convert the topGenres object to an array of objects with label and value properties
    const genreData = Object.entries(topGenres).map(([genre, count]) => ({
      label: genre,
      value: count
    }));

    // Sort the genreData array in descending order based on the value (count)
    genreData.sort((a, b) => b.value - a.value);

    // Get the top 5 genres
    const top5Genres = genreData.slice(0, 5);

    res.render('spotify-info', {
      title: 'Spotify Evaluator',
      userData: userData.body,
      artists: artists,
      tracks: tracks,
      history: history,
      genreData: top5Genres
    });

  } catch (err) {
    console.error('Error retrieving data from Spotify API:', err);
    res.status(500).send('Error retrieving data from Spotify API');
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
