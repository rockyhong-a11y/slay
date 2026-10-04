import { LIVE_ART_RIGS } from "./live-art-rigs.js";
import {
  CONDITION_MOTION,
  motionTokens,
  approach,
  artSeed,
  motionAt,
  partVector,
  deformPoint,
  fitArt,
  smoothstep,
  clamp,
} from "./motion-config.js";

const MAX_PARTS = 8;
const MAX_EYES = 4;
const entries = new Set();
const textures = new Map();
let device,
  frameRequest,
  lastFrame = 0,
  enabled = true;
let reduced = false,
  booted = false;
let pointer = [0, 0];
const vertexSource = [
  "attribute vec2 a_uv;",
  "varying vec2 v_uv;",
  "uniform vec4 u_parts[8];",
  "uniform vec4 u_vectors[8];",
  "void main(){",
  "  vec2 p=a_uv;",
  "  for(int i=0;i<8;i++){",
  "    vec2 d=(a_uv-u_parts[i].xy)/max(u_parts[i].zw,vec2(0.0001));",
  "    float w=pow(max(0.0,1.0-length(d)),2.0);",
  "    vec2 relative=a_uv-u_parts[i].xy;",
  "    p+=w*(u_vectors[i].xy+vec2(-relative.y,relative.x)*u_vectors[i].z+vec2(relative.x,0.0)*u_vectors[i].w);",
  "  }",
  "  gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,0.0,1.0);",
  "  v_uv=a_uv;",
  "}",
].join("\n");
const fragmentSource = [
  "precision mediump float;",
  "varying vec2 v_uv;",
  "uniform sampler2D u_image;",
  "uniform vec4 u_eyes[4];",
  "uniform vec2 u_skin[4];",
  "uniform float u_blink;",
  "void main(){",
  "  vec4 color=texture2D(u_image,v_uv);",
  "  for(int i=0;i<4;i++){",
  "    vec2 r=max(u_eyes[i].zw,vec2(0.00001));",
  "    vec2 d=(v_uv-u_eyes[i].xy)/r;",
  "    float oval=max(0.0,1.0-dot(d,d));",
  "    float mask=smoothstep(0.0,0.3,oval)*u_blink;",
  "    vec4 skin=texture2D(u_image,u_skin[i]+vec2(d.x*r.x*0.25,0.0));",
  "    float lash=1.0-smoothstep(0.12,0.28,abs(d.y-0.22));",
  "    skin.rgb*=1.0-lash*0.32;",
  "    color.rgb=mix(color.rgb,skin.rgb,mask*0.9);",
  "  }",
  "  gl_FragColor=color;",
  "}",
].join("\n");

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function makeDevice() {
  const surface = document.createElement("canvas");
  surface.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    textures.forEach((record) => {
      record.texture = null;
    });
    device = { mode: "canvas", surface: document.createElement("canvas") };
    entries.forEach((entry) => {
      entry.previous = null;
    });
    wake();
  });
  const gl = surface.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) return { mode: "canvas", surface };
  try {
    const program = gl.createProgram();
    const shaders = [
      compile(gl, gl.VERTEX_SHADER, vertexSource),
      compile(gl, gl.FRAGMENT_SHADER, fragmentSource),
    ];
    shaders.forEach((shader) => gl.attachShader(program, shader));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program));
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.useProgram(program);
    const columns = 36,
      rows = 44,
      vertices = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < columns; x++) {
        const x0 = x / columns,
          x1 = (x + 1) / columns;
        const y0 = y / rows,
          y1 = (y + 1) / rows;
        vertices.push(x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1);
      }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const uv = gl.getAttribLocation(program, "a_uv");
    gl.enableVertexAttribArray(uv);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);
    const uniforms = {};
    ["u_parts", "u_vectors", "u_eyes", "u_skin", "u_blink", "u_image"].forEach(
      (name) => {
        uniforms[name] = gl.getUniformLocation(program, name);
      },
    );
    gl.uniform1i(uniforms.u_image, 0);
    gl.disable(gl.DEPTH_TEST);
    return {
      mode: "webgl",
      surface,
      gl,
      program,
      uniforms,
      count: vertices.length / 2,
    };
  } catch {
    return { mode: "canvas", surface: document.createElement("canvas") };
  }
}

function textureFor(art, src) {
  if (textures.has(art)) return textures.get(art);
  const record = {
    art,
    image: new Image(),
    ready: false,
    touched: performance.now(),
  };
  record.image.decoding = "async";
  record.image.onload = () => {
    record.ready = true;
    wake();
  };
  record.image.onerror = () => {
    record.failed = true;
  };
  record.image.src = src;
  textures.set(art, record);
  return record;
}

