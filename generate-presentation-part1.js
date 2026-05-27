const puppeteer = require("puppeteer");
const PptxGenJS = require("pptxgenjs");
const fs = require("fs"), path = require("path");
const DIR = path.join(__dirname, "mockups");

const C = { brand:"0f49bd", b6:"0c3a97", b7:"092c71", dark:"002f87", navy:"002a5c", a:"13ec6d", a2:"10bd57", w:"ffffff", g50:"f9fafb", g100:"f3f4f6", g200:"e5e7eb", g300:"d1d5db", g400:"9ca3af", g500:"6b7280", g600:"4b5563", g700:"374151", g800:"1f2937", g900:"111827" };

function css() { return `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;min-height:100vh}
.top{background:linear-gradient(135deg,#0f49bd,#002f87);color:white;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.top .l{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:700}
.top .nav{display:flex;gap:24px;font-size:14px}
.top .nav a{color:rgba(255,255,255,.85);text-decoration:none}
.top .nav a:hover{color:#fff}
.cart-badge{background:#13ec6d;color:#002f87;border-radius:999px;padding:2px 8px;font-size:12px;font-weight:700}
.pg{padding:24px}
.card{background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.1);padding:24px}
.badge{display:inline-flex;align-items:center;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600}
.b-blue{background:#dbeafe;color:#1d4ed8}
.b-green{background:#dcfce7;color:#16a34a}
.b-yellow{background:#fef3c7;color:#d97706}
.b-red{background:#fee2e2;color:#dc2626}
.b-gray{background:#f3f4f6;color:#6b7280}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:8px;font-weight:600;font-size:14px;border:none;cursor:pointer;text-decoration:none;transition:all .2s}
.btn-p{background:#0f49bd;color:white}
.btn-p:hover{background:#0c3a97}
.btn-g{background:#13ec6d;color:#002f87}
.btn-o{background:transparent;color:#0f49bd;border:2px solid #0f49bd}
.btn-sm{padding:6px 14px;font-size:13px}
.inp{width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;outline:none}
.inp:focus{border-color:#0f49bd;box-shadow:0 0 0 3px rgba(15,73,189,.1)}
.stat{background:white;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.stat .l{font-size:13px;color:#6b7280}
.stat .v{font-size:28px;font-weight:700;color:#111827}
.tbl{width:100%;border-collapse:collapse}
.tbl th{padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;background:#f9fafb;border-bottom:1px solid #e5e7eb}
.tbl td{padding:14px 16px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6}
.sb{width:260px;background:#092c71;color:white;min-height:100vh}
.sb .la{padding:20px;border-bottom:1px solid rgba(255,255,255,.1)}
.sb .ni{display:flex;align-items:center;gap:12px;padding:14px 20px;color:rgba(255,255,255,.7);text-decoration:none;font-size:14px;transition:all .2s}
.sb .ni:hover,.sb .ni.act{background:rgba(255,255,255,.1);color:white}
.sb .ni.act{border-left:3px solid #13ec6d}
.al{display:flex;min-height:100vh}
.ac{flex:1;padding:24px;overflow-y:auto}
.at{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
.at h1{font-size:22px;font-weight:700;color:#111827}
.gc{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:24px}
.pg2{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px}
.pc{background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);transition:transform .2s;cursor:pointer;position:relative}
.pc:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(0,0,0,.1)}
.pc .im{height:180px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f9fafb,#f3f4f6);padding:20px}
.pc .inf{padding:16px}
.pc .inf .ma{font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase}
.pc .inf .no{font-size:15px;font-weight:600;color:#111827;margin:4px 0}
.pc .inf .pr{font-size:20px;font-weight:700;color:#0f49bd}
.pc .inf .pa{font-size:13px;color:#9ca3af;text-decoration:line-through}
.pc .of{position:absolute;top:12px;left:12px;background:#ef4444;color:white;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700}
.fs{width:240px;flex-shrink:0;background:white;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.fs h3{font-size:14px;font-weight:600;color:#374151;margin-bottom:12px;text-transform:uppercase}
.fg{margin-bottom:20px}
.fo{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:14px;color:#4b5563;cursor:pointer}
.fo input{accent-color:#0f49bd}
.fg2{margin-bottom:16px}
.fg2 label{display:block;font-size:14px;font-weight:500;color:#374151;margin-bottom:4px}
.cw{position:fixed;bottom:24px;right:24px;z-index:100}
.cb{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#0f49bd,#002f87);color:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(15,73,189,.3)}
.cp{position:fixed;bottom:96px;right:24px;width:360px;height:500px;background:white;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.15);display:flex;flex-direction:column;overflow:hidden}
.ch{background:linear-gradient(135deg,#0f49bd,#002f87);color:white;padding:16px;display:flex;align-items:center;gap:12px}
.cmsg{flex:1;padding:16px;overflow-y:auto}
.msg{margin-bottom:12px;max-width:80%}
.msg.b{margin-right:auto}
.msg.u{margin-left:auto}
.msg .bub{padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.4}
.msg.b .bub{background:#f3f4f6;color:#1f2937;border-bottom-left-radius:4px}
.msg.u .bub{background:#0f49bd;color:white;border-bottom-right-radius:4px}
.cin{padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;gap:8px}
.cin input{flex:1;padding:10px 14px;border:1px solid #d1d5db;border-radius:24px;font-size:14px;outline:none}
.wh{background:linear-gradient(135deg,#0f49bd,#002a5c);color:white;padding:40px;border-radius:16px;margin-bottom:24px}
.wh h1{font-size:28px;font-weight:700;margin-bottom:8px}
.wh p{font-size:15px;opacity:.9}
.mp{background:#e8f4fd;border-radius:12px;height:280px;display:flex;align-items:center;justify-content:center;color:#0f49bd;font-size:14px;font-weight:600}
.suc{text-align:center;padding:60px 20px}
.suc .chk{width:80px;height:80px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}
.pb{height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden}
.pb .f{height:100%;background:linear-gradient(90deg,#13ec6d,#10bd57);border-radius:999px}
.av{width:36px;height:36px;border-radius:50%;background:#e6f0ff;color:#0f49bd;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}
.flex{display:flex;gap:20px}
.f1{flex:1}
.tc{text-align:center}
.mb4{margin-bottom:16px}
.mt4{margin-top:16px}
`.trim();
}

function page(html, opts={}) {
  const {nav=true}=opts;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${opts.title||'Paguito Telcel'}</title><script src="https://cdn.tailwindcss.com"></script><script>tailwind.config={theme:{extend:{colors:{brand:{50:'#e6f0ff',100:'#cce0ff',200:'#99c2ff',300:'#66a3ff',400:'#3385ff',500:'#0f49bd',600:'#0c3a97',700:'#092c71',800:'#061d4a',900:'#030f24'},'brand-dark':{500:'#002f87',600:'#00256b'},'brand-green':{500:'#13ec6d',600:'#10bd57'}}}}}</script><style>${css()}</style></head><body>${html}</body></html>`;
}
