import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbManager, CheeringPost, SavedLetter, SavedCharm, ChatSession } from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Persona prompts for midterm exam counseling
const PERSONA_PROMPTS: Record<string, string> = {
  pogeun: `당신은 '포근이'라는 이름의 다정하고 따뜻한 대학교 선배/룸메이트입니다.
대상은 중간고사를 앞두고 큰 스트레스, 불안감, 자책감, 피로감에 시달리고 있는 한국 대학생입니다.
[성격 및 말투]
- 20대 대학생 특유의 자연스럽고 다정한 반존대 또는 친근한 반말("~했어?", "~하자", "~란다", "~토닥토닥")을 사용하여 진심 어린 온기를 줍니다.
- 상대방의 마음을 전적으로 공감하고 수용해줍니다. "진짜 힘들었지", "잠도 못 자고 얼마나 애썼어", "커피나 달달한 음료수 사주고 싶다" 같은 따뜻한 위로를 건넵니다.
- 벼락치기, 도서관 밤샘, 핫식스/몬스터, 족보, 교수님 PPT, 학점, 과제 등에 대한 대학생 현실을 깊이 이해하고 있습니다.
- 성적이 인생의 전부가 아니며, 지금까지 버티고 노력한 것만으로도 너무나 소중하고 빛나는 사람임을 상기시켜 줍니다.
- 답변은 부담스럽게 길지 않게 2~4문단 정도로 가독성 있게 작성하고, 따뜻한 이모지를 곁들입니다.`,

  owl: `당신은 '올빼미 멘토'라는 이름의 현실적이고 든든한 시험 전략 요정입니다.
대상은 시험 직전 시간이 촉박하거나, 공부 분량에 압도되어 멘붕(공황)에 빠진 대학생입니다.
[성격 및 말투]
- 똑똑하지만 차분하고 다정하게 용기를 북돋워주는 선배 멘토 말투("자, 심호흡 한번 하고!", "지금 포기하기엔 너무 일러요", "제가 딱 3가지만 정리해 줄게요").
- 막막한 상황을 당장 실행 가능한 초소형 스텝(Micro-step)으로 분해해줍니다 (예: 목차 읽기 5분, 기출/교재 굵은 글씨 훑기, 빈출 3개 개념 마스터).
- "완벽하게 다 보려 하지 말고, 버릴 건 과감히 버리고 나오는 것부터 챙기는 게 벼락치기의 미학"이라는 현실적인 구원책을 줍니다.
- 용기를 불어넣으며 멘탈을 꽉 잡아줍니다.`,

  ondo: `당신은 '온도쌤'이라는 이름의 차분하고 온화한 대학생 마음건강 전문 상담사입니다.
대상은 시험 불안(Test Anxiety), 실패에 대한 극심한 공포, 완벽주의적 자책감에 짓눌린 대학생입니다.
[성격 및 말투]
- 정중하고 부드러운 경어체("~하셨군요", "~마음이 드는 것은 지극히 자연스러운 과정입니다")를 사용합니다.
- 심리학적 기반의 인지적 재구조화(Reframing)와 신체 이완(호흡, 근육 이완)을 부드럽게 안내합니다.
- 시험 결과와 개인의 가치를 분리해주고, '지금 이 순간 할 수 있는 최선'에 초점을 맞추도록 돕습니다.
- 깊은 안정감과 평온을 선사합니다.`,

  cat: `당신은 '치즈'라는 이름의 깜찍하고 사랑스러운 대학 캠퍼스 마스코트 고양이입니다.
대상은 지친 대학생 집사입니다.
[성격 및 말투]
- 끝에 "~냥", "~다옹", "골골골~", "냥발 젤리로 꾹꾹이 해준다냥!" 같은 귀여운 고양이 말투를 씁니다.
- 책상 앞에 앉아 있는 것만으로도 대단하다고 폭풍 칭찬을 퍼붓습니다.
- 스트레칭하기, 물 한 모금 마시기, 간식 챙겨먹기 등을 잔소리 대신 애교로 챙겨줍니다.
- 웃음과 귀여움으로 학생의 굳은 얼굴을 풀어줍니다.`
};

