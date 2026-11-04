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

This is a static Vite project with no server-side dependency. `vite.config.js` serves local previews at `/` and sets the production build base path to `/sliding-window-protocol-simulator/` for this repository's GitHub Pages URL.

1. In repository **Settings → Pages**, choose **GitHub Actions** as the build/deployment source.
2. Merge the project into `main`. The workflow in `.github/workflows/deploy.yml` runs tests, builds, and deploys on pushes to `main`. It can also be launched manually from the Actions tab.
3. Visit `https://mayank17op.github.io/sliding-window-protocol-simulator/` after the deployment succeeds.

For a fork or renamed repository, change `base` in `vite.config.js` to `/<your-repository-name>/` before building. For root-domain Pages, use `/` instead.

## Model

- One data-frame send per tick, two ticks of one-way propagation, and an eight-tick retransmission timeout.
- Data attempts independently drop at the chosen loss probability; ACKs are reliable. The loss decision is derived from the seed, frame ID, and attempt number, so the same attempt has the same outcome across protocols.
- ACK arrivals are processed before timeouts at the same tick. Stop-and-Wait uses window 1; GBN uses cumulative ACKs and resends outstanding frames; SR ACKs frames individually and buffers out-of-order arrivals.
- Runs stop at 10,000 ticks if necessary. Goodput is unique frames delivered divided by completion ticks; transmission efficiency is unique frames divided by data transmission attempts.
- The engine is independent of playback/UI; animation speed changes presentation only. No accounts or network connection are needed.

See [PRD.md](PRD.md) for the full requirements and acceptance criteria.
