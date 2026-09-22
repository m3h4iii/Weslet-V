import { notFound } from "next/navigation";
import { requireMerchant } from "@/lib/supabase/server";
import ProductForm from "@/components/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, merchant } = await requireMerchant();

  const [{ data: product }, { data: categories }, { data: variants }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("merchant_id", merchant.id)
      .maybeSingle(),
    supabase.from("categories").select("id, name_fr").order("sort_order"),
    supabase
      .from("product_variants")
      .select("id, name, stock_qty")
      .eq("product_id", id)
      .order("sort_order"),
  ]);

  if (!product) notFound();

  return (
    <main>
      <h1 className="text-2xl font-extrabold tracking-tight">Modifier le produit</h1>
      <ProductForm
        merchantId={merchant.id}
        categories={categories || []}
        product={product}
        initialVariants={variants || []}
      />
    </main>
  );
}
