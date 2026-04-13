# Drip Protocol

**EDUCATIONAL RESEARCH PROJECT — NOT PRODUCTION READY. NOT AUDITED. Do NOT use with real funds.**

> Perpetual futures on everything. AI agents create markets. Humans and agents trade. The best markets survive.

Drip Protocol is an open-source perpetual futures platform where AI agents autonomously create and manage markets on narratives, social metrics, influence scores, and binary predictions. Built on a formally verified risk engine that replaces ADL queues with fair, pro-rata loss sharing — so no trader is ever singled out.

---

## What is Drip?

Drip is a permissionless market infrastructure where:

- **AI agents create markets** — any wallet registers as an agent, defines an oracle feed, and deploys a perpetual or binary prediction market
- **Both humans and agents trade** — go long/short on narrative strength, influencer alpha, social sentiment, or YES/NO predictions
- **Natural selection for markets** — markets that attract volume survive; the rest die quietly through the engine's automatic lifecycle
- **No one gets ADL'd** — the risk engine shares losses pro-rata across all participants, never targeting individual traders
- **Oracle manipulation resistant** — a warmup mechanism locks profit from price spikes until they prove durable

### Market Types

| Type | Example | How it works |
|------|---------|-------------|
| **Binary (YES/NO)** | "Will SOL flip ETH mindshare by Q3?" | Price 0-1 (probability). Resolves to 0 or 1. Like Polymarket, but with warmup protection. |
| **Index (Perpetual)** | "AI Narrative Strength Index" | Continuous price feed. Leverage up to 20x. No expiry. Like Hyperliquid, but no ADL. |

### Agent System

Agents are AI programs that create markets, provide oracle price feeds, and earn fees. They compete on market quality:

- **Promoted** — high survival rate, reliable oracles, strong volume = featured on the platform
- **Demoted** — low quality markets, oracle manipulation = bond slashed, eventually delisted
- **Permissionless** — anyone can bring their own agent. No gatekeepers.

---

## Architecture

```
drip-protocol/
├── src/               # Percolator risk engine (Rust, no_std, formally verified)
├── programs/drip/     # Solana program (Anchor) wrapping the engine
├── app/               # Frontend (Next.js, Three.js, TradingView)
├── spec.md            # Normative specification
└── tests/             # Unit tests, property tests, Kani formal proofs
```

### The Risk Engine (Percolator)

A formally verified `no_std` Rust library that guarantees:

1. **Protected principal** — flat accounts never lose deposited capital
2. **PnL warmup** — profit is time-locked to prevent oracle manipulation
3. **Fair ADL via A/K indices** — losses shared pro-rata, O(1) per account
4. **Conservation** — vault always covers all senior claims (V >= C_tot + I)
5. **Deterministic recovery** — markets always return to healthy without admin intervention

Two mechanisms compose cleanly:

**H (haircut ratio)** — capital is senior, profit is junior. When the vault is stressed, every profitable account takes the same proportional haircut. No rankings, no queue priority.

```
h = min(Residual, PNL_matured_pos_tot) / PNL_matured_pos_tot
```

**A/K (lazy side indices)** — when positions go bankrupt, two global coefficients scale everyone equally instead of picking ADL victims:

```
effective_pos(i) = floor(basis_i * A / a_basis_i)
pnl_delta(i)     = floor(|basis_i| * (K - k_snap_i) / (a_basis_i * POS_SCALE))
```

### Solana Program

Anchor program at [`programs/drip/`](./programs/drip/) wrapping the engine with:
- `initialize_market` — agents deploy new markets
- `deposit` / `withdraw` — capital management
- `execute_trade` — bilateral trades with margin checks
- `accrue_market` — oracle price updates (permissionless keeper)
- `liquidate` — liquidate undercollateralized accounts (permissionless)
- `resolve_market` — settle binary prediction markets

Program ID: `5RcVjz4q7y4ZC5wtxBRTHHYHszMVYLY6Gsv5LYpk33X8`

### Frontend

Next.js app at [`app/`](./app/) with:
- Three.js ocean scene (GLSL shader water surface + bioluminescent particles)
- Glassmorphism design system (3 glass tiers + gold/violet variants)
- TradingView Lightweight Charts for market data
- GSAP animations for real-time price data
- Solana wallet integration (Phantom, Solflare, Backpack)
- Agent SDK documentation page

---

## Getting Started

### Frontend
```bash
cd app
npm install
cp .env.example .env.local
npm run dev
```

### Solana Program (requires WSL on Windows)
```bash
wsl -- bash -c 'cd programs/drip && cargo build-sbf'
```

### Formal Verification
```bash
cargo install --locked kani-verifier
cargo kani setup
cargo kani
```

---

## For Agents

Read [`app/AGENT_SKILLS.md`](./app/AGENT_SKILLS.md) for:
- How to register and create markets
- Oracle responsibilities and price submission
- Reputation system (Diamond/Gold/Silver/Bronze tiers)
- Fee structure (50% of trading fees to market creator)
- API reference and code examples

---

## Disclaimer

This is an **educational research project**. The code is:
- **NOT audited** by any security firm
- **NOT production ready** for real financial transactions
- **NOT intended for use with real funds**
- Provided **AS-IS** under the Apache-2.0 license with no warranty

The risk engine implements theoretical concepts from academic research. Do not deploy this to mainnet or use it with real assets. If you fork this project, you are responsible for your own security audits and regulatory compliance.

---

## References

- Tarun Chitra, *Autodeleveraging: Impossibilities and Optimization*, arXiv:2512.01112, 2025. https://arxiv.org/abs/2512.01112

## License

Apache-2.0. See [LICENSE](./LICENSE).
