import type { Concept } from "./anatomy";

/** Default number of results the visible search panel shows. */
export const SEARCH_LIMIT = 80;
/** Default number of results returned to an agent tool call. */
export const AGENT_SEARCH_LIMIT = 30;

/**
 * Relevance tiers, best first. Anatomical names are highly repetitive
 * ("heart", "wall of heart", "region of wall of heart"), so ordering by name
 * length alone buries the structure a reader actually asked for: it ranks
 * "tibialis anterior" above "tibia" when both match, and it cannot tell a
 * name match from an incidental source-identifier match.
 */
const EXACT_NAME = 0;
const EXACT_ID = 1;
const NAME_PREFIX = 2;
const WORD_BOUNDARY = 3;
const NAME_SUBSTRING = 4;
const ID_SUBSTRING = 5;
const NO_MATCH = 6;

/** Where `term` sits inside `name`, as a relevance tier. */
function nameTier(name: string, term: string): number {
  if (name === term) return EXACT_NAME;
  const at = name.indexOf(term);
  if (at < 0) return NO_MATCH;
  if (at === 0) return NAME_PREFIX;
  // A match that starts a word ("left tibia") reads as the same structure;
  // one that starts mid-word ("iliotibial") usually does not.
  return /[\s\-(,/]/.test(name.charAt(at - 1)) ? WORD_BOUNDARY : NAME_SUBSTRING;
}

function tierOf(concept: Concept, term: string): number {
  const tier = nameTier(concept.name.toLowerCase(), term);
  if (tier !== NO_MATCH) return tier;
  const id = concept.id.toLowerCase();
  if (id === term) return EXACT_ID;
  return id.includes(term) ? ID_SUBSTRING : NO_MATCH;
}

/**
 * Rank concepts against a free-text query.
 *
 * Ordering is total and deterministic: relevance tier, then the shorter name
 * (the more specific structure of a repetitive family), then name, then id.
 * The visible search panel and the agent tools both call this so that asking
 * for "heart" returns the heart in either surface.
 */
export function rankConcepts(concepts: Concept[], query: string, limit = SEARCH_LIMIT): Concept[] {
  const term = query.toLowerCase().trim();
  if (!term) return [];
  const matches: { concept: Concept; tier: number }[] = [];
  for (const concept of concepts) {
    const tier = tierOf(concept, term);
    if (tier !== NO_MATCH) matches.push({ concept, tier });
  }
  matches.sort(
    (a, b) =>
      a.tier - b.tier ||
      a.concept.name.length - b.concept.name.length ||
      a.concept.name.localeCompare(b.concept.name) ||
      a.concept.id.localeCompare(b.concept.id),
  );
  return matches.slice(0, limit).map((m) => m.concept);
}

/** Structures offered before the reader has typed anything. */
export const SUGGESTED = [
  "heart",
  "brain",
  "liver",
  "stomach",
  "spleen",
  "pancreas",
  "urinary bladder",
  "trachea",
] as const;

/** The suggested starting points, in the order listed, skipping any absent from the atlas. */
export function suggestedConcepts(concepts: Concept[]): Concept[] {
  const byName = new Map(concepts.map((c) => [c.name.toLowerCase(), c]));
  return SUGGESTED.map((name) => byName.get(name)).filter((c): c is Concept => !!c);
}
