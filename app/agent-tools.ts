import type { Atlas, Concept } from "./anatomy";
// Explicit extension: node --test strips types but does not rewrite import
// specifiers, so scripts/agent-tools.test.mjs can only load this module if its
// runtime imports resolve as written. Vite resolves the .ts extension too.
import { AGENT_SEARCH_LIMIT, rankConcepts } from "./search.ts";

type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => unknown;
};

function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Expected an object.");
  return input as Record<string, unknown>;
}

export function atlasTools(atlas: Atlas, inspect: (concept: Concept) => void): Tool[] {
  return [
    {
      name: "find_anatomy",
      description:
        "Find anatomical structures by name or source atlas identifier in this atlas. Results are ordered by relevance, most relevant first.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", minLength: 1 },
          limit: { type: "integer", minimum: 1, maximum: 200 },
        },
        required: ["query"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute(input) {
        const data = record(input);
        if (typeof data.query !== "string" || !data.query.trim())
          throw new Error("A nonempty query is required.");
        if (data.limit !== undefined && !Number.isInteger(data.limit))
          throw new Error("The limit must be a whole number.");
        const requested = typeof data.limit === "number" ? data.limit : AGENT_SEARCH_LIMIT;
        const limit = Math.min(200, Math.max(1, requested));
        // Shares the ranking used by the visible search panel, so that both
        // surfaces return the same structure for the same query.
        return rankConcepts(atlas.concepts, data.query, limit).map((c) => ({
          id: c.id,
          name: c.name,
          pieces: c.elements.length,
        }));
      },
    },
    {
      name: "inspect_anatomical_structure",
      description: "Select an atlas concept in the 3D anatomy and open its visible detail panel.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute(input) {
        const data = record(input);
        if (typeof data.id !== "string") throw new Error("An atlas identifier is required.");
        const concept = atlas.concepts.find((c) => c.id === data.id);
        if (!concept) throw new Error("That structure is not present in this atlas.");
        inspect(concept);
        return { id: concept.id, name: concept.name, selectedPieces: concept.elements.length };
      },
    },
  ];
}

/**
 * Register the optional WebMCP tools. Returns a cleanup function in every
 * case, including when the browser exposes no model context, so that callers
 * can use it directly as an effect teardown.
 */
export function registerAtlasTools(atlas: Atlas, inspect: (concept: Concept) => void): () => void {
  const context = (
    document as Document & {
      modelContext?: {
        registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void>;
      };
    }
  ).modelContext;
  const lifecycle = new AbortController();
  if (!context?.registerTool) return () => lifecycle.abort();
  for (const tool of atlasTools(atlas, inspect)) {
    try {
      void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(
        () => {},
      );
    } catch {
      /* Optional browser capability; the visible UI remains available. */
    }
  }
  return () => lifecycle.abort();
}
