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
        // Query the database to see if the user has already submitted a survey
        const submission = await SurveyResponse.findOne({
          where: {
            user: req.user.spotifyId,
          },
        });
    
        // Set the alreadySubmitted variable based on whether a submission exists
        const alreadySubmitted = submission ? true : false;
    
        // Render the survey page with the alreadySubmitted variable
        res.render('survey', { alreadySubmitted });
    } catch (err) {
      next(err);
    }
  });

  router.post('/submit', async (req, res, next) => {
    try {  
      const newResponse = await SurveyResponse.create({
        user: req.user.spotifyId,
        question1: req.body.question1,
        question2: req.body.question2,
        question3: req.body.question3,
      });
      res.redirect(`/forum`);
    } 
    catch (err) {
      next(err);
    }
  });



module.exports = router;
