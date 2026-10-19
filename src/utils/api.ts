/**
 * Client API utilities to interact with the backend data persistence endpoints.
 */

function getUserId(): string {
  if (typeof window === 'undefined') return 'server_side';
  let uid = localStorage.getItem('pogeun_uid');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('pogeun_uid', uid);
  }
  return uid;
}

export const clientUserId = getUserId();

export interface CheeringPost {
  id: string;
  author: string;
  major: string;
  badge: string;
  message: string;
  likes: number;
  createdAt: string;
}

export interface SavedLetter {
  id: string;
  userId: string;
  title: string;
  letter: string;
  quote: string;
  signature: string;
  createdAt: string;
}

export interface SavedCharm {
  id: string;
  userId: string;
  name: string;
  badge: string;
  buff: string;
  blessing: string;
  luckyItem: string;
  luckyAction: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  persona: string;
  personaName: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  updatedAt: string;
}

export interface GlobalStats {
  totalShreddedWorries: number;
  totalFocusMinutes: number;
  totalCheeringSent: number;
  totalCheeringPosts: number;
  totalSavedLetters: number;
  totalSavedCharms: number;
}

// 1. Cheering Posts
export async function fetchCheeringPosts(): Promise<CheeringPost[]> {
  try {
    const res = await fetch('/api/cheer');
    if (!res.ok) throw new Error('Failed to fetch posts');
    const data = await res.json();
    return data.posts || [];
  } catch (err) {
    console.error('fetchCheeringPosts error:', err);
    return [];
  }
}

export async function createCheeringPost(post: {
  author: string;
  major: string;
  badge: string;
  message: string;
}): Promise<CheeringPost | null> {
  try {
    const res = await fetch('/api/cheer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });
    if (!res.ok) throw new Error('Failed to create post');
    const data = await res.json();
    return data.post;
  } catch (err) {
    console.error('createCheeringPost error:', err);
    return null;
  }
}

export async function likeCheeringPost(id: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/cheer/${id}/like`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to like post');
    const data = await res.json();
    return data.likes;
  } catch (err) {
    console.error('likeCheeringPost error:', err);
    return null;
  }
}

// 2. Letters
export async function fetchSavedLetters(): Promise<SavedLetter[]> {
  try {
    const res = await fetch('/api/letters', {
      headers: { 'x-user-id': clientUserId }
    });
    if (!res.ok) throw new Error('Failed to fetch letters');
    const data = await res.json();
    return data.letters || [];
  } catch (err) {
    console.error('fetchSavedLetters error:', err);
    return [];
  }
}

export async function saveLetterToBackend(letter: {
  title: string;
  letter: string;
  quote?: string;
  signature?: string;
}): Promise<SavedLetter | null> {
  try {
    const res = await fetch('/api/letters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...letter, userId: clientUserId })
    });
    if (!res.ok) throw new Error('Failed to save letter');
    const data = await res.json();
    return data.letter;
  } catch (err) {
    console.error('saveLetterToBackend error:', err);
    return null;
  }
}

export async function deleteLetterFromBackend(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/letters/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('deleteLetter error:', err);
    return false;
  }
}

// 3. Charms
export async function fetchSavedCharms(): Promise<SavedCharm[]> {
  try {
    const res = await fetch('/api/charms', {
      headers: { 'x-user-id': clientUserId }
    });
    if (!res.ok) throw new Error('Failed to fetch charms');
    const data = await res.json();
    return data.charms || [];
  } catch (err) {
    console.error('fetchSavedCharms error:', err);
    return [];
  }
}

export async function saveCharmToBackend(charm: {
  name: string;
  badge: string;
  buff: string;
  blessing?: string;
  luckyItem?: string;
  luckyAction?: string;
}): Promise<SavedCharm | null> {
  try {
    const res = await fetch('/api/charms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...charm, userId: clientUserId })
    });
    if (!res.ok) throw new Error('Failed to save charm');
    const data = await res.json();
    return data.charm;
  } catch (err) {
    console.error('saveCharmToBackend error:', err);
    return null;
  }
}

export async function deleteCharmFromBackend(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/charms/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('deleteCharm error:', err);
    return false;
  }
}

// 4. Chat Sessions
export async function fetchChatSessions(): Promise<ChatSession[]> {
  try {
    const res = await fetch('/api/chat/sessions', {
      headers: { 'x-user-id': clientUserId }
    });
    if (!res.ok) throw new Error('Failed to fetch chat sessions');
    const data = await res.json();
    return data.sessions || [];
  } catch (err) {
    console.error('fetchChatSessions error:', err);
    return [];
  }
}

export async function saveChatSessionToBackend(session: {
  sessionId?: string;
  persona: string;
  personaName: string;
  messages: any[];
}): Promise<ChatSession | null> {
  try {
    const res = await fetch('/api/chat/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...session, userId: clientUserId })
    });
    if (!res.ok) throw new Error('Failed to save chat');
    const data = await res.json();
    return data.session;
  } catch (err) {
    console.error('saveChatSession error:', err);
    return null;
  }
}

export async function deleteChatSessionFromBackend(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('deleteChatSession error:', err);
    return false;
  }
}

// 5. Global Stats
export async function fetchGlobalStats(): Promise<GlobalStats | null> {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    const data = await res.json();
    return data.stats;
  } catch (err) {
    console.error('fetchGlobalStats error:', err);
    return null;
  }
}

export async function recordShreddedWorryBackend(): Promise<number | null> {
  try {
    const res = await fetch('/api/stats/shred', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to record shred');
    const data = await res.json();
    return data.totalShreddedWorries;
  } catch (err) {
    console.error('recordShreddedWorry error:', err);
    return null;
  }
}

export async function recordFocusMinutesBackend(minutes: number): Promise<number | null> {
  try {
    const res = await fetch('/api/stats/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes })
    });
    if (!res.ok) throw new Error('Failed to record focus');
    const data = await res.json();
    return data.totalFocusMinutes;
  } catch (err) {
    console.error('recordFocusMinutes error:', err);
    return null;
  }
}
