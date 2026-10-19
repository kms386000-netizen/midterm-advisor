import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  SlidersHorizontal,
  Info,
  History,
  Trash2,
  MessageSquare,
  Save
} from 'lucide-react';
import {
  fetchChatSessions,
  saveChatSessionToBackend,
  deleteChatSessionFromBackend,
  ChatSession
} from '../utils/api';

export type PersonaId = 'pogeun' | 'owl' | 'ondo' | 'cat';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface PersonaInfo {
  id: PersonaId;
  name: string;
  badge: string;
  tagline: string;
  greeting: string;
  avatarBg: string;
  borderTheme: string;
}

const PERSONAS: PersonaInfo[] = [
  {
    id: 'pogeun',
    name: '포근이 선배',
    badge: '🧸',
    tagline: '무조건적인 공감과 다정한 토닥임',
    greeting: '안녕! 시험 기간이라 몸도 마음도 뻐근하고 힘들지? 나도 그 도서관 공기, 벼락치기의 막막함 너무 잘 알아. 여기선 학점 걱정 10분만 내려놓고 마음껏 털어놔도 돼. 네가 얼마나 애쓰고 있는지 난 다 알아 토닥토닥.',
    avatarBg: 'bg-amber-100 text-amber-800',
    borderTheme: 'border-amber-300'
  },
  {
    id: 'owl',
    name: '올빼미 멘토',
    badge: '🦉',
    tagline: '현실적인 벼락치기 전략 & 멘탈 구원',
    greeting: '자, 심호흡 한번 들이쉬고! 시험 범위에 압도되어 멘붕 온 거 다 알아요. 지금부터는 "완벽"이 아니라 "효율"로 승부보는 시간입니다. 목차부터 딱 3개만 잡고 시작합시다. 제가 현실적인 플랜 같이 세워줄게요!',
    avatarBg: 'bg-indigo-100 text-indigo-800',
    borderTheme: 'border-indigo-300'
  },
  {
    id: 'ondo',
    name: '온도 쌤',
    badge: '🍵',
    tagline: '시험 불안 완화 & 심리 마인드셋',
    greeting: '반갑습니다. 시험을 앞두고 가슴이 두근거리거나 백지가 될까 두려우신가요? 시험 불안은 잘 해내고 싶다는 마음이 만든 자연스러운 신체 반응입니다. 당신의 존재 가치는 성적표 한 장으로 결코 재단될 수 없어요. 함께 마음의 안정을 찾아봐요.',
    avatarBg: 'bg-emerald-100 text-emerald-800',
    borderTheme: 'border-emerald-300'
  },
  {
    id: 'cat',
    name: '치즈냥이',
    badge: '🐱',
    tagline: '공부 1분도 폭풍 칭찬하는 캠퍼스 냥이',
    greeting: '골골골~ 집사야! 이 야심한 시각까지 책상에 앉아있다니, 너는 정말 우주 최강 대단한 집사다냥! 츄르 대신 냥발 젤리로 꾹꾹이 해줄 테니 기운 내라옹! 칭찬 가득 먹고 가라옹~',
    avatarBg: 'bg-orange-100 text-orange-800',
    borderTheme: 'border-orange-300'
  }
];

const SUGGESTIONS = [
  '⚡ 벼락치기 시작조차 막막해... 어쩌지?',
  '☁️ 공부 집중이 하나도 안 되고 멍해져',
  '💔 시험 망치면 인생 끝날 것 같아 두려워',
  '☕ 10분만 쉬는 것도 죄책감 들어',
  '📚 교수님 PPT 분량이 너무 많아서 눈물나',
  '💖 지금 나에게 따뜻한 한마디만 해줘'
];

