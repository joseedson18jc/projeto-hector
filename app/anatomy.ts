export type SystemId =
  | "skeletal"
  | "muscular"
  | "arterial"
  | "venous"
  | "nervous"
  | "digestive"
  | "respiratory"
  | "urinary"
  | "reproductive"
  | "lymphatic"
  | "endocrine"
  | "integumentary"
  | "connective"
  | "sensory"
  | "cardiac";
export const SYSTEMS: { id: SystemId; name: string; color: string; description: string }[] = [
  {
    id: "skeletal",
    name: "Skeleton",
    color: "#e2d9ba",
    description:
      "Bones form the supporting framework of the body, protect organs, and provide attachment points for muscles. Their internal tissue also stores minerals and produces blood cells.",
  },
  {
    id: "muscular",
    name: "Muscles",
    color: "#a85b50",
    description:
      "Skeletal muscles generate movement by pulling on their attachments. Together with tendons, they move joints, stabilize posture, and produce heat.",
  },
  {
    id: "cardiac",
    name: "Heart",
    color: "#b96760",
    description:
      "The heart is a muscular pump with four chambers. Its valves direct blood forward through the pulmonary and systemic circuits.",
  },
  {
    id: "sensory",
    name: "Sensory organs",
    color: "#b0c8ce",
    description:
      "These structures contribute to special senses, including sight, hearing, and balance. Their specialized tissues detect stimuli and work with the nervous system to convey information.",
  },
  {
    id: "arterial",
    name: "Arteries",
    color: "#c05245",
    description:
      "The heart drives blood through the circulation. Arteries carry blood away from the heart to supply tissues or, in the pulmonary circuit, to the lungs.",
  },
  {
    id: "venous",
    name: "Veins",
    color: "#527c9f",
    description:
      "Veins return blood toward the heart. Superficial and deep networks collect blood from the tissues; the pulmonary veins bring oxygenated blood back from the lungs.",
  },
  {
    id: "nervous",
    name: "Nervous system",
    color: "#d8b565",
    description:
      "The brain, spinal cord, and peripheral nerves carry and process signals. They support sensation, movement, coordination, and automatic regulation of body functions.",
  },
  {
    id: "respiratory",
    name: "Respiratory",
    color: "#b98991",
    description:
      "The airways conduct air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing depends on pressure changes produced by respiratory muscles.",
  },
  {
    id: "digestive",
    name: "Digestive",
    color: "#b8916b",
    description:
      "The digestive tract breaks down food, absorbs nutrients and water, and moves waste onward. Accessory organs contribute bile and digestive enzymes.",
  },
  {
    id: "urinary",
    name: "Urinary",
    color: "#b47961",
    description:
      "The kidneys filter blood and regulate fluid, electrolyte, and acid–base balance. Urine travels through the ureters to the bladder and exits through the urethra.",
  },
  {
    id: "lymphatic",
    name: "Lymphatic",
    color: "#879f7c",
    description:
      "Lymphatic vessels return excess tissue fluid to the circulation. Lymph nodes and other lymphoid organs support immune surveillance and responses.",
  },
  {
    id: "endocrine",
    name: "Endocrine",
    color: "#c5a09a",
    description:
      "Endocrine organs release hormones into the blood to coordinate processes such as metabolism, growth, stress responses, and reproduction.",
  },
  {
    id: "reproductive",
    name: "Reproductive",
    color: "#bda098",
    description:
      "The male reproductive structures represented here contribute to sperm production, maturation, transport, and the production of sex hormones.",
  },
  {
    id: "integumentary",
    name: "Body surface",
    color: "#ba9b7d",
    description:
      "The body surface provides an outer anatomical reference. The integumentary system forms a protective barrier and contributes to sensation and temperature regulation.",
  },
  {
    id: "connective",
    name: "Connective tissue",
    color: "#aec3bb",
    description:
      "Cartilage, ligaments, and other connective tissues support, connect, and separate structures. Their roles include stabilizing joints and distributing mechanical loads.",
  },
];
export interface Part {
  id: string;
  name: string;
  conceptId: string;
  system: SystemId;
  chunk: number;
  positions: number;
  normals: number;
  indices: number;
  vertexCount: number;
  indexCount: number;
  bounds: [number[], number[]];
}
export interface Concept {
  id: string;
  name: string;
  elements: string[];
}
export interface Atlas {
  version: string;
  sex?: "male";
  source?: string;
  scope?: string;
  parts: Part[];
  concepts: Concept[];
  chunks: { url: string; bytes: number; gzip?: string; gzipBytes?: number }[];
  triangles: number;
}
export type View = "three-quarter" | "front" | "back" | "side";
export interface SceneState {
  inspectorOpen?: boolean;
  explode: number;
  visible: SystemId[];
  selected: string[];
  isolate: boolean;
  view: View;
  rotate: boolean;
  reset: number;
}
export const DEFAULT_VISIBLE: SystemId[] = [
  "cardiac",
  "sensory",
  "skeletal",
  "muscular",
  "arterial",
  "venous",
  "nervous",
  "respiratory",
  "digestive",
  "urinary",
  "lymphatic",
  "endocrine",
  "reproductive",
  "connective",
];
/**
 * Layer presets offered above the system list. Each preset is defined once, so
 * that the button's pressed state and the systems it applies cannot drift
 * apart. `null` means "every system the loaded atlas actually contains".
 */
export const PRESETS: { label: string; systems: SystemId[] | null }[] = [
  { label: "All", systems: null },
  { label: "Skeleton", systems: ["skeletal"] },
  {
    label: "Organs",
    systems: ["cardiac", "respiratory", "digestive", "urinary", "endocrine", "reproductive"],
  },
];

