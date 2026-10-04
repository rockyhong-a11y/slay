import React, { useEffect, useState } from "react";
import "./artwork.css";

const asset = (path) => import.meta.env.BASE_URL + "assets/" + path;
let portraitRequest;
function loadPortraits() {
  portraitRequest ??= fetch(asset("fighters/states/portraits.json"))
    .then((response) => {
      if (response.ok) return response.json();
      portraitRequest = null;
      return {};
    })
    .catch(() => {
      portraitRequest = null;
      return {};
    });
  return portraitRequest;
}

// Every visible surface uses a complete illustration. Portraits crop that same file.
export function Artwork({
  art,
  alt,
  className = "",
  style,
  fit = "contain",
  position = [0.5, 0.5],
  condition = "normal",
  loading,
  portrait = false,
  mirrored = false,
}) {
  const [loadedArt, setLoadedArt] = useState(null);
  const [portraits, setPortraits] = useState({});
  useEffect(() => {
    if (!portrait) return;
    let active = true;
    loadPortraits().then((data) => {
      if (active) setPortraits(data);
    });
    return () => {
      active = false;
    };
  }, [portrait, art]);
  const stateMatch = art.match(/^fighters\/states\/([a-z]+)-([a-z]+)\.webp$/);
  const fallback = stateMatch ? `fighters/${stateMatch[1]}.webp` : null;
  const crop =
    portraits[art] || portraits[stateMatch?.[1] + "-" + stateMatch?.[2]];
  const center = crop?.center?.length === 2 ? crop.center : [0.5, 0.14];
  const cropWidth =
    Number.isFinite(crop?.width) && crop.width > 0.05 && crop.width <= 1
      ? crop.width
      : 0.28;
  const imageStyle = portrait
    ? {
        width: `${100 / cropWidth}%`,
        height: "auto",
        maxWidth: "none",
        left: `${50 - (center[0] * 100) / cropWidth}%`,
        top: "50%",
        transform: `translateY(-${center[1] * 100}%)`,
      }
    : {
        objectFit: fit,
        objectPosition: position.map((value) => `${value * 100}%`).join(" "),
      };
  const ready = loadedArt === art;
  return (
    <span
      role="img"
      aria-label={alt}
      className={`artwork ${portrait ? "artwork-portrait" : ""} ${mirrored ? "artwork-mirrored" : ""} ${className}`}
      style={style}
      data-art={art}
      data-condition={condition}
    >
      {fallback && !ready && (
        <img
          src={asset(fallback)}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="artwork-loading-fallback"
          style={imageStyle}
        />
      )}
      <img
        key={art}
        src={asset(art)}
        alt=""
        aria-hidden="true"
        loading={loading}
        decoding="async"
        onLoad={() => setLoadedArt(art)}
        style={{ ...imageStyle, opacity: fallback && !ready ? 0 : 1 }}
      />
    </span>
  );
}
