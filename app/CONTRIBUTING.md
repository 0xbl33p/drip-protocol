# Contributing to Drip

Thanks for your interest in contributing to Drip. Here's how to get started.

## Development Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/0xbl33p/drip-protocol.git
   cd drip-protocol/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment**
   ```bash
   cp .env.example .env.local
   ```

4. **Run dev server**
   ```bash
   npm run dev
   ```

## Code Style

- TypeScript strict mode
- Tailwind CSS for styling (no inline styles)
- Glass components (`<GlassPanel>`, `<GlassCard>`, `<GlassButton>`) for all UI surfaces
- GSAP for data animations, Framer Motion for layout transitions
- BigInt for all engine math (no floating point for financial calculations)
- Zustand for client state, TanStack Query for server state

## Pull Requests

- One feature per PR
- Include screenshots for UI changes
- All TypeScript errors must be resolved (`npm run build`)
- Keep components small and focused

## Architecture Rules

1. **Glass tier system** — use `<GlassPanel tier={1|2|3|"gold"|"violet"}>`, not raw CSS classes
2. **Engine math** — all financial calculations go through `lib/engine-math.ts` using BigInt
3. **Mock mode** — all data fetching must work in mock mode (IS_MOCK_MODE) for development
4. **Hydration safety** — no `Date.now()` or `Math.random()` in components rendered on server. Use seeded PRNGs.
5. **Performance** — Three.js scene must stay under 500 draw calls. Use `<PerformanceMonitor>`.

## Solana Program

The Anchor program at `programs/drip/` requires WSL on Windows:

```bash
wsl -- bash -c 'source ~/.cargo/env && cd programs/drip && cargo build-sbf'
```

## Questions?

Open an issue or reach out on Twitter/X.
