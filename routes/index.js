//routes/index.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');

/* GET home page. */
router.get('/', function(req, res, next) {
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
  function(req, res) {
    // The request will be redirected to Spotify for authentication, so this
    // function will not be called.
  }
);

router.get('/auth/spotify/callback', async (req, res) => {
  const code = req.query.code; // Authorization code obtained from Spotify
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID, // Your Spotify application's client ID
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET, // Your Spotify application's client secret
    redirectUri: process.env.SPOTIFY_CALLBACK_URL_LOCAL // Your Spotify application's redirect URI
  });

  try {
    // Exchange authorization code for access token
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];

    // Step 4: Store and use the access token
    // Store the access token and refresh token securely in your application
    // For example, you can save them in a server-side environment variable or a secure database
    // Then use the access token to make authorized requests to the Spotify API
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    // Now you can use the access token to make authorized requests to the Spotify API
    const userData = await spotifyApi.getMe(); // Example request to retrieve user data

    // Retrieve user's top 5 artists
    const topArtists = await spotifyApi.getMyTopArtists({ limit: 5 });
    const artists = topArtists.body.items.map((artist, index) => ({
      name: artist.name,
      plays: artist.playcount // Get the play count of the artist
    }));

    // Retrieve user's top 5 tracks
    const topTracks = await spotifyApi.getMyTopTracks({ limit: 5 });
    const tracks = topTracks.body.items.map(track => {
      const artists = track.artists.map(artist => artist.name).join(', ');
      return { name: track.name, artists: artists };
    });
    // Retrieve user's listening history
    const listeningHistory = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 10 });
    const history = listeningHistory.body.items.map(item => ({
      artist: item.track.artists[0].name,
      track: item.track.name,
      album: item.track.album.name,
      albumImage: item.track.album.images[0].url // Get the URL of the first album image
    }));

// Render or send response with user data, top artists, top tracks, and listening history
    res.send(`
      <h1>Welcome ${userData.body.display_name}! Here is your listening history and metrics.</h1>
      <h2>Top 5 Artists:</h2>
      <ol>
        ${artists.map(artist => `<li> ${artist.name}</li>`).join('')}
      </ol>
      <h2>Top 5 Tracks:</h2>
      <ol>
        ${tracks.map(track => `<li>${track.name} by ${track.artists}</li>`).join('')}
      </ol>
      <h2>Listening History:</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        ${history.map(item => `
          <div>
            <img src="${item.albumImage}" alt="${item.album}" style="max-width: 150px; max-height: 150px;">
            <p><strong>${item.track}</strong> by ${item.artist}</p>
            <p>Album: ${item.album}</p>
          </div>
        `).join('')}
      </div>
    `);

  } catch (err) {
    // Handle any errors that occur during the authorization code exchange
    console.error('Error exchanging authorization code for access token:', err);
    // Send an error response to the client
    res.status(500).send('Error exchanging authorization code for access token');
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
// Define routes
router.get('/', (req, res) => {
  res.send('Welcome to Spotify Evaluator!');
});

// Authenticate with Spotify
router.get('/auth/spotify', passport.authenticate('spotify', {
  scope: ['user-library-read', 'user-top-read'],
  showDialog: true
}));

// Callback URL after Spotify authentication
router.get('/auth/spotify/callback', passport.authenticate('spotify', {
  failureRedirect: '/login'
}), (req, res) => {
  // Redirect to home page or any other page after successful authentication
  res.redirect('/');
});

// GET user's listening history and metrics
router.get('/user/history', async (req, res) => {
  console.log("test");
  if (req.isAuthenticated()) {
    const spotifyApi = new SpotifyWebApi({
      accessToken: req.user.accessToken, // User's access token retrieved from authentication
      // Add any other options as required
    });
    console.log("in user history "+ spotifyApi)

    try {
      spotifyApi.getMyRecentlyPlayedTracks()
      .then(data => {
        console.log(data.body); // Log the response body to the console
      })
      .catch(err => {
        console.error('Error retrieving listening history:', err);
      });
    
      // Process the data returned from the API
      // The recent listening history is available in data.body.items
      res.send(`Welcome ${req.user.displayName}! Here is your listening history and metrics.`);
    } catch (err) {
      // Handle any errors that occur while retrieving data from the API
      console.error('Error retrieving listening history:', err);
      // Send an error response to the client
      res.status(500).send('Error retrieving listening history');
    }
  } else {
    // Redirect to login
    res.redirect('/auth/spotify');
  }
});


module.exports = router;
