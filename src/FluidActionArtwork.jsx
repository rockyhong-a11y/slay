import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ClassicActionArtwork,
  preloadClassicActions,
} from "./ClassicActionArtwork.jsx";
import { createFluidArtwork } from "./fluid-artwork.js";

// The containing combat stage owns the sole frame clock. This surface receives
// sampled frames imperatively, so React does not render sixty times per second.
export const FluidActionArtwork = forwardRef(function FluidActionArtwork(
  {
    actor,
    pose = "ready",
    active = false,
    still = false,
    mirrored = false,
    onReady,
  },
  ref,
) {
  const canvas = useRef(null);
  const host = useRef(null);
  const renderer = useRef(null);
  const callback = useRef(onReady);
  callback.current = onReady;
  const [status, setStatus] = useState("loading");
  useImperativeHandle(
    ref,
    () => ({
      draw(body) {
        const fluid = body?.fluid;
        if (!fluid || !renderer.current) {
          if (host.current) host.current.dataset.fluidActive = "false";
          return false;
        }
        const drawn = renderer.current.draw(fluid);
        if (host.current) {
          host.current.dataset.fluidActive = String(drawn);
          host.current.style.opacity = String(fluid.opacity ?? 1);
          host.current.dataset.fluidFrom = fluid.from;
          host.current.dataset.fluidTo = fluid.to;
          host.current.dataset.fluidMix = fluid.mix.toFixed(3);
        }
        return drawn;
      },
    }),
    [],
  );
  useEffect(() => {
    let alive = true;
    let painter = null;
    const element = canvas.current;
    const fail = (event) => {
      event?.preventDefault();
      if (!alive) return;
      renderer.current = null;
      callback.current?.(null);
      setStatus("fallback");
    };
    callback.current?.(null);
    setStatus("loading");
    element.addEventListener("webglcontextlost", fail);
    preloadClassicActions(actor)
      .then((metadata) => {
        if (!alive) return;
        try {
          painter = createFluidArtwork(element, metadata, actor);
          renderer.current = painter;
          setStatus("ready");
          callback.current?.({ ...metadata, fluid: true });
        } catch {
          fail();
        }
      })
      .catch(() => fail());
    return () => {
      alive = false;
      element.removeEventListener("webglcontextlost", fail);
      renderer.current = null;
      painter?.dispose();
    };
  }, [actor]);
  return (
    <>
      <span
        ref={host}
        className={`fluid-action-artwork ${mirrored ? "classic-action-mirrored" : ""}`}
        data-fluid-actor={actor}
        data-fluid-status={status}
        data-fluid-active="false"
        aria-hidden="true"
      >
        <canvas key={actor} ref={canvas} />
      </span>
      {status === "fallback" && (
        <ClassicActionArtwork
          actor={actor}
          pose={pose}
          active={active}
          still={still}
          mirrored={mirrored}
          onReady={onReady}
        />
      )}
    </>
  );
});