// Chat endpoint supporting multi-turn conversation
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, persona = 'pogeun', studentContext } = req.body;

    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API key is not configured on the server. Please check your environment settings.'
      });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const personaPrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.pogeun;

    let contextInfo = '';
    if (studentContext) {
      const { major, subject, worry } = studentContext;
      if (major || subject || worry) {
        contextInfo = `\n[학생 현재 상황 정보]\n- 전공/학과: ${major || '미입력'}\n- 이번 시험 과목: ${subject || '미입력'}\n- 가장 큰 고민: ${worry || '미입력'}\n이 상황을 헤아려 대답에 자연스럽게 녹여주세요.`;
      }
    }

    const systemInstruction = `${personaPrompt}${contextInfo}
[추가 지침]
- Markdown 형식을 사용하여 중요한 부분은 **강조**나 따뜻한 인용구(> )로 보기 편하게 전달하세요.
- 비난이나 지적은 절대 금지하며, 학생의 자존감을 지켜주고 마음의 짐을 덜어주세요.`;

    // Convert client message history into Gemini content format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    const replyText = response.text || '마음이 조금은 편안해지길 바라요. 언제든 또 이야기해줘요.';
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      error: error?.message || '대화를 생성하는 도중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
});

// Personalized Encouragement Letter endpoint
app.post('/api/encourage-letter', async (req, res) => {
  try {
    const { name, major, subject, currentFeelings, style = 'warm' } = req.body;

    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API key is not configured.'
      });
    }

    const prompt = `중간고사를 치르고 있는 대학생 '${name || '소중한 친구'}'에게 보내는 감동적이고 가슴 뭉클한 응원 편지를 써주세요.
- 전공: ${major || '대학 생활'}
- 시험 과목: ${subject || '중간고사 과목들'}
- 학생의 현재 심정: ${currentFeelings || '불안하고 지쳐있음'}
- 편지 분위기: ${style === 'mentor' ? '든든하고 현실적인 격려' : style === 'cute' ? '다정하고 귀여운 힐링' : '눈물 나게 따뜻하고 위로가 되는 선배의 편지'}

[작성 조건]
1. 제목은 감성적이고 힘이 되는 한 줄(예: "밤을 지새우는 너의 모든 순간이 헛되지 않음을")
2. 편지 본문(약 400~600자)은 진심 어린 어조로, 얼마나 수고하고 있는지 알아주고 시험 한 번으로 네 인생이 결정되지 않는다는 깊은 위로를 전할 것
3. 편지 끝맺음(추신 포함)과 따뜻한 서명
4. JSON 형식으로 반환:
{
  "title": "편지 제목",
  "letter": "편지 본문 내용",
  "quote": "마음에 새길 짧은 응원 한 문장",
  "signature": "보내는 사람 (예: 언제나 너를 믿는 포근이 선배가)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let data;
    try {
      data = JSON.parse(response.text || '{}');
    } catch {
      data = {
        title: `${name || '친구'}야, 이번 시험도 넌 최선을 다하고 있어`,
        letter: `도서관의 차가운 공기 속에서 책장을 넘기던 너의 손길과 눈빛을 기억해. 결과가 어떻든 너는 이미 최선을 다해 버텨냈어. 이번 중간고사가 너의 전부를 증명하는 게 아니야. 숨 한번 크게 쉬고, 네 속도대로 걸어가도 괜찮아.`,
        quote: "꽃마다 피어나는 계절이 다르듯, 너만의 찬란한 계절이 올 거야.",
        signature: "너를 온 마음으로 응원하는 포근이가"
      };
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/encourage-letter:', error);
    res.status(500).json({ error: error?.message || '편지 생성에 실패했습니다.' });
  }
});

// Lucky Exam Charm / Fortune endpoint
app.post('/api/fortune', async (req, res) => {
  try {
    const { subject, anxiety } = req.body;

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API is not configured.' });
    }

    const prompt = `중간고사 시험을 앞둔 대학생을 위한 '오늘의 시험 수호 부적 & 행운의 예언'을 1개 만들어주세요.
시험 과목: ${subject || '중간고사 전 과목'}
고민/불안: ${anxiety || '벼락치기 걱정'}

