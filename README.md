# Rally - Stay Safe Together

A mobile-first nightlife safety app that monitors your group in real time and alerts friends when something looks off.

## What it does

Rally keeps an eye on everyone in your group throughout the night using three passive signals: gait, proximity, and ambient sound. When those signals combine in a way that looks wrong, it notifies your friends automatically and explains exactly why.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Live map showing group member locations with safety overlays |
| `gait-alerts.html` | Real-time safety monitoring dashboard |
| `night-summary.html` | End-of-night recap with route and alert history |
| `past-rallies.html` | History of previous nights out |
| `calibration.html` | Sober baseline calibration for gait tracking |
| `profile.html` | User settings including home location |
| `friends.html` | Rally group management |
| `login.html` / `signup.html` | Auth |

## Safety Alerts (gait-alerts.html)

This is the core of the app. It monitors three signals simultaneously:

**Gait impairment** - compares live walking pattern against a sober baseline captured at calibration. Flagged at 30%+ deviation, high concern at 70%+.

**Proximity** - distance from the nearest rally member. Flagged at 100m+, critical at 400m+.

**Ambient sound** - detects environment shifts (bar to quiet, bar to outside). A sudden shift to quiet is flagged as suspicious.

### Alert banner

The top banner shows the current concern level at a glance:

- **All Clear** - all signals normal, monitoring
- **Heads Up** - one signal flagged, watching
- **Concern** - multiple signals flagged, friends notified
- **Urgent** - high gait or sudden sound shift, friends notified
- **Emergency** - extreme readings, rally alerted

Below the level and notification status, a one-liner from the AI summarizes the most important signal combination right now.

### AI reasoning

Each signal tab shows a full AI analysis that weighs signals against each other with real context. It considers combinations rather than individual readings, references past rally memory and time-of-night patterns, and ends with a score and a direct action. The exact phrasing adapts to whatever signals are active.

The one-liner in the banner and the notification log both use the same AI-generated summary so everything stays consistent.

### Signal data

Each tab panel shows a color-coded breakdown of all five inputs:

- Gait impairment - Normal / Mild / Moderate / High
- Distance from group - Close / Far / Very far / Separated
- Sound shift - Stable / Shifted / Flagged
- Stationary time - Active / 15+ min / 30+ min / 60+ min
- Battery level - OK / Low

### Notification log

Every time the alert tier changes, an entry is logged with the timestamp, tier badge, active signal chips, and the same one-liner shown at the top.

## Stack

- Vanilla HTML/CSS/JS frontend (mobile-first)
- Node.js + Express backend (`server.js`)
- Supabase for auth and data
- Leaflet for maps
- Anthropic SDK included for future live AI integration

## Running locally

```bash
npm install
npm start
```

Then open `index.html` in a browser or serve the static files.
