import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Wand2,
  Shield,
  Heart,
  RefreshCw,
  Share2,
  Award,
  Download,
  BookmarkPlus,
  BookmarkCheck,
  FolderHeart,
  Trash2
} from 'lucide-react';
import {
  fetchSavedCharms,
  saveCharmToBackend,
  deleteCharmFromBackend,
  SavedCharm
} from '../utils/api';

interface Charm {
  id: string;
  name: string;
  badge: string;
  buff: string;
  blessing: string;
  luckyItem: string;
  luckyAction: string;
  themeBg: string;
  borderColor: string;
}

const PRESET_CHARMS: Charm[] = [
  {
    id: 'god-guess',
    name: '찍신 강림(神) 부적',
    badge: '🎯',
    buff: '모르는 문제 찍을 때 직관력 +300% / 정답 회피율 0%',
    blessing: '헷갈리는 두 보기 중 네가 마지막에 고른 그 번호가 무조건 정답이다! 의심하지 말고 직관을 믿어라.',
    luckyItem: '검은색 컴퓨터용 사인펜 & 젤리',
    luckyAction: '시험지 받기 전 책상 세 번 톡! 톡! 톡!',
    themeBg: 'from-amber-400 to-orange-500',
    borderColor: 'border-amber-400'
  },
  {
    id: 'prof-hint',
    name: '교수님 뇌동기화 부적',
    badge: '⚡',
    buff: '어젯밤 훑어본 PPT 슬라이드에서 서술형 99% 출제',
    blessing: '교수님이 "이건 중요하지 않지만..."이라고 흘려 말했던 그 힌트까지 머릿속에 번개처럼 떠오를지어다!',
    luckyItem: '따뜻한 유자차 or 아메리카노',
    luckyAction: '교수님 연구실 방향으로 1초 묵념',
    themeBg: 'from-yellow-400 to-amber-600',
    borderColor: 'border-yellow-400'
  },
  {
    id: 'mental-shield',
    name: '멘탈 금강불괴 방패',
    badge: '🛡️',
    buff: '옆자리 시험지 폭풍 넘기는 소리 무효화 / 멘붕 저항력 MAX',
    blessing: '남들이 펜을 몇 자루 쓰든, 시험지를 몇 번 넘기든 흔들리지 마라. 너는 너의 속도로 완벽하게 풀어낼 것이다.',
    luckyItem: '귀마개 or 좋아하는 포근한 후드티',
    luckyAction: '어깨를 크게 으쓱하고 깊은 한숨 뱉기',
    themeBg: 'from-sky-400 to-blue-600',
    borderColor: 'border-sky-400'
  },
  {
    id: 'miracle-memory',
    name: '벼락치기 기적의 암기 부적',
    badge: '🧠',
    buff: '단기 기억 저장 공간 500% 일시 확장',
    blessing: '도서관에서 눈물 흘리며 집어넣은 그 공식과 개념들, 시험 끝나는 순간까지 머릿속에 찰떡처럼 붙어있으리라!',
    luckyItem: '달콤한 초콜릿 한 조각',
    luckyAction: '관자놀이를 부드럽게 원을 그리며 마사지',
    themeBg: 'from-emerald-400 to-teal-600',
    borderColor: 'border-emerald-400'
  },
  {
    id: 'gpa-defense',
    name: '학점 수호 절대 결계',
    badge: '✨',
    buff: 'C+ 이하 차단 / 상대평가 상위권 안착 버프',
    blessing: '너의 노력은 결코 너를 배신하지 않는다. 교수님의 채점 펜 끝에 자비와 관대함이 깃들지어다!',
    luckyItem: '형광펜 세트',
    luckyAction: '손바닥을 비벼 눈 위에 3초 얹기',
    themeBg: 'from-purple-400 to-indigo-600',
    borderColor: 'border-purple-400'
  },
  {
    id: 'refresh-brain',
    name: '맑은 정신 청량 부적',
    badge: '🌿',
    buff: '밤샘 피로감 -80% / 뇌세포 각성 효과',
    blessing: '멍해지던 눈이 반짝 뜨이고, 머릿속 안개가 걷히듯 명쾌한 논리로 서술형 답안을 채워나갈 것이다.',
    luckyItem: '시원한 물 한 컵 & 민트 사탕',
    luckyAction: '목을 좌우로 천천히 3회 스트레칭',
    themeBg: 'from-teal-400 to-emerald-700',
    borderColor: 'border-teal-400'
  }
];

