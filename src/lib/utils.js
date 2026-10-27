export const toFa = (v) => String(v ?? "").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
export const toEn = (v) =>
  String(v ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

export const num = (v) => Number(toEn(v).replace(/[^\d.]/g, "")) || 0;
export const fmt = (n) => Number(n || 0).toLocaleString("fa-IR") + " تومان";
export const fmtNum = (n) => Number(n || 0).toLocaleString("fa-IR");

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const randomCode = (len = 8) => {
  const a = new Uint32Array(len);
  crypto.getRandomValues(a);
  return Array.from(a, (x) => ALPHA[x % ALPHA.length]).join("");
};
export const genTrackingCode = () => "GGJ-" + randomCode(8);

export const toDate = (t) => (t?.toDate ? t.toDate() : t ? new Date(t) : null);
export const faDate = (t, withTime = false) => {
  const d = toDate(t);
  if (!d) return "";
  return withTime
    ? d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" })
    : d.toLocaleDateString("fa-IR");
};

export const slugify = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || randomCode(6).toLowerCase();

export const isValidMobile = (m) => /^09\d{9}$/.test(toEn(m).trim());

export const telLink = (p) => "tel:" + toEn(p).replace(/[^\d+]/g, "");
export const waLink = (p, text = "") =>
  "https://wa.me/98" + toEn(p).replace(/\D/g, "").replace(/^0/, "") + (text ? "?text=" + encodeURIComponent(text) : "");

// فشرده‌سازی عکس در مرورگر (برای عکس محصول و رسید) — خروجی data URL با حجم کم
export function compressImage(file, maxSide = 1000, quality = 0.78, maxBytes = 450_000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let side = maxSide;
        let q = quality;
        for (let i = 0; i < 6; i++) {
          const scale = Math.min(1, side / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          const url = c.toDataURL("image/webp", q);
          if (url.length * 0.75 <= maxBytes || i === 5) return resolve(url);
          side *= 0.8;
          q = Math.max(0.5, q - 0.08);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// صدای کوتاه اعلان برای ادمین
export function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.start(t);
      o.stop(t + 0.17);
    });
  } catch {
    /* بدون صدا */
  }
}

export const storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* حالت خصوصی */
    }
  },
};
