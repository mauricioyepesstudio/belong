# BELONG Growth OS

**Status:** Active product directive
**Date:** 2026-08-23
**Objective:** Turn BELONG from a broad feature platform into a compounding human-action network.

## 1. Strategic thesis

BELONG wins only if it creates outcomes that existing social networks, project tools, community apps, and AI assistants do not create reliably.

The wedge is not "another social network" and not "more features."

The wedge is:

> BELONG continuously understands who I am, what I care about, what I can contribute, and what is happening around me — then connects me to the right person, project, community, mission, event, or need at the right moment, with a clear reason and a one-tap action.

The product must therefore optimize for **meaningful actions completed**, not feed consumption or screen time.

## 2. The core compounding loop

1. **Signal** — User supplies or generates identity, skills, interests, location tier, goals, project activity, community activity, and availability signals.
2. **Match** — BELONG ranks people + opportunities using affinity, context, proximity tier, urgency, trust, and predicted actionability.
3. **Explain** — Every recommendation says why it matters: shared skill, shared mission, nearby need, complementary capability, mutual community, etc.
4. **Act** — User takes a low-friction action: Connect, Collaborate, Help, Join, Attend, Mentor, Fund, Message.
5. **Outcome** — BELONG records whether the action produced a response, collaboration, completed task, project milestone, event attendance, or impact receipt.
6. **Learn** — Ranking improves from outcomes, not clicks alone.
7. **Reputation** — Useful completed actions increase trust and contribution history.
8. **Unlock** — Better reputation and richer signals improve future matches.

This is the BELONG network effect.

## 3. Immediate product wedge: Right Person / Right Action / Right Now

The next product milestone is **BELONG Signal Engine V1**.

It should power a unified recommendation stream across People, Projects, Missions/Needs, Communities, and Events.

Each recommendation must expose:

- `subjectType`
- `subjectId`
- `score`
- `reasonCodes[]`
- `reasonText[]`
- `locationTier`
- `urgency`
- `trustSignal`
- `primaryAction`
- `secondaryActions[]`
- `expiresAt` when applicable

No opaque AI recommendation is acceptable. Recommendations must be explainable and deterministic enough to test.

## 4. Ranking V1

Use existing data first. No schema expansion is required for the first pass if existing domain objects provide sufficient signals.

Suggested normalized components:

- affinity: 0–1
- context: 0–1
- proximity: 0–1 using privacy-safe categorical location matching
- urgency: 0–1
- trust: 0–1
- actionability: 0–1

Initial score:

`score = 0.30*affinity + 0.20*context + 0.15*proximity + 0.15*urgency + 0.10*trust + 0.10*actionability`

Weights are configuration, not UI constants.

Hard gates override score:

- blocked / hidden / not discoverable => exclude
- location opt-out => no proximity contribution or nearby notification
- already completed / expired opportunity => exclude
- self recommendation => exclude where inappropriate

## 5. Notification intelligence

Notifications become a delivery channel for high-confidence recommendations, not generic activity noise.

V1 notification families:

- **Nearby aligned person** — “Marie is in your area and shares your Community Builder focus.”
- **Skill needed nearby** — “A project in your area needs Design — one of your skills.”
- **Complementary builder** — “Mateo is building in a space aligned with your current mission.”
- **Community momentum** — “A community you belong to has a concrete need you can help complete.”
- **Time-sensitive action** — “An event aligned with your interests is happening soon.”

Rules:

- explicit reason in every recommendation
- location discovery opt-in
- categorical location only in client UI; never raw coordinates
- cooldown per recommendation family
- deduplicate subjects
- no notification when confidence is below threshold
- user can tune or disable recommendation families

## 6. Today / World integration

The World is the emotional visualization layer. The Signal Engine is the intelligence beneath it.

The home experience should answer three questions immediately:

1. **What matters now?**
2. **Who should I meet?**
3. **Where can I make progress or impact today?**

The AI Companion should consume ranked recommendations and explain them conversationally; it should not invent independent suggestions disconnected from platform state.

## 7. Story Deck role

The Story Deck is not merely a profile viewer. It is the conversion surface from recommendation to human action.

For every surfaced person:

- show authentic story/media when available
- show the strongest truthful match reasons
- show relevant shared context
- show privacy-safe location alignment when opted in
- make the primary action obvious
- measure whether the recommendation becomes a meaningful interaction

The deck should not add filler to sparse profiles.

## 8. Outcome graph

BELONG must begin treating actions as a graph:

`Person -> Action -> Person/Project/Community/Event -> Outcome -> Impact`

The long-term moat is not the content graph. It is the **human potential + collaboration + outcome graph**.

Future ranking should learn which combinations of people, skills, missions, communities, and timing produce successful outcomes.

## 9. North-star metrics

Primary:

**Weekly Meaningful Actions (WMA)** — unique users completing at least one meaningful action with a measurable downstream result.

Supporting:

- recommendation -> action conversion
- action -> response conversion
- response -> collaboration conversion
- collaboration -> completed outcome conversion
- 7-day and 30-day returning contributors
- successful matches per active user
- time to first meaningful action
- percentage of recommendations with explicit reason
- notification -> meaningful action conversion

Do not optimize primarily for time spent, raw likes, raw impressions, or infinite-scroll consumption.

## 10. Economic model

Monetization should sit on top of value creation rather than attention extraction.

Potential layers, introduced only after the core loop proves useful:

1. **BELONG Pro** — advanced intelligence, opportunity matching, builder tools, professional identity, deeper analytics.
2. **Organizations** — communities, nonprofits, schools, companies, municipalities: verified spaces, matching, missions, impact analytics, recruiting/volunteer coordination.
3. **Success / transaction layer** — provider services, paid opportunities, project services, marketplace transactions, funding flows where appropriate.
4. **Sponsored opportunities** — only when aligned and explicitly labeled; ranking integrity must not be sold.
5. **Impact infrastructure** — verified impact reporting and coordination tools for institutions.

Do not introduce creator payouts based primarily on addictive engagement. Reward verified contribution and outcomes instead.

## 11. 30-day execution order

### Phase A — Signal Engine foundation

- Create typed recommendation model.
- Create deterministic ranking functions.
- Add reason-code generation.
- Add privacy-safe location tier contribution.
- Add tests for ranking, exclusion, privacy, and reason provenance.

### Phase B — Unified action surfaces

- Feed ranked People into Story Deck.
- Feed ranked Projects/Needs/Events into Discover.
- Replace generic AI Companion suggestions with Signal Engine recommendations.
- Add “Why this?” explanation affordance.

### Phase C — Smart notification loop

- Generate in-app recommendation notifications from high-confidence signals.
- Add dedupe + cooldown.
- Add preference controls.
- Record notification -> action attribution.

### Phase D — Outcome instrumentation

- Define meaningful action events.
- Track recommendation -> action -> outcome funnel.
- Add internal metrics view.
- Use outcome data to tune ranking weights.

## 12. Kill list

Until the loop above is measurable, avoid major work on:

- decorative new dashboard modules
- additional navigation sections without a proven user job
- generic gamification
- follower-count mechanics
- infinite-feed engagement tricks
- speculative blockchain/token layers
- broad marketplace expansion
- complex geographic tracking
- AI features without platform-grounded context

## 13. Acceptance criterion for the next milestone

A user opens BELONG and, within 60 seconds, can understand and act on at least one high-quality recommendation that answers:

> Why this person/project/action, why me, and why now?

The recommendation must be grounded in real BELONG data, privacy-safe, explainable, actionable, and measurable.

That is the next product milestone.