const express   = require('express');
const cors      = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const MOCK_MODE = !process.env.ANTHROPIC_API_KEY;

const app    = express();
const client = MOCK_MODE ? null : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

// Scoring
// gait:        0-40 pts  (>30%: 15pts, >50%: 25pts, >70%: 40pts)
// noise shift: 0-30 pts  (gradual: 10pts, sudden: 25pts, loud-to-silent: 30pts)
// distance:    0-30 pts  (100-200m: 10pts, 200-400m: 20pts, >400m: 30pts)
// stationary:  0-20 pts  (15min: 5pts, 30min: 10pts, 60min: 20pts)
// battery:     +10 pts   (flat bonus if battery < 20%)
// multiplier:  1.0x before midnight, 1.2x midnight-2am, 1.4x after 2am
function computeRiskScore({ gaitPct, noiseShiftType, maxFriendDistMeters, minutesStationary, hourOfNight, batteryPct }) {
  // Gait
  let gaitPts = 0;
  if (gaitPct > 70)      gaitPts = 40;
  else if (gaitPct > 50) gaitPts = 25;
  else if (gaitPct > 30) gaitPts = 15;

  // Noise shift
  const noisePts = noiseShiftType === 'sudden'  ? 30
                 : noiseShiftType === 'gradual' ? 10
                 : 0;

  // Distance
  let distPts = 0;
  if (maxFriendDistMeters > 400)      distPts = 30;
  else if (maxFriendDistMeters > 200) distPts = 20;
  else if (maxFriendDistMeters > 100) distPts = 10;

  // Stationary bonus
  let stationaryPts = 0;
  if (minutesStationary >= 60)      stationaryPts = 20;
  else if (minutesStationary >= 30) stationaryPts = 10;
  else if (minutesStationary >= 15) stationaryPts = 5;

  // Battery
  const batteryPts = (batteryPct !== undefined && batteryPct < 20) ? 10 : 0;

  const base = gaitPts + noisePts + distPts + stationaryPts + batteryPts;

  // Time of night multiplier
  const mult = (hourOfNight >= 2 && hourOfNight < 12) ? 1.4
             : (hourOfNight >= 0)                     ? 1.2
             : 1.0;

  return { score: Math.min(100, Math.round(base * mult)), gaitPts, noisePts, distPts, stationaryPts, batteryPts, base, mult };
}

function getStatusLabel(score) {
  if (score <= 20) return 'Healthy';
  if (score <= 40) return 'Doing Well';
  if (score <= 55) return 'Mellow';
  if (score <= 65) return 'Uneasy';
  if (score <= 75) return 'Needs a Check-in';
  if (score <= 85) return 'Needs Help';
  if (score <= 95) return 'Critical';
  return 'Distressed';
}

// /check-safety
app.post('/check-safety', async (req, res) => {
  const {
    gaitPct             = 0,
    noiseShiftType      = 'none',
    maxFriendDistMeters = 0,
    minutesStationary   = 0,
    hourOfNight         = 22,
    batteryPct          = 100,
  } = req.body;

  const { score, ...breakdown } = computeRiskScore({ gaitPct, noiseShiftType, maxFriendDistMeters, minutesStationary, hourOfNight, batteryPct });
  const tier        = score >= 90 ? 'emergency' : score >= 75 ? 'urgent' : score >= 60 ? 'heads-up' : 'ok';
  const statusLabel = getStatusLabel(score);

  if (score < 60) {
    return res.json({ score, tier: 'ok', statusLabel, notify: false, blurb: null, breakdown });
  }

  if (MOCK_MODE) {
    const mockBlurbs = {
      emergency: `Gait severely impaired at ${gaitPct}%, ${maxFriendDistMeters}m from group at ${hourOfNight}:00. Urgent.`,
      urgent:    `Walk is off, stationary ${minutesStationary} min, environment shift detected. Check on them now.`,
      'heads-up': `Gait at ${gaitPct}% with unusual environment shift. Monitoring, may need follow-up.`,
    };
    return res.json({ score, tier, statusLabel, notify: true, blurb: mockBlurbs[tier] || mockBlurbs['heads-up'], breakdown });
  }

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content:
`You are the safety reasoning engine for Rally, a nightlife app. Decide if this person's friends should be notified.

Signals:
- Gait impairment: ${gaitPct}% (concerning >30%, alarming >70%)
- Noise shift type: ${noiseShiftType} (none/gradual/sudden)
- Distance from nearest friend: ${maxFriendDistMeters}m (concerning >100m, alarming >400m)
- Minutes stationary: ${minutesStationary}
- Hour of night: ${hourOfNight}:00
- Battery: ${batteryPct}%
- Risk score: ${score}/100

Score >= 60 means notify. Tiers: 60-74 heads-up, 75-89 urgent, 90+ emergency.

Respond ONLY with this JSON:
{"notify": true, "tier": "heads-up", "blurb": "one sentence reason under 18 words"}

If score < 60: {"notify": false, "tier": "ok", "blurb": null}`,
      }],
    });

    let data;
    try {
      data = JSON.parse(msg.content[0].text.trim());
    } catch {
      data = { notify: true, tier, blurb: `Risk score ${score}/100. Multiple safety signals active.` };
    }
    res.json({ score, statusLabel, breakdown, ...data });
  } catch (err) {
    console.error('Claude error:', err.message);
    res.json({ score, tier, statusLabel, notify: true, blurb: `Risk score ${score}/100. Multiple safety signals active.`, breakdown });
  }
});

app.listen(3001, () => console.log('Rally safety server running on http://localhost:3001'));
