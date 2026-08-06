const PAGE_CSS = `
:root { --bg:#0f172a; --panel:#1e293b; --accent:#38bdf8; --text:#e2e8f0; --muted:#94a3b8; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; line-height:1.5; }
main { max-width:760px; margin:0 auto; padding:48px 20px; }
h1 { font-size:1.9rem; margin:0 0 8px; color:#fff; }
h2 { font-size:1.25rem; margin:32px 0 12px; color:var(--accent); }
p { color:var(--muted); }
code { background:var(--panel); padding:2px 6px; border-radius:6px; font-size:.9em; }
a { color:var(--accent); }
ul.downloads { list-style:none; padding:0; margin:16px 0; }
ul.downloads li { margin:10px 0; }
ul.downloads a { display:inline-block; padding:10px 16px; background:var(--panel); border:1px solid #334155; border-radius:10px; text-decoration:none; font-weight:600; }
ul.downloads a:hover { border-color:var(--accent); }
table { width:100%; border-collapse:collapse; margin-top:12px; }
th, td { text-align:left; padding:10px 12px; border-bottom:1px solid #334155; font-size:.92rem; }
th { color:var(--muted); font-weight:600; }
td a { word-break:break-all; }
.note { margin-top:40px; padding:14px 16px; background:var(--panel); border-left:4px solid var(--accent); border-radius:8px; font-size:.9rem; }
.footer { margin-top:32px; color:var(--muted); font-size:.85rem; }
`;

const HTML_HEAD = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TCM Android Builds</title>
<style>${PAGE_CSS}</style>
</head>
<body>
<main>`;

const HTML_TAIL = `</main>
</body>
</html>`;

function withCors(headers) {
  headers["Access-Control-Allow-Origin"] = "*";
  return headers;
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: withCors({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    }),
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function landingPage() {
  return `${HTML_HEAD}
<h1>TCM Android Builds</h1>
<p>Development and internal test builds for the TCM Android app, served directly from Cloudflare R2 for immediate installation.</p>
<ul class="downloads">
  <li><a href="/apk/latest-release.apk">Download APK (installable) — latest-release.apk</a></li>
  <li><a href="/aab/latest-release.aab">Download AAB (Play upload) — latest-release.aab</a></li>
</ul>
<h2>About these builds</h2>
<p>These are development/internal builds produced by the CI pipeline, <strong>not</strong> Play Store builds. They are meant for installers, testers, and quick side-loading on Android devices. For an up-to-date list of every artifact in the bucket, see <a href="/files">all files</a>.</p>
<div class="note">This page is served from the Cloudflare Workers subdomain <code>https://tcm-dist.&lt;subdomain&gt;.workers.dev</code> (the actual subdomain is assigned at deploy time).</div>
<div class="footer">TCM Distribution Worker &middot; Cloudflare R2 + Workers</div>
${HTML_TAIL}`;
}

function notFoundPage(key) {
  return `${HTML_HEAD}
<h1>404 &mdash; Build not found yet</h1>
<p>No artifact named <code>${escapeHtml(key)}</code> exists in the distribution bucket yet.</p>
<p>Run the build pipeline (push to <code>main</code> or trigger <code>build-android</code> / <code>deploy-dist</code>) to upload a build, then reload this page.</p>
<p><a href="/">Back to home</a> &middot; <a href="/files">All files</a></p>
${HTML_TAIL}`;
}

async function filesPage(bucket) {
  const objects = [];
  let cursor;
  do {
    const page = cursor ? await bucket.list({ cursor }) : await bucket.list();
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  const rows = objects
    .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded))
    .map(
      (o) => `<tr>
  <td><a href="/dl/${encodeURIComponent(o.key)}">${escapeHtml(o.key)}</a></td>
  <td>${(o.size / 1048576).toFixed(2)} MB</td>
  <td>${escapeHtml(new Date(o.uploaded).toISOString())}</td>
</tr>`
    )
    .join("\n");

  const body = objects.length === 0
    ? `<p>No artifacts have been uploaded yet. Run the build pipeline to upload <code>latest-release.apk</code>, <code>latest-release.aab</code>, or versioned <code>tcm-v&lt;version&gt;-release.*</code> files.</p>`
    : `<table>
<thead>
<tr><th>File</th><th>Size</th><th>Uploaded (UTC)</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>`;

  return `${HTML_HEAD}
<h1>All Build Files</h1>
${body}
<p><a href="/">Back to home</a></p>
${HTML_TAIL}`;
}

function contentTypeForKey(key) {
  return key.endsWith(".apk")
    ? "application/vnd.android.package-archive"
    : "application/octet-stream";
}

async function serveObject(bucket, key) {
  const object = await bucket.get(key);
  if (!object) {
    return htmlResponse(notFoundPage(key), 404);
  }
  return new Response(object.body, {
    headers: withCors({
      "Content-Type": contentTypeForKey(key),
      "Content-Disposition": `attachment; filename="${key}"`,
      "Cache-Control": "no-cache",
      "Content-Length": String(object.size),
    }),
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const bucket = env.DIST_BUCKET;

    if (request.method !== "GET" && request.method !== "HEAD") {
      return htmlResponse(`${HTML_HEAD}
<h1>405 &mdash; Method Not Allowed</h1>
<p>This endpoint only supports GET requests.</p>
${HTML_TAIL}`, 405);
    }

    if (pathname === "/") {
      return htmlResponse(landingPage());
    }

    if (pathname === "/files") {
      return htmlResponse(await filesPage(bucket));
    }

    const dlMatch = pathname.match(/^\/dl\/(.+)$/);
    let key = null;
    if (dlMatch) {
      key = decodeURIComponent(dlMatch[1]);
    } else if (pathname === "/apk/latest-release.apk") {
      key = "latest-release.apk";
    } else if (pathname === "/aab/latest-release.aab") {
      key = "latest-release.aab";
    }

    if (key) {
      return serveObject(bucket, key);
    }

    return htmlResponse(notFoundPage(pathname), 404);
  },
};
