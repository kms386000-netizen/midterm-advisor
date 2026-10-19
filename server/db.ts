import fs from 'fs';
import path from 'path';

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

export interface AppDatabase {
  cheeringPosts: CheeringPost[];
  savedLetters: SavedLetter[];
  savedCharms: SavedCharm[];
  chatSessions: ChatSession[];
  stats: {
    totalShreddedWorries: number;
    totalFocusMinutes: number;
    totalCheeringSent: number;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const TEMP_FILE = path.join(DATA_DIR, 'db.temp.json');

const INITIAL_DATA: AppDatabase = {
  cheeringPosts: [
    {
      id: 'post-1',
      author: '새벽 열람실 32번석',
      major: '컴퓨터공학과',
      badge: '💻',
      message: '자료구조랑 알고리즘 벼락치기 중인데 코드가 눈앞에서 춤을 춥니다... 그래도 끝까지 버텨볼게요. 전국 컴공 학우들 버그 없는 시험 되길!',
      likes: 184,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      id: 'post-2',
      author: '국시까지 달린다',
      major: '간호학과',
      badge: '🩺',
      message: '해부학 의학용어 1,000개 외우다가 울 뻔했는데 초콜릿 하나 까먹고 다시 봅니다. 우리 모두의 땀방울은 멋진 날개가 될 거예요!',
      likes: 248,
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
    },
    {
      id: 'post-3',
      author: '학점 심폐소생술러',
      major: '경영학과',
      badge: '📊',
      message: '재수강이라 이번에 C+ 아래로 나오면 큰일인데... 긍정의 힘으로 B+ 쟁취한다! 다들 커피 과다 복용 조심하고 속 버리지 마요.',
      likes: 129,
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    },
    {
      id: 'post-4',
      author: '도서관 지박령',
      major: '인문학부',
      badge: '☕',
      message: '도서관 창밖으로 여명이 밝아오네요. 이 새벽을 밝힌 불빛 하나하나가 다 누군가의 빛나는 청춘이라는 생각에 가슴이 뭉클해요. 다들 진짜 수고 많았어요.',
      likes: 312,
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    {
      id: 'post-5',
      author: '과탑 노리는 2학년',
      major: '전자전기',
      badge: '⚡',
      message: '회로이론 교수님 증명 문제 제발 안 나오게 해주세요... 찍신 강림 부적 받고 다시 문제 풀러 갑니다. 아자아자!',
      likes: 96,
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
    }
  ],
  savedLetters: [],
  savedCharms: [],
  chatSessions: [],
  stats: {
    totalShreddedWorries: 1420,
    totalFocusMinutes: 28550,
    totalCheeringSent: 975
  }
};

class DatabaseManager {
  private cache: AppDatabase | null = null;
  private writePromise: Promise<void> = Promise.resolve();

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
        this.cache = JSON.parse(JSON.stringify(INITIAL_DATA));
      } else {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.cache = { ...INITIAL_DATA, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.error('Failed to initialize database file:', e);
      this.cache = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
  }

  public async getDb(): Promise<AppDatabase> {
    if (!this.cache) {
      this.init();
    }
    return this.cache!;
  }

  public async saveDb(updater: (db: AppDatabase) => void): Promise<AppDatabase> {
    const current = await this.getDb();
    updater(current);

    // Chain write operations to ensure atomic file writing
    this.writePromise = this.writePromise.then(async () => {
      try {
        const dataString = JSON.stringify(current, null, 2);
        await fs.promises.writeFile(TEMP_FILE, dataString, 'utf-8');
        await fs.promises.rename(TEMP_FILE, DB_FILE);
      } catch (err) {
        console.error('Error writing to DB file:', err);
      }
    });

    await this.writePromise;
    return current;
  }
}

export const dbManager = new DatabaseManager();
