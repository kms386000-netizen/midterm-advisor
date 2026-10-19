import React, { useState, useEffect } from 'react';
import {
  Mail,
  Sparkles,
  Heart,
  Copy,
  Check,
  Volume2,
  VolumeX,
  BookmarkCheck,
  Trash2,
  FolderHeart,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  fetchSavedLetters,
  saveLetterToBackend,
  deleteLetterFromBackend,
  SavedLetter
} from '../utils/api';

interface LetterData {
  id?: string;
  title: string;
  letter: string;
  quote: string;
  signature: string;
  timestamp: string;
}

export default function LetterView() {
  const [formData, setFormData] = useState({
    name: '',
    major: '',
    subject: '',
    currentFeelings: '',
    style: 'warm' as 'warm' | 'mentor' | 'cute'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Saved letters from backend
  const [savedLetters, setSavedLetters] = useState<SavedLetter[]>([]);
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);

  const [currentLetter, setCurrentLetter] = useState<LetterData | null>(() => {
    return {
      title: "너의 밤샘은 결코 헛되지 않아",
      letter: `어두운 열람실 창가에서, 혹은 책상 위 작은 스탠드 불빛 아래서 고개 숙여 책장을 넘기던 너의 모습을 떠올려.\n\n남들은 다 쉽게 해내는 것 같은데 나만 제자리걸음인 것 같아 외로웠지? 하지만 너는 오늘 하루도 포기하지 않고 그 무거운 펜을 쥐고 있었잖아. 그것만으로도 너는 이미 너무 대단한 사람이야.\n\n중간고사 점수 몇 점이 너라는 사람의 눈부신 가치를 결코 정의할 수 없어. 지금의 긴장과 두려움은 네가 그만큼 네 삶에 진심이라는 가장 아름다운 증거니까. 시험장 문을 나설 때, 스스로의 어깨를 꼭 토닥여줘. "진짜 고생 많았다"고.`,
      quote: "바람이 불지 않을 때 바람개비를 돌리는 방법은, 내가 앞으로 달려가는 것뿐이야. 너는 이미 달리고 있어.",
      signature: "도서관 한구석에서 너를 온 마음으로 응원하는 선배 포근이가",
      timestamp: new Date().toLocaleDateString('ko-KR')
    };
  });

  const loadSavedLetters = async () => {
    const list = await fetchSavedLetters();
    setSavedLetters(list);
  };

  useEffect(() => {
    loadSavedLetters();
  }, []);

  const handleGenerateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/encourage-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('편지 작성에 실패했습니다.');
      const data = await res.json();

      const newLetter: LetterData = {
        title: data.title || `${formData.name || '친구'}야, 이번 시험도 넌 빛나고 있어`,
        letter: data.letter || '너의 모든 노력과 숨결이 헛되지 않음을 내가 기억할게.',
        quote: data.quote || '네가 걸어온 길은 결코 사라지지 않아.',
        signature: data.signature || '너의 곁에서 항상 응원하는 포근이가',
        timestamp: new Date().toLocaleDateString('ko-KR')
      };

      setCurrentLetter(newLetter);

      // Automatically save to backend server database
      const saved = await saveLetterToBackend({
        title: newLetter.title,
        letter: newLetter.letter,
        quote: newLetter.quote,
        signature: newLetter.signature
      });

      if (saved) {
        setSavedLetters(prev => [saved, ...prev]);
        setSavedSuccess(true);
      }

      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.55 }
        });
      } catch {
        // ignore
      }
    } catch (err) {
      console.error(err);
      setCurrentLetter({
        title: `${formData.name || '소중한 친구'}야, 힘든 시험 기간 잘 버텨내줘서 고마워`,
        letter: `오늘 하루도 무거운 책가방과 벅찬 시험 범위 속에서 고군분투하느라 정말 고생 많았어.\n\n결과가 어떻게 나오든 이번 시험이 네 인생의 전부가 아니야. 숨을 크게 고르고, 밥 든든하게 챙겨 먹고, 스스로를 먼저 아껴주자. 넌 언제나 응원받아 마땅한 사람이야.`,
        quote: "가장 어두운 밤도 결국 지나가고 새벽은 오니까.",
        signature: "언제나 너를 믿는 포근이 선배가",
        timestamp: new Date().toLocaleDateString('ko-KR')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!currentLetter || isSaving) return;
    setIsSaving(true);
    const saved = await saveLetterToBackend({
      title: currentLetter.title,
      letter: currentLetter.letter,
      quote: currentLetter.quote,
      signature: currentLetter.signature
    });
    if (saved) {
      setSavedLetters(prev => [saved, ...prev.filter(l => l.id !== saved.id)]);
      setSavedSuccess(true);
    }
    setIsSaving(false);
  };

  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 편지를 보관함에서 삭제하시겠습니까?')) {
      const ok = await deleteLetterFromBackend(id);
      if (ok) {
        setSavedLetters(prev => prev.filter(l => l.id !== id));
      }
    }
  };

  const handleSelectSavedLetter = (saved: SavedLetter) => {
    setCurrentLetter({
      id: saved.id,
      title: saved.title,
      letter: saved.letter,
      quote: saved.quote,
      signature: saved.signature,
      timestamp: new Date(saved.createdAt).toLocaleDateString('ko-KR')
    });
    setShowSavedDrawer(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopy = () => {
    if (!currentLetter) return;
    const fullText = `[${currentLetter.title}]\n\n${currentLetter.letter}\n\n"${currentLetter.quote}"\n\n- ${currentLetter.signature}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!window.speechSynthesis || !currentLetter) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${currentLetter.title}. ${currentLetter.letter}. ${currentLetter.quote}. ${currentLetter.signature}`
    );
    utterance.lang = 'ko-KR';
    utterance.rate = 0.92;
    utterance.pitch = 1.02;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-semibold">
          <Heart size={14} className="text-rose-600 fill-rose-500" />
          <span>백엔드 영구 보관 편지함</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
          밤샘 열람실에서 온 따뜻한 손편지 💌
        </h2>
        <p className="text-sm text-stone-600 max-w-lg mx-auto">
          시험 공부하느라 누구에게도 털어놓지 못했던 막막함과 고단함을 적어보세요.
          생성된 편지는 백엔드 서버에 자동 보관되어 언제든 다시 꺼내볼 수 있습니다.
        </p>

        {/* Saved letters button */}
        <div className="pt-2">
          <button
            onClick={() => setShowSavedDrawer(!showSavedDrawer)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-amber-300 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-50 transition"
          >
            <FolderHeart size={15} className="text-rose-500" />
            <span>나의 보관된 편지함 ({savedLetters.length}통)</span>
          </button>
        </div>
      </div>

      {/* Saved Letters Drawer */}
      {showSavedDrawer && (
        <div className="bg-amber-100/60 border border-amber-300/80 rounded-3xl p-5 shadow-inner space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <BookOpen size={16} className="text-amber-700" />
              <span>서버에 영구 보관된 내 위로 편지들</span>
            </h4>
            <span className="text-xs text-stone-500">클릭하면 바로 읽을 수 있습니다</span>
          </div>

          {savedLetters.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-400 bg-white/60 rounded-2xl">
              아직 보관된 편지가 없습니다. 새로운 편지를 작성해보세요!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {savedLetters.map(letter => (
                <div
                  key={letter.id}
                  onClick={() => handleSelectSavedLetter(letter)}
                  className="p-3.5 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 shadow-2xs cursor-pointer flex justify-between items-start gap-2 hover:bg-amber-50/50 transition"
                >
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-stone-800 truncate">
                      {letter.title}
                    </div>
                    <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {letter.letter}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1">
                      {new Date(letter.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <button
                    onClick={e => handleDeleteSaved(letter.id, e)}
                    className="p-1 text-stone-300 hover:text-rose-500 transition"
                    title="편지 삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-5 bg-white/90 border border-amber-200/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 font-bold text-stone-800 text-base border-b border-amber-100 pb-3">
            <Mail size={18} className="text-amber-600" />
            <span>나만의 위로 편지 신청서</span>
          </div>

          <form onSubmit={handleGenerateLetter} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                불리고 싶은 이름 / 닉네임
              </label>
              <input
                type="text"
                placeholder="예: 민지, 도서관 좀비, A+꿈나무"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-stone-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  내 전공 / 계열
                </label>
                <input
                  type="text"
                  placeholder="예: 전자공학, 경영학"
                  value={formData.major}
                  onChange={e => setFormData({ ...formData, major: e.target.value })}
                  className="w-full bg-stone-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  가장 벅찬 시험 과목
                </label>
                <input
                  type="text"
                  placeholder="예: 회로이론, 생화학"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-stone-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                지금 내 솔직한 심정 (선택)
              </label>
              <textarea
                rows={3}
                placeholder="예: 3일 내내 밤샜는데 진도가 안 끝나서 눈물나요. 나만 뒤처진 기분이에요..."
                value={formData.currentFeelings}
                onChange={e => setFormData({ ...formData, currentFeelings: e.target.value })}
                className="w-full bg-stone-50 border border-amber-200 rounded-xl p-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                편지 어조 스타일
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { key: 'warm', label: '눈물 왈칵 다정' },
                  { key: 'mentor', label: '든든한 용기' },
                  { key: 'cute', label: '귀여운 힐링' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, style: opt.key as any })}
                    className={`py-2 px-2 rounded-xl text-center font-medium border transition ${
                      formData.style === opt.key
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-amber-500/30 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Sparkles size={16} className="animate-spin text-amber-200" />
                  <span>진심을 담아 편지지에 적는 중...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>위로 편지 받고 서버에 저장</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Letter Preview Column */}
        <div className="lg:col-span-7">
          {currentLetter ? (
            <div className="relative bg-[#fffdf9] border-2 border-amber-200/90 rounded-3xl p-6 sm:p-9 shadow-xl shadow-amber-900/5 space-y-6">
              {/* Paper Tape Deco */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-amber-200/50 backdrop-blur-xs rounded-sm rotate-1 shadow-2xs border border-amber-300/40" />

              {/* Letter Header */}
              <div className="border-b-2 border-dashed border-amber-200/80 pb-4 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-amber-700 tracking-wider uppercase">
                      A Letter For You
                    </span>
                    {savedSuccess && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        ✓ 서버 보관 완료
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1 font-gaegu">
                    {currentLetter.title}
                  </h3>
                </div>
                <span className="text-xs text-stone-400 shrink-0 mt-1 font-mono">
                  {currentLetter.timestamp}
                </span>
              </div>

              {/* Letter Body */}
              <div className="text-stone-700 text-sm sm:text-base leading-relaxed sm:leading-loose whitespace-pre-wrap font-sans font-normal">
                {currentLetter.letter}
              </div>

              {/* Quote Highlight Box */}
              <div className="p-4 bg-amber-100/40 rounded-2xl border-l-4 border-amber-400 text-xs sm:text-sm text-stone-700 italic">
                "{currentLetter.quote}"
              </div>

              {/* Signature */}
              <div className="pt-2 text-right">
                <span className="text-sm font-handwriting text-stone-800 text-xl font-bold tracking-wide">
                  {currentLetter.signature}
                </span>
              </div>

              {/* Bottom Utility Tools */}
              <div className="pt-4 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSpeak}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
                      isSpeaking
                        ? 'bg-amber-500 text-white border-amber-500 animate-pulse'
                        : 'bg-white hover:bg-amber-50 text-stone-600 border-amber-200'
                    }`}
                  >
                    {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{isSpeaking ? '낭독 멈추기' : '편지 귀로 듣기'}</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-stone-600 border border-amber-200 transition"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copied ? '복사 완료!' : '편지 복사'}</span>
                  </button>

                  <button
                    onClick={handleManualSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-medium transition"
                  >
                    <FolderHeart size={14} className="text-rose-500" />
                    <span>{isSaving ? '저장 중...' : '서버에 다시 저장'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 text-stone-400 text-[11px]">
                  <BookmarkCheck size={14} className="text-amber-500" />
                  <span>힘들 때마다 다시 꺼내 읽어보세요</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 border-2 border-dashed border-amber-300/80 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-stone-400 bg-white/40">
              <Mail size={40} className="text-amber-300 mb-3" />
              <p className="font-semibold text-stone-600">아직 도착한 편지가 없습니다.</p>
              <p className="text-xs mt-1">왼쪽 양식을 입력하고 '위로 편지 받아보기'를 눌러주세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
