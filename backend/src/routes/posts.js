const express = require('express');

const router = express.Router();
const { pool } = require('../db');

const MAX_TITLE_LENGTH = 255;
const MAX_CONTENT_LENGTH = 100000;
const MAX_AUTHOR_LENGTH = 100;
const MAX_EMOJI_LENGTH = 10;

function parsePostId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function validatePostInput(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const author =
    typeof body.author === 'string' && body.author.trim()
      ? body.author.trim()
      : 'Anonymous';
  const emoji =
    typeof body.emoji === 'string' && body.emoji.trim()
      ? body.emoji.trim()
      : '✨';

  if (!title || !content) {
    return {
      error: 'Title and content are required'
    };
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return {
      error: `Title must be ${MAX_TITLE_LENGTH} characters or less`
    };
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return {
      error: `Content must be ${MAX_CONTENT_LENGTH} characters or less`
    };
  }

  if (author.length > MAX_AUTHOR_LENGTH) {
    return {
      error: `Author must be ${MAX_AUTHOR_LENGTH} characters or less`
    };
  }

  if (emoji.length > MAX_EMOJI_LENGTH) {
    return {
      error: `Emoji must be ${MAX_EMOJI_LENGTH} characters or less`
    };
  }

  return {
    title,
    content,
    author,
    emoji
  };
}

// GET all posts - newest first
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        (
          SELECT COUNT(*)
          FROM comments c
          WHERE c.post_id = p.id
        )::integer AS comment_count
      FROM posts p
      ORDER BY p.created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Failed to fetch posts:', err);

    res.status(500).json({
      error: 'Failed to fetch posts'
    });
  }
});

// GET single post with comments
router.get('/:id', async (req, res) => {
  const postId = parsePostId(req.params.id);

  if (!postId) {
    return res.status(400).json({
      error: 'Invalid post ID'
    });
  }

  try {
    const postResult = await pool.query(
      'SELECT * FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    const commentsResult = await pool.query(
      `
        SELECT *
        FROM comments
        WHERE post_id = $1
        ORDER BY created_at DESC
      `,
      [postId]
    );

    res.status(200).json({
      ...postResult.rows[0],
      comments: commentsResult.rows
    });
  } catch (err) {
    console.error('Failed to fetch post:', err);

    res.status(500).json({
      error: 'Failed to fetch post'
    });
  }
});

// CREATE post
router.post('/', async (req, res) => {
  const post = validatePostInput(req.body || {});

  if (post.error) {
    return res.status(400).json({
      error: post.error
    });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO posts (
          title,
          content,
          author,
          emoji
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [post.title, post.content, post.author, post.emoji]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Failed to create post:', err);

    res.status(500).json({
      error: 'Failed to create post'
    });
  }
});

// UPDATE post
router.put('/:id', async (req, res) => {
  const postId = parsePostId(req.params.id);

  if (!postId) {
    return res.status(400).json({
      error: 'Invalid post ID'
    });
  }

  const post = validatePostInput(req.body || {});

  if (post.error) {
    return res.status(400).json({
      error: post.error
    });
  }

  try {
    const result = await pool.query(
      `
        UPDATE posts
        SET
          title = $1,
          content = $2,
          author = $3,
          emoji = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `,
      [
        post.title,
        post.content,
        post.author,
        post.emoji,
        postId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Failed to update post:', err);

    res.status(500).json({
      error: 'Failed to update post'
    });
  }
});

// DELETE post
router.delete('/:id', async (req, res) => {
  const postId = parsePostId(req.params.id);

  if (!postId) {
    return res.status(400).json({
      error: 'Invalid post ID'
    });
  }

  try {
    const result = await pool.query(
      `
        DELETE FROM posts
        WHERE id = $1
        RETURNING id
      `,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    res.status(200).json({
      message: 'Post deleted successfully 🗑️'
    });
  } catch (err) {
    console.error('Failed to delete post:', err);

    res.status(500).json({
      error: 'Failed to delete post'
    });
  }
});

module.exports = router;