function upload(record) {
  if (record.texture) return record.texture;
  const gl = device.gl,
    image = record.image;
  const maximum = 1024;
  const scale = Math.min(1, maximum / Math.max(image.width, image.height));
  let source = image;
  if (scale < 1) {
    source = document.createElement("canvas");
    source.width = Math.round(image.width * scale);
    source.height = Math.round(image.height * scale);
    source.getContext("2d").drawImage(image, 0, 0, source.width, source.height);
  }
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  record.texture = texture;
  return texture;
}

function webglFrame(record, rig, vectors, blink, width, height) {
  const { gl, surface, uniforms } = device;
  if (surface.width !== width || surface.height !== height) {
    surface.width = width;
    surface.height = height;
  }
  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const parts = new Float32Array(MAX_PARTS * 4),
    moves = new Float32Array(MAX_PARTS * 4);
  rig.parts.slice(0, MAX_PARTS).forEach((part, i) => {
    parts.set([...part.center, ...part.radius], i * 4);
    moves.set(vectors[i], i * 4);
  });
  const eyes = new Float32Array(MAX_EYES * 4),
    skin = new Float32Array(MAX_EYES * 2);
  (rig.eyes || []).slice(0, MAX_EYES).forEach((eye, i) => {
    eyes.set([...eye.center, ...eye.radius], i * 4);
    skin.set(eye.skin, i * 2);
  });
  gl.uniform4fv(uniforms.u_parts, parts);
  gl.uniform4fv(uniforms.u_vectors, moves);
  gl.uniform4fv(uniforms.u_eyes, eyes);
  gl.uniform2fv(uniforms.u_skin, skin);
  gl.uniform1f(uniforms.u_blink, blink);
  gl.bindTexture(gl.TEXTURE_2D, upload(record));
  gl.drawArrays(gl.TRIANGLES, 0, device.count);
  return surface;
}

function triangle(context, image, source, target) {
  const [a, b, c] = source,
    [p, q, r] = target;
  const det =
    a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]);
  if (Math.abs(det) < 0.00001) return;
  const transform = (values) => [
    (values[0] * (b[1] - c[1]) +
      values[1] * (c[1] - a[1]) +
      values[2] * (a[1] - b[1])) /
      det,
    (values[0] * (c[0] - b[0]) +
      values[1] * (a[0] - c[0]) +
      values[2] * (b[0] - a[0])) /
      det,
    (values[0] * (b[0] * c[1] - c[0] * b[1]) +
      values[1] * (c[0] * a[1] - a[0] * c[1]) +
      values[2] * (a[0] * b[1] - b[0] * a[1])) /
      det,
  ];
  const [ax, cx, ex] = transform([p[0], q[0], r[0]]);
  const [by, dy, fy] = transform([p[1], q[1], r[1]]);
  context.save();
  context.beginPath();
  context.moveTo(...p);
  context.lineTo(...q);
  context.lineTo(...r);
  context.closePath();
  context.clip();
  context.transform(ax, by, cx, dy, ex, fy);
  context.drawImage(image, 0, 0);
  context.restore();
}

function canvasFrame(record, rig, vectors, blink, width, height) {
  const surface = device.surface;
  surface.width = width;
  surface.height = height;
  const context = surface.getContext("2d"),
    image = record.image;
  const columns = 9,
    rows = 12;
  const draw = (uv) => {
    const target = uv.map((p) => {
      const moved = deformPoint(p, rig.parts, vectors);
      return [moved[0] * width, moved[1] * height];
    });
    triangle(
      context,
      image,
      uv.map((p) => [p[0] * image.width, p[1] * image.height]),
      target,
    );
  };
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < columns; x++) {
      const a = [x / columns, y / rows],
        b = [(x + 1) / columns, y / rows],
        c = [x / columns, (y + 1) / rows],
        d = [(x + 1) / columns, (y + 1) / rows];
      draw([a, b, c]);
      draw([c, b, d]);
    }
  if (blink > 0.005)
    (rig.eyes || []).forEach((eye) => {
      const center = deformPoint(eye.center, rig.parts, vectors);
      const x = center[0] * width,
        y = center[1] * height;
      const rx = eye.radius[0] * width,
        ry = eye.radius[1] * height;
      context.save();
      context.globalAlpha = blink * 0.9;
      context.beginPath();
      context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      context.clip();
      context.drawImage(
        image,
        eye.skin[0] * image.width - 1,
        eye.skin[1] * image.height - 1,
        3,
        3,
        x - rx,
        y - ry,
        rx * 2,
        ry * 2,
      );
      context.strokeStyle = "rgba(32,23,26,.3)";
      context.lineWidth = Math.max(0.5, ry * 0.25);
      context.beginPath();
      context.moveTo(x - rx * 0.8, y);
      context.quadraticCurveTo(x, y + ry * 0.65, x + rx * 0.8, y);
      context.stroke();
      context.restore();
    });
  return surface;
}

