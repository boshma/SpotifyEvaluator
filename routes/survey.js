// routes/survey.js

const express = require('express');
const router = express.Router();
const { SurveyResponse } = require('../models');


// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }
  
  router.get('/', isAuthenticated, async (req, res, next) => {
    try {
      res.render('survey');
    } catch (err) {
      next(err);
    }
  });

  router.post('/submit', async (req, res, next) => {
    try {  
      const newResponse = await SurveyResponse.create({
        user: req.user.spotifyId,
        question1: 1,
        question2: 2,
        question3: 3,
      });
  
      res.redirect(`/forum`);
    } 
    catch (err) {
      next(err);
    }
  });



module.exports = router;
