import { classicActionGeometry } from "./action-motion.js";
import { actionLandmarks } from "./action-landmarks.js";

// One connected surface per drawing. No face/limb images or independently
// transformed body parts are created: both endpoints are complete paintings.
const POINTS = 18;
const COLUMNS = 24;
const ROWS = 30;
// Geometry travels for the entire transition. Exchange the ink only through
// its central quarter (about 4–5 display frames), avoiding translucent limbs
// lingering throughout a 220–320 ms movement.
export function fluidInkMix(value) {
  const t = Math.max(0, Math.min(1, (value - 0.38) / 0.24));
  return t * t * t * (10 + t * (-15 + 6 * t));
}
const VERTEX = `
attribute vec2 a_position;
uniform vec2 u_size;
uniform vec2 u_offset;
uniform vec2 u_source[18];
uniform vec2 u_target[18];
uniform vec2 u_secondary;
varying vec2 v_uv;
void main() {
  vec2 p = u_offset + a_position * u_size;
  vec2 sourceCenter = vec2(0.0);
  vec2 targetCenter = vec2(0.0);
  float total = 0.0;
  for (int i = 0; i < 18; i++) {
    vec2 d = p - u_source[i];
    float weight = 1.0 / max(0.000001, dot(d,d) * dot(d,d));
    sourceCenter += u_source[i] * weight;
    targetCenter += u_target[i] * weight;
    total += weight;
  }
  sourceCenter /= total;
  targetCenter /= total;
  float similarityA = 0.0;
  float similarityB = 0.0;
  float spread = 0.0;
  for (int i = 0; i < 18; i++) {
    vec2 d = p - u_source[i];
    float weight = 1.0 / max(0.000001, dot(d,d) * dot(d,d));
    vec2 a = u_source[i] - sourceCenter;
    vec2 b = u_target[i] - targetCenter;
    similarityA += weight * dot(a,b);
    similarityB += weight * (a.x*b.y - a.y*b.x);
    spread += weight * dot(a,a);
  }
  vec2 v = p - sourceCenter;
  float a = similarityA / max(spread, 0.000001);
  float b = similarityB / max(spread, 0.000001);
  p = targetCenter + vec2(a*v.x - b*v.y, b*v.x + a*v.y);
  float upper = (1.0 - p.y) * (1.0 - p.y);
  p.x += u_secondary.x * upper;
  p.y += u_secondary.y * upper;
  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
  v_uv = a_position;
}`;
const FRAGMENT = `
precision mediump float;
uniform sampler2D u_image;
uniform float u_opacity;
varying vec2 v_uv;
void main() {
  gl_FragColor = texture2D(u_image, v_uv) * u_opacity;
}`;

export function fluidSurface(metadata) {
  const frames = Object.values(metadata.frames);
  return {
    width: Math.max(...frames.map((f) => f.width)),
    height: Math.max(...frames.map((f) => f.height)),
  };
}

export function poseRegistration(
  metadata,
  actor,
  pose,
  surface = fluidSurface(metadata),
) {
  const geometry = classicActionGeometry(metadata, pose);
  const frame = geometry.source;
  const size = [frame.width / surface.width, frame.height / surface.height];
  const offset = [(1 - size[0]) / 2, 1 - size[1]];
  const points = actionLandmarks(actor, pose).map(([x, y]) => [
    offset[0] + x * size[0],
    offset[1] + y * size[1],
  ]);
  // Fixed transparent perimeter constrains the surface and bounds deformation.
  points.push([0, 0], [1, 0], [0, 1], [1, 1]);
  return { geometry, size, offset, points: new Float32Array(points.flat()) };
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(error || "Whole-image shader unavailable");
  }
  return shader;
}

export function createFluidArtwork(canvas, metadata, actor) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
    depth: false,
    stencil: false,
  });
  if (!gl) throw new Error("Whole-image acceleration unavailable");
  const surface = fluidSurface(metadata);
  const resolution = Math.min(2, 768 / Math.max(surface.width, surface.height));
  canvas.width = Math.ceil(surface.width * resolution);
  canvas.height = Math.ceil(surface.height * resolution);
  let program, buffer, vertex, fragment;
  const textures = new Map();
  let alive = true;
  const dispose = () => {
    if (!alive) return;
    alive = false;
    for (const value of textures.values()) gl.deleteTexture(value.texture);
    textures.clear();
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
  try {
    vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const vertices = [];
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLUMNS; x++)
        for (const [dx, dy] of [
          [0, 0],
          [1, 0],
          [0, 1],
          [0, 1],
          [1, 0],
          [1, 1],
        ])
          vertices.push((x + dx) / COLUMNS, (y + dy) / ROWS);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = Object.fromEntries(
      [
        "size",
        "offset",
        "source",
        "target",
        "secondary",
        "opacity",
        "image",
      ].map((key) => [
        key,
        gl.getUniformLocation(
          program,
          `u_${key}${["source", "target"].includes(key) ? "[0]" : ""}`,
        ),
      ]),
    );
    gl.uniform1i(uniforms.image, 0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.enable(gl.BLEND);
    // Weighted premultiplied sum avoids making aligned bodies translucent at
    // the midpoint, which source-over crossfades do with two 50% layers.
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0, 0, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const target = new Float32Array(POINTS * 2);

    function prepare(pose) {
      if (textures.has(pose)) return textures.get(pose);
      const registration = poseRegistration(metadata, actor, pose, surface);
      const { source } = registration.geometry;
      // Clip a complete pose once before upload, retaining the authored alpha.
      // This render-only buffer never rewrites a generated asset on disk.
      const whole = document.createElement("canvas");
      whole.width = source.width;
      whole.height = source.height;
      const ctx = whole.getContext("2d");
      if (!ctx) throw new Error("Whole-pose preparation unavailable");
      if (Array.isArray(source.clip)) {
        ctx.beginPath();
        source.clip.forEach(([x, y], index) => {
          ctx[index ? "lineTo" : "moveTo"](
            (x * whole.width) / 100,
            (y * whole.height) / 100,
          );
        });
        ctx.closePath();
        ctx.clip();
      }
      ctx.drawImage(
        metadata.image,
        source.x,
        source.y,
        source.width,
        source.height,
        0,
        0,
        whole.width,
        whole.height,
      );
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        whole,
      );
      const entry = { ...registration, texture };
      textures.set(pose, entry);
      return entry;
    }
    // Upload outside playback, so a new pose never blocks a contact frame.
    for (const pose of Object.keys(metadata.frames)) prepare(pose);

    return {
      dispose,
      draw(fluid) {
        if (!alive || gl.isContextLost()) return false;
        const a = prepare(fluid.from);
        const b = prepare(fluid.to);
        const mix = Math.max(0, Math.min(1, fluid.mix));
        const ink = fluidInkMix(mix);
        for (let i = 0; i < target.length; i++)
          target[i] = a.points[i] + (b.points[i] - a.points[i]) * mix;
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2fv(uniforms.target, target);
        gl.uniform2f(uniforms.secondary, fluid.sway || 0, fluid.compress || 0);
        const drawLayer = (entry, opacity) => {
          if (opacity < 0.0001) return;
          gl.bindTexture(gl.TEXTURE_2D, entry.texture);
          gl.uniform2fv(uniforms.source, entry.points);
          gl.uniform2fv(uniforms.size, entry.size);
          gl.uniform2fv(uniforms.offset, entry.offset);
          gl.uniform1f(uniforms.opacity, opacity);
          gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
        };
        if (a === b) drawLayer(a, 1);
        else {
          drawLayer(a, 1 - ink);
          drawLayer(b, ink);
        }
        return true;
      },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