/** True when exactly `systems` are visible, in any order. */
export function isPresetActive(visible: SystemId[], systems: SystemId[]): boolean {
  if (visible.length !== systems.length) return false;
  const shown = new Set(visible);
  return systems.every((id) => shown.has(id));
}

export const EXPLANATIONS: Record<string, string> = {
  heart:
    "A muscular pump in the chest. Its right side sends blood to the lungs; its left side sends blood through the systemic circulation.",
  liver:
    "A large organ beneath the right side of the diaphragm. It processes absorbed nutrients, produces bile, and synthesizes many proteins carried in the blood.",
  brain:
    "The central organ of the nervous system. Its interconnected regions support perception, movement, memory, language, and the regulation of bodily functions.",
  stomach:
    "A muscular chamber between the esophagus and small intestine. It stores and mixes food with acid and enzymes before releasing it into the duodenum.",
  spleen:
    "A lymphoid organ in the upper left abdomen. It filters blood, removes aging blood cells, and participates in immune responses.",
  pancreas:
    "An abdominal organ with digestive and endocrine roles. It supplies enzymes to the small intestine and releases hormones including insulin and glucagon.",
  "urinary bladder":
    "A muscular reservoir in the pelvis that stores urine arriving from the kidneys through the ureters.",
  trachea:
    "The main airway connecting the larynx to the bronchi. Its cartilage supports keep the airway open during breathing.",
  diaphragm:
    "A broad muscle separating the chest and abdomen. When it contracts, it increases chest volume and helps draw air into the lungs.",
};
export function explanation(name: string, system: SystemId) {
  return (
    EXPLANATIONS[name.toLowerCase()] ?? SYSTEMS.find((s) => s.id === system)?.description ?? ""
  );
}

const SYSTEM_IDS: ReadonlySet<string> = new Set(SYSTEMS.map((s) => s.id));

/** True when `value` is a known display system. */
export function isSystemId(value: unknown): value is SystemId {
  return typeof value === "string" && SYSTEM_IDS.has(value);
}

function fail(detail: string): never {
  throw new Error(`The anatomy catalogue is not valid: ${detail}`);
}

function isFinitePair(value: unknown): value is [number[], number[]] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(
      (corner) =>
        Array.isArray(corner) && corner.length === 3 && corner.every((n) => Number.isFinite(n)),
    )
  );
}

/**
 * Validate a fetched manifest before the scene consumes it.
 *
 * The scene reads `parts` straight into typed-array views over the binary
 * chunks, so a truncated or mismatched manifest otherwise surfaces as an
 * opaque RangeError from deep inside geometry assembly. Checking the shape at
 * the boundary turns that into a message the reader can act on.
 */
export function parseAtlas(value: unknown): Atlas {
  if (!value || typeof value !== "object") fail("the file did not contain an object.");
  const atlas = value as Partial<Atlas>;
  if (!Array.isArray(atlas.parts) || atlas.parts.length === 0) fail("it lists no parts.");
  if (!Array.isArray(atlas.concepts)) fail("it lists no named concepts.");
  if (!Array.isArray(atlas.chunks) || atlas.chunks.length === 0) fail("it lists no geometry.");

  for (const [index, chunk] of atlas.chunks.entries()) {
    if (typeof chunk?.url !== "string" || !Number.isFinite(chunk?.bytes))
      fail(`chunk ${index} has no url or byte length.`);
  }
  const ids = new Set<string>();
  for (const part of atlas.parts) {
    if (typeof part?.id !== "string" || !part.id) fail("a part has no identifier.");
    if (ids.has(part.id)) fail(`part ${part.id} appears more than once.`);
    ids.add(part.id);
    if (typeof part.name !== "string" || !part.name.trim()) fail(`part ${part.id} has no name.`);
    if (!isSystemId(part.system)) fail(`part ${part.id} names an unknown system.`);
    const chunk = atlas.chunks[part.chunk];
    if (!Number.isInteger(part.chunk) || !chunk)
      fail(`part ${part.id} points at a missing geometry chunk.`);
    for (const field of ["positions", "normals", "indices", "vertexCount", "indexCount"] as const) {
      if (!Number.isSafeInteger(part[field]) || part[field] < 0)
        fail(`part ${part.id} has an invalid ${field}.`);
    }
    // The scene builds typed-array views straight over these offsets. An
    // unaligned offset or one that runs past the chunk throws a RangeError from
    // inside geometry assembly, which is the failure this function exists to
    // turn into something the reader can act on.
    const spans = [
      ["positions", part.positions, part.vertexCount * 3 * 4, 4],
      ["normals", part.normals, part.vertexCount * 3 * 2, 2],
      ["indices", part.indices, part.indexCount * 4, 4],
    ] as const;
    for (const [field, offset, byteLength, alignment] of spans) {
      if (offset % alignment !== 0)
        fail(`part ${part.id} has a ${field} offset that is not ${alignment}-byte aligned.`);
      if (offset + byteLength > chunk.bytes)
        fail(`part ${part.id} has a ${field} span that runs past its geometry chunk.`);
    }
    if (!isFinitePair(part.bounds)) fail(`part ${part.id} has invalid bounds.`);
  }
  for (const concept of atlas.concepts) {
    if (typeof concept?.id !== "string" || typeof concept?.name !== "string")
      fail("a concept has no identifier or name.");
    if (!Array.isArray(concept.elements) || concept.elements.length === 0)
      fail(`concept ${concept.id} references no parts.`);
    for (const element of concept.elements) {
      if (!ids.has(element)) fail(`concept ${concept.id} references missing part ${element}.`);
    }
  }
  return atlas as Atlas;
}
