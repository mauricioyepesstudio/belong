# BELONG Proof Protocol

**Status:** Product doctrine / implementation blueprint
**Purpose:** Turn disagreement, claims, promises, and social positions into structured evidence, experiments, outcomes, and learning without turning BELONG into an ideological referee.

## 1. Core idea

BELONG should not ask users to stop believing strongly.

BELONG should ask:

> What would count as evidence that your claim is true, false, incomplete, or context-dependent?

The product goal is not to manufacture "absolute truth" for complex social questions. Many claims are normative, causal, probabilistic, or value-based and cannot be proven in the same way.

The goal is to make claims **testable, inspectable, falsifiable where possible, and accountable to outcomes**.

## 2. The loop

CLAIM -> CHALLENGE -> PROOF STANDARD -> ACTION / EXPERIMENT -> EVIDENCE -> REVIEW -> OUTCOME -> LEARNING -> IMPACT

Every stage must preserve the dignity of the people involved.

Rule:

> Challenge the claim. Test the solution. Never dehumanize the person.

## 3. Claim types

BELONG must classify claims before evaluating them.

### FACTUAL
Example: "This program served 10,000 people."

Can be evaluated against records, sources, receipts, timestamps, and independent confirmation.

### CAUSAL
Example: "This policy reduced homelessness."

Requires a defined outcome, baseline, timeframe, comparison, confounders, and appropriate evidence.

### PREDICTIVE
Example: "This intervention will reduce emergency-room visits by 20% in six months."

Requires a deadline and measurable prediction before the outcome is known.

### NORMATIVE
Example: "Healthcare should be free."

Cannot be objectively proven as a value statement. BELONG should separate the value claim from testable implementation claims such as cost, access, wait times, outcomes, or public preference.

### PERSONAL / IDENTITY
Example: "This is what I value" or "this is how I identify."

Not subject to public proof contests merely because another person disagrees.

### COMMITMENT
Example: "Our company will fund 1,000 scholarships by June."

Evaluated by promised scope, deadline, completion, and evidence.

### CAPABILITY
Example: "Our team can build affordable emergency housing faster."

Can become a Challenge with defined requirements and outcome criteria.

## 4. Proof Standard

A Challenge must define success before execution whenever possible.

Required fields:

- claim
- claim type
- problem being addressed
- hypothesis / proposed solution
- outcome metrics
- baseline
- deadline
- scope
- evidence requirements
- known limitations
- who can participate
- who can review
- conflicts of interest where relevant

For subjective or normative claims, BELONG must not label a universal winner. It can report measured outcomes and tradeoffs.

## 5. Evidence states

Evidence should carry provenance rather than a single binary "verified" badge.

Possible states:

- SELF_REPORTED
- PARTICIPANT_RECORDED
- OWNER_CONFIRMED
- ORGANIZATION_CONFIRMED
- MULTI_PARTY_CONFIRMED
- EXTERNAL_SOURCE_LINKED
- INDEPENDENTLY_REVIEWED
- DISPUTED
- INCOMPLETE
- RETRACTED

The UI must explain what a state means.

No state implies philosophical or ideological correctness.

## 6. Result states

A Challenge can resolve to:

- SUPPORTED
- PARTIALLY_SUPPORTED
- NOT_SUPPORTED
- MIXED
- INCONCLUSIVE
- FAILED_TO_COMPLETE
- WITHDRAWN

"Not supported" is not a moral judgment about the person who proposed the idea.

Changing position after evidence should be treated as intellectual growth, not humiliation.

## 7. Counter-challenges

A competing viewpoint should be able to create a different approach to the same outcome.

Example:

Question: What is the best way to reduce food insecurity in City X?

Approach A: public program
Approach B: private-sector coalition
Approach C: community cooperative
Approach D: hybrid model

Each approach defines the same or comparable core outcomes where possible.

BELONG displays tradeoffs rather than forcing a partisan winner.

## 8. Reputation without social credit

BELONG must never assign a single score representing a person's human worth.

Contextual reputation can include:

- commitment follow-through
- evidence quality
- collaboration reliability
- domain expertise
- successful projects
- bridge-building across different groups
- correction / retraction behavior
- transparent acknowledgment of failed predictions

A user should be able to be highly trusted in one domain and unknown in another.

## 9. Bridge Building

One of BELONG's strongest status signals should be demonstrated ability to collaborate across meaningful differences.

Examples:

- cross-community collaboration
- competing teams sharing useful evidence
- joint solution after disagreement
- respectful challenge completion
- public correction after new evidence

