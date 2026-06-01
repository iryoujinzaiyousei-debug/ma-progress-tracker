import { notFound } from "next/navigation";
import { getBuyerById } from "@/lib/buyers";
import { updateBuyer } from "@/app/(internal)/buyers/actions";
import { BuyerForm } from "@/components/buyers/buyer-form";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function EditBuyerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buyer = await getBuyerById(id);
  if (!buyer) notFound();

  const action = updateBuyer.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="買い顧客を編集" description={buyer.company_name} />
      <BuyerForm action={action} buyer={buyer} />
    </div>
  );
}
