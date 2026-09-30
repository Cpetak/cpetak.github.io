/*
 * Landing-page background: a stylized, slowly drifting fitness landscape,
 * drawn as topographic contour lines. The landscape is a sum of Gaussian
 * peaks whose positions move on slow Lissajous paths. Peak placement,
 * orbits and the starting time are seeded from the clock, so each page
 * load shows a different landscape.
 *
 * Cost is kept low on purpose:
 *   - one full-screen triangle, roughly 40 ALU ops per fragment
 *     (peak positions are computed once per frame on the CPU, not per pixel)
 *   - device pixel ratio capped at 1.5
 *   - capped at 30 fps, paused when the tab is hidden
 *   - a single static frame (no loop at all) when the user prefers reduced motion
 */
(function () {
  "use strict";

  // Render at native pixel density (capped) so contour edges stay crisp.
  var RENDER_SCALE = Math.min(window.devicePixelRatio || 1, 1.5);
  var FPS = 30;

  var canvas = document.createElement("canvas");
  canvas.id = "fitness-landscape";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  var gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  });
  if (!gl) { canvas.remove(); return; }
  var hasDerivatives = !!gl.getExtension("OES_standard_derivatives");

  var VERT =
    "attribute vec2 aPos;" +
    "void main(){gl_Position=vec4(aPos,0.0,1.0);}";

  var FRAG =
    (hasDerivatives ? "#extension GL_OES_standard_derivatives : enable\n" : "") +
    "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n" +
    "uniform vec2 uRes;uniform float uT;uniform vec3 uColor;uniform float uAlpha;\n" +
    "uniform vec2 uC[6];uniform float uS[6];uniform float uA[6];\n" +
    "float peak(vec2 p,vec2 c,float s,float a){vec2 d=p-c;return a*exp(-dot(d,d)/s);}\n" +
    "void main(){\n" +
    "  vec2 p=(gl_FragCoord.xy-0.5*uRes)/uRes.y*2.8;\n" +
    "  float t=uT;\n" +
    // Peak centres are computed once per frame on the CPU (see draw) and passed in.
    "  float h=0.0;\n" +
    "  for(int i=0;i<6;i++){h+=peak(p,uC[i],uS[i],uA[i]);}\n" +
    // Gentle undulating base so valleys are not perfectly flat.
    "  h+=0.10*sin(p.x*1.7+t)*cos(p.y*1.9-t*0.7);\n" +
    // Contour lines: minor every 0.1 in height, major every 0.5.
    "  float lv=h*10.0;\n" +
    (hasDerivatives
      ? "  float w=max(fwidth(lv),1e-4);\n"
      : "  float w=0.05;\n") +
    "  float dMinor=abs(fract(lv+0.5)-0.5);\n" +
    "  float minor=1.0-smoothstep(0.25*w,1.35*w,dMinor);\n" +
    "  float dMajor=abs(fract(lv*0.2+0.5)-0.5)*5.0;\n" +
    "  float major=1.0-smoothstep(0.55*w,1.9*w,dMajor);\n" +
    // Very faint tint on high ground so peaks read as peaks.
    "  float fill=smoothstep(0.2,1.3,h)*0.22;\n" +
    "  float a=uAlpha*max(max(minor*0.7,major),fill);\n" +
    "  gl_FragColor=vec4(uColor*a,a);\n" +
    "}";

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("fitness-landscape shader:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.remove(); return; }
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);

  // One triangle covering the whole clip space.
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, "uRes");
  var uT = gl.getUniformLocation(prog, "uT");
  var uColor = gl.getUniformLocation(prog, "uColor");
  var uAlpha = gl.getUniformLocation(prog, "uAlpha");
  var uC = gl.getUniformLocation(prog, "uC");
  var uS = gl.getUniformLocation(prog, "uS");
  var uA = gl.getUniformLocation(prog, "uA");

  // --- landscape definition, seeded from the clock so every visit differs ----
  // mulberry32: tiny deterministic PRNG so the seed fully determines the scene.
  var seed = Date.now() >>> 0;
  function rand() {
    seed = (seed + 0x6D2B79F5) >>> 0;
    var r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }
  // Six peaks. Each drifts on a slow Lissajous orbit around a home position;
  // the orbit frequencies are incommensurate so the landscape never repeats.
  var peaks = [];
  var homes = [[-1.1, 0.3], [0.9, -0.4], [0.1, 0.55], [-0.3, -0.7], [1.7, 0.6], [-1.8, -0.3]];
  for (var i = 0; i < 6; i++) {
    peaks.push({
      hx: homes[i][0] + (rand() - 0.5) * 0.6,
      hy: homes[i][1] + (rand() - 0.5) * 0.5,
      rx: 0.25 + rand() * 0.3,            // orbit radius
      ry: 0.2 + rand() * 0.25,
      fx: 0.5 + rand() * 0.9,             // orbit frequencies
      fy: 0.5 + rand() * 0.9,
      px: rand() * Math.PI * 2,           // orbit phases
      py: rand() * Math.PI * 2,
      s: 0.35 + rand() * 0.5,             // width
      a: 0.55 + rand() * 0.45,            // height
    });
  }
  var tOffset = rand() * 1000;            // start somewhere along the orbits
  var centres = new Float32Array(12);
  var sizes = new Float32Array(6);
  var amps = new Float32Array(6);
  for (var j = 0; j < 6; j++) { sizes[j] = peaks[j].s; amps[j] = peaks[j].a; }
  gl.uniform1fv(uS, sizes);
  gl.uniform1fv(uA, amps);

  function updatePeaks(t) {
    for (var k = 0; k < 6; k++) {
      var pk = peaks[k];
      centres[2 * k] = pk.hx + pk.rx * Math.sin(t * pk.fx + pk.px);
      centres[2 * k + 1] = pk.hy + pk.ry * Math.cos(t * pk.fy + pk.py);
    }
    gl.uniform2fv(uC, centres);
  }

  // --- theme -------------------------------------------------------------
  // Dark lines on a white page read fainter than light lines on a dark one at
  // the same opacity, so light mode gets roughly double.
  function applyTheme() {
    var dark = document.documentElement.dataset.theme === "dark";
    if (dark) {
      gl.uniform3f(uColor, 0.93, 0.93, 0.95);
      gl.uniform1f(uAlpha, 0.20);
    } else {
      gl.uniform3f(uColor, 0.12, 0.12, 0.14);
      gl.uniform1f(uAlpha, 0.40);
    }
  }
  applyTheme();
  new MutationObserver(function () { applyTheme(); requestFrame(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // --- size --------------------------------------------------------------
  function resize() {
    var w = Math.max(1, Math.round(window.innerWidth * RENDER_SCALE));
    var h = Math.max(1, Math.round(window.innerHeight * RENDER_SCALE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    }
    requestFrame();
  }
  window.addEventListener("resize", resize, { passive: true });

  // --- animation loop ----------------------------------------------------
  // Exactly one requestAnimationFrame is ever pending (tracked in rafId), so
  // repeated tab hide/show cycles cannot stack up extra loops.
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var frameInterval = 1000 / FPS;
  var last = 0;
  var start = performance.now();
  var rafId = 0;
  var lost = false;

  function draw(now) {
    var t = tOffset + (now - start) * 0.001 * 0.08;
    updatePeaks(t);
    gl.uniform1f(uT, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop(now) {
    rafId = 0;
    if (document.hidden || lost) { return; }
    // Small tolerance: rAF timestamps jitter around 16.7ms, so an exact
    // comparison against 33.3ms would sometimes wait three frames.
    if (now - last >= frameInterval - 1) {
      last = now;
      draw(now);
    }
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (rafId || lost || reduceMotion || document.hidden) { return; }
    rafId = requestAnimationFrame(loop);
  }

  // Redraw on demand. With reduced motion there is no loop, so a static frame
  // is drawn once here and again only on resize or theme change.
  function requestFrame() {
    if (lost || rafId) { return; }
    if (reduceMotion) {
      rafId = requestAnimationFrame(function () { rafId = 0; draw(0); });
    } else {
      startLoop();
    }
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { requestFrame(); }
  });

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    lost = true;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    canvas.remove();
  });

  resize();          // sizes the canvas and requests the first frame
})();
