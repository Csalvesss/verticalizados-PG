import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, timestamp } from '../firebase';
import type { Post } from '../types';

export async function createPost(userId: string, content: string, mediaUrl?: string) {
  return await addDoc(collection(db, 'posts'), {
    userId,
    content: content.trim(),
    mediaUrl: mediaUrl ?? null,
    createdAt: timestamp(),
  });
}

export async function getUserPosts(userId: string) {
  const q = query(
    collection(db, 'posts'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function listenToHomeFeed(
  followedIds: string[],
  callback: (posts: Array<Record<string, unknown>>) => void,
) {
  const q = query(
    collection(db, 'posts'),
    where('userId', 'in', followedIds),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(posts);
  });
}

export async function likePost(postId: string, userId: string) {
  const likeRef = doc(db, 'posts', postId, 'likes', userId);
  await setDoc(likeRef, { createdAt: timestamp() });
}

export async function unlikePost(postId: string, userId: string) {
  const likeRef = doc(db, 'posts', postId, 'likes', userId);
  await deleteDoc(likeRef);
}

export async function createReply(
  postId: string,
  userId: string,
  content: string,
  parentReplyId?: string | null,
) {
  return await addDoc(collection(db, 'posts', postId, 'replies'), {
    userId,
    content: content.trim(),
    parentId: parentReplyId ?? null,
    createdAt: timestamp(),
  });
}

export function listenToReplies(
  postId: string,
  callback: (replies: Array<Record<string, unknown>>) => void,
) {
  const q = query(
    collection(db, 'posts', postId, 'replies'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snapshot) => {
    const replies = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(replies);
  });
}

// Helpers usados pelo feed atual (modelo com arrays)
export async function createFeedPost(data: {
  user: string;
  userId: string;
  photo: string;
  text: string;
  imageUrl: string | null;
  userEmail: string;
  repostOf?: Post['repostOf'];
}) {
  const { repostOf: rawRepostOf, ...rest } = data;
  const repostOf = rawRepostOf
    ? {
      user: rawRepostOf.user,
      text: rawRepostOf.text,
      ...(rawRepostOf.imageUrl ? { imageUrl: rawRepostOf.imageUrl } : {}),
      ...(rawRepostOf.userEmail ? { userEmail: rawRepostOf.userEmail } : {}),
    }
    : null;

  await addDoc(collection(db, 'posts'), {
    ...rest,
    ...(repostOf ? { repostOf } : {}),
    text: rest.text.trim(),
    likes: [],
    comments: [],
    createdAt: timestamp(),
  });
}

export async function togglePostLike(postId: string, hasLiked: boolean, uid: string) {
  await updateDoc(doc(db, 'posts', postId), {
    likes: hasLiked ? arrayRemove(uid) : arrayUnion(uid),
  });
}

export async function addPostComment(
  postId: string,
  comment: {
    user: string;
    userId: string;
    photo: string;
    text: string;
    time: string;
  },
) {
  await updateDoc(doc(db, 'posts', postId), {
    comments: arrayUnion({
      ...comment,
      text: comment.text.trim(),
    }),
  });
}

export async function removePost(postId: string) {
  await deleteDoc(doc(db, 'posts', postId));
}
