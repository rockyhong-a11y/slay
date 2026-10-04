"use client";
import React, { useEffect, useRef, useState } from "react";
import { registerLiveArt } from "./live-art-renderer.js";
import { createFighterController } from "./fighter-puppet.js";
import "./fighter-puppet.css";

const root = `${import.meta.env.BASE_URL}assets/`;

export function FighterPuppet({
  art,
  alt,
  className = "",
  style,
  fit = "contain",
  position = [0.5, 1],
  condition = "normal",
  still = false,
  loading,
  portrait = false,
  cast = null,
  castDuration,
  hit = false,
  hitId = null,
  side,
}) {
  const wrapper = useRef(null),
    canvas = useRef(null),
    handle = useRef(null),
    options = useRef(null);
  const [readyArt, setReadyArt] = useState(null);
  options.current = {
    art,
    fit,
    position,
    condition,
    still,
    portrait,
    cast,
    castDuration,
    hit,
    hitId,
    side,
  };
  useEffect(() => {
    handle.current = registerLiveArt(
      wrapper.current,
      canvas.current,
      () => options.current,
      () => setReadyArt(options.current.art),
      createFighterController(root),
    );
    return () => handle.current.dispose();
  }, []);
  useEffect(() => {
    handle.current?.refresh();
  }, [
    art,
    condition,
    still,
    fit,
    position[0],
    position[1],
    portrait,
    cast,
    castDuration,
    hit,
    hitId,
    side,
  ]);
  return (
    <span
      ref={wrapper}
      role="img"
      aria-label={alt}
      className={`live-art fighter-puppet ${className} ${readyArt === art ? "live-art-ready" : ""}`}
      style={style}
      data-art={art}
      data-condition={condition}
    >
      <img
        src={root + art}
        alt=""
        aria-hidden="true"
        loading={loading}
        decoding="async"
        style={{
          objectFit: fit,
          objectPosition: position.map((value) => `${value * 100}%`).join(" "),
        }}
      />
      <canvas ref={canvas} aria-hidden="true" />
    </span>
  );
}
