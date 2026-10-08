// JavaScript runner. Lives in a sandboxed page (the only place an MV3
// extension may eval code), and runs each program in a throwaway Worker so
// infinite loops can be killed.

const WORKER_SRC = `
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function fmt(v, depth = 0, seen = new WeakSet()) {
  if (typeof v === "string") return depth ? JSON.stringify(v) : v;
  if (typeof v === "bigint") return v + "n";
  if (typeof v === "function") return "[Function: " + (v.name || "anonymous") + "]";
  if (typeof v === "symbol") return v.toString();
  if (v === null || typeof v !== "object") return String(v);
  if (v instanceof Error) return v.stack || (v.name + ": " + v.message);
  if (seen.has(v)) return "[Circular]";
  if (depth > 3) return Array.isArray(v) ? "[Array]" : "[Object]";
  seen.add(v);
  const f = (x) => fmt(x, depth + 1, seen);
  let s;
  if (Array.isArray(v)) s = "[ " + v.map(f).join(", ") + " ]";
  else if (v instanceof Map) s = "Map(" + v.size + ") { " + [...v].map(([k, x]) => f(k) + " => " + f(x)).join(", ") + " }";
  else if (v instanceof Set) s = "Set(" + v.size + ") { " + [...v].map(f).join(", ") + " }";
  else if (v instanceof Date) s = v.toISOString();
  else {
    const name = v.constructor && v.constructor.name !== "Object" ? v.constructor.name + " " : "";
    const keys = Object.keys(v);
    s = keys.length ? name + "{ " + keys.map((k) => (/^[A-Za-z_$][\\w$]*$/.test(k) ? k : JSON.stringify(k)) + ": " + f(v[k])).join(", ") + " }" : name + "{}";
  }
  seen.delete(v);
  if (s === "[  ]") s = "[]";
  return s;
}

let buf = [], last = 0;
function emit(kind, args) {
  buf.push({ kind, text: args.map((a) => fmt(a)).join(" ") + "\\n" });
  if (buf.length > 200 || performance.now() - last > 60) flush();
}
function flush() {
  for (const b of buf) postMessage({ type: b.kind, text: b.text });
  buf = []; last = performance.now();
}
setInterval(flush, 50);

self.onmessage = async ({ data }) => {
  const stdin = data.stdin ? data.stdin.replace(/\\r/g, "").split("\\n") : [];
  if (stdin.length && stdin[stdin.length - 1] === "") stdin.pop();
  const con = {
    log: (...a) => emit("out", a), info: (...a) => emit("out", a), debug: (...a) => emit("out", a),
    warn: (...a) => emit("err", a), error: (...a) => emit("err", a),
    table: (d) => emit("out", [d]),
  };
  self.console = Object.assign(self.console || {}, con);
  // prompt() reads the next line from the Input tab, like input() in Python.
  self.prompt = (q) => {
    const line = stdin.length ? stdin.shift() : null;
    emit("out", [(q ? q + " " : "") + (line ?? "")]);
    return line;
  };
  const t0 = performance.now();
  let error = null;
  try {
    await new AsyncFunction(data.code)();
  } catch (e) {
    // Point at the user's line numbers (the function wrapper adds 2 lines) and drop runner frames.
    const head = e && e.name ? e.name + ": " + e.message : String(e);
    const frames = String((e && e.stack) || "").split("\\n")
      .map((l) => { const m = l.match(/<anonymous>:(\\d+):(\\d+)/); return m ? "    at line " + (m[1] - 2) + ":" + m[2] : null; })
      .filter(Boolean);
    error = [head, ...frames].join("\\n");
  }
  flush();
  postMessage({ type: "done", error, ms: performance.now() - t0 });
};
`;

const workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
let worker = null;

function stop() {
  if (worker) { worker.terminate(); worker = null; }
}

window.addEventListener("message", (e) => {
  if (e.source !== window.parent) return;
  const msg = e.data || {};
  if (msg.type === "stop") { stop(); return; }
  if (msg.type !== "run") return;
  stop();
  worker = new Worker(workerUrl);
  worker.onmessage = (ev) => window.parent.postMessage(ev.data, "*");
  worker.onerror = (ev) => {
    ev.preventDefault();
    window.parent.postMessage({ type: "done", error: String(ev.message || "Error"), ms: 0 }, "*");
  };
  worker.postMessage({ code: msg.code, stdin: msg.stdin });
});

window.parent.postMessage({ type: "sandbox-ready" }, "*");
