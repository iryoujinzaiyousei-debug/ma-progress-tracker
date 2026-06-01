import { createBuyer } from "@/app/(internal)/buyers/actions";
import { BuyerForm } from "@/components/buyers/buyer-form";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default function NewBuyerPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="買い顧客を登録"
        description="買い手の基本情報と買いニーズ（譲渡スキーム・価格帯・エリア・業種）を登録します。"
      />
      <BuyerForm action={createBuyer} />
    </div>
  );
}