export default function CounselingChat() {
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>('pogeun');
  const [sessionId, setSessionId] = useState<string>(() => 'chat-' + Date.now());
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: PERSONAS[0].greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Saved sessions from backend
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>([]);
  const [showSessionsDrawer, setShowSessionsDrawer] = useState(false);

  // Student context settings
  const [showContextModal, setShowContextModal] = useState(false);
  const [studentContext, setStudentContext] = useState({
    major: '',
    subject: '',
    worry: ''
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentPersona = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const list = await fetchChatSessions();
    setSavedSessions(list);
  };

  const handlePersonaChange = (newPersona: PersonaId) => {
    setSelectedPersona(newPersona);
    const target = PERSONAS.find(p => p.id === newPersona);
    if (!target) return;

    if (messages.length <= 1) {
      setMessages([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: target.greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `*[상담 멘토가 **${target.name}**(${target.badge})로 변경되었습니다.]*\n\n${target.greeting}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const persistMessages = async (updatedMessages: Message[]) => {
    const saved = await saveChatSessionToBackend({
      sessionId,
      persona: selectedPersona,
      personaName: currentPersona.name,
      messages: updatedMessages
    });
    if (saved) {
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      loadSessions();
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newThread = [...messages, userMsg];
    setMessages(newThread);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = newThread.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          persona: selectedPersona,
          studentContext
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '상담 멘토와 연결에 실패했습니다.');
      }

      const data = await res.json();
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalThread = [...newThread, botMsg];
      setMessages(finalThread);

      // Save to backend database!
      persistMessages(finalThread);
    } catch (error: any) {
      console.error('Chat error:', error);
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `토닥토닥... 지금 도서관 와이파이나 네트워크가 잠시 흔들렸나 봐요. 하지만 잊지 마세요: **"너는 지금도 충분히 잘 해내고 있고, 이 시험이 네 빛을 가릴 수 없어."**\n\n잠시 후 다시 말을 걸어주면 바로 달려올게요! ❤️`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewSession = () => {
    if (window.confirm('새로운 대화를 시작할까요? 현재 대화는 서버에 안전하게 보관됩니다.')) {
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
      const newSid = 'chat-' + Date.now();
      setSessionId(newSid);
      setMessages([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: currentPersona.greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setLastSavedTime(null);
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    setSessionId(session.id);
    setSelectedPersona((session.persona as PersonaId) || 'pogeun');
    setMessages(session.messages || []);
    setShowSessionsDrawer(false);
    setLastSavedTime(new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 대화 기록을 서버에서 삭제하시겠습니까?')) {
      const ok = await deleteChatSessionFromBackend(id);
      if (ok) {
        setSavedSessions(prev => prev.filter(s => s.id !== id));
        if (sessionId === id) {
          handleStartNewSession();
        }
      }
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (!window.speechSynthesis) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*#_`>]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.95;
    utterance.pitch = selectedPersona === 'cat' ? 1.2 : selectedPersona === 'owl' ? 0.95 : 1.05;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-[760px] max-w-4xl mx-auto bg-amber-50/70 border border-amber-200/80 rounded-3xl shadow-xl shadow-amber-900/5 overflow-hidden backdrop-blur-sm">
      {/* Top Bar with Persona Selector */}
      <div className="bg-white/90 border-b border-amber-200/60 p-4 sm:p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-amber-100/70 shadow-sm animate-float">
              {currentPersona.badge}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-800">{currentPersona.name}</h2>
                {lastSavedTime ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    ✓ 서버 동기화 ({lastSavedTime})
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                    실시간 위로 중
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">{currentPersona.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSessionsDrawer(!showSessionsDrawer)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-amber-100/70 hover:bg-amber-200/70 border border-amber-200 rounded-xl transition"
              title="이전 대화 세션 기록"
            >
              <History size={14} />
              <span>대화 기록 ({savedSessions.length})</span>
            </button>
            <button
              onClick={() => setShowContextModal(!showContextModal)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
              title="내 시험 과목 및 고민 등록"
            >
              <SlidersHorizontal size={14} />
              <span>내 정보 {studentContext.subject ? '✓' : ''}</span>
            </button>
            <button
              onClick={handleStartNewSession}
              className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition"
              title="새 대화 시작"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Sessions Drawer */}
        {showSessionsDrawer && (
          <div className="mb-3 p-3 bg-white rounded-2xl border border-amber-300 shadow-sm space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span className="flex items-center gap-1.5">
                <MessageSquare size={14} className="text-amber-600" />
                <span>서버에 저장된 이전 상담 기록</span>
              </span>
              <button
                onClick={handleStartNewSession}
                className="text-[11px] text-amber-600 hover:underline font-semibold"
              >
                + 새 상담 시작하기
              </button>
            </div>

            {savedSessions.length === 0 ? (
              <div className="text-xs text-stone-400 py-2 text-center">
                아직 저장된 상담 기록이 없습니다. 대화를 나누면 서버에 자동 저장됩니다!
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {savedSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                      sessionId === session.id
                        ? 'bg-amber-100/70 border-amber-400 font-bold'
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <span>[{session.personaName || '포근이'}] </span>
                      <span className="text-stone-600 font-normal">
                        {session.messages?.[session.messages.length - 1]?.content.substring(0, 35) || '상담 대화'}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-stone-400">
                        {new Date(session.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                      </span>
                      <button
                        onClick={e => handleDeleteSession(session.id, e)}
                        className="text-stone-300 hover:text-rose-500 p-0.5"
                        title="기록 삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Persona Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PERSONAS.map(p => {
            const isSelected = selectedPersona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePersonaChange(p.id)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-semibold scale-[1.02]'
                    : 'bg-stone-100/70 hover:bg-stone-100 text-stone-600 text-xs'
                }`}
              >
                <span className="text-lg">{p.badge}</span>
                <div className="truncate">
                  <div className="text-xs truncate">{p.name}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Student Context Drawer */}
        {showContextModal && (
          <div className="mt-3 p-3 bg-amber-100/50 rounded-2xl border border-amber-200 text-xs space-y-2">
            <div className="font-semibold text-amber-900 flex items-center gap-1.5">
              <Info size={14} />
              <span>멘토에게 내 상황 미리 알려주기 (선택사항)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="전공 (예: 간호학, 경영학, 컴공)"
                value={studentContext.major}
                onChange={e => setStudentContext({ ...studentContext, major: e.target.value })}
                className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-700"
              />
              <input
                type="text"
                placeholder="이번 시험 과목 (예: 생리학, 통계)"
                value={studentContext.subject}
                onChange={e => setStudentContext({ ...studentContext, subject: e.target.value })}
                className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-700"
              />
              <input
                type="text"
                placeholder="가장 큰 고민 (예: 벼락치기, 암기)"
                value={studentContext.worry}
                onChange={e => setStudentContext({ ...studentContext, worry: e.target.value })}
                className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isUser && (
                <div className="w-9 h-9 rounded-2xl bg-amber-200/70 border border-amber-300 flex items-center justify-center text-xl shrink-0 shadow-sm">
                  {currentPersona.badge}
                </div>
              )}

              <div
                className={`relative max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-amber-600 text-white rounded-tr-sm ml-auto'
                    : 'bg-white text-stone-800 border border-amber-100 rounded-tl-sm'
                }`}
              >
                <div className="prose prose-sm max-w-none text-stone-800 prose-headings:text-stone-900 prose-p:my-1.5 prose-strong:text-amber-800">
                  {isUser ? (
                    <p className="whitespace-pre-wrap text-white font-medium">{msg.content}</p>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>

                {!isUser && (
                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                    <span>{msg.timestamp}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSpeak(msg.id, msg.content)}
                        className={`p-1 rounded hover:bg-amber-50 transition ${
                          speakingId === msg.id ? 'text-amber-600 animate-pulse' : 'text-stone-400'
                        }`}
                        title={speakingId === msg.id ? '음성 멈추기' : '따뜻한 목소리로 듣기'}
                      >
                        {speakingId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 rounded hover:bg-amber-50 text-stone-400 transition"
                        title="메시지 복사"
                      >
                        {copiedId === msg.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {isUser && (
                  <div className="text-[10px] text-amber-200 text-right mt-1">
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-200/70 border border-amber-300 flex items-center justify-center text-xl shrink-0">
              {currentPersona.badge}
            </div>
            <div className="bg-white border border-amber-200/60 rounded-3xl rounded-tl-sm p-4 text-xs text-stone-500 flex items-center gap-2 shadow-sm">
              <span className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span>{currentPersona.name}가 따뜻한 위로를 적고 있어요...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-4 py-2 bg-amber-50/90 border-t border-amber-200/40 overflow-x-auto scrollbar-none flex items-center gap-2">
        <span className="text-[11px] font-semibold text-stone-400 shrink-0 flex items-center gap-1">
          <Sparkles size={12} className="text-amber-500" /> 빠른 질문:
        </span>
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            className="text-xs whitespace-nowrap px-3 py-1.5 bg-white/90 hover:bg-amber-100 hover:text-amber-900 border border-amber-200/60 rounded-full text-stone-600 transition shadow-2xs shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 bg-white/95 border-t border-amber-200/60">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`${currentPersona.name}에게 마음속 솔직한 이야기를 털어놓아 보세요...`}
            className="flex-1 bg-stone-50 border border-amber-200/80 rounded-2xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white transition"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-2xl shadow-md shadow-amber-500/30 transition flex items-center justify-center shrink-0"
            title="전송"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
