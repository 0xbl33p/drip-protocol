/** Agent — a wallet that creates markets and/or provides oracle feeds */
export interface Agent {
  /** Unique agent identifier */
  id: string;

  /** Display name */
  name: string;

  /** Agent wallet address (Solana pubkey) */
  wallet: string;

  /** Short description of the agent's purpose */
  description: string;

  /** Oracle methodology description */
  methodology: string;

  /** Data sources the agent uses */
  dataSources: string[];

  /** Markets created by this agent */
  marketsCreated: number;

  /** Currently active markets */
  marketsActive: number;

  /** Total OI across all agent's markets */
  totalOi: number;

  /** Track record */
  trackRecord: AgentTrackRecord;

  /** When the agent registered */
  createdAt: string;

  /** Avatar URL or identifier */
  avatar?: string;
}

/** Agent performance metrics */
export interface AgentTrackRecord {
  /** Total markets ever created */
  totalMarketsCreated: number;

  /** Markets that survived (reached meaningful OI) */
  marketsSurvived: number;

  /** Markets that drained/died */
  marketsDied: number;

  /** Average market lifespan in hours */
  avgMarketLifespanHours: number;

  /** Peak OI across all markets */
  peakOi: number;

  /** Total volume facilitated across all markets */
  totalVolume: number;
}

/** Oracle configuration for a market */
export interface OracleConfig {
  /** Data source identifiers */
  sources: string[];

  /** Aggregation method */
  aggregation: "median" | "mean" | "weighted";

  /** Update frequency in seconds */
  updateIntervalSeconds: number;

  /** Description of how the index is computed */
  methodology: string;
}
