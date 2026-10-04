"use client";
import React, { useEffect, useRef, useState } from "react";
import { registerLiveArt } from "./live-art-renderer.js";
import "./live-art.css";

const asset = (path) => import.meta.env.BASE_URL + "assets/" + path;

// One visible image, locally deformed. The original remains the safe loading fallback.
export function LiveArt({
  art,
  alt,
  className = "",
  style,
  fit = "contain",
  position = [0.5, 0.5],
  condition = "normal",
  still = false,
  loading,
  portrait = false,
}) {
  const wrapper = useRef(null),
    canvas = useRef(null),
    handle = useRef(null);
  const [ready, setReady] = useState(false);
  const options = useRef(null);
  options.current = {
    art,
    src: asset(art),
    condition,
    still,
    fit,
    position,
    portrait,
  };
  useEffect(() => {
    handle.current = registerLiveArt(
      wrapper.current,
      canvas.current,
      () => options.current,
      () => setReady(true),
    );
    return () => handle.current.dispose();
  }, []);
  useEffect(() => {
    handle.current?.refresh();
  }, [art, condition, still, fit, position[0], position[1]]);
  return (
    <span
      ref={wrapper}
      role="img"
      aria-label={alt}
      className={"live-art " + className + (ready ? " live-art-ready" : "")}
      style={style}
      data-art={art}
      data-condition={condition}
    >
      <img
        src={asset(art)}
        alt=""
        aria-hidden="true"
        loading={loading}
        decoding="async"
        style={{
          objectFit: fit,
          objectPosition: position.map((value) => value * 100 + "%").join(" "),
        }}
      />
      <canvas ref={canvas} aria-hidden="true" />
    </span>
  );
}
