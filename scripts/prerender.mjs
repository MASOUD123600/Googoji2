// بعد از بیلد: برای هر محصول و صفحه اصلی یک HTML با عنوان، توضیحات، Open Graph و JSON-LD می‌سازد
// تا گوگل بدون اجرای جاوااسکریپت هم محتوا را ببیند. نقشه سایت (sitemap.xml) هم ساخته می‌شود.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SEED_PRODUCTS } from "../src/data/seedProducts.js";

const SITE = "https://googoji.ir";
const DIST = new URL("../dist/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const API_KEY = "AIzaSyD4PHoP3O2-MZiB_d1Ryt1Rs2iobViuNas";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// خواندن محصولات از Firestore (REST عمومی)؛ در صورت خطا از محصولات اولیه استفاده می‌شود
function fromFirestore(v) {
  if (!v) return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFirestore);
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, fromFirestore(x)]));
  return undefined;
}
async function loadProducts() {
  try {
    const out = [];
    let token = "";
    do {
      const r = await fetch(`https://firestore.googleapis.com/v1/projects/googoji-ae717/databases/(default)/documents/products?pageSize=300&key=${API_KEY}${token ? `&pageToken=${token}` : ""}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      for (const d of j.documents || []) out.push({ id: d.name.split("/").pop(), ...fromFirestore({ mapValue: { fields: d.fields } }) });
      token = j.nextPageToken || "";
    } while (token);
    if (out.length) return out;
    throw new Error("empty");
  } catch (e) {
    console.log(`prerender: Firestore در دسترس نبود (${e.message}) — استفاده از محصولات اولیه`);
    return SEED_PRODUCTS;
  }
}

function page(template, { title, description, path, image, jsonLd, body }) {
  const full = `${title} | پت شاپ گوگوجی`;
  const url = SITE + path;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(full)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(full)}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  if (image) html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${SITE + image}" />`);
  if (jsonLd) html = html.replace("</head>", `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`);
  // محتوای قابل خواندن برای خزنده؛ React بعد از بارگذاری آن را جایگزین می‌کند
  return html.replace('<div id="root"></div>', `<div id="root"><div style="max-width:900px;margin:40px auto;padding:16px;font-family:Tahoma">${body}</div></div>`);
}

const template = await readFile(join(DIST, "index.html"), "utf8");
const products = (await loadProducts()).filter((p) => p.active !== false);
const urls = ["/", "/shop", "/about", "/contact", "/faq", "/terms", "/privacy"];

for (const p of products) {
  const slug = p.slug || p.id;
  const img = (p.images || [])[0];
  const image = img && img.startsWith("/") ? img : undefined;
  const priced = Number(p.price) > 0;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.desc,
    ...(image && { image: [SITE + image] }),
    ...(p.brand && { brand: { "@type": "Brand", name: p.brand } }),
    category: p.category,
    sku: p.id,
    ...(priced && {
      offers: {
        "@type": "Offer",
        url: `${SITE}/p/${slug}`,
        priceCurrency: "IRR",
        price: Number(p.price) * 10,
        availability: Number(p.stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    }),
  };
  const body = `<h1>${esc(p.name)}</h1>${image ? `<img src="${image}" alt="${esc(p.name)}" width="400">` : ""}<p>${esc(p.desc)}</p><ul>${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>${priced ? `<p>قیمت: ${Number(p.price).toLocaleString("fa-IR")} تومان</p>` : ""}<p><a href="/shop">فروشگاه گوگوجی</a> — ${esc(p.category)}</p>`;
  const dir = join(DIST, "p", slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), page(template, { title: p.name, description: `${p.desc} خرید از پت شاپ گوگوجی با ارسال رایگان در تهران.`.slice(0, 300), path: `/p/${slug}`, image, jsonLd, body }));
  urls.push(`/p/${slug}`);
}

// صفحه فروشگاه با فهرست لینک همه محصولات
await mkdir(join(DIST, "shop"), { recursive: true });
await writeFile(
  join(DIST, "shop", "index.html"),
  page(template, {
    title: "فروشگاه آنلاین غذا و لوازم سگ و گربه",
    description: "خرید آنلاین غذای خشک و مرطوب، تشویقی، مکمل، شیرخشک، اسباب‌بازی و لوازم سگ و گربه از پت شاپ گوگوجی با ارسال رایگان در تهران.",
    path: "/shop",
    body: `<h1>فروشگاه پت شاپ گوگوجی</h1><ul>${products.map((p) => `<li><a href="/p/${p.slug || p.id}">${esc(p.name)}</a></li>`).join("")}</ul>`,
  }),
);

const today = new Date().toISOString().slice(0, 10);
await writeFile(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><priority>${u === "/" ? "1.0" : u.startsWith("/p/") ? "0.8" : "0.6"}</priority></url>`)
    .join("\n")}\n</urlset>\n`,
);
console.log(`prerender: ${products.length} صفحه محصول + sitemap با ${urls.length} آدرس ساخته شد`);
