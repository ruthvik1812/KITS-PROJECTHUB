import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AppContext';
import {
  Star,
  MessageSquare,
  Send,
  Edit3,
  Trash2,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
} from 'lucide-react';
import {
  fetchRatings,
  submitRating,
  deleteRating,
  fetchComments,
  postComment,
  editComment,
  deleteComment,
  ProjectComment,
  RatingSummary,
} from '../services/apiClient';

const MAX_COMMENT_LEN = 1000;

// ─── Star Rating Widget ──────────────────────────────────────────────────────

interface StarWidgetProps {
  value: number | null;
  selected: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarWidget: React.FC<StarWidgetProps> = ({
  value,
  selected,
  onChange,
  disabled = false,
  readOnly = false,
  size = 'md',
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? selected ?? 0;
  const sizeClass = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div
      className="flex items-center gap-0.5"
      role="group"
      aria-label="Star rating"
      onMouseLeave={() => !readOnly && !disabled && setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled || readOnly}
            aria-label={`${star} out of 5 stars`}
            aria-pressed={selected === star}
            onClick={() => !disabled && !readOnly && onChange(star)}
            onMouseEnter={() => !readOnly && !disabled && setHovered(star)}
            className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CA0765] rounded transition-transform ${
              !readOnly && !disabled ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            <Star
              className={`${sizeClass} transition-colors ${
                filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-100'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

// ─── Comment Item ─────────────────────────────────────────────────────────────

interface CommentItemProps {
  comment: ProjectComment;
  currentUserId: string | null;
  projectId: string;
  onUpdated: (c: ProjectComment) => void;
  onDeleted: (id: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  projectId,
  onUpdated,
  onDeleted,
}) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOwner = currentUserId === comment.authorId;
  const initials = comment.authorName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const formattedDate = new Date(comment.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handleEdit = () => {
    setEditText(comment.text);
    setEditing(true);
    setError(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSave = async () => {
    const trimmed = editText.trim();
    if (!trimmed) { setError('Comment cannot be empty.'); return; }
    if (trimmed.length > MAX_COMMENT_LEN) { setError(`Max ${MAX_COMMENT_LEN} characters.`); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await editComment(projectId, comment.id, trimmed);
      onUpdated(res.comment);
      setEditing(false);
    } catch (e: any) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;
    try {
      await deleteComment(projectId, comment.id);
      onDeleted(comment.id);
    } catch (e: any) {
      alert(e.message || 'Failed to delete.');
    }
  };

  return (
    <div className="flex gap-3 py-4 border-b border-slate-100 last:border-b-0">
      <div className="w-9 h-9 rounded-full bg-[#19232B] text-white text-xs font-bold flex items-center justify-center shrink-0 select-none">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-[#19232B]">{comment.authorName}</span>
          <span className="text-[11px] text-[#757F95]">{formattedDate}</span>
          {comment.isEdited && (
            <span className="text-[10px] text-[#757F95] italic bg-slate-100 px-1.5 py-0.5 rounded">Edited</span>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength={MAX_COMMENT_LEN}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-[#D5D5D5] rounded-[4px] focus:outline-none focus:border-[#0070C2] resize-none"
            />
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${editText.length > MAX_COMMENT_LEN - 50 ? 'text-red-500' : 'text-[#757F95]'}`}>
                {editText.length}/{MAX_COMMENT_LEN}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs font-semibold text-[#757F95] hover:text-[#19232B] border border-[#D5D5D5] rounded-[4px] transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs font-semibold bg-[#0070C2] text-white rounded-[4px] hover:bg-[#005696] disabled:opacity-60 flex items-center gap-1.5 transition-colors">
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}Save
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        ) : (
          <p className="text-sm text-[#19232B] leading-relaxed whitespace-pre-wrap break-words">{comment.text}</p>
        )}