JSON 포맷으로 반환:
{
  "charmName": "부적 이름 (예: 교수님 출제 의도 꿰뚫기 부적, 멘탈 무쇠 방패 부적 등)",
  "badge": "부적 상징 이모지 1개",
  "buff": "특수 버프 효과 1줄 (예: 찍은 번호 정답률 +80%, 시험지 백지 공포 저항력 MAX)",
  "blessing": "따뜻하고 힘이 나는 시험 축복의 말 2~3줄",
  "luckyItem": "오늘의 행운 아이템 (예: 민트 사탕, 푹신한 양말, 초콜릿 우유 등)",
  "luckyAction": "시험 전 행운을 부르는 작은 행동 1가지 (예: 어깨 3번 털기, 거울 보고 씨익 웃기)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let data;
    try {
      data = JSON.parse(response.text || '{}');
    } catch {
      data = {
        charmName: "벼락치기 기적의 암기 부적",
        badge: "✨",
        buff: "방금 훑어본 요약노트 시험 출제 확률 99%",
        blessing: "마지막까지 포기하지 않은 너의 끈기가 정답을 콕콕 짚어낼 거야!",
        luckyItem: "달콤한 초콜릿 한 조각",
        luckyAction: "들숨 날숨 3번 깊게 들이쉬기"
      };
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/fortune:', error);
    res.status(500).json({ error: error?.message || '부적 생성에 실패했습니다.' });
  }
});

// --- DATA STORAGE & PERSISTENCE ENDPOINTS ---

// 1. Cheering Posts
app.get('/api/cheer', async (_req, res) => {
  try {
    const db = await dbManager.getDb();
    const sorted = [...db.cheeringPosts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ posts: sorted });
  } catch (err: any) {
    res.status(500).json({ error: '응원글을 불러오지 못했습니다.' });
  }
});

app.post('/api/cheer', async (req, res) => {
  try {
    const { author, major, badge, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: '응원 메시지를 입력해주세요.' });
    }

    const newPost: CheeringPost = {
      id: 'post-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      author: (author || '익명의 밤샘러').trim(),
      major: (major || '대학생').trim(),
      badge: badge || '🔥',
      message: message.trim(),
      likes: 1,
      createdAt: new Date().toISOString()
    };

    await dbManager.saveDb(db => {
      db.cheeringPosts.unshift(newPost);
      db.stats.totalCheeringSent = (db.stats.totalCheeringSent || 0) + 1;
    });

    res.json({ success: true, post: newPost });
  } catch (err: any) {
    res.status(500).json({ error: '응원글 저장에 실패했습니다.' });
  }
});

app.post('/api/cheer/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    let updatedLikes = 0;

    await dbManager.saveDb(db => {
      const target = db.cheeringPosts.find(p => p.id === id);
      if (target) {
        target.likes = (target.likes || 0) + 1;
        updatedLikes = target.likes;
      }
    });

    res.json({ success: true, likes: updatedLikes });
  } catch (err: any) {
    res.status(500).json({ error: '하트 반영에 실패했습니다.' });
  }
});

// 2. Saved Letters
app.get('/api/letters', async (req, res) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
    const db = await dbManager.getDb();
    const letters = userId
      ? db.savedLetters.filter(l => l.userId === userId)
      : db.savedLetters;
    res.json({
      letters: letters.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (err: any) {
    res.status(500).json({ error: '편지 목록을 불러오지 못했습니다.' });
  }
});

app.post('/api/letters', async (req, res) => {
  try {
    const { userId, title, letter, quote, signature } = req.body;
    if (!title || !letter) {
      return res.status(400).json({ error: '편지 내용이 올바르지 않습니다.' });
    }

    const saved: SavedLetter = {
      id: 'letter-' + Date.now(),
      userId: userId || 'anonymous',
      title,
      letter,
      quote: quote || '',
      signature: signature || '',
      createdAt: new Date().toISOString()
    };

    await dbManager.saveDb(db => {
      db.savedLetters.unshift(saved);
    });

    res.json({ success: true, letter: saved });
  } catch (err: any) {
    res.status(500).json({ error: '편지 저장에 실패했습니다.' });
  }
});

app.delete('/api/letters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbManager.saveDb(db => {
      db.savedLetters = db.savedLetters.filter(l => l.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: '편지 삭제에 실패했습니다.' });
  }
});

