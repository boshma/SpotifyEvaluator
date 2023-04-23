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

router.get('/', async (req, res, next) => { 
  try {
    const threads = await Thread.findAll({
      include: [{
        model: User,
        as: 'author',
        attributes: ['displayName', 'spotifyId']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.render('forum', { threads, user: req.user });

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
      spotifyId: req.user.id
    });
    res.redirect(`/forum/thread/${thread.id}`);
  } catch (err) {
    next(err);
  }
});

//handle viewing threads/posts
router.get('/thread/:id', async (req, res, next) => { // Removed isAuthenticated middleware
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
          attributes: ['displayName', 'spotifyId']
        }, {
          model: Post,
          as: 'ReplyToPost',
          attributes: ['content']
        }],
      }],
      order: [[Post, 'createdAt', 'ASC']]
    });

    if (!thread) {
      return res.status(404).send('Thread not found');
    }

    router.post('/thread/:id/new-post', async (req, res, next) => {
      try {
        const threadId = req.params.id;
        const thread = await Thread.findByPk(threadId, {
          include: [{
            model: User,
            as: 'author',
          }],
        });
    
        if (!thread) {
          return res.status(404).send('Thread not found');
        }
    
        const newPost = await Post.create({
          content: req.body.content,
          ThreadId: thread.id,
          spotifyId: req.user.id,
          ReplyTo: req.body.replyTo || null,
        });
    
        res.redirect(`/forum/thread/${thread.id}`);
      } catch (err) {
        next(err);
      }
    });

    res.render('thread', { thread, user: req.user }); // Pass the user object here
  } catch (err) {
    next(err);
  }
});



router.get('/post/:id/edit', isAuthenticated, async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{ model: User, as: 'author' }]
    });

    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.author.spotifyId !== req.user.spotifyId) {
      return res.status(403).send('Not allowed');
    }

    res.render('edit-post', { post });
  } catch (err) {
    next(err);
  }
});

router.post('/post/:id/edit', isAuthenticated, async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{ model: User, as: 'author' }]
    });

    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.author.spotifyId !== req.user.spotifyId) {
      return res.status(403).send('Not allowed');
    }

    await post.update({ content: req.body.content });
    res.redirect(`/forum/thread/${post.ThreadId}`); 
  } catch (err) {
    next(err);
  }
});


router.post('/post/:id/delete', isAuthenticated, async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{ model: User, as: 'author' }]
    });

    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.author.spotifyId !== req.user.spotifyId) {
      return res.status(403).send('Not allowed');
    }

    const threadId = post.ThreadId; // Store the ThreadId before deleting the post
    await Post.update({ ReplyTo: null }, { where: { ReplyTo: req.params.id } }); // Sets children to null so post can be deleted.

    await post.destroy();
    res.redirect(`/forum/thread/${threadId}`); // Redirect to the thread using the stored ThreadId
  } catch (err) {
    next(err);
  }
});


router.post('/thread/:id/delete', isAuthenticated, async (req, res, next) => {
  try {
    const thread = await Thread.findByPk(req.params.id, {
      include: [{ model: User, as: 'author' }]
    });

    if (!thread) {
      return res.status(404).send('Thread not found');
    }

    if (thread.author.spotifyId !== req.user.spotifyId) {
      return res.status(403).send('Not allowed');
    }

    await thread.destroy();
    res.redirect('/forum');
  } catch (err) {
    next(err);
  }
});

//Reply to functionality
router.get('/thread/:id/reply-to/:postId', isAuthenticated, async (req, res, next) => {
  try {
    const thread = await Thread.findByPk(req.params.id);
    const postToReply = await Post.findByPk(req.params.postId, {
      include: [{ model: User, as: 'author', attributes: ['displayName'] }]
    });

    if (!thread || !postToReply) {
      return res.status(404).send('Thread or post not found');
    }

    res.render('new-reply', { thread, postToReply, user: req.user });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
