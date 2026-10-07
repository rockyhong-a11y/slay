import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { GEAR_WEAR_ACTORS, gearWearAnchors } from "../src/gear-wear.js";
import { sdGearWearAnchors } from "../src/sd-gear-anchors.js";

test("every cartoon and SD wear overlay renders finite source-registered geometry and isolated masks", async () => {
  const server = await createServer({
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
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
          assert.match(markup, /data-gear-garment="upper"/);
          assert.match(markup, /data-gear-garment="lower"/);
          assert.match(markup, /data-gear-coverage="opaque-lining"/);
          if (condition === "fiery")
            assert.doesNotMatch(markup, /data-gear-opening/);
          else {
            assert.match(markup, /data-gear-opening="true"/);
            assert.equal(
              [...markup.matchAll(/data-gear-coverage="side-skin"/g)].length,
              4,
              `${actor}/${condition}: each copy has one skin opening per garment`,
            );
          }
          if (["fiery", "frustrated"].includes(condition)) {
            assert.doesNotMatch(markup, /data-gear-release=/);
          } else {
            assert.equal(
              [...markup.matchAll(/data-gear-deform="(?:strap|seam)"/g)].length,
              4,
              `${actor}/${condition}: upper and lower edges release independently`,
            );
            assert.match(
              markup,
              new RegExp(
                `data-gear-release="${condition === "groggy" ? "hanging" : "loosened"}"`,
              ),
            );
          }
          if (["tired", "groggy"].includes(condition))
            assert.match(markup, /data-gear-loose="true"/);
          if (condition === "groggy") {
            for (const area of ["upper", "lower"]) {
              assert.ok(
                [
                  ...markup.matchAll(
                    new RegExp(`data-gear-garment="${area}"`, "g"),
                  ),
                ].length >= 4,
                `${actor}: both copies must show at least two ${area} garment tears`,
              );
              assert.match(markup, new RegExp(`data-gear-flap="${area}"`));
            }
          }
        }
      }
    }
    for (const source of [
      gearWearAnchors("viper", "normal"),
      sdGearWearAnchors("viper", 0),
    ]) {
      const anchors = {
        ...source,
        zones: source.zones.map((zone) =>
          zone.kind === "garment" && zone.skin
            ? { ...zone, side: -1, skinColor: "#edb087", skinShadow: "#b57458" }
            : zone,
        ),
      };
      const healed = renderToStaticMarkup(
        React.createElement(GearWearOverlay, {
          actor: "viper",
          condition: "normal",
          anchors,
          vitals: { hp: 100, maxHp: 100, stress: 0, hype: 0, gearWearLevel: 4 },
        }),
      );
      assert.match(healed, /data-gear-level="4"/);
      assert.equal(
        [...healed.matchAll(/data-gear-release="hanging"/g)].length,
        2,
      );
      assert.equal(
        [...healed.matchAll(/data-gear-release-side="left"/g)].length,
        2,
      );
      assert.match(healed, /transform="scale\(-1 1\)"/);
      assert.match(healed, /stop-color="#edb087"/);
      assert.match(healed, /stop-color="#b57458"/);
      assert.equal(
        [...healed.matchAll(/data-gear-coverage="opaque-lining"/g)].length,
        2,
      );
      const ids = [...healed.matchAll(/\bid="([^"]+)"/g)].map(
        (match) => match[1],
      );
      assert.equal(new Set(ids).size, ids.length);
      for (const [, id] of healed.matchAll(/url\(#([^)]*)\)/g))
        assert.ok(ids.includes(id), id);
    }
  } finally {
    await server.close();
  }
});
