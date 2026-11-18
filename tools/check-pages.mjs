// Run: node tools/check-pages.mjs   (from the repo root). Exits 1 on any problem.
// Fails while any "[OWNER TO CONFIRM" remains in a page, and checks title, one H1, JSON-LD and local links.
import fs from 'fs'; import path from 'path';
const root = process.cwd(); let bad = 0;
const walk = d => fs.readdirSync(d,{withFileTypes:true}).flatMap(e => e.name.startsWith('.')||['tools','posts','node_modules'].includes(e.name) ? [] : e.isDirectory() ? walk(path.join(d,e.name)) : [path.join(d,e.name)]);
const files = walk(root).filter(f => /\.(html|txt|xml)$/.test(f));
const fail = (f,m) => { bad++; console.log('FAIL', path.relative(root,f), m); };
for (const f of files) {
  const t = fs.readFileSync(f,'utf8');
  if (t.includes('[OWNER TO CONFIRM')) fail(f, `${(t.match(/\[OWNER TO CONFIRM/g)||[]).length} placeholder(s) still open`);
  if (!f.endsWith('.html') || f.endsWith('post.html')) continue;
  if (!/<title>[^<]{10,}<\/title>/.test(t)) fail(f,'missing/short title');
  const h1 = (t.match(/<h1[\s>]/g)||[]).length;
  if (h1 !== 1 && !f.includes(path.join('blog',path.sep))) fail(f,`${h1} H1s`);
  for (const m of t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch(e) { fail(f,'invalid JSON-LD'); } }
  for (const m of t.matchAll(/(?:href|src)="([^"#?]+)[^"]*"/g)) {
    const u = m[1]; if (/^(https?:|mailto:|tel:|data:)/.test(u) || u.includes('OWNER TO CONFIRM') || /['+]/.test(u)) continue;
    let p = u.startsWith('/') ? path.join(root,u) : path.join(path.dirname(f),u);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p,'index.html');
    if (!fs.existsSync(p)) fail(f,`broken link ${u}`);
  }
}
console.log(bad ? `\n${bad} problem(s). Not ready to publish.` : `OK: ${files.length} files checked, nothing open.`);
process.exit(bad ? 1 : 0);
