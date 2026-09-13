# Human Atlas

An interactive 3D anatomy explorer built with React, Three.js, and shadcn/ui. Take the BodyParts3D adult male reference apart into **2,234 individually selectable meshes**, explore **15 anatomical systems**, and search **3,432 named concepts**.

**[Explore the live demo](https://human-atlas-seven.vercel.app)**

## Explore

- Orbit, zoom, and select structures directly on the body.
- Toggle individual systems or use skeleton and organ presets.
- Move from assembled anatomy to a spaced inventory of every visible piece.
- Search anatomical names and source identifiers, ranked by relevance.
- Isolate a selected structure and read its details.
- Use compact controls and detail panels on mobile.

### Keyboard

The body is reachable with <kbd>Tab</kbd> and operable without a pointer.

| Key                                         | Action                                                |
| ------------------------------------------- | ----------------------------------------------------- |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> | Orbit the assembled body; pan the exploded inventory |
| <kbd>+</kbd> / <kbd>−</kbd>                 | Zoom in and out                                       |
| <kbd>Enter</kbd> or <kbd>Space</kbd>        | Inspect the structure at the centre of the view       |
| <kbd>/</kbd>                                | Open search                                           |
| <kbd>Esc</kbd>                              | Close the open panel                                  |

## Run locally

Requires Node.js 22.18 or newer, which is the first release that runs the `.ts`
test imports without a flag. No API keys or accounts are needed.

```sh
npm ci
npm run dev
```

Open http://localhost:3016. To build the static site, run `npm run build`; the output is in `dist/`.

## Validate

```sh
npm run verify
```

That runs everything CI runs, in order:

| Script                 | Covers                                                                         |
| ---------------------- | ------------------------------------------------------------------------------ |
| `npm run format:check` | oxfmt formatting                                                                |
| `npm run lint`         | oxlint, type-aware                                                              |
| `npm run check`        | `tsc --noEmit`                                                                  |
| `npm test`             | search ranking, exploded-layout packing, tap-versus-drag, and the agent tools    |
| `npm run validate`     | the anatomy manifest against its binary geometry                                |
| `npm run build`        | the production bundle                                                           |

`npm test` runs `node --test` over `scripts/*.test.mjs`: relevance ordering and
its regressions, nonoverlapping exploded layouts at desktop and phone aspect
ratios, layout determinism, tap versus orbit versus pinch versus cancelled
touch, and the agent tools' search, inspection, and input-validation contracts.

`npm run validate` checks the manifest against the chunks it points at: byte
lengths, gzip framing, buffer alignment and extents, index ranges, normal unit
length, bounds containment and ordering, known system ids, resolvable concept
ids, that every part is reachable from some concept, and the recorded
fingerprint in `scripts/atlas-expectations.json`. It takes any manifest as an
argument, so a rebuilt atlas can be validated before it is shipped.

Browser interaction checks have exercised selection, system controls, search,
isolation, rotation, keyboard orbit/zoom/inspect, and 390×844, 320×568, and
844×390 layouts. Physical-device performance and real multitouch hardware have
not been tested.

## Anatomy data

The current viewer uses **BodyParts3D 4.0**, an adult male reference anatomy, licensed **CC BY 4.0**. It does not represent every human structure or variation. Individual source meshes are distinct from named concepts, which may group multiple meshes. Descriptions distinguish general system context from individual organ explanations.

Geometry is simplified for browser performance while retaining every source mesh. The packaged model contains 2,288,268 triangles and downloads approximately 33 MB of compressed geometry. Full credits, source links, and adaptation details are in [ATTRIBUTION.md](public/ATTRIBUTION.md).

This is an educational explorer, not a diagnostic or surgical tool.

## How it works

Geometry is merged into batches. Per-structure GPU textures control translation, visibility, and selection, while component geometry supports accurate picking. Exploded layouts pack only the visible pieces. Rendering updates when the scene changes; orbit controls remain responsive without thousands of separate draw calls.

Picking sorts the bounding boxes the ray enters by entry distance and stops
once a hit is nearer than the next box can contain, so a tap tests triangles in
a few structures rather than every visible mesh along the ray.

The visible search panel and the WebMCP tools share one ranking function
(`app/search.ts`), so both answer a query with the same structure in the same
order.

The optional WebMCP tools expose anatomy search and inspection in compatible browsers. The visible interface works without them.

## Rebuilding geometry

The repository includes browser-ready geometry. Rebuilding it is optional: obtain the official BodyParts3D OBJ archive and English metadata tables, prepare the joined concepts and display-system mappings, run `scripts/convert-anatomy.py`, then `node scripts/optimize-anatomy.mjs` and `node scripts/compress-models.mjs`. Simplification uses a 0.2% relative error limit per structure.

`optimize-anatomy.mjs` takes an optional `--weld`, which merges coincident
vertices and averages their source normals before simplification. Exporters
that duplicate vertices at every triangle boundary need it; the BodyParts3D
OBJ archive does not. `--prefix=` names the emitted chunks.

After rebuilding, update `scripts/atlas-expectations.json` to the new totals so
that `npm run validate` continues to guard against silent pipeline regressions.

## Deploy

Import this repository into Vercel as a Vite project. The included `vercel.json` configures `npm ci`, `npm run build`, and the `dist` output directory. It can also be served by a static host.

## License

Original application code is released under the [MIT License](LICENSE). **The anatomy data has its own CC BY 4.0 license**; preserve the attribution when redistributing it. Third-party dependencies retain their respective licenses.

Issues and pull requests are welcome. Please include reproduction steps and browser/device details for interaction problems.
