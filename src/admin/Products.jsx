import { useMemo, useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { ArrowUp, Edit3, Plus, Save, Search, Trash2, Upload, X } from "lucide-react";
import { db } from "../firebase";
import { useApp } from "../store/AppContext";
import { Img, Modal, Spinner } from "../components/ui";
import { SEED_PRODUCTS } from "../data/seedProducts";
import { CATEGORIES, PETS } from "../config";
import { compressImage, fmtNum, num, slugify, toFa } from "../lib/utils";

const BLANK = { name: "", slug: "", brand: "", category: CATEGORIES[0].name, pet: "گربه", desc: "", features: [], price: "", comparePrice: "", stock: "10", badge: "", images: [], active: true, featured: false };

function ProductForm({ product, onClose }) {
  const { notify, products } = useApp();
  const [f, setF] = useState(() => ({ ...BLANK, ...product, images: product?.images || (product?.imageUrl ? [product.imageUrl] : []), features: product?.features || [] }));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const upload = async (e) => {
    const files = [...(e.target.files || [])];
    setUploading(true);
    try {
      for (const file of files) {
        const data = await compressImage(file, 1000, 0.8, 300_000);
        const m = await addDoc(collection(db, "media"), { data, name: file.name, createdAt: serverTimestamp() });
        setF((x) => ({ ...x, images: [...x.images, `media:${m.id}`] }));
      }
    } catch {
      notify("آپلود عکس ناموفق بود", "err");
    }
    setUploading(false);
    e.target.value = "";
  };
  const moveFirst = (k) => setF((x) => ({ ...x, images: [x.images[k], ...x.images.filter((_, i) => i !== k)] }));
  const dropImg = (k) => setF((x) => ({ ...x, images: x.images.filter((_, i) => i !== k) }));

  const save = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return notify("نام محصول الزامی است", "err");
    const slug = slugify(f.slug || f.name);
    if (products.some((p) => p.id !== product?.id && (p.slug || p.id) === slug)) return notify("این آدرس (slug) تکراری است", "err");
    setBusy(true);
    const data = {
      ...f,
      slug,
      name: f.name.trim(),
      price: num(f.price),
      comparePrice: num(f.comparePrice),
      stock: num(f.stock),
      features: (typeof f.features === "string" ? f.features.split("\n") : f.features).map((s) => s.trim()).filter(Boolean),
      updatedAt: serverTimestamp(),
    };
    delete data.id;
    delete data.imageUrl;
    try {
      if (product?.id) await updateDoc(doc(db, "products", product.id), data);
      else await setDoc(doc(db, "products", slug), { ...data, order: 999, createdAt: serverTimestamp() });
      notify("محصول ذخیره شد ✅");
      onClose();
    } catch (err) {
      console.error(err);
      notify("ذخیره ناموفق بود", "err");
    }
    setBusy(false);
  };

  return (
    <Modal open onClose={onClose} title={product?.id ? "ویرایش محصول" : "افزودن محصول جدید"} wide>
      <form onSubmit={save} className="stack">
        <div className="img-manager">
          {f.images.map((src, k) => (
            <div key={src + k} className={`img-slot ${k === 0 ? "main" : ""}`}>
              <Img src={src} small alt="" />
              {k === 0 ? <span className="tag">عکس اصلی</span> : <button type="button" onClick={() => moveFirst(k)} title="عکس اصلی شود"><ArrowUp size={14} /></button>}
              <button type="button" className="del" onClick={() => dropImg(k)} title="حذف"><X size={14} /></button>
            </div>
          ))}
          <button type="button" className="img-slot add" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Spinner /> : <><Upload size={22} /><small>افزودن عکس</small></>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={upload} />
        </div>
        <div className="form-grid">
          <label className="field full"><span>نام محصول *</span><input value={f.name} onChange={set("name")} required /></label>
          <label className="field"><span>قیمت (تومان)</span><input value={f.price} onChange={set("price")} inputMode="numeric" placeholder="مثلاً 285000" /></label>
          <label className="field"><span>قیمت قبل از تخفیف (اختیاری)</span><input value={f.comparePrice} onChange={set("comparePrice")} inputMode="numeric" /></label>
          <label className="field"><span>موجودی</span><input value={f.stock} onChange={set("stock")} inputMode="numeric" /></label>
          <label className="field"><span>برند</span><input value={f.brand} onChange={set("brand")} /></label>
          <label className="field"><span>دسته‌بندی</span>
            <select value={f.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}</select>
          </label>
          <label className="field"><span>مناسب برای</span>
            <select value={f.pet} onChange={set("pet")}>{PETS.map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <label className="field"><span>برچسب (پرفروش، جدید، ...)</span><input value={f.badge} onChange={set("badge")} /></label>
          <label className="field"><span>آدرس صفحه (اختیاری، انگلیسی)</span><input dir="ltr" value={f.slug} onChange={set("slug")} placeholder="josera-kitten" /></label>
          <label className="field full"><span>توضیح کوتاه (برای گوگل هم استفاده می‌شود)</span><textarea rows={3} value={f.desc} onChange={set("desc")} /></label>
          <label className="field full"><span>ویژگی‌ها (هر خط یک ویژگی)</span><textarea rows={4} value={Array.isArray(f.features) ? f.features.join("\n") : f.features} onChange={set("features")} /></label>
        </div>
        <div className="row-gap">
          <label className="check"><input type="checkbox" checked={f.active !== false} onChange={set("active")} /> نمایش در سایت</label>
          <label className="check"><input type="checkbox" checked={!!f.featured} onChange={set("featured")} /> محصول ویژه (صفحه اول)</label>
        </div>
        <button className="btn btn-p btn-lg" disabled={busy || uploading}>{busy ? <Spinner /> : <><Save size={18} /> ذخیره محصول</>}</button>
      </form>
    </Modal>
  );
}

export default function Products() {
  const { products, productsSource, notify } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [onlyNoPrice, setOnlyNoPrice] = useState(false);
  const [edits, setEdits] = useState({});
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const list = useMemo(
    () => products.filter((p) => (!cat || p.category === cat) && (!onlyNoPrice || !(Number(p.price) > 0)) && (!q || `${p.name} ${p.brand}`.includes(q))),
    [products, cat, q, onlyNoPrice],
  );
  const missingSeeds = SEED_PRODUCTS.filter((s) => productsSource === "seed" || !products.some((p) => p.id === s.id));
  const dirty = Object.keys(edits).length;
  const edit = (id, k, v) => setEdits((e) => ({ ...e, [id]: { ...e[id], [k]: v } }));
  const val = (p, k) => edits[p.id]?.[k] ?? p[k] ?? "";

  const saveAll = async () => {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      Object.entries(edits).forEach(([id, ch]) => {
        const data = {};
        if ("price" in ch) data.price = num(ch.price);
        if ("stock" in ch) data.stock = num(ch.stock);
        if ("active" in ch) data.active = ch.active;
        if ("featured" in ch) data.featured = ch.featured;
        batch.update(doc(db, "products", id), { ...data, updatedAt: serverTimestamp() });
      });
      await batch.commit();
      setEdits({});
      notify(`${toFa(dirty)} محصول به‌روز شد ✅`);
    } catch (e) {
      console.error(e);
      notify("ذخیره ناموفق بود — قوانین Firestore را بررسی کن", "err");
    }
    setSaving(false);
  };

  const importSeeds = async () => {
    if (!window.confirm(`${toFa(missingSeeds.length)} محصول آماده (با عکس و توضیح) به فروشگاه اضافه شود؟ قیمت‌ها را بعداً وارد کن.`)) return;
    setImporting(true);
    try {
      const batch = writeBatch(db);
      missingSeeds.forEach(({ id, ...p }) => batch.set(doc(db, "products", id), { ...p, createdAt: serverTimestamp() }));
      await batch.commit();
      notify("محصولات آماده اضافه شدند 🎉 حالا قیمت‌ها را وارد کن");
    } catch (e) {
      console.error(e);
      notify("ورود محصولات ناموفق بود — قوانین Firestore و ورود مدیر را بررسی کن", "err");
    }
    setImporting(false);
  };

  const remove = async (p) => {
    if (!window.confirm(`«${p.name}» حذف شود؟`)) return;
    await deleteDoc(doc(db, "products", p.id));
    notify("محصول حذف شد");
  };

  return (
    <div className="stack">
      {missingSeeds.length > 0 && (
        <div className="alert alert-warn row-between wrap">
          <span>📦 {toFa(missingSeeds.length)} محصول آماده از عکس‌های فروشگاه ساخته شده که هنوز وارد دیتابیس نشده‌اند.</span>
          <button className="btn btn-p btn-sm" onClick={importSeeds} disabled={importing}>{importing ? <Spinner /> : "ورود محصولات آماده"}</button>
        </div>
      )}
      <div className="shop-bar">
        <label className="search grow"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی محصول..." /></label>
        <select value={cat} onChange={(e) => setCat(e.target.value)}><option value="">همه دسته‌ها</option>{CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}</select>
        <label className="check"><input type="checkbox" checked={onlyNoPrice} onChange={(e) => setOnlyNoPrice(e.target.checked)} /> فقط بدون قیمت</label>
        <button className="btn btn-p" onClick={() => setEditing({})}><Plus size={17} /> محصول جدید</button>
      </div>
      <p className="muted small">💡 قیمت و موجودی را مستقیم در جدول تغییر بده و در آخر «ذخیره تغییرات» را بزن. برای عکس و توضیحات، دکمه ویرایش ✏️.</p>
      <div className="card table-card">
        <table className="table products-table">
          <thead><tr><th></th><th>محصول</th><th>قیمت (تومان)</th><th>موجودی</th><th>نمایش</th><th>ویژه</th><th></th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className={edits[p.id] ? "dirty" : ""}>
                <td className="td-img"><Img src={p.images?.[0] || p.imageUrl} small alt="" /></td>
                <td><b>{p.name}</b><div className="muted small">{p.category} • {p.brand}</div></td>
                <td>
                  <input className="cell-input" inputMode="numeric" value={val(p, "price") === 0 ? "" : val(p, "price")} placeholder="قیمت" onChange={(e) => edit(p.id, "price", e.target.value)} />
                  {num(val(p, "price")) > 0 && <div className="muted tiny">{fmtNum(num(val(p, "price")))}</div>}
                </td>
                <td><input className="cell-input sm" inputMode="numeric" value={val(p, "stock")} onChange={(e) => edit(p.id, "stock", e.target.value)} /></td>
                <td><input type="checkbox" className="switch" checked={val(p, "active") !== false} onChange={(e) => edit(p.id, "active", e.target.checked)} /></td>
                <td><input type="checkbox" className="switch" checked={!!val(p, "featured")} onChange={(e) => edit(p.id, "featured", e.target.checked)} /></td>
                <td className="nowrap">
                  <button className="icon-btn" onClick={() => setEditing(p)} title="ویرایش"><Edit3 size={17} /></button>
                  <button className="icon-btn danger" onClick={() => remove(p)} title="حذف"><Trash2 size={17} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dirty > 0 && (
        <div className="save-bar">
          <span>{toFa(dirty)} تغییر ذخیره‌نشده</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setEdits({})}>لغو</button>
          <button className="btn btn-accent" onClick={saveAll} disabled={saving}>{saving ? <Spinner /> : <><Save size={17} /> ذخیره تغییرات</>}</button>
        </div>
      )}
      {editing && <ProductForm product={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </div>
  );
}
