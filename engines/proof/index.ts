export {
  getActiveProofs,
  getApproachesForChallenges,
  getChallengesForClaim,
  getExecutionLinksForApproachIds,
  getProofClaim,
  deriveProofClaimStage,
  PROOF_CHALLENGE_TYPE_LABELS,
  PROOF_CLAIM_STAGE_LABELS,
  PROOF_CLAIM_TYPE_LABELS,
} from "@/lib/data/proof";

export { ProofScreen } from "./components/proof-screen";
export { ProofClaimDetailScreen } from "./components/proof-claim-detail-screen";
export { CreateChallengeModal } from "./components/create-challenge-modal";
export { CreateApproachModal } from "./components/create-approach-modal";
export { ShowUpModal } from "./components/show-up-modal";
