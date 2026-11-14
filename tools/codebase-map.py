#!/usr/bin/env python3
"""Peta codebase: pohon file yang berubah di branch ini (dibanding main) beserta riwayat commit.

Pakai:  python3 tools/codebase-map.py > peta.html
Hanya membaca git, tidak mengubah apa pun. Halaman yang dihasilkan berdiri sendiri (tanpa jaringan).
"""
import html
import json
import subprocess
import sys

BASE = sys.argv[1] if len(sys.argv) > 1 else "main"


def git(*args: str) -> str:
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


# Catatan singkat per folder/berkas penting. Hanya penjelasan, tidak memengaruhi data.
NOTES = {
    "frontend/src/components": "Komponen bersama (StatCard, chip, EmptyState, tabel footer, field berlabel)",
    "frontend/src/components/layout": "Sidebar, app bar desktop, top bar dan navigasi bawah HP",
    "frontend/src/layouts": "Rangka halaman: DesktopLayout (admin, manager) dan MobileLayout (agent)",
    "frontend/src/router": "Rute. Satu file per bagian di routes/ supaya layar bisa dikerjakan terpisah",
    "frontend/src/views": "Layar. shared/ berisi penanda sementara dan galeri komponen",
    "frontend/src/stores": "Pinia. session.ts = sesi tiruan sampai login sungguhan ada",
    "frontend/src/plugins": "Vuetify (tema, defaults, locale id) dan Pinia",
    "frontend/src/styles/global.css": "Penyesuaian yang tidak bisa lewat prop Vuetify (field 42px, fokus, tombol)",
    "frontend/src/utils/theme-colors.ts": "Memetakan tokens.json ke warna tema Vuetify",
    "backend/src": "Express + TypeScript. controllers/routes/middleware/services/utils",
    "backend/prisma": "schema.prisma lengkap dan seed dev/tes",
    "backend/sql/deltas": "Skrip SQL produksi idempotent (001_init.sql)",
    "tests/e2e": "Playwright (Python): login, rangka, tema, tampilan visual",
}

status_map: dict[str, str] = {}
for line in git("diff", "--name-status", "-M", f"{BASE}...HEAD").splitlines():
    parts = line.split("\t")
    code = parts[0][0]
    path = parts[-1]
    status_map[path] = {"A": "baru", "M": "ubah", "D": "hapus", "R": "pindah"}.get(code, "ubah")
# Perubahan yang belum di-commit
for line in git("status", "--porcelain").splitlines():
    code, path = line[:2].strip(), line[3:].strip().strip('"')
    if path.startswith(("frontend/", "backend/", "tests/", "tools/")) and not path.endswith("/"):
        status_map.setdefault(path, "belum commit")

stats: dict[str, tuple[int, int]] = {}
for line in git("diff", "--numstat", "-M", f"{BASE}...HEAD").splitlines():
    a, d, path = line.split("\t", 2)
    if "=>" in path:
        path = path.split("=>")[-1].strip(" {}")
    stats[path] = (int(a) if a.isdigit() else 0, int(d) if d.isdigit() else 0)

files = []
for path, st in sorted(status_map.items()):
    if "node_modules/" in path or path.endswith("package-lock.json"):
        continue
    add, dele = stats.get(path, (0, 0))
    files.append({"path": path, "status": st, "add": add, "del": dele})

commits = []
for line in git("log", f"{BASE}..HEAD", "--pretty=%h\t%ad\t%s", "--date=format:%d %b %H:%M").splitlines():
    h, d, s = line.split("\t", 2)
    commits.append({"hash": h, "date": d, "subject": s})

branch = git("rev-parse", "--abbrev-ref", "HEAD").strip()
data = {"branch": branch, "base": BASE, "files": files, "commits": commits, "notes": NOTES}

