// routes/survey.js

const express = require('express');
const router = express.Router();
const { User, Thread, Post } = require('../models');


// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }
  
  router.get('/', isAuthenticated, async (req, res, next) => {
    try {
      const threads = await Thread.findAll({
        include: [{
          model: User,
          as: 'author',
          attributes: ['displayName', 'spotifyId']
        }],
        order: [['createdAt', 'DESC']]
      });
      res.render('survey', { threads, user: req.user });
  
    } catch (err) {
      next(err);
    }
  });



module.exports = router;
