import React, { useState, useEffect } from 'react';
import { MessageSquareHeart, Heart, Send, Sparkles, Flame, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchCheeringPosts, createCheeringPost, likeCheeringPost, CheeringPost } from '../utils/api';

export default function CheeringWall() {
  const [posts, setPosts] = useState<CheeringPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // New post form
  const [author, setAuthor] = useState('');
  const [major, setMajor] = useState('');
  const [message, setMessage] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('🔥');

  const BADGES = ['🔥', '☕', '📚', '💪', '🧸', '✨', '🩺', '💻'];

  const loadPosts = async () => {
    setIsLoading(true);
    const data = await fetchCheeringPosts();
    setPosts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleLike = async (id: string) => {
    if (likedMap[id]) return;

    // Optimistic UI update
    setLikedMap(prev => ({ ...prev, [id]: true }));
    setPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );

    try {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 }
      });
    } catch {
      // ignore
    }

    // Persist to backend server
    const serverLikes = await likeCheeringPost(id);
    if (serverLikes !== null) {
      setPosts(prev =>
        prev.map(p => (p.id === id ? { ...p, likes: serverLikes } : p))
      );
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const created = await createCheeringPost({
      author: author.trim() || '익명의 밤샘러',
      major: major.trim() || '대학생',
      badge: selectedBadge,
      message: message.trim()
    });

    if (created) {
      setPosts(prev => [created, ...prev]);
      setMessage('');
      setAuthor('');
      setMajor('');

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {
        // ignore
      }
    }
    setIsSubmitting(false);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '방금 전';
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diff / (1000 * 60));
      if (mins < 1) return '방금 전';
      if (mins < 60) return `${mins}분 전`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}시간 전`;
      return `${Math.floor(hours / 24)}일 전`;
    } catch {
      return '최근';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-semibold">
          <MessageSquareHeart size={14} className="text-orange-600" />
          <span>백엔드 실시간 동기화 롤링페이퍼</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
          중간고사 익명 응원 롤링페이퍼 📝
        </h2>
        <p className="text-sm text-stone-600 max-w-lg mx-auto">
          "나만 밤새우는 게 아니구나." 작성한 모든 응원과 하트는 백엔드 서버에 영구 보관되어 전국의 학우들과 실시간으로 공유됩니다!
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <span>밤샘 동지들에게 응원 한 줄 남기기</span>
          </h3>
          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
            서버 실시간 저장됨
          </span>
        </div>

        <form onSubmit={handleCreatePost} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="닉네임 (예: 도서관 2층, 벼락치기 장인)"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="bg-stone-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <input
              type="text"
              placeholder="학과/전공 (예: 간호학, 경영학, 미대)"
              value={major}
              onChange={e => setMajor(e.target.value)}
              className="bg-stone-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <textarea
              rows={2}
              placeholder="전국에서 시험 준비하는 대학생들에게 따스한 위로나 힘찬 응원을 남겨주세요!"
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-stone-50 border border-amber-200 rounded-xl p-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-stone-500 mr-1 font-medium">아이콘:</span>
              {BADGES.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBadge(b)}
                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition ${
                    selectedBadge === b ? 'bg-amber-200 ring-2 ring-amber-400 scale-110' : 'hover:bg-stone-100'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              <Send size={14} />
              <span>{isSubmitting ? '서버에 저장 중...' : '응원글 등록하기'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Cheering Feed Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-stone-600 flex items-center gap-2">
            <span>총 {posts.length}개의 응원 메시지</span>
            <button
              onClick={loadPosts}
              className="text-stone-400 hover:text-stone-700 transition"
              title="새로고침"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </span>
          <span className="text-xs text-stone-400 flex items-center gap-1">
            <Flame size={14} className="text-amber-500" />
            <span>하트를 눌러 응원의 마음을 보태주세요</span>
          </span>
        </div>

        {/* Feed List */}
        {isLoading && posts.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            서버에서 응원글을 불러오는 중...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map(post => {
              const isLiked = likedMap[post.id];
              return (
                <div
                  key={post.id}
                  className="bg-white/90 border border-amber-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl p-1.5 bg-amber-100/60 rounded-xl">
                          {post.badge}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-stone-800">{post.author}</div>
                          <div className="text-[10px] text-amber-800 font-medium">{post.major}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {formatTime(post.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                      "{post.message}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">함께 버티는 동지</span>
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                        isLiked
                          ? 'bg-rose-100 text-rose-600 scale-105'
                          : 'bg-stone-50 hover:bg-rose-50 text-stone-500 hover:text-rose-500'
                      }`}
                    >
                      <Heart
                        size={14}
                        className={isLiked ? 'fill-rose-500 text-rose-500 animate-bounce' : 'text-stone-400'}
                      />
                      <span>{post.likes}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
