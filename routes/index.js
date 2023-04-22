//routes/index.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

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

router.get('/auth/spotify/callback',
  passport.authenticate('spotify', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);

router.get('/logout', function (req, res) {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});



module.exports = router;
