import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CloudRain,
  BookOpen,
  Coffee,
  Flame,
  Clock,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { soundManager } from '../utils/soundGenerator';
import { recordFocusMinutesBackend, fetchGlobalStats } from '../utils/api';

const SOUNDS = [
  { id: 'rain', name: '창밖 빗소리', icon: CloudRain, play: () => soundManager.playRain(), desc: '빗소리로 잡음 차단' },
  { id: 'library', name: '조용한 도서관', icon: BookOpen, play: () => soundManager.playLibrary(), desc: '깊은 저음의 핑크 노이즈' },
  { id: 'cafe', name: '새벽 카공 앰비언스', icon: Coffee, play: () => soundManager.playCafe(), desc: '적당한 집중 주파수' },
  { id: 'campfire', name: '따뜻한 모닥불', icon: Flame, play: () => soundManager.playCampfire(), desc: '타닥타닥 편안한 장작' }
];

export default function FocusRoom() {
  // Pomodoro states
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalServerFocusMinutes, setTotalServerFocusMinutes] = useState<number>(28550);

  // Sound states
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    fetchGlobalStats().then(stats => {
      if (stats?.totalFocusMinutes) {
        setTotalServerFocusMinutes(stats.totalFocusMinutes);
      }
    });
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            soundManager.playBellChime();
            if (mode === 'work') {
              setCompletedSessions(c => c + 1);

              // Record 25 minutes focus to backend server!
              recordFocusMinutesBackend(25).then(newTotal => {
                if (newTotal) setTotalServerFocusMinutes(newTotal);
              });

              setMode('break');
              return 5 * 60; // 5 min break
            } else {
              setMode('work');
              return 25 * 60; // 25 min work
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const handleSwitchMode = (newMode: 'work' | 'break') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const handleToggleSound = (soundId: string) => {
    if (activeSound === soundId) {
      soundManager.stop();
      setActiveSound(null);
    } else {
      const sound = SOUNDS.find(s => s.id === soundId);
      if (sound) {
        sound.play();
        setActiveSound(soundId);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundManager.setVolume(val);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-semibold">
          <Clock size={14} className="text-indigo-600" />
          <span>몰입과 충전의 밸런스</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">
          밤샘 열람실 & 포모도로 집중실 🎧
        </h2>
        <p className="text-sm text-stone-600 max-w-lg mx-auto">
          25분 몰입과 5분 꿀맛 휴식! 완료된 집중 시간은 백엔드 서버에 자동 기록되어
          전국 학우들의 총 몰입 시간과 함께 집계됩니다.
        </p>

        {/* Global Total Focus Time Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100/70 border border-indigo-200 rounded-full text-xs text-indigo-900 font-medium">
          <TrendingUp size={13} className="text-indigo-600" />
          <span>전국 대학생 누적 <strong>{Math.floor(totalServerFocusMinutes / 60).toLocaleString()}시간</strong> 몰입 달성 중!</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Timer Card */}
        <div className="md:col-span-6 bg-white/95 border border-indigo-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center space-y-6">
          {/* Mode Tabs */}
          <div className="flex items-center p-1 bg-stone-100 rounded-2xl gap-1">
            <button
              onClick={() => handleSwitchMode('work')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                mode === 'work'
                  ? 'bg-white text-indigo-800 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              📖 집중 몰입 (25분)
            </button>
            <button
              onClick={() => handleSwitchMode('break')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                mode === 'break'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              ☕ 뇌 충전 휴식 (5분)
            </button>
          </div>

          {/* Clock Display */}
          <div className="relative py-4">
            <div
              className={`w-56 h-56 rounded-full border-8 flex flex-col items-center justify-center transition-colors duration-500 ${
                mode === 'work'
                  ? isRunning
                    ? 'border-indigo-500/80 bg-indigo-50/50'
                    : 'border-indigo-200 bg-stone-50'
                  : 'border-emerald-400 bg-emerald-50/40'
              }`}
            >
              <span className="text-5xl sm:text-6xl font-black text-stone-800 font-mono tracking-tight">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs font-medium text-stone-400 mt-2">
                {mode === 'work' ? '지금은 이 페이지에만 집중' : '스트레칭하며 눈 감기'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 w-full justify-center">
            <button
              onClick={handleToggleTimer}
              className={`px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition flex items-center gap-2 ${
                isRunning
                  ? 'bg-stone-800 hover:bg-stone-900 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
              }`}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              <span>{isRunning ? '일시정지' : '집중 시작하기'}</span>
            </button>
            <button
              onClick={handleResetTimer}
              className="p-3.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl transition"
              title="타이머 리셋"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Session Counter */}
          <div className="pt-2 flex items-center gap-2 text-xs text-stone-500">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>오늘 완료한 집중 세션: <strong>{completedSessions}회</strong> ({completedSessions * 25}분 서버 누적!)</span>
          </div>
        </div>

        {/* Ambient Noise Synthesizer */}
        <div className="md:col-span-6 bg-white/95 border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Volume2 size={20} className="text-amber-600" />
                <span>열람실 ASMR 백색소음</span>
              </h3>
              {activeSound && (
                <button
                  onClick={() => handleToggleSound(activeSound)}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-semibold"
                >
                  <VolumeX size={14} /> 소리 끄기
                </button>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              외부 음원 버퍼링 없이 브라우저 내 오디오 엔진으로 부드럽게 합성되는 소음 차단 앰비언스
            </p>
          </div>

          {/* Sound Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {SOUNDS.map(s => {
              const Icon = s.icon;
              const isPlaying = activeSound === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleToggleSound(s.id)}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    isPlaying
                      ? 'bg-amber-100/80 border-amber-400 shadow-md ring-2 ring-amber-400/50 scale-[1.02]'
                      : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={22} className={isPlaying ? 'text-amber-700' : 'text-stone-500'} />
                    {isPlaying && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  <div className="font-bold text-xs text-stone-800">{s.name}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{s.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Volume Control */}
          <div className="space-y-2 pt-2 bg-stone-50 p-4 rounded-2xl border border-stone-200/60">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span className="font-semibold">소음 볼륨 조절</span>
              <span className="font-mono">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Study Advice Box */}
          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-stone-700 space-y-1">
            <span className="font-bold text-amber-800 block">💡 벼락치기 집중 꿀팁</span>
            <p>
              "공부가 안 될 때는 휴대폰을 다른 방에 두거나 가방 깊숙이 넣어보세요. 시작하고 5분만 버티면 뇌의 작업흥분(Task Activation) 효과로 자연스럽게 몰입됩니다."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
