# Rally -- Nightlife Safety App

Rally is a real-time safety application for groups going out at night. It monitors friends' physical and environmental conditions to detect safety risks and alert the group when someone may need help.

## Features

- **Gait Analysis** -- Detects walking pattern impairment using device motion sensors
- **Live Friend Map** -- Leaflet-powered map showing friends' real-time locations, status, and battery
- **Risk Scoring** -- 0-100+ safety score based on gait, noise environment, proximity, stationary time, and battery
- **AI Alerts** -- Claude AI generates context-aware, human-friendly explanations for each alert
- **Night Summary** -- Post-night recap with route map, timeline, and stats
- **Safe Spots** -- Emergency location markers visible on the map
- **Gait Calibration** -- Onboarding wizard to establish each user's baseline walking pattern
- **Friends List & History** -- Manage your group and review past rallies

## Risk Scoring

Each factor contributes points to a running safety score. Once the score exceeds 60, it is sent to Claude to analyze whether the user is safe or unsafe using factors such as the combination of signals (e.g. gait impairment AND isolation AND late hour), context from past user patterns, the severity and pattern of each reading, context like time of night and distance from safe spots, and whether the situation is worsening over time.

### Scoring Breakdown

**Gait deviation:**

| Deviation above baseline | Points |
|--------------------------|--------|
| < 30%                    |  0 pts |
| 30-50%                   | 15 pts |
| 50-70%                   | 25 pts |
| 70%+                     | 40 pts |

**Noise shift:**

| Condition             | Points |
|-----------------------|--------|
| No shift              |  0 pts |
| Gradual quiet         | 10 pts |
| Sudden quiet shift    | 25 pts |
| Quiet + was loud      | 30 pts |

**Distance from nearest friend/safe spot:**

| Distance   | Points |
|------------|--------|
| < 100m     |  0 pts |
| 100-200m   | 10 pts |
| 200-400m   | 20 pts |
| 400m+      | 30 pts |

**Time stationary in unfamiliar place:**

| Duration    | Points |
|-------------|--------|
| < 15 min    |  0 pts |
| 15-30 min   |  5 pts |
| 30-60 min   | 10 pts |
| 60+ min     | 20 pts |

**Time of night multiplier (applied to total):**

| Time          | Multiplier |
|---------------|------------|
| Before midnight | x1.0     |
| 12am-2am      | x1.2       |
| 2am+          | x1.4       |

**Battery under 20%:** flat +10 pts bonus

### Alert Tiers

| Score | Status    | Action                               |
|-------|-----------|--------------------------------------|
| 0-59  | Healthy   | No alert                             |
| 60-74 | Check-in  | Friends notified -- heads-up         |
| 75-89 | Urgent    | Friends notified -- check on them    |
| 90+   | Emergency | Friends notified -- go find them now |

## Tech Stack

| Layer    | Technology                                        |
|----------|---------------------------------------------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript                   |
| Maps     | Leaflet.js + Stadia Maps (dark mode)              |
| Backend  | Node.js + Express                                 |
| Database | Supabase (PostgreSQL)                             |
| AI       | Anthropic Claude API (`@anthropic-ai/sdk`)        |

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

| File                          | Description                               |
|-------------------------------|-------------------------------------------|
| `index.html`                  | Main dashboard with live friend map       |
| `gait-alerts.html`            | Safety alerts, risk signals, and AI interpretations |
| `night-summary.html`          | Post-night recap and route timeline       |
| `friends.html`                | Friend list and management                |
| `past-rallies.html`           | History of past events                    |
| `profile.html`                | User profile and settings                 |
| `calibration.html`            | Gait baseline calibration                 |
| `login.html` / `signup.html`  | Authentication                            |

## API Endpoints

| Method | Route           | Description                                             |
|--------|-----------------|---------------------------------------------------------|
| POST   | `/check-safety` | Analyzes sensor data and returns an AI-generated safety blurb |

## Built At

HooHacks 2026
