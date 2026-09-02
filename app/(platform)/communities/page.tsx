import { permanentRedirect } from "next/navigation";

/** Compatibility alias; the canonical BELONG community hub remains /community. */
export default function CommunitiesPage() {
  permanentRedirect("/community");
}
