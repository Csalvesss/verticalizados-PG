import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, timestamp } from '../firebase';

export async function createUserProfile(
  uid: string,
  data: {
    username: string;
    name: string;
    photoURL?: string;
    bio?: string;
  },
) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...data,
    createdAt: timestamp(),
  });
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<{
    username: string;
    name: string;
    photoURL: string;
    bio: string;
  }>,
) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, updates);
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function followUser(currentId: string, targetId: string) {
  const followingRef = doc(db, 'users', currentId, 'following', targetId);
  const followerRef = doc(db, 'users', targetId, 'followers', currentId);
  await setDoc(followingRef, { createdAt: timestamp() });
  await setDoc(followerRef, { createdAt: timestamp() });
}

export async function unfollowUser(currentId: string, targetId: string) {
  const followingRef = doc(db, 'users', currentId, 'following', targetId);
  const followerRef = doc(db, 'users', targetId, 'followers', currentId);
  await deleteDoc(followingRef);
  await deleteDoc(followerRef);
}
