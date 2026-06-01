import { getUsers } from "@/lib/deals";
import { getBuyers } from "@/lib/buyers";
import { createDeal } from "@/app/(internal)/deals/actions";
import { DealForm } from "@/components/deals/deal-form";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function NewDealPage() {
  const [users, buyers] = await Promise.all([getUsers(), getBuyers()]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="新規案件"
        description="案件の基本情報・商流・進捗・金額・担当者を登録します。"
      />
      <DealForm action={createDeal} users={users} buyers={buyers} />
    </div>
  );
}
