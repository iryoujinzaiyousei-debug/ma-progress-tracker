import { notFound } from "next/navigation";
import { getDealById, getUsers } from "@/lib/deals";
import { getBuyers } from "@/lib/buyers";
import { updateDeal } from "@/app/(internal)/deals/actions";
import { DealForm } from "@/components/deals/deal-form";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [deal, users, buyers] = await Promise.all([
    getDealById(id),
    getUsers(),
    getBuyers(),
  ]);

  if (!deal) notFound();

  const action = updateDeal.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="案件を編集" description={deal.deal_name} />
      <DealForm action={action} users={users} buyers={buyers} deal={deal} />
    </div>
  );
}
