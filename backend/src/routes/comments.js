const express = require('express');

const router = express.Router();
const { pool } = require('../db');

const MAX_AUTHOR_LENGTH = 100;
const MAX_CONTENT_LENGTH = 10000;

function parseId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function validateCommentInput(body) {
  const postId = parseId(body.post_id);

  const content =
    typeof body.content === 'string'
      ? body.content.trim()
      : '';

  const author =
    typeof body.author === 'string' && body.author.trim()
      ? body.author.trim()
      : 'Anonymous';

  if (!postId) {
    return {
      error: 'Valid post ID is required'
    };
  }

  if (!content) {
    return {
      error: 'Comment content is required'
    };
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return {
      error: `Comment must be ${MAX_CONTENT_LENGTH} characters or less`
    };
  }

  if (author.length > MAX_AUTHOR_LENGTH) {
    return {
      error: `Author must be ${MAX_AUTHOR_LENGTH} characters or less`
    };
  }

  return {
    postId,
    author,
    content
  };
}

// GET comments for a post
router.get('/post/:postId', async (req, res) => {
  const postId = parseId(req.params.postId);

  if (!postId) {
    return res.status(400).json({
      error: 'Invalid post ID'
    });
  }

  try {
    const result = await pool.query(
      `
        SELECT *
        FROM comments
        WHERE post_id = $1
        ORDER BY created_at DESC
      `,
      [postId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Failed to fetch comments:', err);

    res.status(500).json({
      error: 'Failed to fetch comments'
    });
  }
});

// CREATE comment
router.post('/', async (req, res) => {
  const comment = validateCommentInput(req.body || {});

  if (comment.error) {
    return res.status(400).json({
      error: comment.error
    });
  }

  try {
    // Verify that the post exists
    const postCheck = await pool.query(
      'SELECT id FROM posts WHERE id = $1',
      [comment.postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    const result = await pool.query(
      `
        INSERT INTO comments (
          post_id,
          author,
          content
        )
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [
        comment.postId,
        comment.author,
        comment.content
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Failed to create comment:', err);

    res.status(500).json({
      error: 'Failed to create comment'
    });
  }
});

// DELETE comment
router.delete('/:id', async (req, res) => {
  const commentId = parseId(req.params.id);

  if (!commentId) {
    return res.status(400).json({
      error: 'Invalid comment ID'
    });
  }

  try {
    const result = await pool.query(
      `
        DELETE FROM comments
        WHERE id = $1
        RETURNING id
      `,
      [commentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Comment not found'
      });
    }

    res.status(200).json({
      message: 'Comment deleted successfully 🗑️'
    });
  } catch (err) {
    console.error('Failed to delete comment:', err);

    res.status(500).json({
      error: 'Failed to delete comment'
    });
  }
});

module.exports = router;