// 3. Saved Charms
app.get('/api/charms', async (req, res) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
    const db = await dbManager.getDb();
    const charms = userId
      ? db.savedCharms.filter(c => c.userId === userId)
      : db.savedCharms;
    res.json({
      charms: charms.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (err: any) {
    res.status(500).json({ error: '부적 목록을 불러오지 못했습니다.' });
  }
});

app.post('/api/charms', async (req, res) => {
  try {
    const { userId, name, badge, buff, blessing, luckyItem, luckyAction } = req.body;
    if (!name || !buff) {
      return res.status(400).json({ error: '부적 데이터가 올바르지 않습니다.' });
    }

    const saved: SavedCharm = {
      id: 'charm-' + Date.now(),
      userId: userId || 'anonymous',
      name,
      badge: badge || '🔮',
      buff,
      blessing: blessing || '',
      luckyItem: luckyItem || '',
      luckyAction: luckyAction || '',
      createdAt: new Date().toISOString()
    };

    await dbManager.saveDb(db => {
      db.savedCharms.unshift(saved);
    });

    res.json({ success: true, charm: saved });
  } catch (err: any) {
    res.status(500).json({ error: '부적 저장에 실패했습니다.' });
  }
});

app.delete('/api/charms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbManager.saveDb(db => {
      db.savedCharms = db.savedCharms.filter(c => c.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: '부적 삭제에 실패했습니다.' });
  }
});

// 4. Chat Sessions
app.get('/api/chat/sessions', async (req, res) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
    const db = await dbManager.getDb();
    const sessions = userId
      ? db.chatSessions.filter(s => s.userId === userId)
      : db.chatSessions;
    res.json({
      sessions: sessions.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    });
  } catch (err: any) {
    res.status(500).json({ error: '대화 세션을 불러오지 못했습니다.' });
  }
});

app.post('/api/chat/save', async (req, res) => {
  try {
    const { sessionId, userId, persona, personaName, messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: '메시지 배열이 필요합니다.' });
    }

    const id = sessionId || 'chat-' + Date.now();
    const updatedSession: ChatSession = {
      id,
      userId: userId || 'anonymous',
      persona: persona || 'pogeun',
      personaName: personaName || '포근이 선배',
      messages,
      updatedAt: new Date().toISOString()
    };

    await dbManager.saveDb(db => {
      const idx = db.chatSessions.findIndex(s => s.id === id);
      if (idx >= 0) {
        db.chatSessions[idx] = updatedSession;
      } else {
        db.chatSessions.unshift(updatedSession);
      }
    });

    res.json({ success: true, session: updatedSession });
  } catch (err: any) {
    res.status(500).json({ error: '대화 저장에 실패했습니다.' });
  }
});

app.delete('/api/chat/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbManager.saveDb(db => {
      db.chatSessions = db.chatSessions.filter(s => s.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: '대화 삭제에 실패했습니다.' });
  }
});

// 5. Global Stats
app.get('/api/stats', async (_req, res) => {
  try {
    const db = await dbManager.getDb();
    res.json({
      stats: {
        ...db.stats,
        totalCheeringPosts: db.cheeringPosts.length,
        totalSavedLetters: db.savedLetters.length,
        totalSavedCharms: db.savedCharms.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: '통계를 불러오지 못했습니다.' });
  }
});

app.post('/api/stats/shred', async (_req, res) => {
  try {
    let newCount = 0;
    await dbManager.saveDb(db => {
      db.stats.totalShreddedWorries = (db.stats.totalShreddedWorries || 0) + 1;
      newCount = db.stats.totalShreddedWorries;
    });
    res.json({ success: true, totalShreddedWorries: newCount });
  } catch (err: any) {
    res.status(500).json({ error: '카운트 업데이트 실패' });
  }
});

app.post('/api/stats/focus', async (req, res) => {
  try {
    const { minutes = 25 } = req.body;
    let total = 0;
    await dbManager.saveDb(db => {
      db.stats.totalFocusMinutes = (db.stats.totalFocusMinutes || 0) + minutes;
      total = db.stats.totalFocusMinutes;
    });
    res.json({ success: true, totalFocusMinutes: total });
  } catch (err: any) {
    res.status(500).json({ error: '포커스 기록 실패' });
  }
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