        {isOwner && !editing && (
          <div className="flex gap-3 mt-1.5">
            <button onClick={handleEdit} className="inline-flex items-center gap-1 text-xs text-[#757F95] hover:text-[#0070C2] transition-colors">
              <Edit3 className="w-3 h-3" />Edit
            </button>
            <button onClick={handleDelete} className="inline-flex items-center gap-1 text-xs text-[#757F95] hover:text-red-500 transition-colors">
              <Trash2 className="w-3 h-3" />Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface RatingsAndCommentsProps {
  projectId: string;
  isProjectMember: boolean;
}

export const RatingsAndComments: React.FC<RatingsAndCommentsProps> = ({
  projectId,
  isProjectMember,
}) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({ averageRating: 0, totalRatings: 0, myRating: null });
  const [pendingStar, setPendingStar] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSuccess, setRatingSuccess] = useState<string | null>(null);

  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, perPage: 10, hasMore: false });
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const loadRatings = useCallback(async () => {
    try {
      const data = await fetchRatings(projectId);
      setRatingSummary(data);
      if (data.myRating) setPendingStar(data.myRating);
    } catch { /* silent */ }
  }, [projectId]);

  const loadComments = useCallback(async (page = 1, append = false) => {
    try {
      const data = await fetchComments(projectId, page);
      setComments(prev => append ? [...prev, ...data.comments] : data.comments);
      setPagination(data.pagination);
    } catch { /* silent */ } finally {
      setCommentsLoading(false);
      setLoadingMore(false);
    }
  }, [projectId]);

  useEffect(() => { loadRatings(); loadComments(1); }, [loadRatings, loadComments]);

  const handleSubmitRating = async (score: number) => {
    if (!isAuthenticated) { setRatingError('Please sign in to rate.'); return; }
    if (isProjectMember) { setRatingError('Project owners/members cannot rate their own project.'); return; }
    setRatingLoading(true); setRatingError(null); setRatingSuccess(null);
    try {
      const data = await submitRating(projectId, score);
      setRatingSummary(data);
      setPendingStar(score);
      setRatingSuccess(ratingSummary.myRating ? 'Rating updated!' : 'Rating submitted!');
      setTimeout(() => setRatingSuccess(null), 3000);
    } catch (e: any) {
      setRatingError(e.message || 'Failed to submit rating.');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleRemoveRating = async () => {
    setRatingLoading(true); setRatingError(null);
    try {
      const data = await deleteRating(projectId);
      setRatingSummary(data); setPendingStar(null);
      setRatingSuccess('Rating removed.');
      setTimeout(() => setRatingSuccess(null), 3000);
    } catch (e: any) {
      setRatingError(e.message || 'Failed to remove rating.');
    } finally {
      setRatingLoading(false);
    }
  };

  const handlePostComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) { setCommentError('Comment cannot be empty.'); return; }
    if (trimmed.length > MAX_COMMENT_LEN) { setCommentError(`Max ${MAX_COMMENT_LEN} characters.`); return; }
    setSubmitting(true); setCommentError(null);
    try {
      const res = await postComment(projectId, trimmed);
      setComments(prev => [res.comment, ...prev]);
      setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      setCommentText('');
    } catch (e: any) {
      setCommentError(e.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadComments(pagination.page + 1, true);
  };

  const avgDisplay = ratingSummary.averageRating > 0 ? ratingSummary.averageRating.toFixed(1) : '—';

  return (
    <div className="space-y-6" id="ratings-comments-section">
      {/* RATINGS */}
      <div className="kits-card p-6 sm:p-8 bg-white space-y-5 relative">
        <span className="kits-cyan-corner-tl" />
        <span className="kits-cyan-corner-br" />
        <div className="border-b border-[#D5D5D5] pb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <h2 className="font-heading font-bold text-lg text-[#19232B]">Ratings</h2>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-[#19232B]">{avgDisplay}</div>
            <StarWidget value={null} selected={ratingSummary.averageRating > 0 ? Math.round(ratingSummary.averageRating) : null} onChange={() => {}} readOnly size="sm" />
            <div className="text-xs text-[#757F95] mt-1">
              {ratingSummary.totalRatings === 0 ? 'No ratings yet' : `${ratingSummary.totalRatings} rating${ratingSummary.totalRatings > 1 ? 's' : ''}`}
            </div>
          </div>

          {isAuthenticated && !isProjectMember && (
            <div className="flex-1 min-w-[200px] space-y-2">
              <div className="text-xs font-semibold text-[#757F95] uppercase tracking-wide">
                {ratingSummary.myRating ? 'Your rating' : 'Rate this project'}
              </div>
              <StarWidget value={pendingStar} selected={ratingSummary.myRating} onChange={handleSubmitRating} disabled={ratingLoading} size="lg" />
              {ratingSummary.myRating && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#757F95]">You rated {ratingSummary.myRating}/5</span>
                  <button onClick={handleRemoveRating} disabled={ratingLoading} className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50">Remove</button>
                </div>
              )}
              {ratingLoading && <div className="flex items-center gap-1.5 text-xs text-[#757F95]"><Loader2 className="w-3 h-3 animate-spin" />Saving…</div>}
              {ratingError && <div className="flex items-center gap-1.5 text-xs text-red-500"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{ratingError}</div>}
              {ratingSuccess && <div className="flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" />{ratingSuccess}</div>}
            </div>
          )}

          {isAuthenticated && isProjectMember && (
            <div className="flex items-center gap-2 text-xs text-[#757F95] bg-slate-50 border border-slate-200 rounded-[4px] px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Project owners and team members cannot rate their own project.</span>
            </div>
          )}

          {!isAuthenticated && (
            <div className="flex items-center gap-2 text-xs text-[#757F95] bg-slate-50 border border-slate-200 rounded-[4px] px-3 py-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Sign in to rate this project.</span>
            </div>
          )}
        </div>
      </div>

      {/* COMMENTS */}
      <div className="kits-card p-6 sm:p-8 bg-white space-y-5 relative">
        <span className="kits-cyan-corner-tl" />
        <span className="kits-cyan-corner-br" />
        <div className="border-b border-[#D5D5D5] pb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#0070C2]" />
          <h2 className="font-heading font-bold text-lg text-[#19232B]">
            Comments
            {pagination.total > 0 && <span className="ml-2 text-sm font-normal text-[#757F95]">({pagination.total})</span>}
          </h2>
        </div>

        {isAuthenticated ? (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-[#CA0765] text-white text-xs font-bold flex items-center justify-center shrink-0 select-none">
              {(currentUser.name || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                id="comment-input"
                value={commentText}
                onChange={(e) => { setCommentText(e.target.value); setCommentError(null); }}
                placeholder="Share your thoughts about this project…"
                rows={3}
                maxLength={MAX_COMMENT_LEN}
                className="w-full px-3 py-2.5 text-sm border border-[#D5D5D5] rounded-[4px] focus:outline-none focus:border-[#0070C2] resize-none placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between">
                <span className={`text-[11px] ${commentText.length > MAX_COMMENT_LEN - 50 ? 'text-red-500' : 'text-[#757F95]'}`}>
                  {commentText.length}/{MAX_COMMENT_LEN}
                </span>
                <button
                  onClick={handlePostComment}
                  disabled={submitting || !commentText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#CA0765] hover:bg-[#A10550] text-white text-xs font-bold rounded-[4px] disabled:opacity-50 transition-colors"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {submitting ? 'Posting…' : 'Post Comment'}
                </button>
              </div>
              {commentError && <div className="flex items-center gap-1.5 text-xs text-red-500"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{commentError}</div>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#757F95] bg-slate-50 border border-slate-200 rounded-[4px] px-4 py-3">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Sign in to post a comment.</span>
          </div>
        )}

        {commentsLoading ? (
          <div className="flex items-center justify-center py-8 text-[#757F95] gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Loading comments…</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-[#757F95]">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={isAuthenticated ? currentUser.uid : null}
                projectId={projectId}
                onUpdated={(c) => setComments(prev => prev.map(x => x.id === c.id ? c : x))}
                onDeleted={(id) => { setComments(prev => prev.filter(x => x.id !== id)); setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) })); }}
              />
            ))}
          </div>
        )}

        {pagination.hasMore && (
          <div className="text-center pt-2">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0070C2] hover:text-[#005696] border border-[#D5D5D5] rounded-[4px] transition-colors disabled:opacity-50"
            >
              {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {loadingMore ? 'Loading…' : `Load More (${pagination.total - comments.length} remaining)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
