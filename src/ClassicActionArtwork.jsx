import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { classicActionGeometry, hasClassicActionArt } from "./action-motion.js";

const requests = new Map();
const base = () => `${import.meta.env.BASE_URL}assets/classic-actions/`;
let manifestRequest;
async function loadManifest() {
  if (!manifestRequest) {
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 5000);
    manifestRequest = fetch(`${base()}manifest.json`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Action pose manifest unavailable");
        return response.json();
      })
      .catch((error) => {
        manifestRequest = null;
        throw error;
      })
      .finally(() => clearTimeout(deadline));
  }
  return manifestRequest;
}

export function preloadClassicActions(actor) {
  if (!hasClassicActionArt(actor)) return Promise.resolve(null);
  if (!requests.has(actor)) {
    const request = loadManifest()
      .then((manifest) => {
        const entry = manifest[actor];
        if (!classicActionGeometry(entry))
          throw new Error("Complete action pose metadata required");
        return new Promise((resolve, reject) => {
          const image = new Image();
          let deadline;
          const release = () => {
            clearTimeout(deadline);
            image.onload = null;
            image.onerror = null;
          };
          image.decoding = "async";
          image.onload = () => {
            release();
            if (
              image.naturalWidth !== entry.width ||
              image.naturalHeight !== entry.height
            ) {
              reject(
                new Error("Action atlas dimensions do not match its crops"),
              );
              return;
            }
            resolve({ ...entry, id: actor, src: `${base()}${actor}.png` });
          };
          image.onerror = () => {
            release();
            reject(new Error("Action atlas unavailable"));
          };
          deadline = setTimeout(() => {
            release();
            image.src = "";
            reject(new Error("Action atlas timed out"));
          }, 15000);
          image.src = `${base()}${actor}.png`;
        });
      })
      .catch((error) => {
        requests.delete(actor);
        throw error;
      });
    requests.set(actor, request);
  }
  return requests.get(actor);
}

/** Each cell is one independently illustrated complete body, never a limb rig. */
export function ClassicActionArtwork({
  actor,
  pose = "ready",
  active = false,
  still = false,
  mirrored = false,
  onReady,
  onStatus,
}) {
  const callbacks = useRef({ onReady, onStatus });
  callbacks.current = { onReady, onStatus };
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [outgoing, setOutgoing] = useState(null);
  const previous = useRef(null);
  const loaded = image?.id === actor;
  const geometry = loaded ? classicActionGeometry(image, pose) : null;
  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = active && geometry ? { geometry, src: image.src } : null;
    // Contact drawings stay sharp; the short dissolve only bridges preparation,
    // grip and recovery. Both layers are complete source silhouettes.
    if (
      !active ||
      still ||
      !geometry ||
      !old ||
      old.src !== image.src ||
      old.geometry.pose === geometry.pose ||
      ["elbow", "kick", "slam", "hurt"].includes(pose)
    ) {
      setOutgoing(null);
      return;
    }
    setOutgoing(old);
    const timer = setTimeout(() => setOutgoing(null), 50);
    return () => clearTimeout(timer);
  }, [pose, active, still, image]);
  useEffect(() => {
    let alive = true;
    callbacks.current.onReady?.(null);
    if (!hasClassicActionArt(actor)) {
      setStatus("unsupported");
      return () => {
        alive = false;
      };
    }
    setStatus("loading");
    callbacks.current.onStatus?.("loading");
    preloadClassicActions(actor)
      .then((metadata) => {
        if (!alive) return;
        setImage(metadata);
        setStatus("ready");
        callbacks.current.onReady?.(metadata);
        callbacks.current.onStatus?.("ready");
      })
      .catch(() => {
        if (!alive) return;
        setStatus("fallback");
        callbacks.current.onReady?.(null);
        callbacks.current.onStatus?.("fallback");
      });
    return () => {
      alive = false;
    };
  }, [actor]);
  return (
    <span
      className={`classic-action-artwork ${mirrored ? "classic-action-mirrored" : ""}`}
      data-action-actor={actor}
      data-action-pose={geometry?.pose || "ready"}
      data-action-status={status}
      data-action-active={!!active && !!geometry}
      data-action-dissolve={!!outgoing}
      aria-hidden="true"
    >
      {geometry && (
        <span
          key={pose}
          className={`classic-action-cell ${outgoing ? "classic-action-incoming" : ""}`}
          style={{
            backgroundImage: `url("${image.src}")`,
            backgroundSize: geometry.backgroundSize,
            backgroundPosition: geometry.backgroundPosition,
            clipPath: geometry.clipPath,
          }}
        />
      )}
      {geometry &&
        outgoing &&
        (() => {
          const before = outgoing.geometry;
          const scale = Math.min(
            1,
            geometry.worldWidth / before.worldWidth,
            geometry.worldHeight / before.worldHeight,
          );
          const width =
            ((before.worldWidth * scale) / geometry.worldWidth) * 100;
          const height =
            ((before.worldHeight * scale) / geometry.worldHeight) * 100;
          return (
            <span
              key={`out-${before.pose}`}
              className="classic-action-cell classic-action-outgoing"
              style={{
                width: `${width}%`,
                height: `${height}%`,
                left: `${(100 - width) / 2}%`,
                top: "auto",
                bottom: 0,
                backgroundImage: `url("${outgoing.src}")`,
                backgroundSize: before.backgroundSize,
                backgroundPosition: before.backgroundPosition,
                clipPath: before.clipPath,
              }}
            />
          );
        })()}
    </span>
  );
}
