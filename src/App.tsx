import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Shield,
  Mail,
  Wind,
  Clock,
  MessageSquareHeart,
  Calendar,
  AlertCircle,
  X,
  Heart,
  Sparkles,
  Database
} from 'lucide-react';
import CounselingChat from './components/CounselingChat';
import LuckyCharmView from './components/LuckyCharmView';
import LetterView from './components/LetterView';
import CalmAndShred from './components/CalmAndShred';
import FocusRoom from './components/FocusRoom';
import CheeringWall from './components/CheeringWall';
import { fetchGlobalStats, GlobalStats } from './utils/api';

type TabType = 'chat' | 'charm' | 'letter' | 'calm' | 'focus' | 'cheer';

const COMFORTING_QUOTES = [
  "🌸 너의 가치는 성적표 한 장으로 결코 결정되지 않아.",
  "☕ 오늘 밤샘을 버텨낸 너의 시간은 분명 미래의 든든한 밑거름이 될 거야.",
  "✨ 완벽하려 애쓰지 마. 지금 버티고 있는 것만으로도 넌 충분히 대단해.",
  "💧 물 한 모금 마시고, 목과 어깨를 살짝 펴줘. 넌 소중하니까.",
  "🕊️ 가장 짙은 어둠도 결국 아침 햇살에 물러나듯, 시험은 반드시 끝난다."
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [dDayDays, setDDayDays] = useState<number>(() => {
    const saved = localStorage.getItem('pogeun_dday');
    return saved ? parseInt(saved, 10) : 3;
  });
  const [isEditingDDay, setIsEditingDDay] = useState(false);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);

  // Fetch backend statistics
  useEffect(() => {
    fetchGlobalStats().then(stats => {
      if (stats) setGlobalStats(stats);
    });
  }, [activeTab]);

  // Rotate comforting quotes
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % COMFORTING_QUOTES.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateDDay = (val: number) => {
    setDDayDays(val);
    localStorage.setItem('pogeun_dday', val.toString());
  };

  const TABS = [
    { id: 'chat', label: '1:1 마음 상담실', icon: MessageCircle, badge: 'AI 멘토' },
    { id: 'charm', label: '시험 수호 부적', icon: Shield, badge: '행운' },
    { id: 'letter', label: '위로의 손편지', icon: Mail, badge: '맞춤' },
    { id: 'calm', label: '호흡 & 걱정 파쇄', icon: Wind, badge: '이완' },
    { id: 'focus', label: '포모도로 & ASMR', icon: Clock, badge: '몰입' },
    { id: 'cheer', label: '전국 응원벽', icon: MessageSquareHeart, badge: '연대' }
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-[#fbf8f2] via-[#faf4ea] to-[#f7eedc] text-stone-800 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Top Floating Quote Banner */}
      <div className="bg-amber-100/70 border-b border-amber-200/60 py-1.5 px-4 text-center text-xs text-amber-900 font-medium overflow-hidden">
        <div className="transition-all duration-700 ease-in-out">
          {COMFORTING_QUOTES[quoteIndex]}
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-amber-200/60 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-md shadow-amber-500/20">
              🧸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl text-stone-900 tracking-tight">
                  포근이 마음 쉼터
                </h1>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                  중간고사 특화
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium border border-emerald-200">
                  <Database size={10} />
                  <span>서버 DB 활성</span>
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                지치고 불안한 대학생을 위한 다정한 위로와 백엔드 실시간 연대
              </p>
            </div>
          </div>

          {/* Right Status Badges & Controls */}
          <div className="flex items-center gap-2.5">
            {/* Live Study Counter */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>전국 <strong>4,829명</strong> 함께 버티는 중</span>
            </div>

            {/* D-Day Counter Pill */}
            <div className="relative">
              {isEditingDDay ? (
                <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-full px-2 py-1 shadow-xs">
                  <span className="text-xs text-stone-500 pl-1">D-</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={dDayDays}
                    onChange={e => handleUpdateDDay(parseInt(e.target.value) || 0)}
                    onBlur={() => setIsEditingDDay(false)}
                    autoFocus
                    className="w-10 text-xs font-bold text-amber-800 focus:outline-none"
                  />
                  <button
                    onClick={() => setIsEditingDDay(false)}
                    className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold"
                  >
                    확인
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingDDay(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100/80 hover:bg-amber-200 border border-amber-300 text-xs font-bold text-amber-900 transition shadow-2xs"
                  title="클릭하여 내 시험 D-Day 변경"
                >
                  <Calendar size={13} className="text-amber-700" />
                  <span>중간고사 D-{dDayDays}</span>
                </button>
              )}
            </div>

            {/* Mental Emergency Button */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 transition"
              title="지금 당장 숨이 가쁘거나 불안할 때 누르세요"
            >
              <AlertCircle size={13} className="text-rose-500" />
              <span className="hidden sm:inline">긴급 멘탈 응급실</span>
              <span className="sm:hidden">응급실</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-1 sm:gap-2 py-1.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-amber-100/50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'chat' && <CounselingChat />}
        {activeTab === 'charm' && <LuckyCharmView />}
        {activeTab === 'letter' && <LetterView />}
        {activeTab === 'calm' && <CalmAndShred />}
        {activeTab === 'focus' && <FocusRoom />}
        {activeTab === 'cheer' && <CheeringWall />}
      </main>

      {/* Mental Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-200 space-y-5 relative">
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl shrink-0">
                🚨
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  시험 공황 & 긴급 안심 가이드
                </h3>
                <p className="text-xs text-stone-500">
                  가슴이 심하게 뛰거나 눈물이 멈추지 않을 때 지금 당장 따라하세요
                </p>
              </div>
            </div>

            {/* Quick 3-Step First Aid */}
            <div className="space-y-3 bg-rose-50/60 p-4 rounded-2xl border border-rose-100 text-xs sm:text-sm text-stone-700">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-rose-900">손에 쥔 펜과 스마트폰을 내려놓으세요.</strong>
                  <p className="text-xs text-stone-600 mt-0.5">
                    공부 10분 쉰다고 시험 안 망합니다. 당신의 몸과 마음이 먼저입니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-rose-900">5-4-3-2-1 그라운딩 (감각 깨우기):</strong>
                  <p className="text-xs text-stone-600 mt-0.5">
                    눈에 보이는 3가지 물건을 마음속으로 부르고, 손바닥으로 책상의 차가운 감촉을 느껴보세요. 패닉 상태의 뇌가 현재로 돌아옵니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-rose-900">입으로 길게 후- 내쉬기:</strong>
                  <p className="text-xs text-stone-600 mt-0.5">
                    촛불을 끄듯 입술을 둥글게 모아 8초 동안 숨을 길게 뿜어내세요.
                  </p>
                </div>
              </div>
            </div>

            {/* Crisis Support Hotlines */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs text-stone-600 space-y-1">
              <span className="font-semibold text-stone-800 block">
                📞 언제든 기댈 수 있는 24시간 전문 무료 상담:
              </span>
              <p>• 정신건강 위기상담전화: <strong>1577-0199</strong> (24시간)</p>
              <p>• 청년 및 청소년 상담전화: <strong>1388</strong></p>
              <p>• 자살예방 상담전화: <strong>109</strong></p>
            </div>

            <button
              onClick={() => {
                setShowEmergencyModal(false);
                setActiveTab('calm');
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              호흡 가이드 탭으로 이동해서 몸 풀기
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-amber-200/60 bg-white/70 py-6 px-4 text-center text-xs text-stone-500 space-y-1.5">
        <p className="font-medium text-stone-700">
          포근이(Pogeun) - 중간고사를 앞둔 전국의 모든 대학생을 온 마음으로 응원합니다.
        </p>
        <p className="text-stone-400 text-[11px]">
          "결과가 어떠하든, 스스로와 마주하며 최선을 다한 당신의 모든 밤은 이미 충분히 아름답습니다."
        </p>
      </footer>
    </div>
  );
}
