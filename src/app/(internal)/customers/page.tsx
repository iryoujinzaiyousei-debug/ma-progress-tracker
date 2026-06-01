import { getCustomersByRole } from "@/lib/customers";
import { getBuyers } from "@/lib/buyers";
import { PageHeader } from "@/components/layout/page-header";
import { CustomersTabs } from "@/components/customers/customers-tabs";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [{ sellers }, buyers] = await Promise.all([
    getCustomersByRole(),
    getBuyers(),
  ]);

  return (
    <>
      <PageHeader
        title="顧客一覧"
        description="売主は案件から集約、買主は買い顧客マスタ（買いニーズ）を管理します。"
      />
      <CustomersTabs sellers={sellers} buyers={buyers} />
    </>
  );
}
