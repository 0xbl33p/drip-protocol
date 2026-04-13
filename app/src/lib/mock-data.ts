export interface MockMarket {
  id: string;
  name: string;
  category: "narrative" | "social" | "influence" | "meta";
  price: number;
  change24h: number;
  oi: number;
  volume24h: number;
  oracleCount: number;
  agentName: string;
  agentId: string;
  createdAgo: string;
  mindshare: number;
  sentiment: number;
  velocity: "accelerating" | "stable" | "cooling";
  status: "active" | "draining" | "new";
  sparkline: number[];
}

/** Seeded pseudo-random so server and client produce identical sparklines */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateSparkline(trend: number, seed: number): number[] {
  const rand = seededRandom(seed);
  const points: number[] = [];
  let val = 50 + rand() * 20;
  for (let i = 0; i < 24; i++) {
    val += (rand() - 0.45 + trend * 0.1) * 5;
    val = Math.max(10, Math.min(100, val));
    points.push(val);
  }
  return points;
}

export const MOCK_MARKETS: MockMarket[] = [
  {
    id: "ai-narrative",
    name: "AI Narrative Index",
    category: "narrative",
    price: 142.3,
    change24h: 12.4,
    oi: 2_140_000,
    volume24h: 890_000,
    oracleCount: 3,
    agentName: "scout_agent_7",
    agentId: "agent-001",
    createdAgo: "14h",
    mindshare: 73,
    sentiment: 68,
    velocity: "accelerating",
    status: "active",
    sparkline: generateSparkline(1, 1001),
  },
  {
    id: "sol-eth-mindshare",
    name: "SOL vs ETH Mindshare",
    category: "social",
    price: 0.634,
    change24h: -3.1,
    oi: 890_000,
    volume24h: 420_000,
    oracleCount: 5,
    agentName: "narrative_bot",
    agentId: "agent-002",
    createdAgo: "6h",
    mindshare: 54,
    sentiment: 41,
    velocity: "stable",
    status: "active",
    sparkline: generateSparkline(-0.5, 2002),
  },
  {
    id: "hsaka-alpha",
    name: "@HsakaTrades Alpha",
    category: "influence",
    price: 87.2,
    change24h: 0.8,
    oi: 340_000,
    volume24h: 95_000,
    oracleCount: 2,
    agentName: "ct_auditor",
    agentId: "agent-003",
    createdAgo: "2d",
    mindshare: 31,
    sentiment: 72,
    velocity: "stable",
    status: "active",
    sparkline: generateSparkline(0.2, 3003),
  },
  {
    id: "depin-revival",
    name: "DePIN Revival Index",
    category: "narrative",
    price: 23.7,
    change24h: 41.2,
    oi: 45_000,
    volume24h: 18_000,
    oracleCount: 1,
    agentName: "contrarian_ai",
    agentId: "agent-004",
    createdAgo: "47min",
    mindshare: 12,
    sentiment: 58,
    velocity: "accelerating",
    status: "new",
    sparkline: generateSparkline(2, 4004),
  },
  {
    id: "restaking-meta",
    name: "Restaking Meta",
    category: "meta",
    price: 3.2,
    change24h: -89.1,
    oi: 1_200,
    volume24h: 400,
    oracleCount: 1,
    agentName: "cycle_watcher",
    agentId: "agent-005",
    createdAgo: "12d",
    mindshare: 2,
    sentiment: 15,
    velocity: "cooling",
    status: "draining",
    sparkline: generateSparkline(-2, 5005),
  },
  {
    id: "meme-szn",
    name: "Memecoin Season Index",
    category: "narrative",
    price: 67.8,
    change24h: 5.6,
    oi: 1_560_000,
    volume24h: 720_000,
    oracleCount: 4,
    agentName: "degen_oracle",
    agentId: "agent-006",
    createdAgo: "3d",
    mindshare: 61,
    sentiment: 74,
    velocity: "accelerating",
    status: "active",
    sparkline: generateSparkline(1.2, 6006),
  },
  {
    id: "rwa-institutional",
    name: "RWA Institutional Flow",
    category: "narrative",
    price: 198.4,
    change24h: 2.1,
    oi: 3_200_000,
    volume24h: 1_100_000,
    oracleCount: 6,
    agentName: "macro_agent",
    agentId: "agent-007",
    createdAgo: "8d",
    mindshare: 44,
    sentiment: 62,
    velocity: "stable",
    status: "active",
    sparkline: generateSparkline(0.5, 7007),
  },
  {
    id: "cobie-alpha",
    name: "@colobie Signal Score",
    category: "influence",
    price: 112.0,
    change24h: -1.4,
    oi: 560_000,
    volume24h: 190_000,
    oracleCount: 3,
    agentName: "ct_auditor",
    agentId: "agent-003",
    createdAgo: "5d",
    mindshare: 38,
    sentiment: 55,
    velocity: "cooling",
    status: "active",
    sparkline: generateSparkline(-0.3, 8008),
  },
];
