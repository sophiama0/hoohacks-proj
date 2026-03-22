const express  = require('express');
const cors     = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

// Set to true to use mock responses (no API key needed)
const MOCK_MODE = !process.env.ANTHROPIC_API_KEY;

const app    = express();
const client = MOCK_MODE ? null : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

// ── Scoring ──────────────────────────────────────────────────────────────────
// gait:       0–40 pts  (impairment %)
// noise:      0–30 pts  (sudden quiet shift = full 30)
// distance:   0–30 pts  (distance from nearest friend, scaled 100–400m)
// late+still: +15 bonus  (stationary >20 min between midnight–5am)
function computeRiskScore({ gaitPct, noiseShift, maxFriendDistMeters, minutesStationary, hourOfNight }) {
  const gaitScore  = Math.round((gaitPct / 99) * 40);
  const noiseScore = noiseShift ? 30 : 0;
  const distScore  = Math.round(Math.min(30, Math.max(0, (maxFriendDistMeters - 100) / 300) * 30));
  const lateBonus  = (minutesStationary > 20 && hourOfNight >= 0 && hourOfNight <= 5) ? 15 : 0;
  return Math.min(100, gaitScore + noiseScore + distScore + lateBonus);
}

// ── /check-safety ─────────────────────────────────────────────────────────────
app.post('/check-safety', async (req, res) => {
  const {
    gaitPct            = 0,
    noiseShift         = false,
    maxFriendDistMeters = 0,
    minutesStationary  = 0,
    hourOfNight        = 22,
  } = req.body;

  const score = computeRiskScore({ gaitPct, noiseShift, maxFriendDistMeters, minutesStationary, hourOfNight });
  const tier  = score >= 90 ? 'emergency' : score >= 75 ? 'urgent' : score >= 45 ? 'heads-up' : 'ok';

  // Nothing elevated at all — skip AI entirely
  if (score < 45) {
    return res.json({ score, tier: 'ok', notify: false, blurb: null });
  }

  // ── Mock mode (no API key) ────────────────────────────────────────────────
  if (MOCK_MODE) {
    const notify = score >= 60 ||
      gaitPct > 75 ||
      maxFriendDistMeters > 300 ||
      (minutesStationary > 45 && hourOfNight >= 0 && hourOfNight <= 5);

    const mockBlurbs = {
      emergency: `Gait severely impaired at ${gaitPct}% — gone quiet ${maxFriendDistMeters}m from group at ${hourOfNight}:00.`,
      urgent:    `Walk is off and stationary ${minutesStationary} min — environment shift detected, check in now.`,
      'heads-up': `Gait at ${gaitPct}% with unusual environment shift — monitoring, may need follow-up.`,
    };
    return res.json({ score, tier, notify, blurb: notify ? mockBlurbs[tier] || mockBlurbs['heads-up'] : null });
  }

  // ── Real Claude call ──────────────────────────────────────────────────────
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content:
`You are the safety reasoning engine for Rally, a nightlife app. Your job is to decide if this person's friends should be notified.

Current signals:
- Gait impairment: ${gaitPct}% (normal <40%, concerning 40-65%, alarming >65%)
- Sudden environment shift (loud venue → quiet): ${noiseShift ? 'Yes' : 'No'}
- Furthest friend in the rally group: ${maxFriendDistMeters}m away (concerning >150m, alarming >300m)
- Minutes stationary in same location: ${minutesStationary}
- Current time: ${hourOfNight}:00

You must decide: should friends be notified right now?
- Notify if 2+ signals are elevated, OR if one signal is extreme (gait >75%, distance >300m, stationary >45min after midnight)
- Do not notify for minor deviations on a single signal

Respond ONLY with this exact JSON (no other text):
{"notify": true, "tier": "heads-up", "blurb": "one sentence reason under 18 words"}

tier must be one of: "heads-up", "urgent", "emergency"
If not notifying: {"notify": false, "tier": "ok", "blurb": null}`,
      }],
    });

    let data;
    try {
      data = JSON.parse(msg.content[0].text.trim());
    } catch {
      // Claude didn't return valid JSON — fall back
      data = { notify: true, tier, blurb: `Risk score ${score}/100 — multiple safety signals active.` };
    }
    res.json({ score, ...data });
  } catch (err) {
    console.error('Claude error:', err.message);
    res.json({ score, tier, notify: true, blurb: `Risk score ${score}/100 — multiple safety signals active.` });
  }
});

app.listen(3001, () => console.log('Rally safety server → http://localhost:3001'));
