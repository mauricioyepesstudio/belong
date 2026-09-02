/**
 * Belong Score v1 — a give/receive reciprocity score computed from existing
 * social reaction/comment activity ("lo que diste frente a lo que recibiste").
 *
 * Not a vanity/popularity metric: posting or receiving more does not raise
 * the score unless it is matched by giving to others. Comments count for
 * more than reactions because they represent more effort.
 */

export interface BelongScoreCounts {
  givenReactions: number;
  givenComments: number;
  receivedReactions: number;
  receivedComments: number;
}

export interface BelongScoreResult {
  /** 0-100 ratio of giving vs. total (give + receive) activity. */
  score: number;
  /** Weighted "given" activity (reactions + comments * COMMENT_WEIGHT). */
  given: number;
  /** Weighted "received" activity (reactions + comments * COMMENT_WEIGHT). */
  received: number;
  /** Raw weighted activity volume (given + received), separate from the ratio. */
  volume: number;
}

/** Comments require more effort than reactions, so they carry more weight. */
export const BELONG_SCORE_COMMENT_WEIGHT = 2;

export function computeBelongScore(counts: BelongScoreCounts): BelongScoreResult {
  const given =
    counts.givenReactions + counts.givenComments * BELONG_SCORE_COMMENT_WEIGHT;
  const received =
    counts.receivedReactions + counts.receivedComments * BELONG_SCORE_COMMENT_WEIGHT;
  const volume = given + received;

  const score = Math.round((100 * given) / Math.max(1, volume));

  return { score, given, received, volume };
}