BELONG should reward constructive disagreement, not ideological conformity.

## 10. Disaster and crisis mode

For emergencies, the protocol becomes operational:

NEED -> CLAIM / OFFER -> VERIFIED CAPACITY -> TASK -> COMPLETION -> RECEIPT -> IMPACT

Examples:

- "We can deliver 5,000 meals in 24 hours."
- "We have 20 available trucks."
- "This shelter has 120 beds available."

Crisis claims require timestamps and expiration because stale information can be harmful.

BELONG should prioritize coordination and provenance over debate during urgent response.

## 11. Public figures, companies, governments, creators

Public commitments can be tracked when they are voluntarily created in BELONG or based on clearly attributable public statements under appropriate product/legal rules.

A Public Commitment card may show:

PROMISED
IN PROGRESS
COMPLETED
PARTIAL
NOT COMPLETED
DISPUTED

The platform should present evidence and status without organizing harassment against the person or institution.

## 12. Product objects

### Claim
The proposition being asserted.

### Challenge
A structured attempt to test or demonstrate a claim.

### ProofStandard
Success criteria and evidence requirements.

### EvidenceItem
A provenance-carrying piece of evidence.

### Approach
One proposed method for addressing the problem.

### Outcome
Measured result.

### Review
Structured critique or confirmation.

### ImpactReceipt
Human-readable evidence summary after completion.

### Commitment
A time-bound public promise.

### PositionChange
A voluntary record that a user's view evolved after evidence or experience.

## 13. UX principle

Every controversial Claim should offer productive paths:

- SEE EVIDENCE
- SUPPORT WITH EVIDENCE
- CHALLENGE CLAIM
- PROPOSE AN APPROACH
- JOIN AN APPROACH
- REVIEW RESULTS
- CHANGE MY POSITION

The product should make constructive action easier than hostile reply behavior.

## 14. Anti-manipulation rules

- no vote brigading as proof
- likes are not evidence
- follower count is not evidence
- wealth is not evidence
- virality is not evidence
- AI-generated text is not evidence by itself
- source popularity is not equivalent to source quality
- edited media must disclose material alteration where known
- disputed evidence remains visibly disputed
- deleted/retracted evidence must leave an audit-safe status record when appropriate

## 15. AI role

AI may:

- classify claim type
- identify missing proof criteria
- summarize evidence
- surface contradictions
- compare approaches
- identify unsupported leaps
- suggest measurable outcomes
- detect duplicate claims / challenges
- translate arguments across languages

AI must not:

- declare ideological truth based solely on model opinion
- fabricate evidence
- hide uncertainty
- assign human worth
- secretly privilege political viewpoints

## 16. Aspirational status layer

BELONG should make intellectual honesty and real-world execution desirable.

Prestigious signals can include:

- Promise kept
- Challenge completed
- Evidence strengthened
- Position responsibly updated
- Cross-view collaboration
- Outcome replicated
- Community problem measurably improved

The aspiration is not "I won the argument."

It is:

> I believed something strongly enough to test it, learned from the result, and left the world with better evidence than I found it.

## 17. North-star product loop

WATCH -> QUESTION -> CHALLENGE -> SHOW UP -> BUILD -> MEASURE -> PROVE / LEARN -> SHARE -> INSPIRE

BELONG's cultural objective:

> Don't win the argument. Move the world.

## 18. Implementation sequence

### V1 — Claims + proof standard
- typed Claim model
- claim types
- proof-standard builder
- evidence states
- result states
- Challenge creation UI

### V1.1 — Approaches + participation
- competing approaches
- team participation
- Show Up actions
- progress timeline

### V1.2 — Evidence + review
- evidence submission
- provenance labels
- disputes
- structured review

### V1.3 — Outcomes + Impact Receipt
- outcome metrics
- final status
- receipt generation
- shareable result card

### V1.4 — Reputation + learning
- contextual reliability
- commitment follow-through
- bridge-building evidence
- position-change record

### V1.5 — Signal Engine integration
- recommend Claims/Challenges based on identity, intent, skills, location tier, urgency, and relevance

## 19. Acceptance test

A user should be able to take a polarizing statement and transform it into a constructive BELONG object that answers:

1. What exactly are you claiming?
2. What would count as evidence?
3. What are the competing approaches?
4. Who is willing to show up?
5. What happened?
6. What did we learn?
7. What changed in the real world?

If BELONG can do this reliably, disagreement becomes productive infrastructure rather than attention fuel.