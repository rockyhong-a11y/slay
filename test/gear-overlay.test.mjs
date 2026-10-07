import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { GEAR_WEAR_ACTORS, gearWearAnchors } from "../src/gear-wear.js";
import { sdGearWearAnchors } from "../src/sd-gear-anchors.js";

test("every cartoon and SD wear overlay renders finite source-registered geometry and isolated masks", async () => {
  const server = await createServer({
    server: { middlewareMode: true, watch: null, hmr: false },
    appType: "custom",
    logLevel: "error",
  });
  try {
    const { GearWearOverlay } = await server.ssrLoadModule(
      "/src/GearWearOverlay.jsx",
    );
    for (const actor of GEAR_WEAR_ACTORS) {
      for (const condition of [
        "normal",
        "excited",
        "fiery",
        "frustrated",
        "tired",
        "groggy",
      ]) {
        const variants = [
          gearWearAnchors(actor, condition),
          ...[0, 1, 2].map((frame) => sdGearWearAnchors(actor, frame)),
        ];
        for (const anchors of variants) {
          const props = {
            actor,
            condition,
            anchors,
            mask: {
              src: "/assets/test.webp",
              width: 1774,
              height: 1500,
              x: -20,
              y: -35,
            },
          };
          const markup = renderToStaticMarkup(
            React.createElement(
              "div",
              null,
              React.createElement(GearWearOverlay, props),
              React.createElement(GearWearOverlay, props),
            ),
          );
          assert.doesNotMatch(markup, /NaN|Infinity|undefined/);
          if (["normal", "excited"].includes(condition)) {
            assert.doesNotMatch(markup, /<svg/);
            continue;
          }
          const masks = [...markup.matchAll(/<mask id="([^"]+)"/g)].map(
            (match) => match[1],
          );
          assert.equal(
            new Set(masks).size,
            2,
            `${actor}/${condition}: instances need independent masks`,
          );
          assert.match(markup, /mask-type:alpha/);
          assert.match(markup, /aria-hidden="true"/);
          assert.match(markup, /preserveAspectRatio="none"/);
          if (condition === "fiery")
            assert.doesNotMatch(markup, /data-gear-opening/);
          else assert.match(markup, /data-gear-opening="true"/);
          if (["tired", "groggy"].includes(condition))
            assert.match(markup, /data-gear-loose="true"/);
        }
      }
    }
  } finally {
    await server.close();
  }
});
