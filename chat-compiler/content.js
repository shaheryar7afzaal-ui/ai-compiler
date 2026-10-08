(()=>{var O=[{name:"ChatGPT",host:/(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/,input:["#prompt-textarea","div.ProseMirror[contenteditable='true']","textarea"],send:["button[data-testid='send-button']","#composer-submit-button","button[aria-label='Send prompt']"]},{name:"Claude",host:/(^|\.)claude\.ai$/,input:["div.ProseMirror[contenteditable='true']","[data-testid='chat-input']","fieldset [contenteditable='true']"],send:["button[aria-label='Send message']","button[aria-label='Send Message']","fieldset button[type='submit']"]},{name:"Gemini",host:/(^|\.)gemini\.google\.com$/,input:["rich-textarea .ql-editor","div.ql-editor[contenteditable='true']"],send:["button.send-button","button[aria-label='Send message']"]},{name:"DeepSeek",host:/(^|\.)chat\.deepseek\.com$/,input:["textarea#chat-input","textarea"],send:["div[role='button'][aria-disabled='false']:has(svg)"]},{name:"Perplexity",host:/(^|\.)perplexity\.ai$/,input:["#ask-input","div[contenteditable='true'][role='textbox']","textarea"],send:["button[aria-label='Submit']","button[data-testid='submit-button']"]},{name:"Grok",host:/(^|\.)grok\.com$/,input:["div.ProseMirror[contenteditable='true']","textarea"],send:["button[aria-label='Submit']","button[type='submit']"]}];function A(t){return O.find(i=>i.host.test(t))||{name:"",input:[],send:[]}}function w(t){if(!t||!t.isConnected)return!1;let i=t.getBoundingClientRect(),r=getComputedStyle(t);return i.width>20&&i.height>8&&r.visibility!=="hidden"&&r.display!=="none"}function v(t){return!!t.closest("#chat-compiler-root")}function M(t,i=document){for(let e of t.input){let n=[...i.querySelectorAll(e)].filter(l=>w(l)&&!v(l));if(n.length)return n[n.length-1]}let r=[...i.querySelectorAll("textarea, [contenteditable='true'], [contenteditable='plaintext-only']")].filter(e=>w(e)&&!v(e)&&!e.closest("[contenteditable='true'] [contenteditable='true']")),c=null,u=-1;for(let e of r){let n=e.getBoundingClientRect(),l=n.width*Math.min(n.height,200)+n.bottom*10;l>u&&(c=e,u=l)}return c}function q(t,i,r=document){for(let e of t.send){let n;try{n=[...r.querySelectorAll(e)]}catch{continue}let l=n.filter(g=>w(g)&&!v(g)).pop();if(l)return l}let c=i?.closest("form, fieldset")||i?.parentElement?.parentElement?.parentElement;return c&&[...c.querySelectorAll("button")].filter(e=>w(e)&&!e.disabled).find(e=>/send|submit/i.test(e.getAttribute("aria-label")||e.textContent))||null}function E(t){return t.tagName==="TEXTAREA"||t.tagName==="INPUT"?t.value:t.innerText}function I(t,i){let r=t.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(r,"value").set.call(t,i),t.dispatchEvent(new Event("input",{bubbles:!0}))}function T(t){let i=t.ownerDocument.getSelection(),r=t.ownerDocument.createRange();r.selectNodeContents(t),r.collapse(!1),i.removeAllRanges(),i.addRange(r)}function N(t,i){if(t.focus(),t.tagName==="TEXTAREA"||t.tagName==="INPUT"){let n=t.value;return I(t,n?n.replace(/\s*$/,"")+`

`+i:i),t.value.includes(i.slice(0,20))}T(t);let r=i.trim().split(`
`).find(n=>n.trim())||"",c=E(t),u=new DataTransfer;if(u.setData("text/plain",i),t.dispatchEvent(new ClipboardEvent("paste",{clipboardData:u,bubbles:!0,cancelable:!0})),E(t).length>c.length)return!0;T(t);let e=i.split(`
`);return e.forEach((n,l)=>{n&&t.ownerDocument.execCommand("insertText",!1,n),l<e.length-1&&t.ownerDocument.execCommand("insertLineBreak")}),E(t).includes(r.trim().slice(0,15))}function R(t=document){let r=[...t.querySelectorAll("pre")].filter(n=>!v(n)&&n.textContent.trim()).pop();if(!r)return null;let c=r.querySelector("code")||r,e=(((c.className||"")+" "+(r.className||"")).match(/language-([\w+#-]+)/)||[])[1]||"";if(!e){let n=r.querySelector("div, span")?.textContent?.trim().toLowerCase()||"";/^(python|py|javascript|js|typescript|ts)$/.test(n)&&(e=n)}return e=/^py/i.test(e)?"python":/^(js|javascript|ts|typescript)$/i.test(e)?"javascript":e,{code:c.textContent.replace(/\n$/,""),lang:e}}(()=>{if(window.__chatCompilerLoaded)return;window.__chatCompilerLoaded=!0;let t=chrome.runtime.getURL("panel.html"),i=new URL(t).origin,r=A(location.hostname),c=r.input.length>0,u,e,n,l,g,f=!1,s={right:24,bottom:120,width:460,height:560},P=`
    :host { all: initial; }
    .box {
      position: fixed; z-index: 2147483646; display: flex; flex-direction: column;
      background: #141414; border: 1px solid #2e2e2e; border-radius: 10px; overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,.55), 0 0 0 1px rgba(0,0,0,.4);
      min-width: 320px; min-height: 260px;
    }
    .box.hidden { display: none; }
    .bar {
      height: 30px; flex: none; display: flex; align-items: center; padding: 0 10px; position: relative;
      background: #141414; border-bottom: 1px solid #262626; cursor: grab; user-select: none;
      font: 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color: #8a8a8a;
    }
    .bar:active { cursor: grabbing; }
    .lights { display: flex; gap: 7px; }
    .lights span { width: 11px; height: 11px; border-radius: 50%; background: #3a3a3a; display: grid; place-items: center; }
    .lights:hover span:nth-child(1) { background: #ff5f57; }
    .lights:hover span:nth-child(2) { background: #febc2e; }
    .lights:hover span:nth-child(3) { background: #28c840; }
    .lights span::after { content: ""; opacity: 0; font: 700 8px/1 system-ui, sans-serif; color: rgba(0,0,0,.6); }
    .lights:hover span:nth-child(1)::after { content: "\xD7"; opacity: 1; font-size: 10px; }
    .lights:hover span:nth-child(2)::after { content: "\u2013"; opacity: 1; }
    .lights span.close, .lights span.min { cursor: pointer; }
    .title { position: absolute; left: 0; right: 0; text-align: center; pointer-events: none; }
    iframe { flex: 1; width: 100%; border: 0; background: #181818; display: block; }
    .grip { position: absolute; left: 0; bottom: 0; width: 14px; height: 14px; cursor: nesw-resize; }
    .shield { position: fixed; inset: 0; z-index: 2147483647; display: none; }
    .shield.on { display: block; }
    .launch {
      position: fixed; right: 18px; bottom: 96px; z-index: 2147483645;
      width: 38px; height: 38px; border-radius: 10px; border: 1px solid #2e2e2e;
      background: #1f1f1f; color: #e4e4e4; cursor: pointer; display: grid; place-items: center;
      font: 600 12px/1 "SF Mono", Menlo, Consolas, monospace;
      box-shadow: 0 6px 20px rgba(0,0,0,.4); opacity: .9; transition: opacity .15s, transform .15s, background .15s;
    }
    .launch:hover { opacity: 1; transform: translateY(-1px); background: #262626; }
    .launch.hidden { display: none; }
  `;function $(){u=document.createElement("div"),u.id="chat-compiler-root",e=u.attachShadow({mode:"closed"}),e.innerHTML=`
      <style>${P}</style>
      <button class="launch hidden" title="Open Chat Compiler (Alt+Shift+K)">&lt;/&gt;</button>
      <div class="box hidden">
        <div class="bar">
          <div class="lights"><span class="close" title="Hide (Alt+Shift+K)"></span><span class="min" title="Hide (Alt+Shift+K)"></span><span></span></div>
          <span class="title">Chat Compiler</span>
        </div>
        <iframe allow="clipboard-write" title="Chat Compiler"></iframe>
        <div class="grip" title="Resize"></div>
      </div>
      <div class="shield"></div>`,document.documentElement.appendChild(u),l=e.querySelector(".box"),n=e.querySelector("iframe"),g=e.querySelector(".launch");let o=e.querySelector(".shield");g.addEventListener("click",()=>b(!0)),e.querySelectorAll(".lights .close, .lights .min").forEach(a=>a.addEventListener("click",()=>b(!1)));function d(a,m){a.preventDefault();let p={x:a.clientX,y:a.clientY,...s};o.classList.add("on"),o.style.cursor=getComputedStyle(a.target).cursor;let h=C=>{m(C.clientX-p.x,C.clientY-p.y,p),x()},L=()=>{o.classList.remove("on"),window.removeEventListener("mousemove",h,!0),window.removeEventListener("mouseup",L,!0),chrome.storage.local.set({ccGeom:s})};window.addEventListener("mousemove",h,!0),window.addEventListener("mouseup",L,!0)}e.querySelector(".bar").addEventListener("mousedown",a=>{a.target.closest(".lights span.close, .lights span.min")||d(a,(m,p,h)=>{s.right=h.right-m,s.bottom=h.bottom-p})}),e.querySelector(".grip").addEventListener("mousedown",a=>{d(a,(m,p,h)=>{s.width=Math.max(320,h.width-m),s.height=Math.max(260,h.height+p),s.bottom=h.bottom-(s.height-h.height)})}),window.addEventListener("resize",x)}function x(){let o=window.innerWidth,d=window.innerHeight;s.width=Math.min(s.width,o-16),s.height=Math.min(s.height,d-16),s.right=Math.min(Math.max(s.right,8-s.width+80),o-80),s.bottom=Math.min(Math.max(s.bottom,8),d-40),Object.assign(l.style,{right:s.right+"px",bottom:s.bottom+"px",width:s.width+"px",height:s.height+"px"})}function b(o){f=o,o&&!n.src&&(n.src=t),l.classList.toggle("hidden",!o),g.classList.toggle("hidden",o||!y),o&&x(),chrome.storage.local.set({ccOpen:o})}let y=!0;function S(o){n.contentWindow?.postMessage(o,i)}async function D({text:o,autoSend:d}){let a=M(r);if(!a)return{ok:!1,error:`Couldn't find the message box on ${r.name||"this page"}.`};if(!N(a,o))return{ok:!1,error:"Found the message box but couldn't type into it."};if(!d)return a.focus(),{ok:!0,sent:!1};for(let m=0;m<20;m++){await new Promise(h=>setTimeout(h,100));let p=q(r,a);if(p&&!p.disabled&&p.getAttribute("aria-disabled")!=="true")return p.click(),{ok:!0,sent:!0}}return a.focus(),{ok:!0,sent:!1,error:"Added to the chat box, but couldn't find the send button. Press Enter to send."}}window.addEventListener("message",async o=>{if(!n||o.source!==n.contentWindow||o.origin!==i)return;let d=o.data||{};if(d.type==="cc:send")S({type:"cc:send-result",...await D(d)});else if(d.type==="cc:import-request"){let a=R();S(a?{type:"cc:import",...a}:{type:"cc:import",error:"No code block found on this page yet."})}else d.type==="cc:hide"?b(!1):d.type==="cc:ready"&&S({type:"cc:site",name:r.name})});let k=!1;chrome.runtime.onMessage.addListener(o=>{o?.type==="cc:toggle"&&(k=!0,b(!f))}),$(),chrome.storage.local.get(["ccGeom","ccOpen","ccLauncher"],o=>{o.ccGeom&&(s={...s,...o.ccGeom}),y=o.ccLauncher!==!1&&c,f&&x(),c&&!k&&b(!!o.ccOpen)}),chrome.storage.onChanged.addListener(o=>{o.ccLauncher&&(y=o.ccLauncher.newValue!==!1&&c,g.classList.toggle("hidden",f||!y))})})();})();
