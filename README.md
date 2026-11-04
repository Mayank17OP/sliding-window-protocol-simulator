# WindowLab — Sliding Window Protocol Simulator

An interactive, browser-based lab for **Stop-and-Wait**, **Go-Back-N**, and **Selective Repeat ARQ**. Animate frame/ACK flow, inspect a deterministic event trace, adjust loss and window size, and compare goodput and transmission efficiency.

## Run locally

Requires Node.js 20.19+ (Node 22 recommended).

```bash
npm ci
npm run dev
```

Open the address printed by Vite. Run checks with `npm test` and `npm run build`.

## Deploy to GitHub Pages

This is a static Vite project with no server-side dependency. GitHub Pages is currently configured to serve the `main` branch at `/` (legacy source), so the compiled `dist/` site is committed and served at `/sliding-window-protocol-simulator/dist/`. The root page redirects visitors there. Local Vite previews still run at `/`.

1. Keep **Settings → Pages → Build and deployment → Deploy from a branch** set to `main` and `/ (root)`.
2. After changing the app, run `npm ci && npm test && npm run build`, then commit **both** your source changes and the refreshed `dist/` files (`git add -f dist`). The verification workflow checks that committed output matches the source.
3. Merge to `main`. GitHub's built-in `pages-build-deployment` workflow publishes the branch automatically. Visit `https://mayank17op.github.io/sliding-window-protocol-simulator/` after it succeeds.

For a fork or renamed repository, change the production `base` in `vite.config.js` to `/<your-repository-name>/dist/` before building. For root-domain Pages, use `/dist/` instead.

## Model

- One data-frame send per tick, two ticks of one-way propagation, and an eight-tick retransmission timeout.
- Data attempts independently drop at the chosen loss probability; ACKs are reliable. The loss decision is derived from the seed, frame ID, and attempt number, so the same attempt has the same outcome across protocols.
- ACK arrivals are processed before timeouts at the same tick. Stop-and-Wait uses window 1; GBN uses cumulative ACKs and resends outstanding frames; SR ACKs frames individually and buffers out-of-order arrivals.
- Runs stop at 10,000 ticks if necessary. Goodput is unique frames delivered divided by completion ticks; transmission efficiency is unique frames divided by data transmission attempts.
- The engine is independent of playback/UI; animation speed changes presentation only. No accounts or network connection are needed.

See [PRD.md](PRD.md) for the full requirements and acceptance criteria.