PAGE = r"""<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Peta codebase — SA Visit Tracker</title>
<style>
:root{--bg:#f5f7fc;--surface:#fff;--border:#d7dfe9;--text:#2d3643;--muted:#5e718d;--brand:#040abe;--soft:#ecf2ff;
--new-bg:#bcf8cc;--new:#006f36;--mod-bg:#fbefb2;--mod:#8a5a00;--del-bg:#ffcccf;--del:#b01b13;--mov-bg:#e1f4fc;--mov:#00548d;--unc-bg:#ebe0ff;--unc:#4b1fa8}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/20px system-ui,-apple-system,"Segoe UI",sans-serif}
header{padding:24px 32px 8px}h1{margin:0;font-size:20px;line-height:28px}.sub{color:var(--muted);margin-top:4px}
.wrap{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px;padding:16px 32px 40px;align-items:start}
@media(max-width:900px){.wrap{grid-template-columns:1fr;padding:16px}header{padding:20px 16px 4px}}
.card{background:var(--surface);border:1px solid var(--border);border-radius:8px}
.tools{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border);align-items:center}
.chip{border:1px solid var(--border);background:var(--surface);border-radius:999px;padding:3px 12px;font:inherit;font-size:13px;cursor:pointer;color:var(--text)}
.chip[aria-pressed=true]{background:var(--soft);border-color:var(--brand);color:var(--brand);font-weight:600}
input[type=search]{flex:1;min-width:160px;border:1px solid var(--border);border-radius:5px;height:34px;padding:0 10px;font:inherit}
.sum{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px 16px;border-bottom:1px solid var(--border)}
.sum div{font-size:12px;color:var(--muted)}.sum b{display:block;font-size:20px;line-height:28px;color:var(--text)}
ul.tree,ul.tree ul{list-style:none;margin:0;padding:0}ul.tree{padding:8px 0}ul.tree ul{margin-left:18px;border-left:1px dashed var(--border)}
.row{display:flex;align-items:center;gap:8px;padding:3px 12px;min-height:28px}.row:hover{background:var(--bg)}
.dir{cursor:pointer;font-weight:600;user-select:none}.dir .arrow{display:inline-block;width:14px;color:var(--muted);transition:transform .1s}
.dir.closed .arrow{transform:rotate(-90deg)}.closed+ul{display:none}
.name{white-space:nowrap}.note{color:var(--muted);font-size:12px;margin-left:4px;white-space:normal}
.badge{font-size:11px;font-weight:600;border-radius:999px;padding:0 8px;line-height:18px;white-space:nowrap}
.baru{background:var(--new-bg);color:var(--new)}.ubah{background:var(--mod-bg);color:var(--mod)}.hapus{background:var(--del-bg);color:var(--del)}
.pindah{background:var(--mov-bg);color:var(--mov)}.belum{background:var(--unc-bg);color:var(--unc)}
.lines{margin-left:auto;font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}.lines .a{color:var(--new)}.lines .d{color:var(--del)}
.count{margin-left:auto;font-size:12px;color:var(--muted)}
aside .card{padding:16px}aside h2{font-size:14px;margin:0 0 12px}.commit{display:flex;gap:10px;padding:8px 0;border-top:1px solid var(--border)}
.commit:first-of-type{border-top:0}.hash{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--brand)}.cm{font-size:13px}.cd{font-size:12px;color:var(--muted)}
.empty{padding:24px;color:var(--muted);text-align:center}
</style></head><body>
<header><h1>Peta codebase — SA Visit Tracker</h1>
<div class="sub" id="sub"></div></header>
<div class="wrap"><main class="card"><div class="sum" id="sum"></div>
<div class="tools"><input type="search" id="q" placeholder="Cari nama file…" aria-label="Cari file">
<span id="filters"></span></div><ul class="tree" id="tree"></ul></main>
<aside><div class="card"><h2>Riwayat commit</h2><div id="commits"></div></div></aside></div>
<script>
const DATA = __DATA__;
const LABEL={baru:"Baru",ubah:"Diubah",hapus:"Dihapus",pindah:"Dipindah","belum commit":"Belum commit"};
const CLS={baru:"baru",ubah:"ubah",hapus:"hapus",pindah:"pindah","belum commit":"belum"};
let active=new Set(Object.keys(LABEL)), query="";
document.getElementById("sub").textContent=`Branch ${DATA.branch} dibanding ${DATA.base} · ${DATA.files.length} file · ${DATA.commits.length} commit`;
function esc(s){return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function summary(){const c={};let a=0,d=0;DATA.files.forEach(f=>{c[f.status]=(c[f.status]||0)+1;a+=f.add;d+=f.del});
 document.getElementById("sum").innerHTML=`<div><b>${DATA.files.length}</b>file berubah</div><div><b>${c.baru||0}</b>file baru</div><div><b>${(c.ubah||0)+(c.pindah||0)}</b>diubah / dipindah</div><div><b><span style="color:var(--new)">+${a}</span> <span style="color:var(--del)">−${d}</span></b>baris</div>`}
function filters(){const el=document.getElementById("filters");el.innerHTML="";Object.keys(LABEL).forEach(k=>{const n=DATA.files.filter(f=>f.status===k).length;if(!n)return;
 const b=document.createElement("button");b.className="chip";b.setAttribute("aria-pressed",active.has(k));b.textContent=`${LABEL[k]} ${n}`;
 b.onclick=()=>{active.has(k)?active.delete(k):active.add(k);filters();render()};el.appendChild(b)})}
function build(){const root={};DATA.files.filter(f=>active.has(f.status)&&f.path.toLowerCase().includes(query)).forEach(f=>{
 const parts=f.path.split("/");let n=root;parts.forEach((p,i)=>{if(i===parts.length-1){(n.__files??=[]).push({name:p,f})}else{n=(n[p]??={})}})});return root}
function count(n){let c=(n.__files||[]).length;Object.keys(n).filter(k=>k!=="__files").forEach(k=>c+=count(n[k]));return c}
function node(n,path,depth){let h="";const dirs=Object.keys(n).filter(k=>k!=="__files").sort();
 dirs.forEach(k=>{const p=path?path+"/"+k:k;const closed=depth>=3&&!query?"closed":"";const note=DATA.notes[p];
  h+=`<li><div class="row dir ${closed}" onclick="this.classList.toggle('closed')"><span class="arrow">▾</span><span class="name">${esc(k)}/</span>${note?`<span class="note">${esc(note)}</span>`:""}<span class="count">${count(n[k])}</span></div><ul>${node(n[k],p,depth+1)}</ul></li>`});
 (n.__files||[]).sort((a,b)=>a.name.localeCompare(b.name)).forEach(({name,f})=>{const note=DATA.notes[f.path];
  h+=`<li><div class="row"><span class="name">${esc(name)}</span><span class="badge ${CLS[f.status]}">${LABEL[f.status]}</span>${note?`<span class="note">${esc(note)}</span>`:""}<span class="lines">${f.add||f.del?`<span class="a">+${f.add}</span> <span class="d">−${f.del}</span>`:""}</span></div></li>`});return h}
function render(){const t=build();const h=node(t,"",0);document.getElementById("tree").innerHTML=h||'<li class="empty">Tidak ada file yang cocok.</li>'}
document.getElementById("q").oninput=e=>{query=e.target.value.toLowerCase();render()};
document.getElementById("commits").innerHTML=DATA.commits.map(c=>`<div class="commit"><span class="hash">${c.hash}</span><div><div class="cm">${esc(c.subject)}</div><div class="cd">${esc(c.date)}</div></div></div>`).join("")||'<div class="empty">Belum ada commit.</div>';
summary();filters();render();
</script></body></html>"""

sys.stdout.write(PAGE.replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/")))