export default function LuckyCharmView() {
  const [activeCharm, setActiveCharm] = useState<Charm>(PRESET_CHARMS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Saved charms from backend
  const [savedCharms, setSavedCharms] = useState<SavedCharm[]>([]);
  const [showSavedCharms, setShowSavedCharms] = useState(false);

  // Custom Charm Form State
  const [subjectInput, setSubjectInput] = useState('');
  const [anxietyInput, setAnxietyInput] = useState('');

  const loadSavedCharms = async () => {
    const list = await fetchSavedCharms();
    setSavedCharms(list);
  };

  useEffect(() => {
    loadSavedCharms();
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const handleSelectCharm = (charm: Charm) => {
    setActiveCharm(charm);
    setSavedSuccess(false);
    triggerConfetti();
  };

  const handleSaveCurrentCharm = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const saved = await saveCharmToBackend({
      name: activeCharm.name,
      badge: activeCharm.badge,
      buff: activeCharm.buff,
      blessing: activeCharm.blessing,
      luckyItem: activeCharm.luckyItem,
      luckyAction: activeCharm.luckyAction
    });

    if (saved) {
      setSavedCharms(prev => [saved, ...prev]);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
    setIsSaving(false);
  };

  const handleDeleteSavedCharm = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 부적을 보관함에서 삭제할까요?')) {
      const ok = await deleteCharmFromBackend(id);
      if (ok) {
        setSavedCharms(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  const handleSelectSavedCharm = (saved: SavedCharm) => {
    setActiveCharm({
      id: saved.id,
      name: saved.name,
      badge: saved.badge,
      buff: saved.buff,
      blessing: saved.blessing,
      luckyItem: saved.luckyItem,
      luckyAction: saved.luckyAction,
      themeBg: 'from-amber-400 to-orange-500',
      borderColor: 'border-amber-400'
    });
    setShowSavedCharms(false);
    triggerConfetti();
  };

  const handleGenerateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    setIsGenerating(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectInput || '중간고사 전 과목',
          anxiety: anxietyInput || '벼락치기와 불안'
        })
      });

      if (!res.ok) throw new Error('부적 생성 실패');
      const data = await res.json();

      const newCharm: Charm = {
        id: 'custom-' + Date.now(),
        name: data.charmName || '특제 시험 수호 부적',
        badge: data.badge || '🔮',
        buff: data.buff || '모든 시험 불안 소멸 버프',
        blessing: data.blessing || '너의 모든 노력이 눈부신 결실로 이어질 거야!',
        luckyItem: data.luckyItem || '달콤한 디저트',
        luckyAction: data.luckyAction || '거울 보며 활짝 웃기',
        themeBg: 'from-rose-400 to-amber-500',
        borderColor: 'border-rose-400'
      };

      setActiveCharm(newCharm);

      // Auto-save to backend server
      const saved = await saveCharmToBackend({
        name: newCharm.name,
        badge: newCharm.badge,
        buff: newCharm.buff,
        blessing: newCharm.blessing,
        luckyItem: newCharm.luckyItem,
        luckyAction: newCharm.luckyAction
      });

      if (saved) {
        setSavedCharms(prev => [saved, ...prev]);
        setSavedSuccess(true);
      }

      triggerConfetti();
    } catch (err) {
      console.error(err);
      const fallback: Charm = {
        id: 'custom-fallback',
        name: '기적의 중간고사 수호 부적',
        badge: '🌟',
        buff: '어떤 난관도 뚫고 나가는 절대 긍정 에너지',
        blessing: '수많은 밤을 버텨낸 너는 이미 승리자야. 시험장 문을 열고 나서는 순간 후련한 자유가 기다릴 거야!',
        luckyItem: '따뜻한 코코아',
        luckyAction: '스스로 어깨 토닥이기',
        themeBg: 'from-amber-400 to-orange-500',
        borderColor: 'border-amber-400'
      };
      setActiveCharm(fallback);
      triggerConfetti();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Hero Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <Sparkles size={14} className="text-amber-600" />
          <span>서버에 저장되는 영구 귀속 부적</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
          중간고사 수호 부적 & 행운의 예언 🪬
        </h2>
        <p className="text-sm text-stone-600 max-w-lg mx-auto">
          불안한 마음은 접어두고, 나에게 꼭 필요한 시험 수호 부적을 뽑아 가세요.
          발급받은 부적은 백엔드 서버에 저장되어 시험 당일까지 보관할 수 있습니다.
        </p>

        {/* Saved Charms Drawer Toggle */}
        <div className="pt-2">
          <button
            onClick={() => setShowSavedCharms(!showSavedCharms)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-amber-300 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-50 transition"
          >
            <FolderHeart size={15} className="text-amber-600" />
            <span>내 부적 보관함 ({savedCharms.length}개)</span>
          </button>
        </div>
      </div>

      {/* Saved Charms Drawer View */}
      {showSavedCharms && (
        <div className="bg-amber-100/60 border border-amber-300/80 rounded-3xl p-5 shadow-inner space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Shield size={16} className="text-amber-700" />
              <span>서버에 안전하게 보관된 나의 시험 부적</span>
            </h4>
            <span className="text-xs text-stone-500">부적을 누르면 바로 장착됩니다</span>
          </div>

          {savedCharms.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-400 bg-white/60 rounded-2xl">
              아직 보관된 부적이 없습니다. 아래에서 나만의 부적을 만들어 저장해보세요!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {savedCharms.map(charm => (
                <div
                  key={charm.id}
                  onClick={() => handleSelectSavedCharm(charm)}
                  className="p-3.5 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 shadow-2xs cursor-pointer flex justify-between items-start gap-2 hover:bg-amber-50/50 transition"
                >
                  <div className="flex items-start gap-2.5 overflow-hidden">
                    <span className="text-2xl shrink-0">{charm.badge}</span>
                    <div className="overflow-hidden">
                      <div className="font-bold text-xs text-stone-800 truncate">
                        {charm.name}
                      </div>
                      <div className="text-[11px] text-amber-800 font-medium line-clamp-1">
                        {charm.buff}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {new Date(charm.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={e => handleDeleteSavedCharm(charm.id, e)}
                    className="p-1 text-stone-300 hover:text-rose-500 transition"
                    title="부적 삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Display: Featured Charm Card */}
      <div className="flex flex-col items-center">
        <div
          className={`w-full max-w-md bg-linear-to-b ${activeCharm.themeBg} p-1.5 rounded-3xl shadow-2xl shadow-amber-900/20 transform transition-all duration-500 hover:scale-[1.01]`}
        >
          <div className="bg-amber-50/95 rounded-[22px] p-6 sm:p-8 border-2 border-dashed border-amber-300 relative overflow-hidden text-center space-y-5">
            {/* Top Seals */}
            <div className="flex justify-between items-center text-xs font-bold text-red-700/80 px-2">
              <span className="border-2 border-red-600/70 px-2 py-0.5 rounded tracking-widest bg-red-50">
                必勝
              </span>
              <span className="text-stone-400 font-normal">포근이 중간고사 영험부적</span>
              <span className="border-2 border-red-600/70 px-2 py-0.5 rounded tracking-widest bg-red-50">
                大吉
              </span>
            </div>

            {/* Emblem */}
            <div className="pt-2">
              <div className="w-24 h-24 mx-auto bg-linear-to-tr from-amber-200 to-yellow-100 rounded-full flex items-center justify-center text-5xl shadow-inner border border-amber-300 animate-float">
                {activeCharm.badge}
              </div>
            </div>

            {/* Name */}
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-gaegu tracking-wide">
                {activeCharm.name}
              </h3>
              <div className="inline-block mt-2 px-3 py-1 bg-amber-200/80 text-amber-900 text-xs font-bold rounded-full">
                ⚡ {activeCharm.buff}
              </div>
            </div>

            {/* Blessing Box */}
            <div className="p-4 bg-white/80 rounded-2xl border border-amber-200 text-stone-800 text-sm leading-relaxed font-medium shadow-2xs">
              "{activeCharm.blessing}"
            </div>

            {/* Lucky Details */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-amber-100/50 p-3 rounded-xl border border-amber-200/60">
              <div>
                <span className="text-amber-800 font-semibold block mb-0.5">🍀 오늘의 행운템</span>
                <span className="text-stone-700">{activeCharm.luckyItem}</span>
              </div>
              <div>
                <span className="text-amber-800 font-semibold block mb-0.5">✨ 행운의 리추얼</span>
                <span className="text-stone-700">{activeCharm.luckyAction}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={triggerConfetti}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-500/30 transition flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>부적 기운 충전하기!</span>
              </button>

              <button
                onClick={handleSaveCurrentCharm}
                disabled={isSaving}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <BookmarkCheck size={14} className="text-emerald-400" />
                    <span>서버 저장 완료!</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus size={14} />
                    <span>{isSaving ? '저장 중...' : '부적함에 영구 저장'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Charms Grid */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
          <Award size={18} className="text-amber-600" />
          <span>인기 대학생 수호 부적 컬렉션 (클릭해서 교체)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRESET_CHARMS.map(charm => {
            const isCurrent = activeCharm.name === charm.name;
            return (
              <button
                key={charm.id}
                onClick={() => handleSelectCharm(charm)}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  isCurrent
                    ? 'bg-amber-100 border-amber-400 shadow-md ring-2 ring-amber-400/50'
                    : 'bg-white hover:bg-amber-50/50 border-amber-200/70 hover:border-amber-300'
                }`}
              >
                <div className="text-3xl mb-2">{charm.badge}</div>
                <div className="font-bold text-sm text-stone-800 truncate">{charm.name}</div>
                <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{charm.buff}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Custom Charm Generator */}
      <div className="bg-linear-to-r from-amber-100/70 via-orange-100/60 to-rose-100/70 border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md">
            <Wand2 size={20} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-stone-900">
              내 과목 맞춤형 AI 영험 부적 조제소
            </h4>
            <p className="text-xs text-stone-600">
              이번 학기 가장 큰 걱정거리나 시험 과목을 적어주시면, Gemini가 부적을 만들고 백엔드 서버에 영구 보관해드립니다!
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerateCustom} className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                시험 과목명
              </label>
              <input
                type="text"
                placeholder="예: 공학수학, 재무회계, 약리학, 서양철학"
                value={subjectInput}
                onChange={e => setSubjectInput(e.target.value)}
                className="w-full bg-white px-4 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                가장 큰 고민 / 불안
              </label>
              <input
                type="text"
                placeholder="예: 벼락치기인데 암기가 안 돼요, 교수님 서술형 기준이 까다로워요"
                value={anxietyInput}
                onChange={e => setAnxietyInput(e.target.value)}
                className="w-full bg-white px-4 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="animate-spin text-amber-400" />
                <span>영험한 부적을 만들고 서버에 저장하는 중...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-amber-400" />
                <span>나만의 맞춤 부적 만들고 서버에 저장</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
