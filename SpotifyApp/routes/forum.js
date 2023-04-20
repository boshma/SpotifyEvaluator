// routes/forum.js

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
        attributes: ['displayName']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.render('forum', { threads });
  } catch (err) {
    next(err);
  }
});

router.get('/new', isAuthenticated, (req, res) => {
  res.render('new-thread');
});

router.post('/new', isAuthenticated, async (req, res, next) => {
  try {
    const thread = await Thread.create({
      title: req.body.title,
      content: req.body.content,
      userId: req.user.id
    });
    res.redirect(`/forum/thread/${thread.id}`);
  } catch (err) {
    next(err);
  }
});


//handle viewing threads/posts
router.get('/thread/:id', isAuthenticated, async (req, res, next) => {
  try {
    const thread = await Thread.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['displayName']
      }, {
        model: Post,
        include: [{
          model: User,
          as: 'author',
          attributes: ['displayName']
        }],
      }],
      order: [[Post, 'createdAt', 'ASC']]
    });

    if (!thread) {
      return res.status(404).send('Thread not found');
    }

    res.render('thread', { thread });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
