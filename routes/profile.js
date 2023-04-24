// routes/profile.js

const express = require('express');
const router = express.Router();
const { ProfileResponse } = require('../models');


// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }
  
  router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        // Render the profile page with the alreadySubmitted variable
        res.render('profile');
    } catch (err) {
      next(err);
    }
  });



module.exports = router;
