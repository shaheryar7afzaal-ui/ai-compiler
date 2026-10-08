// Python runner. Runs in a Web Worker so a long loop never freezes the page,
// and the panel can kill it with a Stop button. Pyodide is bundled with the
// extension (Chrome Web Store rules forbid loading code from a CDN).
importScripts("pyodide/pyodide.js");

let py = null;
let outBuf = "";
let errBuf = "";
let lastFlush = 0;
let stdinQueue = [];
const dec = new TextDecoder();
const decErr = new TextDecoder();

function flush() {
  if (outBuf) { postMessage({ type: "out", text: outBuf }); outBuf = ""; }
  if (errBuf) { postMessage({ type: "err", text: errBuf }); errBuf = ""; }
  lastFlush = performance.now();
}

// Python blocks the worker while it runs, so timers never fire mid-run.
// Flush on size/time instead, so long programs still stream output.
function maybeFlush() {
  if (outBuf.length + errBuf.length > 8192 || performance.now() - lastFlush > 60) flush();
}

const ready = loadPyodide({ indexURL: new URL("pyodide/", self.location.href).href })
  .then((p) => {
    py = p;
    py.setStdout({ write: (buf) => { outBuf += dec.decode(buf, { stream: true }); maybeFlush(); return buf.length; } });
    py.setStderr({ write: (buf) => { errBuf += decErr.decode(buf, { stream: true }); maybeFlush(); return buf.length; } });
    py.setStdin({
      stdin: () => {
        const line = stdinQueue.shift();
        if (line === undefined) { flush(); return undefined; } // EOF -> EOFError in Python
        outBuf += line + "\n"; // echo, so the transcript reads like a terminal
        flush();
        return line + "\n";
      },
    });
    postMessage({ type: "ready", version: py.version });
  })
  .catch((e) => postMessage({ type: "boot-error", message: String(e && e.message || e) }));

// Keep the user's part of the traceback, drop Pyodide's internal frames.
function cleanTraceback(msg) {
  const lines = msg.split("\n");
  const first = lines.findIndex((l) => l.includes('File "main.py"'));
  if (first === -1) return msg.trim();
  return ["Traceback (most recent call last):", ...lines.slice(first)].join("\n").trim();
}

self.onmessage = async ({ data }) => {
  if (data.type !== "run") return;
  await ready;
  if (!py) return;
  stdinQueue = data.stdin ? data.stdin.replace(/\r/g, "").split("\n") : [];
  if (stdinQueue.length && stdinQueue[stdinQueue.length - 1] === "") stdinQueue.pop();
  const ns = py.globals.get("dict")();
  ns.set("__name__", "__main__");
  const t0 = performance.now();
  let error = null;
  try {
    await py.runPythonAsync(data.code, { globals: ns, filename: "main.py" });
  } catch (e) {
    error = cleanTraceback(String(e.message || e));
    if (/EOFError/.test(error)) error += "\n\n(Your program asked for input. Put it in the Input tab, one line per input() call.)";
    if (/ModuleNotFoundError/.test(error)) error += "\n\n(Only the Python standard library is available offline.)";
  } finally {
    ns.destroy();
  }
  outBuf += dec.decode();
  flush();
  postMessage({ type: "done", error, ms: performance.now() - t0 });
};
