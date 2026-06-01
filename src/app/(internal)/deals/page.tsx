import Link from "next/link";
import { getDeals } from "@/lib/deals";
import { DealsView } from "@/components/deals/deals-view";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const deals = await getDeals();

  return (
    <>
      <PageHeader
        title="案件一覧"
        description={`全 ${deals.length} 件`}
        action={
          <Button render={<Link href="/deals/new" />}>新規案件</Button>
        }
      />
      <DealsView deals={deals} />
    </>
  );
}
