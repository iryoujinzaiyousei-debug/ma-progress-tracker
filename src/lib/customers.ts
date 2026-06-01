import "server-only";
import { getDeals, type DealWithAssignees } from "@/lib/deals";
import { isTerminalStatus } from "@/lib/constants";

export type CustomerRole = "seller" | "buyer";

export type CustomerDeal = {
  deal: DealWithAssignees;
  role: CustomerRole;
};

export type CustomerSummary = {
  name: string;
  dealCount: number;
  activeCount: number; // 進行中（終端以外）
  wonCount: number; // 成約・引渡
  lostCount: number; // 失注
  totalTransferPrice: number; // 譲渡価格の合計（null は除外）
  lastUpdated: string; // 最新の updated_at
};

const WON = new Set(["closed_won", "handover"]);

function blankSummary(name: string): CustomerSummary {
  return {
    name,
    dealCount: 0,
    activeCount: 0,
    wonCount: 0,
    lostCount: 0,
    totalTransferPrice: 0,
    lastUpdated: "",
  };
}

function accumulate(s: CustomerSummary, deal: DealWithAssignees) {
  s.dealCount += 1;
  if (WON.has(deal.current_status)) s.wonCount += 1;
  else if (deal.current_status === "lost") s.lostCount += 1;
  if (!isTerminalStatus(deal.current_status)) s.activeCount += 1;
  if (deal.transfer_price) s.totalTransferPrice += deal.transfer_price;
  if (deal.updated_at > s.lastUpdated) s.lastUpdated = deal.updated_at;
}

function sortSummaries(map: Map<string, CustomerSummary>): CustomerSummary[] {
  return [...map.values()].sort(
    (a, b) => b.dealCount - a.dealCount || a.name.localeCompare(b.name, "ja"),
  );
}

/**
 * 顧客を役割（売主 / 買主）ごとに集約して一覧化する（各タブ用、件数の多い順）。
 * 同じ社名が売主と買主の両方にいる場合は、それぞれのタブに役割別の集計で現れる。
 */
export async function getCustomersByRole(): Promise<{
  sellers: CustomerSummary[];
  buyers: CustomerSummary[];
}> {
  const deals = await getDeals();
  const sellerMap = new Map<string, CustomerSummary>();
  const buyerMap = new Map<string, CustomerSummary>();

  for (const deal of deals) {
    const seller = deal.seller_company?.trim();
    if (seller) {
      const s = sellerMap.get(seller) ?? blankSummary(seller);
      accumulate(s, deal);
      sellerMap.set(seller, s);
    }
    const buyer = deal.buyer_company?.trim();
    if (buyer) {
      const s = buyerMap.get(buyer) ?? blankSummary(buyer);
      accumulate(s, deal);
      buyerMap.set(buyer, s);
    }
  }

  return {
    sellers: sortSummaries(sellerMap),
    buyers: sortSummaries(buyerMap),
  };
}

/** 指定顧客の案件を、役割（売主/買主）付きで取得する。 */
export async function getCustomerDetail(name: string): Promise<{
  summary: CustomerSummary;
  asSeller: DealWithAssignees[];
  asBuyer: DealWithAssignees[];
} | null> {
  const deals = await getDeals();
  const summary = blankSummary(name);
  const asSeller: DealWithAssignees[] = [];
  const asBuyer: DealWithAssignees[] = [];

  for (const deal of deals) {
    let matched = false;
    if (deal.seller_company?.trim() === name) {
      asSeller.push(deal);
      matched = true;
    }
    if (deal.buyer_company?.trim() === name) {
      asBuyer.push(deal);
      matched = true;
    }
    if (matched) accumulate(summary, deal);
  }

  if (summary.dealCount === 0) return null;
  return { summary, asSeller, asBuyer };
}
