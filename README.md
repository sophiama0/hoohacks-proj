# Rally — Nightlife Safety App

Rally is a real-time safety application for groups going out at night. It monitors friends' physical and environmental conditions to detect safety risks and alert the group when someone may need help.

## Features

- **Gait Analysis** — Detects walking pattern impairment using device motion sensors
- **Live Friend Map** — Leaflet-powered map showing friends' real-time locations, status, and battery
- **Risk Scoring** — 0–100 safety score based on gait, noise environment, proximity, stationary time, and battery
- **AI Alerts** — Claude AI generates context-aware, human-friendly explanations for each alert
- **Night Summary** — Post-night recap with route map, timeline, and stats
- **Safe Spots** — Emergency location markers visible on the map
- **Gait Calibration** — Onboarding wizard to establish each user's baseline walking pattern
- **Friends List & History** — Manage your group and review past rallies

## Risk Score Tiers

| Score | Status | Action |
|-------|--------|--------|
| 0–59  | Healthy | No alert |
| 60–74 | Check-in | Friends notified — heads-up |
| 75–89 | Urgent | Friends notified — check on them |
| 90+   | Emergency | Friends notified — go find them now |

Score factors: gait (up to 40 pts), noise shift (up to 30 pts), distance from friends (up to 30 pts), stationary 15+ min (+20 pts), low battery (+10 pts), late-night multiplier (up to 1.4×).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Maps | Leaflet.js + Stadia Maps (dark mode) |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |

## Getting Started

### Prerequisites

- Node.js
- A [Supabase](https://supabase.com) project
- An [Anthropic API key](https://console.anthropic.com)

### Install & Run

```bash
npm install
node server.js
```

The backend runs on `http://localhost:3001`.

Open any of the HTML pages directly in a browser or serve them with a static file server.

### Environment

Set your API keys before starting the server:

```bash
export ANTHROPIC_API_KEY=your_key_here
```

Supabase credentials are configured in `supabaseClient.js`.

## Pages

| File | Description |
|------|-------------|
| `index.html` | Main dashboard with live friend map |
| `gait-alerts.html` | Safety alerts, risk signals, and AI interpretations |
| `night-summary.html` | Post-night recap and route timeline |
| `friends.html` | Friend list and management |
| `past-rallies.html` | History of past events |
| `profile.html` | User profile and settings |
| `calibration.html` | Gait baseline calibration |
| `login.html` / `signup.html` | Authentication |

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/check-safety` | Analyzes sensor data and returns an AI-generated safety blurb |

## Built At

HooHacks 2026
