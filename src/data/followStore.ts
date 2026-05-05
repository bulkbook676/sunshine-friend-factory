/**
 * In-memory follow/follower store.
 * Targets are profiles that can be followed (owners and distributors).
 * Agents cannot be followed but can follow distributors.
 * Replace with backend persistence when API is connected.
 */

type Listener = () => void;

const followers: Record<string, Set<string>> = {};
const following: Record<string, Set<string>> = {};
const baseFollowers: Record<string, number> = {};
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export const subscribeFollow = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Seed a baseline follower count for mock display. */
export const seedFollowerBase = (targetId: string, count: number) => {
  if (baseFollowers[targetId] == null) baseFollowers[targetId] = count;
};

export const isFollowing = (followerId: string, targetId: string): boolean => {
  return !!following[followerId]?.has(targetId);
};

export const follow = (followerId: string, targetId: string) => {
  if (!following[followerId]) following[followerId] = new Set();
  if (!followers[targetId]) followers[targetId] = new Set();
  following[followerId].add(targetId);
  followers[targetId].add(followerId);
  notify();
};

export const unfollow = (followerId: string, targetId: string) => {
  following[followerId]?.delete(targetId);
  followers[targetId]?.delete(followerId);
  notify();
};

export const getFollowerCount = (targetId: string): number => {
  const base = baseFollowers[targetId] ?? 0;
  return base + (followers[targetId]?.size ?? 0);
};

export const getFollowingCount = (followerId: string): number => {
  return following[followerId]?.size ?? 0;
};