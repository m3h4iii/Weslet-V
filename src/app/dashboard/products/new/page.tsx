import { requireMerchant } from "@/lib/supabase/server";
import ProductForm from "@/components/ProductForm";

export default async function NewProductPage() {
  const { supabase, merchant } = await requireMerchant();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name_fr")
    .order("sort_order");

  return (
    <main>
      <h1 className="text-2xl font-extrabold tracking-tight">Nouveau produit</h1>
      <ProductForm merchantId={merchant.id} categories={categories || []} />
    </main>
  );
}
