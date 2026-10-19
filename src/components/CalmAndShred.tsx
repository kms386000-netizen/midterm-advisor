import React, { useState, useEffect } from 'react';
import { Wind, Trash2, CheckCircle2, Sparkles, Flame } from 'lucide-react';
import { soundManager } from '../utils/soundGenerator';
import { recordShreddedWorryBackend, fetchGlobalStats } from '../utils/api';

export default function CalmAndShred() {
  // Breathing states
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(4);
  const [breathCount, setBreathCount] = useState(0);

  // Shredder states
  const [worryText, setWorryText] = useState('');
  const [isShredding, setIsShredding] = useState(false);
  const [shredSuccess, setShredSuccess] = useState(false);
  const [localShredCount, setLocalShredCount] = useState(0);
  const [totalServerShreds, setTotalServerShreds] = useState<number>(1420);

  useEffect(() => {
    fetchGlobalStats().then(stats => {
      if (stats?.totalShreddedWorries) {
        setTotalServerShreds(stats.totalShreddedWorries);
      }
    });
  }, []);

  // Breathing timer loop
  useEffect(() => {
    if (!isBreathingActive) return;

    const interval = setInterval(() => {
      setBreathSecondsLeft(prev => {
        if (prev > 1) return prev - 1;

        if (breathPhase === 'inhale') {
          setBreathPhase('hold');
          return 7;
        } else if (breathPhase === 'hold') {
          setBreathPhase('exhale');
          return 8;
        } else {
          setBreathPhase('inhale');
          setBreathCount(c => c + 1);
          soundManager.playBellChime();
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingActive, breathPhase]);

  const toggleBreathing = () => {
    if (!isBreathingActive) {
      setIsBreathingActive(true);
      setBreathPhase('inhale');
      setBreathSecondsLeft(4);
      soundManager.playBellChime();
    } else {
      setIsBreathingActive(false);
    }
  };

  const handleShred = async () => {
    if (!worryText.trim() || isShredding) return;

    setIsShredding(true);

    // Save to backend server!
    recordShreddedWorryBackend().then(newTotal => {
      if (newTotal) setTotalServerShreds(newTotal);
    });

    setTimeout(() => {
      setIsShredding(false);
      setWorryText('');
      setShredSuccess(true);
      setLocalShredCount(c => c + 1);
      setTimeout(() => setShredSuccess(false), 3500);
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-2">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-semibold">
          <Wind size={14} className="text-teal-600" />
          <span>신체 긴장 완화 & 잡념 비우기</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
          마음 이완 쉼터 & 걱정 파쇄기 🧘
        </h2>
        <p className="text-sm text-stone-600 max-w-lg mx-auto">
          가슴이 답답하고 머리가 복잡할 땐 호흡으로 몸을 진정시키고,
          머릿속을 어지럽히는 온갖 스트레스를 종이에 적어 서버 파쇄기로 날려버리세요.
        </p>

        {/* Global Shred Counter Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/70 border border-amber-300 rounded-full text-xs text-amber-900 font-medium">
          <Flame size={13} className="text-amber-600" />
          <span>전국 대학생 누적 <strong>{totalServerShreds.toLocaleString()}개</strong>의 시험 스트레스 소멸됨</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Section 1: 4-7-8 Breathing Guide */}
        <div className="bg-white/95 border border-teal-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              Test Anxiety Relief
            </span>
            <h3 className="text-lg font-bold text-stone-900">
              4-7-8 긴장 해소 호흡법
            </h3>
            <p className="text-xs text-stone-500 max-w-xs">
              심박수를 즉각적으로 낮추고 코르티솔(스트레스 호르몬) 분비를 줄여주는 이완법
            </p>
          </div>

          {/* Visual Breathing Circle */}
          <div className="relative w-56 h-56 flex items-center justify-center">
            <div
              className={`absolute rounded-full transition-all duration-1000 ${
                isBreathingActive
                  ? breathPhase === 'inhale'
                    ? 'w-52 h-52 bg-teal-100/80 border-4 border-teal-300 scale-105'
                    : breathPhase === 'hold'
                    ? 'w-52 h-52 bg-amber-100/80 border-4 border-amber-300 scale-105'
                    : 'w-36 h-36 bg-teal-50 border-4 border-teal-200 scale-95'
                  : 'w-44 h-44 bg-stone-100 border-2 border-dashed border-stone-300'
              }`}
            />

            <div className="relative z-10 flex flex-col items-center justify-center p-4">
              {isBreathingActive ? (
                <>
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
                    {breathPhase === 'inhale'
                      ? '들이쉬기 (숨을 가득 채우세요)'
                      : breathPhase === 'hold'
                      ? '멈추기 (편안히 유지)'
                      : '내쉬기 (후- 길게 뱉어내세요)'}
                  </span>
                  <span className="text-5xl font-extrabold text-stone-800 font-mono">
                    {breathSecondsLeft}
                  </span>
                  <span className="text-[11px] text-teal-700 mt-2 font-medium">
                    {breathCount}회 완료 중
                  </span>
                </>
              ) : (
                <div className="space-y-2">
                  <Wind size={36} className="text-teal-400 mx-auto" />
                  <p className="text-xs text-stone-500 font-medium">
                    버튼을 누르면<br />4-7-8 호흡이 시작됩니다
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Breathing Controls */}
          <div className="space-y-3 w-full">
            <button
              onClick={toggleBreathing}
              className={`w-full py-3 px-6 rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                isBreathingActive
                  ? 'bg-stone-800 hover:bg-stone-900 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/30'
              }`}
            >
              <Wind size={16} />
              <span>{isBreathingActive ? '호흡 멈추기' : '호흡 가이드 시작하기'}</span>
            </button>
            <p className="text-[11px] text-stone-400">
              들숨 4초 → 멈춤 7초 → 날숨 8초로 3회만 반복해도 어깨가 스르르 풀립니다.
            </p>
          </div>
        </div>

        {/* Section 2: Worry Shredder */}
        <div className="bg-white/95 border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Mental Reset Shredder
              </span>
              {localShredCount > 0 && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                  내가 파쇄한 고민 {localShredCount}개
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              시험 불안 종이 파쇄기 🗑️
            </h3>
            <p className="text-xs text-stone-500">
              속상한 마음, 교수님 원망, 자책하는 생각... 무엇이든 적고 갈기갈기 찢어버리세요.
            </p>
          </div>

          {/* Shredder Paper Container */}
          <div className="relative">
            <div
              className={`relative bg-amber-50/60 border-2 border-dashed border-amber-300 rounded-2xl p-4 transition-all duration-500 ${
                isShredding ? 'animate-shred opacity-0' : 'opacity-100'
              }`}
            >
              <textarea
                rows={5}
                placeholder="예: 이번 전공과목 범위 너무 많아서 토나올 것 같아. 시험 망쳐서 장학금 깎이면 어쩌지? 나 진짜 바보인가 봐..."
                value={worryText}
                onChange={e => setWorryText(e.target.value)}
                disabled={isShredding}
                className="w-full bg-transparent text-sm text-stone-800 placeholder-stone-400 focus:outline-none resize-none leading-relaxed"
              />
              <div className="text-[10px] text-stone-400 text-right mt-1">
                적고 파쇄하면 마음의 짐이 가벼워집니다
              </div>
            </div>

            {shredSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 animate-fadeIn">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  <strong>파쇄 완료!</strong> 적었던 모든 불안과 잡념이 허공으로 날아갔습니다. 이제 깨끗한 머리로 다시 시작해요!
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleShred}
            disabled={!worryText.trim() || isShredding}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-bold text-sm rounded-2xl shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            <span>{isShredding ? '위이잉- 갈기갈기 파쇄 중...' : '적은 고민 전부 파쇄해버리기!'}</span>
          </button>
        </div>
      </div>

      {/* Fact Check Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          <span>시험 멘붕 방지용 팩트 체크 (마음 지킴이)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4.5 space-y-2">
            <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <span>💡 Fact 1. 오리 신드롬</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              "동기들은 다 쿨하게 공부 안 한다고 하는데..."
              물 위에서는 여유로워 보여도 물밑에선 다들 발버둥 치고 있습니다. 남들의 겉모습과 내 속마음을 비교하지 마세요.
            </p>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4.5 space-y-2">
            <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <span>💡 Fact 2. 10년 뒤의 나</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              10년 뒤의 당신에게 이번 중간고사 한 과목의 점수는 "아 그때 진짜 힘들었지" 하는 작은 안줏거리가 될 뿐입니다. 삶은 훨씬 더 넓어요.
            </p>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4.5 space-y-2">
            <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <span>💡 Fact 3. 뇌의 재충전</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              15분의 낮잠이나 스트레칭은 시간 낭비가 아니라 '단기기억을 장기기억으로 굳히는 필수 세이브 작업'입니다. 죄책감 없이 쉬어도 괜찮습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