function drawEntry(entry, delta, now, animate) {
  const options = entry.options(),
    next = textureFor(options.art, options.src);
  if (!next.ready) return;
  if (entry.record !== next) {
    if (entry.ready) {
      entry.previous = document.createElement("canvas");
      entry.previous.width = entry.canvas.width;
      entry.previous.height = entry.canvas.height;
      entry.previous.getContext("2d").drawImage(entry.canvas, 0, 0);
      entry.changed = now;
    }
    entry.record = next;
  }
  const rig = LIVE_ART_RIGS[options.art];
  if (!rig) return;
  const profile =
    CONDITION_MOTION[options.condition] || CONDITION_MOTION.normal;
  Object.keys(profile).forEach((key) => {
    entry.profile[key] = approach(entry.profile[key], profile[key], delta, 5);
  });
  const rect = entry.bounds;
  entry.gaze[0] = approach(
    entry.gaze[0],
    clamp(((pointer[0] - rect.left) / Math.max(1, rect.width)) * 2 - 1, -1, 1),
    delta,
    3.5,
  );
  entry.gaze[1] = approach(
    entry.gaze[1],
    clamp(((pointer[1] - rect.top) / Math.max(1, rect.height)) * 2 - 1, -1, 1),
    delta,
    3.5,
  );
  entry.clock += delta * entry.profile.tempo;
  const moving = animate && !options.still;
  entry.activity = reduced
    ? 0
    : approach(entry.activity, moving ? 1 : 0, delta, 7);
  const frame = motionAt(entry.clock, entry.seed, entry.profile, entry.gaze);
  Object.keys(frame).forEach((key) => {
    frame[key] *= entry.activity;
  });
  const gain = rig.kind === "fighter" ? 2.8 : 2.4;
  const vectors = rig.parts.map((part) => {
    const local = part.phase
      ? motionAt(
          entry.clock - part.phase * 0.35,
          entry.seed,
          entry.profile,
          entry.gaze,
        )
      : frame;
    if (part.phase)
      Object.keys(local).forEach((key) => {
        local[key] *= entry.activity;
      });
    return partVector(part, local).map((value) => value * gain);
  });
  const scale = Math.min(window.devicePixelRatio || 1, 1.75);
  const width = Math.max(1, Math.round(rect.width * scale)),
    height = Math.max(1, Math.round(rect.height * scale));
  if (entry.canvas.width !== width || entry.canvas.height !== height) {
    entry.canvas.width = width;
    entry.canvas.height = height;
  }
  const destination = fitArt(
    width,
    height,
    next.image.width,
    next.image.height,
    options.fit,
    options.position,
  );
  if (options.portrait) {
    const head = rig.parts.find((part) => part.motion === "head")?.center || [
      0.5, 0.1,
    ];
    destination.width *= 3.4;
    destination.height *= 3.4;
    destination.x = width / 2 - destination.width * head[0];
    destination.y = height / 2 - destination.height * (head[1] - 0.02);
  }
  const renderWidth = Math.max(
    1,
    Math.min(1200, Math.round(destination.width)),
  );
  const renderHeight = Math.max(
    1,
    Math.min(1200, Math.round(destination.height)),
  );
  const rendered =
    device.mode === "webgl"
      ? webglFrame(next, rig, vectors, frame.blink, renderWidth, renderHeight)
      : canvasFrame(next, rig, vectors, frame.blink, renderWidth, renderHeight);
  const context = entry.canvas.getContext("2d");
  context.clearRect(0, 0, width, height);
  const transition = reduced
    ? motionTokens.duration.fast
    : motionTokens.art.transition;
  const mix = entry.previous
    ? smoothstep((now - entry.changed) / 1000 / transition)
    : 1;
  if (entry.previous && mix < 1) {
    context.globalAlpha = 1 - mix;
    context.drawImage(entry.previous, 0, 0, width, height);
  }
  context.globalAlpha = mix;
  context.drawImage(
    rendered,
    destination.x,
    destination.y,
    destination.width,
    destination.height,
  );
  context.globalAlpha = 1;
  if (mix === 1) entry.previous = null;
  next.touched = now;
  if (!entry.ready) {
    entry.ready = true;
    entry.onReady();
  }
  entry.canvas.dataset.liveState = moving ? "running" : "still";
  entry.canvas.dataset.renderer = device.mode;
  entry.canvas.dataset.frame = String(++entry.frames);
}

