"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { tndToMillimes } from "@/lib/format";

type Category = { id: number; name_fr: string };

type Variant = { id?: string; name: string; stock: string };

type Product = {
  id: string;
  title: string;
  description: string | null;
  price_millimes: number;
  compare_at_millimes: number | null;
  stock_qty: number;
  status: string;
  category_id: number | null;
  images: string[];
};

const PRESETS: Record<string, string[]> = {
  Vêtements: ["XS", "S", "M", "L", "XL", "XXL"],
  Chaussures: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  "Taille unique": ["Unique"],
};

export default function ProductForm({
  merchantId,
  categories,
  product,
  initialVariants = [],
}: {
  merchantId: string;
  categories: Category[];
  product?: Product;
  initialVariants?: { id: string; name: string; stock_qty: number }[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const editing = Boolean(product);

  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product ? (product.price_millimes / 1000).toFixed(3) : "");
  const [compareAt, setCompareAt] = useState(
    product?.compare_at_millimes ? (product.compare_at_millimes / 1000).toFixed(3) : "",
  );
  const [stock, setStock] = useState(String(product?.stock_qty ?? 1));
  const [status, setStatus] = useState(product?.status || "active");
  const [categoryId, setCategoryId] = useState(product?.category_id ? String(product.category_id) : "");
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const [hasSizes, setHasSizes] = useState(initialVariants.length > 0);
  const [variants, setVariants] = useState<Variant[]>(
    initialVariants.map((v) => ({ id: v.id, name: v.name, stock: String(v.stock_qty) })),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(names: string[]) {
    setVariants((prev) => {
      const existing = new Map(prev.map((v) => [v.name.toUpperCase(), v]));
      return names.map((n) => existing.get(n.toUpperCase()) || { name: n, stock: "0" });
    });
  }

  function updateVariant(i: number, patch: Partial<Variant>) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  const totalSizeStock = variants.reduce((s, v) => s + (parseInt(v.stock, 10) || 0), 0);

  async function save() {
    setError(null);

    if (title.trim().length < 2) return setError("Donnez un titre au produit.");
    const priceMillimes = tndToMillimes(price);
    if (priceMillimes === null) return setError("Prix invalide. Exemple : 49,900");
    const compareMillimes = compareAt.trim() ? tndToMillimes(compareAt) : null;

    const cleanVariants = hasSizes
      ? variants.map((v) => ({ ...v, name: v.name.trim(), qty: parseInt(v.stock, 10) })).filter((v) => v.name)
      : [];

    if (hasSizes && cleanVariants.length === 0) return setError("Ajoutez au moins une taille, ou désactivez les tailles.");
    if (cleanVariants.some((v) => isNaN(v.qty) || v.qty < 0)) return setError("Un stock de taille est invalide.");
    const names = cleanVariants.map((v) => v.name.toUpperCase());
    if (new Set(names).size !== names.length) return setError("Deux tailles portent le même nom.");

    const stockQty = hasSizes ? cleanVariants.reduce((s, v) => s + v.qty, 0) : parseInt(stock, 10);
    if (isNaN(stockQty) || stockQty < 0) return setError("Stock invalide.");

    setSaving(true);

    const uploadedUrls: string[] = [];
    for (const file of newFiles) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = merchantId + "/" + crypto.randomUUID() + "." + ext;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file);
      if (upErr) {
        setSaving(false);
        return setError("Échec de l'envoi d'une image. Réessayez.");
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      uploadedUrls.push(data.publicUrl);
    }

    // With sizes, "active" with zero stock is contradictory: the DB trigger will flip it anyway.
    const effectiveStatus = hasSizes && stockQty === 0 && status === "active" ? "out_of_stock" : status;

    const payload = {
      merchant_id: merchantId,
      title: title.trim(),
      description: description.trim() || null,
      price_millimes: priceMillimes,
      compare_at_millimes: compareMillimes,
      stock_qty: stockQty,
      status: effectiveStatus,
      category_id: categoryId ? parseInt(categoryId, 10) : null,
      images: [...existingImages, ...uploadedUrls],
    };

    let productId = product?.id;
    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", product!.id);
      if (error) {
        setSaving(false);
        return setError("Enregistrement impossible. Réessayez.");
      }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error || !data) {
        setSaving(false);
        return setError("Enregistrement impossible. Réessayez.");
      }
      productId = data.id;
    }

    // ---- sync sizes: delete removed, update kept, insert new ----
    const keptIds = new Set(cleanVariants.filter((v) => v.id).map((v) => v.id));
    const toDelete = hasSizes
      ? initialVariants.map((v) => v.id).filter((id) => !keptIds.has(id))
      : initialVariants.map((v) => v.id);
    if (toDelete.length > 0) {
      const { error } = await supabase.from("product_variants").delete().in("id", toDelete);
      if (error) {
        setSaving(false);
        return setError("Impossible de retirer une taille. Réessayez.");
      }
    }
    for (let i = 0; i < cleanVariants.length; i++) {
      const v = cleanVariants[i];
      const { error } = v.id
        ? await supabase.from("product_variants").update({ name: v.name, stock_qty: v.qty, sort_order: i }).eq("id", v.id)
        : await supabase.from("product_variants").insert({ product_id: productId, name: v.name, stock_qty: v.qty, sort_order: i });
      if (error) {
        setSaving(false);
        return setError(`Taille « ${v.name} » non enregistrée. Réessayez.`);
      }
    }

    setSaving(false);
    router.push("/dashboard/products");
    router.refresh();
  }

  async function remove() {
    if (!editing) return;
    if (!confirm("Supprimer ce produit ? Cette action est définitive.")) return;
    setSaving(true);
    const { error } = await supabase.from("products").delete().eq("id", product!.id);
    setSaving(false);
    if (error) return setError("Suppression impossible. Réessayez.");
    router.push("/dashboard/products");
    router.refresh();
  }

  const inputCls = "mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 font-medium";

  return (
    <div className="waybill mt-6 space-y-4 p-6 sm:p-8">
      <label className="block text-sm font-semibold">
        Titre *
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Robe kaftan brodée" className={inputCls} />
      </label>

      <label className="block text-sm font-semibold">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Matière, coupe, conseils de taille..."
          className={inputCls}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold">
          Prix (DT) *
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="49,900" inputMode="decimal" className={inputCls} />
        </label>
        <label className="block text-sm font-semibold">
          Prix barré (DT)
          <input value={compareAt} onChange={(e) => setCompareAt(e.target.value)} placeholder="Optionnel" inputMode="decimal" className={inputCls} />
        </label>
      </div>

      {/* ---------- SIZES ---------- */}
      <div className="rounded-xl border border-line bg-plaster p-4">
        <label className="flex items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={hasSizes}
            onChange={(e) => {
              setHasSizes(e.target.checked);
              if (e.target.checked && variants.length === 0) applyPreset(PRESETS["Vêtements"]);
            }}
            className="h-4 w-4 accent-door"
          />
          Ce produit a des tailles
        </label>

        {hasSizes ? (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESETS).map(([label, names]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => applyPreset(names)}
                  className="rounded-full border border-line bg-white px-3 py-1 text-xs font-bold text-ink-soft hover:text-ink"
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setVariants((prev) => [...prev, { name: "", stock: "0" }])}
                className="rounded-full border border-door bg-door-wash px-3 py-1 text-xs font-bold text-door-deep"
              >
                + Taille
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {variants.map((v, i) => {
                const qty = parseInt(v.stock, 10) || 0;
                return (
                  <div key={v.id || "new-" + i} className="flex items-center gap-2">
                    <input
                      value={v.name}
                      onChange={(e) => updateVariant(i, { name: e.target.value })}
                      placeholder="Taille"
                      className="w-28 rounded-lg border border-line bg-white px-3 py-2 text-sm font-bold"
                    />
                    <input
                      value={v.stock}
                      onChange={(e) => updateVariant(i, { stock: e.target.value.replace(/\D/g, "") })}
                      inputMode="numeric"
                      placeholder="Stock"
                      className="w-24 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium"
                    />
                    <span className={"text-xs font-semibold " + (qty === 0 ? "text-clay" : qty <= 3 ? "text-amber-600" : "text-ink-soft")}>
                      {qty === 0 ? "épuisée" : qty <= 3 ? "presque épuisée" : "en stock"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                      className="ml-auto text-sm font-bold text-clay hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              Stock total du produit : <b>{totalSizeStock}</b> (somme des tailles, calculé automatiquement). Une taille à 0 reste
              visible dans l'app mais barrée.
            </p>
          </div>
        ) : (
          <label className="mt-3 block text-sm font-semibold">
            Stock *
            <input
              value={stock}
              onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="mt-1.5 w-40 rounded-lg border border-line bg-white px-3 py-2.5 font-medium"
            />
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold">
          Catégorie
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
            <option value="">Choisir...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_fr}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Statut
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="active">En ligne</option>
            <option value="draft">Brouillon</option>
            <option value="out_of_stock">Rupture de stock</option>
            <option value="archived">Archivé</option>
          </select>
        </label>
      </div>

      <div className="text-sm font-semibold">
        Photos
        {existingImages.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {existingImages.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setExistingImages(existingImages.filter((u) => u !== url))}
                  className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-ink text-xs font-bold text-white"
                  aria-label="Retirer la photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
          className="mt-2 block w-full text-sm font-medium file:mr-3 file:rounded-lg file:border-0 file:bg-door-wash file:px-3 file:py-2 file:text-sm file:font-bold file:text-door-deep"
        />
        {newFiles.length > 0 && (
          <p className="mt-1 text-xs font-medium text-ink-soft">{newFiles.length} photo(s) à envoyer lors de l'enregistrement.</p>
        )}
      </div>

      {error && <p className="rounded-lg bg-clay-wash px-3 py-2 text-sm font-semibold text-clay">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-door px-5 py-2.5 font-bold text-white hover:bg-door-deep disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : editing ? "Enregistrer" : "Ajouter le produit"}
        </button>
        {editing && (
          <button
            onClick={remove}
            disabled={saving}
            className="rounded-lg px-4 py-2.5 text-sm font-bold text-clay hover:bg-clay-wash disabled:opacity-60"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
