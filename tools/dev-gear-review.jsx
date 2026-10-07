// Independent Vite development entry: no App, combat actions, or saved state.
import React, { useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Artwork } from "../src/Artwork.jsx";
import { SDArtwork } from "../src/SDArtwork.jsx";
import {
  GEAR_WEAR_ACTORS,
  GEAR_WEAR_STATES,
  gearWearAnchors,
} from "../src/gear-wear.js";
import { sdGearWearAnchors } from "../src/sd-gear-anchors.js";

const stages = ["normal", "fiery", "frustrated", "tired", "groggy"];
const sdPoses = ["idle", "strike", "hurt"];
const query = new URLSearchParams(window.location.search);
const initialStyle = query.get("style") === "sd" ? "sd" : "classic";
const sourcePoses = (style) => (style === "sd" ? sdPoses : GEAR_WEAR_STATES);
const sdPoseFor = (condition) =>
  ["tired", "groggy"].includes(condition) ? "hurt" : "idle";

const styles = `
  :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, sans-serif; color: #eee; background: #12141a; }
  * { box-sizing: border-box; }
  body { margin: 0; }
  button, select, input { font: inherit; }
  button, select { background: #242934; border: 1px solid #525967; color: #fff; border-radius: 5px; padding: 6px 9px; }
  button { cursor: pointer; }
  .review-header { position: sticky; top: 0; z-index: 10; padding: 15px 20px; background: #171a21f5; border-bottom: 1px solid #454a55; backdrop-filter: blur(8px); }
  h1 { margin: 0 0 7px; font-size: 21px; }
  .review-header p { color: #b7bdc8; font-size: 12px; margin: 0 0 12px; }
  .review-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; }
  .review-controls label { display: flex; align-items: center; gap: 7px; font-size: 13px; }
  .review-controls input { width: 17px; height: 17px; accent-color: #e9a766; }
  .review-summary { color: #d3af80; font-size: 12px; margin-top: 10px; }
  main { padding: 12px 20px 40px; }
  .review-row { margin: 16px 0 28px; }
  .review-row h2 { margin: 0 0 9px; font-size: 15px; color: #ddd2c4; }
  .review-grid-scroll { overflow-x: auto; }
  .review-grid { display: grid; grid-template-columns: repeat(5, minmax(200px, 1fr)); gap: 10px; min-width: 1040px; }
  .review-card { border: 1px solid #414650; border-radius: 6px; overflow: hidden; background: #20242d; }
  .review-card h3 { display: flex; justify-content: space-between; padding: 9px 11px; margin: 0; font-size: 13px; background: #2c313c; }
  .review-card h3 span { color: #e2bb8b; }
  .review-source { margin: 0; padding: 6px 10px; color: #aeb7c7; font: 11px ui-monospace, monospace; }
  .review-figure, .review-crop { background-color: #373b42; background-image: linear-gradient(45deg, #ffffff06 25%, transparent 25%), linear-gradient(-45deg, #ffffff06 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ffffff06 75%), linear-gradient(-45deg, transparent 75%, #ffffff06 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0; }
  .review-figure { position: relative; height: 250px; }
  .review-crop-label { display: flex; justify-content: space-between; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; padding: 5px 9px; border-top: 1px solid #454a55; color: #c8cfda; }
  .review-crop-label[data-missing=true] { color: #ff9b8e; }
  .review-crop { position: relative; height: 144px; overflow: hidden; }
  .review-crop-image { position: absolute; }
  .review-hide-gear .gear-wear-overlay { visibility: hidden; }
  .review-card .wear-moisture-catchlight { animation: none; }
  .review-footer { color: #aab4c6; font-size: 12px; line-height: 1.7; margin-top: 24px; }
  @media print { .review-header { position: static; } .review-row { break-inside: avoid; } .review-grid { min-width: 0; grid-template-columns: repeat(5, 1fr); } .review-controls { display: none; } }
`;