function pruneTextures() {
  if (!device.gl || textures.size <= 18) return;
  const used = new Set();
  entries.forEach((entry) => {
    if (!entry.visible) return;
    // Keep the incoming image while it loads and the outgoing pose while fading.
    used.add(entry.options().art);
    if (entry.record) used.add(entry.record.art);
  });
  [...textures.values()]
    .sort((a, b) => a.touched - b.touched)
    .forEach((record) => {
      if (textures.size > 18 && !used.has(record.art)) {
        if (record.texture) device.gl.deleteTexture(record.texture);
        textures.delete(record.art);
      }
    });
}

function tick(now) {
  frameRequest = null;
  const fps =
    device.mode === "canvas"
      ? 15
      : navigator.hardwareConcurrency <= 4
        ? 24
        : motionTokens.art.framesPerSecond;
  const interval = 1000 / fps;
  if (now - lastFrame < interval) {
    frameRequest = requestAnimationFrame(tick);
    return;
  }
  const delta = Math.min(
    motionTokens.art.maximumDelta,
    (now - lastFrame) / 1000 || 1 / fps,
  );
  lastFrame = now;
  const animate = enabled && !reduced && !document.hidden;
  const dialog = document.querySelector("dialog[open]");
  let continuation = false;
  entries.forEach((entry) => {
    if (!entry.visible) return;
    if (dialog && !dialog.contains(entry.wrapper)) {
      entry.canvas.dataset.liveState = "obscured";
      return;
    }
    drawEntry(entry, delta, now, animate);
    if (animate && !entry.options().still) continuation = true;
    if (entry.previous) continuation = true;
    if (entry.activity > 0.005 && !reduced) continuation = true;
  });
  pruneTextures();
  if (continuation && !document.hidden)
    frameRequest = requestAnimationFrame(tick);
}

function wake() {
  if (!frameRequest && entries.size && !document.hidden)
    frameRequest = requestAnimationFrame(tick);
}

function boot() {
  if (booted) return;
  booted = true;
  device = makeDevice();
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduced = query.matches;
  query.addEventListener("change", (event) => {
    reduced = event.matches;
    wake();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && frameRequest) {
      cancelAnimationFrame(frameRequest);
      frameRequest = null;
    } else {
      lastFrame = performance.now();
      wake();
    }
  });
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer = [event.clientX, event.clientY];
    },
    { passive: true },
  );
  window.addEventListener(
    "scroll",
    () => {
      entries.forEach((entry) => {
        if (entry.visible) entry.bounds = entry.wrapper.getBoundingClientRect();
      });
    },
    { passive: true, capture: true },
  );
  new MutationObserver(() => wake()).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["open"],
  });
}

export function registerLiveArt(wrapper, canvas, options, onReady) {
  boot();
  const entry = {
    wrapper,
    canvas,
    options,
    onReady,
    visible: false,
    ready: false,
    frames: 0,
    bounds: wrapper.getBoundingClientRect(),
    gaze: [0, 0],
    activity: reduced || !enabled || options().still ? 0 : 1,
    seed: artSeed(
      options()
        .art.split("/")
        .pop()
        .replace(/\.webp$/, "")
        .split("-")[0],
    ),
    clock: performance.now() / 1000,
    profile: { ...CONDITION_MOTION.normal },
  };
  const intersection = new IntersectionObserver(
    ([observed]) => {
      entry.visible = observed.isIntersecting;
      entry.canvas.dataset.liveState = entry.visible ? "loading" : "paused";
      if (entry.visible) {
        entry.bounds = wrapper.getBoundingClientRect();
        wake();
      }
    },
    { rootMargin: "30px" },
  );
  const resize = new ResizeObserver(() => {
    entry.bounds = wrapper.getBoundingClientRect();
    wake();
  });
  intersection.observe(wrapper);
  resize.observe(wrapper);
  entries.add(entry);
  wake();
  return {
    refresh() {
      entry.bounds = wrapper.getBoundingClientRect();
      wake();
    },
    dispose() {
      intersection.disconnect();
      resize.disconnect();
      entries.delete(entry);
      if (!entries.size && frameRequest) {
        cancelAnimationFrame(frameRequest);
        frameRequest = null;
      }
    },
  };
}

export function setLiveArtMotion(value) {
  enabled = value;
  if (!value)
    entries.forEach((entry) => {
      if (!entry.ready) entry.activity = 0;
    });
  wake();
}
