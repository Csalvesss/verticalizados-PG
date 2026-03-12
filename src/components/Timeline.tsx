import { s } from '../styles';
import type { Post, CurrentUser } from '../types';
import { Composer } from './Composer';
import { PostCard } from './PostCard';

interface Props {
  posts: Post[];
  loading: boolean;
  uid: string;
  isAdmin: boolean;
  currentUser: CurrentUser;
  following: string[];
  adminEmails: string[];
  commentingOn: string | null;
  onLike: (post: Post) => void;
  onComment: (postId: string) => void;
  onRepost: (post: Post) => void;
  onDelete: (postId: string) => void;
  onEditPost: (postId: string, newText: string) => void;
  onSubmitComment: (postId: string, text: string) => void;
  onCommentReply: (postId: string, commentId: string, text: string) => void;
  onDeleteReply: (postId: string, commentId: string, replyId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onEditComment: (postId: string, commentId: string, newText: string) => void;
  onFollow: (userId: string) => void;
  onUnfollow: (userId: string) => void;
  onOpenProfile?: (userId: string, userName: string) => void;
}

export function Timeline({
  posts,
  loading,
  uid,
  isAdmin,
  currentUser,
  following,
  adminEmails,
  commentingOn,
  onLike,
  onComment,
  onRepost,
  onDelete,
  onEditPost,
  onSubmitComment,
  onCommentReply,
  onDeleteReply,
  onDeleteComment,
  onEditComment,
  onFollow,
  onUnfollow,
  onOpenProfile,
}: Props) {
  if (loading) {
    return (
      <div style={{ ...s.empty, padding: '60px 16px' }}>
        Carregando...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ ...s.empty, padding: '60px 16px' }}>
        Nenhum post ainda. Seja o primeiro!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {posts.map((post) => (
        <div key={post.id}>
          <PostCard
            post={post}
            uid={uid}
            isAdmin={isAdmin}
            following={following}
            adminEmails={adminEmails}
            onLike={() => onLike(post)}
            onComment={() => onComment(post.id)}
            onRepost={() => onRepost(post)}
            onDelete={() => onDelete(post.id)}
            onEditPost={(newText) => onEditPost(post.id, newText)}
            onCommentReply={(commentId, text) => onCommentReply(post.id, commentId, text)}
            onDeleteReply={(commentId, replyId) => onDeleteReply(post.id, commentId, replyId)}
            onDeleteComment={(commentId) => onDeleteComment(post.id, commentId)}
            onEditComment={(commentId, newText) => onEditComment(post.id, commentId, newText)}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
            onOpenProfile={onOpenProfile}
          />

          {commentingOn === post.id && (
            <div style={{
              borderBottom: '1px solid #2f3336',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <Composer
                userPhoto={currentUser.photo}
                placeholder="Poste sua resposta"
                submitLabel="Responder"
                autoFocus
                onPost={(t) => Promise.resolve(onSubmitComment(post.id, t))}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