function cropFrame(anchors, area, style) {
  const [width, height] = anchors.viewBox;
  const zones = anchors.zones.filter(
    (zone) => zone.kind === "garment" && zone.area === area,
  );
  if (!zones.length) {
    return {
      x: width * 0.5,
      y: height * (area === "upper" ? (style === "sd" ? 0.42 : 0.3) : 0.51),
      field: width * 0.48,
      count: 0,
    };
  }
  const bounds = zones.map((zone) => {
    const radians = (zone.angle * Math.PI) / 180;
    const dx =
      (Math.abs(Math.cos(radians)) * zone.width +
        Math.abs(Math.sin(radians)) * zone.height) /
      2;
    const dy =
      (Math.abs(Math.sin(radians)) * zone.width +
        Math.abs(Math.cos(radians)) * zone.height) /
      2;
    return [zone.x - dx, zone.y - dy, zone.x + dx, zone.y + dy];
  });
  const left = Math.min(...bounds.map((b) => b[0]));
  const top = Math.min(...bounds.map((b) => b[1]));
  const right = Math.max(...bounds.map((b) => b[2]));
  const bottom = Math.max(...bounds.map((b) => b[3]));
  return {
    x: (left + right) / 2,
    y: (top + bottom) / 2,
    field: Math.max(width * 0.32, (right - left) * 1.6, (bottom - top) * 2.5),
    count: zones.length,
  };
}

