import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Artwork } from "./Artwork.jsx";
import { fighterPoseArt } from "./presentation.js";
import { sdActorId } from "./sd-combat.js";
import { sdArtworkRect, sdSpriteGeometry } from "./sd-artwork.js";
import "./sd-combat.css";

const requests = new Map();
const asset = (id) => `${import.meta.env.BASE_URL}assets/sd2d/${id}.png`;
let manifestRequest,
  manifestCache = {};
function loadSDManifest(id) {
  if (manifestCache[id]) return Promise.resolve(manifestCache[id]);
  if (!manifestRequest) {
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 2500);
    manifestRequest = fetch(
      `${import.meta.env.BASE_URL}assets/sd2d/manifest.json`,
      { signal: controller.signal },
    )
      .then((response) => (response.ok ? response.json() : {}))
      .then((data) => {
        manifestCache = { ...manifestCache, ...data };
        return manifestCache;
      })
      .catch(() => manifestCache)
      .finally(() => {
        clearTimeout(deadline);
        manifestRequest = null;
      });
  }
  return manifestRequest.then((data) => data[id]);
}
export function preloadSDArtwork(actor) {
  const id = sdActorId(actor);
  if (!requests.has(id)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      let deadline;
      const release = () => {
        clearTimeout(deadline);
        image.onload = null;
        image.onerror = null;
      };
      image.decoding = "async";
      image.onload = () => {
        const width = image.naturalWidth,
          height = image.naturalHeight;
        release();
        if (width >= 3 && height > 0)
          resolve({ id, width, height, src: asset(id) });
        else reject(new Error("Invalid SD sprite dimensions"));
      };
      image.onerror = () => {
        release();
        reject(new Error("SD illustration unavailable"));
      };
      deadline = setTimeout(() => {
        release();
        image.src = "";
        reject(new Error("SD illustration timeout"));
      }, 15000);
      image.src = asset(id);
    })
      .then(async (metadata) => {
        const entry = await loadSDManifest(id);
        const frames =
          entry?.width === metadata.width && entry?.height === metadata.height
            ? entry.frames
            : undefined;
        const geometry = sdSpriteGeometry(
          metadata.width,
          metadata.height,
          "idle",
          frames,
        );
        // Final sheets have uneven pose bounds. Missing metadata must show the
        // complete original fallback instead of a potentially severed SD pose.
        if (!geometry.exact) throw new Error("SD pose metadata unavailable");
        return {
          ...metadata,
          frames,
          sharedRatio: geometry.sharedRatio,
        };
      })
      .catch((error) => {
        requests.delete(id);
        throw error;
      });
    requests.set(id, promise);
  }
  return requests.get(id);
}

/** One cell of a complete full-body illustration, never separate body parts. */
export function SDArtwork({
  actor = "nova",
  pose = "idle",
  condition = "normal",
  alt = "",
  className = "",
  style,
  mirrored = false,
  portrait = false,
  portraitCenter = [0.55, 0.3],
  portraitWidth = 0.68,
  onStatus,
  onReady,
}) {
  const id = sdActorId(actor);
  const surface = useRef(null);
  const cell = useRef(null);
  const layout = useRef(null);
  const updateLayout = useRef(null);
  const callbacks = useRef({ onStatus, onReady });
  callbacks.current = { onStatus, onReady };
  const [image, setImage] = useState(null);
  const [failed, setFailed] = useState(false);
  const loaded = image?.id === id;
  const status = loaded ? "ready" : failed ? "fallback" : "loading";
  const geometry = sdSpriteGeometry(
    image?.width,
    image?.height,
    pose,
    image?.frames,
  );
  layout.current = {
    geometry,
    portrait,
    center: portraitCenter,
    cropWidth: portraitWidth,
  };
  useLayoutEffect(() => {
    const element = surface.current;
    if (!element) return;
    const update = () => {
      if (!cell.current) return;
      const current = layout.current;
      const rect = sdArtworkRect(
        element.clientWidth,
        element.clientHeight,
        current.geometry.cellRatio,
        {
          ...current,
          source: current.geometry.source,
          shared: current.geometry.shared,
        },
      );
      for (const [key, value] of Object.entries(rect))
        cell.current.style[key] = `${value}px`;
    };
    updateLayout.current = update;
    update();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(element);
    if (!observer) window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      updateLayout.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    updateLayout.current?.();
  }, [image, pose, portrait, portraitCenter, portraitWidth]);
  useEffect(() => {
    let active = true;
    setFailed(false);
    callbacks.current.onStatus?.("loading");
    preloadSDArtwork(id)
      .then((metadata) => {
        if (!active) return;
        setImage(metadata);
        callbacks.current.onReady?.(metadata);
        callbacks.current.onStatus?.("ready");
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
        callbacks.current.onStatus?.("fallback");
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <span
      ref={surface}
      className={`sd-artwork ${portrait ? "sd-artwork-portrait" : ""} ${mirrored ? "sd-artwork-mirrored" : ""} ${className}`}
      style={style}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={!alt || undefined}
      data-sd-actor={id}
      data-sd-status={status}
      data-sd-pose={pose}
      data-sd-frame={geometry.frame}
      data-sd-exact={geometry.exact}
    >
      {loaded ? (
        <span className="sd-artwork-visual" aria-hidden="true">
          <span
            ref={cell}
            className="sd-artwork-cell"
            style={{
              backgroundImage: `url("${image.src}")`,
              backgroundSize: geometry.backgroundSize,
              backgroundPosition: geometry.backgroundPosition,
            }}
          />
        </span>
      ) : (
        <Artwork
          art={fighterPoseArt(id, condition)}
          alt=""
          portrait={portrait}
          mirrored={mirrored}
        />
      )}
    </span>
  );
}
