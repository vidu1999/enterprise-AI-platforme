export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  modelUsed?: string;
  intent?: {
    category: string;
    confidence?: number;
    tablesQueried?: string[];
    rowCount?: number;
    autoNavigate?: {
      shouldMove: boolean;
      route: string;
      pageTitle: string;
      delayMs: number;
      highlightAction?: string;
      steps?: string[];
    };
  };
  uiBlocks?: any[];
  suggestedFollowUps?: string[];
  citations?: { title: string; category: string; excerpt?: string; snippet?: string }[];
  evidence?: string[];
  timestamp?: string;
}

const STORAGE_KEY = 'opspilot_ai_chat_v2';
const ARRIVAL_KEY = 'opspilot_ai_arrival_hint';

export const INITIAL_AI_MESSAGES: AiChatMessage[] = [
  {
    id: 'seed-user-1',
    role: 'user',
    content: 'Which machines had the highest maintenance cost this month?',
  },
  {
    id: 'seed-ai-1',
    role: 'assistant',
    mode: 'opspilot-sql-genui',
    content:
      'Here are the top machines with the highest maintenance costs from your live PostgreSQL telemetry — you can also ask me about any database table or tell me to open any website feature automatically:',
    intent: {
      category: 'DATABASE_ANALYTICS',
      tablesQueried: ['assets', 'work_orders'],
      rowCount: 6,
    },
    uiBlocks: [
      {
        type: 'ranked_list',
        title: 'Top Equipment by Maintenance Cost',
        subtitle: 'Live SQL aggregation · assets & work_orders',
        actionLabel: 'View Details',
        actionRoute: '/reports',
        items: [
          { rank: 1, name: 'Generator #1', subtitle: 'GEN-001 · Power Generation', value: 'Rs. 125,000', percent: 100 },
          { rank: 2, name: 'Compressor #2', subtitle: 'CMP-002 · Pneumatics', value: 'Rs. 98,000', percent: 78 },
          { rank: 3, name: 'HVAC Unit #1', subtitle: 'HVAC-001 · Climate Control', value: 'Rs. 87,000', percent: 70 },
        ],
      },
      {
        type: 'chart',
        title: 'Maintenance Cost Trend',
        subtitle: 'Switch between Area, Bar & Donut views',
        defaultChartType: 'area',
        valuePrefix: 'Rs. ',
        data: [
          { name: 'Wk 1', value: 64000 },
          { name: 'Wk 2', value: 82000 },
          { name: 'Wk 3', value: 98000 },
          { name: 'Wk 4', value: 125000 },
        ],
      },
    ],
    suggestedFollowUps: [
      'Show all low stock & out of stock items',
      'Show employees by department',
      'Where can I add a new product? (Auto-Move)',
      'Show pending workflow approvals',
    ],
  },
];

export function loadAiMessages(): AiChatMessage[] {
  if (typeof window === 'undefined') return INITIAL_AI_MESSAGES;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_AI_MESSAGES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_AI_MESSAGES;
  } catch {
    return INITIAL_AI_MESSAGES;
  }
}

export function saveAiMessages(messages: AiChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
  } catch {
    // ignore quota errors
  }
}

export function clearAiMessages(): AiChatMessage[] {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return INITIAL_AI_MESSAGES;
}

export function setArrivalHint(hint: { pageTitle: string; highlightAction: string; route: string } | null) {
  if (typeof window === 'undefined') return;
  if (!hint) sessionStorage.removeItem(ARRIVAL_KEY);
  else sessionStorage.setItem(ARRIVAL_KEY, JSON.stringify(hint));
}

export function consumeArrivalHint(): { pageTitle: string; highlightAction: string; route: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ARRIVAL_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(ARRIVAL_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