function GarmentCrop({ actor, condition, pose, style, level, area, mirrored }) {
  const box = useRef(null);
  const [width, setWidth] = useState(210);
  const anchors =
    style === "sd"
      ? sdGearWearAnchors(actor, pose)
      : gearWearAnchors(actor, condition);
  const frame = cropFrame(anchors, area, style);
  const [sourceWidth, sourceHeight] = anchors.viewBox;
  const scale = width / frame.field;
  useLayoutEffect(() => {
    const node = box.current;
    const update = () => setWidth(node.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <div className="review-crop-label" data-missing={!frame.count}>
        <strong>{area} garment</strong>
        <span>{frame.count} zones</span>
      </div>
      <div className="review-crop" ref={box} data-review-crop={area}>
        {style === "sd" ? (
          <SDArtwork
            actor={actor}
            pose={pose}
            condition={condition}
            gearLevel={level}
            portrait
            portraitCenter={[frame.x / sourceWidth, frame.y / sourceHeight]}
            portraitWidth={frame.field / sourceWidth}
            mirrored={mirrored}
            alt={`${actor} ${area} garment, level ${level}`}
          />
        ) : (
          <div
            className="review-crop-image"
            style={{
              width: sourceWidth * scale,
              height: sourceHeight * scale,
              left:
                width / 2 -
                (mirrored ? sourceWidth - frame.x : frame.x) * scale,
              top: 72 - frame.y * scale,
            }}
          >
            <Artwork
              art={`fighters/states/${actor}-${condition}.webp`}
              condition={condition}
              gearLevel={level}
              fit="fill"
              mirrored={mirrored}
              alt={`${actor} ${area} garment, level ${level}`}
            />
          </div>
        )}
      </div>
    </>
  );
}

function ReviewRow({ actor, style, source, crops, mirrored }) {
  return (
    <section
      className="review-row"
      data-review-actor={actor}
      data-review-source={source}
    >
      <h2>
        {actor.toUpperCase()} · {style === "sd" ? "SD" : "Cartoon"} · {source}
      </h2>
      <div className="review-grid-scroll">
        <div className="review-grid">
          {stages.map((stage, level) => {
            const condition =
              style === "classic" && source !== "progression" ? source : stage;
            const pose =
              style === "sd" && source !== "progression"
                ? source
                : sdPoseFor(condition);
            return (
              <article
                className="review-card"
                key={level}
                data-review-level={level}
              >
                <h3>
                  {level === 0 ? "Original gear" : stage}
                  <span>{level}/4</span>
                </h3>
                <p className="review-source">
                  {style === "sd" ? pose : condition} source
                </p>
                <div className="review-figure">
                  {style === "sd" ? (
                    <SDArtwork
                      actor={actor}
                      pose={pose}
                      condition={condition}
                      gearLevel={level}
                      mirrored={mirrored}
                      alt={`${actor}, level ${level}`}
                    />
                  ) : (
                    <Artwork
                      art={`fighters/states/${actor}-${condition}.webp`}
                      condition={condition}
                      gearLevel={level}
                      mirrored={mirrored}
                      alt={`${actor}, level ${level}`}
                    />
                  )}
                </div>
                {crops &&
                  ["upper", "lower"].map((area) => (
                    <GarmentCrop
                      key={area}
                      actor={actor}
                      condition={condition}
                      pose={pose}
                      style={style}
                      level={level}
                      area={area}
                      mirrored={mirrored}
                    />
                  ))}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Review() {
  const requestedActor = query.get("actor");
  const [actor, setActor] = useState(
    GEAR_WEAR_ACTORS.includes(requestedActor) || requestedActor === "all"
      ? requestedActor
      : "raven",
  );
  const [style, setStyle] = useState(initialStyle);
  const [source, setSource] = useState(
    ["progression", "all", ...sourcePoses(initialStyle)].includes(
      query.get("pose"),
    )
      ? query.get("pose")
      : "progression",
  );
  const [crops, setCrops] = useState(query.get("crops") !== "0");
  const [mirrored, setMirrored] = useState(query.get("mirror") === "1");
  const [hideGear, setHideGear] = useState(false);
  const actors = actor === "all" ? GEAR_WEAR_ACTORS : [actor];
  const poses = source === "all" ? sourcePoses(style) : [source];
  const moveActor = (step) => {
    const current = Math.max(0, GEAR_WEAR_ACTORS.indexOf(actor));
    setActor(
      GEAR_WEAR_ACTORS[
        (current + step + GEAR_WEAR_ACTORS.length) % GEAR_WEAR_ACTORS.length
      ],
    );
  };
  return (
    <div className={hideGear ? "review-hide-gear" : undefined}>
      <style>{styles}</style>
      <header className="review-header">
        <h1>SLAY · Garment comparison</h1>
        <p>
          Development-only view of the real artwork and renderer. No game state
          or browser storage is read or written.
        </p>
        <div className="review-controls">
          <label>
            Actor
            <select
              value={actor}
              onChange={(event) => setActor(event.target.value)}
            >
              {GEAR_WEAR_ACTORS.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
              <option value="all">All 10 actors</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => moveActor(-1)}
            aria-label="Previous actor"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => moveActor(1)}
            aria-label="Next actor"
          >
            →
          </button>
          <label>
            Style
            <select
              value={style}
              onChange={(event) => {
                setStyle(event.target.value);
                setSource("progression");
              }}
            >
              <option value="classic">Cartoon</option>
              <option value="sd">SD</option>
            </select>
          </label>
          <label>
            Source pose
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
            >
              <option value="progression">Follow condition progression</option>
              {sourcePoses(style).map((pose) => (
                <option key={pose} value={pose}>
                  {pose} · fixed source
                </option>
              ))}
              <option value="all">All source poses</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={crops}
              onChange={(event) => setCrops(event.target.checked)}
            />
            Upper/lower crops
          </label>
          <label>
            <input
              type="checkbox"
              checked={mirrored}
              onChange={(event) => setMirrored(event.target.checked)}
            />
            Mirror
          </label>
          <label>
            <input
              type="checkbox"
              checked={hideGear}
              onChange={(event) => setHideGear(event.target.checked)}
            />
            Hide gear · same source
          </label>
        </div>
        <div className="review-summary">
          {actors.length * poses.length} rows ·{" "}
          {actors.length * poses.length * 5} figures · fixed source isolates
          tear progression; all source poses includes excited cartoon and strike
          SD anchors.
        </div>
      </header>
      <main>
        {actors.flatMap((id) =>
          poses.map((pose) => (
            <ReviewRow
              key={`${style}-${id}-${pose}`}
              actor={id}
              style={style}
              source={pose}
              crops={crops}
              mirrored={mirrored}
            />
          )),
        )}
        <p className="review-footer">
          Inspect upper and lower garment visibility, lining coverage, fabric
          colours, and overlap with hands or hair. At 250px body height, each
          stage should remain readable. Use fixed source and Hide gear to
          compare exactly the same pose. All actors + all source poses covers 60
          cartoon illustrations or 30 SD atlas frames.
        </p>
      </main>
    </div>
  );
}

if (import.meta.env.DEV) {
  const root =
    import.meta.hot?.data.reviewRoot ??
    createRoot(document.getElementById("root"));
  if (import.meta.hot) import.meta.hot.data.reviewRoot = root;
  root.render(<Review />);
} else {
  document.getElementById("root").textContent =
    "This review page is available in Vite development mode only.";
}
