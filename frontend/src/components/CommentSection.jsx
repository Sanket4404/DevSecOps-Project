import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { HiTrash } from 'react-icons/hi2';
import { createComment, deleteComment } from '../api';
import toast from 'react-hot-toast';

const MAX_AUTHOR_LENGTH = 100;
const MAX_CONTENT_LENGTH = 10000;

function CommentSection({ postId, comments = [], onUpdate }) {
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedAuthor = author.trim();
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      toast.error('Write something bestie! 💬');
      return;
    }

    if (trimmedAuthor.length > MAX_AUTHOR_LENGTH) {
      toast.error(`Name must be ${MAX_AUTHOR_LENGTH} characters or less`);
      return;
    }

    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      toast.error(
        `Comment must be ${MAX_CONTENT_LENGTH} characters or less`
      );
      return;
    }

    setSubmitting(true);

    try {
      await createComment({
        post_id: postId,
        author: trimmedAuthor || 'Anonymous',
        content: trimmedContent,
      });

      setAuthor('');
      setContent('');

      toast.success('Comment dropped! 💬');

      if (typeof onUpdate === 'function') {
        await onUpdate();
      }
    } catch (err) {
      console.error('Failed to create comment:', err);

      const message =
        err?.response?.data?.error || 'Failed to post comment 😢';

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) {
      return;
    }

    setDeletingId(commentId);

    try {
      await deleteComment(commentId);

      toast.success('Comment deleted 🗑️');

      if (typeof onUpdate === 'function') {
        await onUpdate();
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);

      const message =
        err?.response?.data?.error || 'Failed to delete comment';

      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="comments-section">
      <h2 className="comments-header">
        💬 Comments ({comments.length})
      </h2>

      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="comment-form-row">
          <input
            type="text"
            placeholder="Your name (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={MAX_AUTHOR_LENGTH}
            disabled={submitting}
          />
        </div>

        <div className="comment-form-row">
          <textarea
            placeholder="Drop your thoughts... 💭"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={MAX_CONTENT_LENGTH}
            disabled={submitting}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={submitting}
        >
          {submitting ? 'Posting...' : 'Send it 🚀'}
        </button>
      </form>

      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <div className="comment-item-header">
              <span className="comment-author">
                @{comment.author || 'Anonymous'}
              </span>

              <span className="comment-date">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <p className="comment-content">{comment.content}</p>

            <div className="comment-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => handleDelete(comment.id)}
                disabled={deletingId === comment.id}
                title="Delete comment"
                aria-label={`Delete comment by ${
                  comment.author || 'Anonymous'
                }`}
              >
                <HiTrash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {comments.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            padding: '2rem',
          }}
        >
          No comments yet. Be the first to vibe! ✨
        </div>
      )}
    </div>
  );
}

export default CommentSection;
