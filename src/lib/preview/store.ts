import "server-only";
import type { DealWithAssignees, DealAssigneeInfo } from "@/lib/deals";
import type { DealDocument } from "@/lib/documents";
import type {
  UserRow,
  DealRow,
  DealStatusHistoryRow,
  BuyerRow,
} from "@/lib/types";
import {
  PIPELINE_STATUSES,
  type DealStatus,
  type DealType,
  type DocumentCategory,
} from "@/lib/constants";

/**
 * プレビュー用のメモリ内ストア。サーバープロセス内で共有され、
 * セッション中の作成・編集・ステータス変更が反映される（再起動でリセット）。
 */

type HistoryRow = DealStatusHistoryRow & { changed_by_name: string | null };

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString();
const dateInDays = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export const MOCK_USERS: UserRow[] = [
  {
    id: "u1",
    name: "田中 一郎",
    email: "tanaka@example.com",
    role: "admin",
    created_at: daysAgo(120),
  },
  {
    id: "u2",
    name: "佐藤 花子",
    email: "sato@example.com",
    role: "staff",
    created_at: daysAgo(90),
  },
  {
    id: "u3",
    name: "鈴木 健太",
    email: "suzuki@example.com",
    role: "staff",
    created_at: daysAgo(60),
  },
];

const PREVIEW_USER = MOCK_USERS[0];

function nameOf(userId: string): string {
  return MOCK_USERS.find((u) => u.id === userId)?.name ?? "（不明）";
}

// 進捗履歴を、現在ステータスまでの進行から生成する
function buildHistory(dealId: string, status: DealStatus): HistoryRow[] {
  const PIPELINE = PIPELINE_STATUSES; // 提案中..引渡
  let path: DealStatus[];
  const idx = PIPELINE.indexOf(status);
  if (idx >= 0) {
    path = PIPELINE.slice(0, idx + 1);
  } else {
    // lost / on_hold（分岐）：途中まで進んで分岐した想定
    path = ["inquiry", "materials_received", "nda", status];
  }

  const total = path.length;
  return path.map((to, i) => {
    const from = i === 0 ? null : path[i - 1];
    const changer = MOCK_USERS[i % MOCK_USERS.length];
    return {
      id: `${dealId}-h${i}`,
      deal_id: dealId,
      from_status: from,
      to_status: to,
      note: null,
      changed_by: changer.id,
      changed_at: daysAgo((total - i) * 4),
      changed_by_name: changer.name,
    };
  });
}

type Seed = {
  id: string;
  deal_name: string;
  deal_type: DealType;
  current_status: DealStatus;
  seller_company?: string | null;
  buyer_company?: string | null;
  referrer_company?: string | null;
  referred_company?: string | null;
  next_action?: string | null;
  scheduled_date?: string | null;
  transfer_price?: number | null;
  retainer_fee?: number | null;
  success_fee?: number | null;
  remarks_internal?: string | null;
  remarks_shared?: string | null;
  share_enabled?: boolean;
  updatedDaysAgo: number;
  assignees: { user_id: string; is_primary: boolean }[];
};

const SEEDS: Seed[] = [
  {
    id: "d1",
    deal_name: "飲食店A 事業譲渡",
    deal_type: "ma_business",
    current_status: "inquiry",
    seller_company: "株式会社A商店",
    next_action: "初回ヒアリングの日程調整",
    scheduled_date: dateInDays(5),
    transfer_price: 8_000_000,
    retainer_fee: 300_000,
    remarks_shared: "ご相談ありがとうございます。まずは概要のヒアリングからお願いします。",
    updatedDaysAgo: 0,
    assignees: [{ user_id: "u1", is_primary: true }],
  },
  {
    id: "d2",
    deal_name: "美容室B 内装譲渡",
    deal_type: "interior",
    current_status: "materials_received",
    seller_company: "B Beauty 合同会社",
    next_action: "受領資料のレビュー",
    scheduled_date: dateInDays(3),
    transfer_price: 3_500_000,
    retainer_fee: 200_000,
    updatedDaysAgo: 5, // stale
    assignees: [{ user_id: "u2", is_primary: true }],
  },
  {
    id: "d3",
    deal_name: "法人C 法人格譲渡",
    deal_type: "corporate",
    current_status: "nda",
    seller_company: "株式会社C",
    referrer_company: "提携先D税理士法人",
    next_action: "NDA署名版の回収",
    scheduled_date: dateInDays(-2), // overdue
    transfer_price: 1_200_000,
    success_fee: 500_000,
    updatedDaysAgo: 1,
    assignees: [{ user_id: "u1", is_primary: true }, { user_id: "u3", is_primary: false }],
  },
  {
    id: "d4",
    deal_name: "クリニックD 事業譲渡",
    deal_type: "ma_business",
    current_status: "meeting_scheduling",
    seller_company: "医療法人D会",
    next_action: null,
    scheduled_date: null, // incomplete
    transfer_price: 25_000_000,
    updatedDaysAgo: 4, // stale + incomplete
    assignees: [{ user_id: "u3", is_primary: true }],
  },
  {
    id: "d5",
    deal_name: "ITスタートアップE 株式譲渡",
    deal_type: "ma_business",
    current_status: "due_diligence",
    seller_company: "E Tech 株式会社",
    buyer_company: "大手SIerF",
    referrer_company: "VC G キャピタル",
    referred_company: "大手SIerF",
    next_action: "財務DDの指摘事項を整理",
    scheduled_date: dateInDays(7),
    transfer_price: 180_000_000,
    retainer_fee: 1_000_000,
    success_fee: 9_000_000,
    remarks_internal: "キーマンの継続コミットが論点。表明保証の範囲を要確認。",
    remarks_shared: "デューデリジェンスを進めております。来週、財務面の確認を予定しています。",
    share_enabled: true,
    updatedDaysAgo: 0,
    assignees: [{ user_id: "u2", is_primary: true }, { user_id: "u1", is_primary: false }],
  },
  {
    id: "d6",
    deal_name: "店舗F 内装譲渡",
    deal_type: "interior",
    current_status: "closed_won",
    seller_company: "F フード",
    buyer_company: "新規出店オーナー",
    transfer_price: 5_000_000,
    retainer_fee: 200_000,
    success_fee: 400_000,
    remarks_shared: "ご成約ありがとうございました。引渡手続きを進めます。",
    share_enabled: true,
    updatedDaysAgo: 8,
    assignees: [{ user_id: "u1", is_primary: true }],
  },
  {
    id: "d7",
    deal_name: "会社G 法人格譲渡",
    deal_type: "corporate",
    current_status: "on_hold",
    seller_company: "株式会社G",
    next_action: "先方の社内検討待ち",
    transfer_price: 900_000,
    updatedDaysAgo: 14,
    assignees: [{ user_id: "u2", is_primary: true }],
  },
  {
    id: "d8",
    deal_name: "飲食チェーンH 事業譲渡",
    deal_type: "ma_business",
    current_status: "basic_agreement",
    seller_company: "H ダイニング株式会社",
    buyer_company: "外食チェーンI",
    next_action: "基本合意書のドラフト送付",
    scheduled_date: dateInDays(4),
    transfer_price: 60_000_000,
    retainer_fee: 500_000,
    success_fee: 3_000_000,
    remarks_shared: "基本合意に向けて条件を調整しております。",
    share_enabled: true,
    updatedDaysAgo: 2,
    assignees: [{ user_id: "u3", is_primary: true }, { user_id: "u2", is_primary: false }],
  },
];

function seedToDeal(s: Seed): DealWithAssignees {
  const assignees: DealAssigneeInfo[] = s.assignees.map((a) => ({
    user_id: a.user_id,
    is_primary: a.is_primary,
    name: nameOf(a.user_id),
  }));
  const base: DealRow = {
    id: s.id,
    deal_name: s.deal_name,
    deal_type: s.deal_type,
    seller_company: s.seller_company ?? null,
    buyer_company: s.buyer_company ?? null,
    referrer_company: s.referrer_company ?? null,
    referred_company: s.referred_company ?? null,
    current_status: s.current_status,
    next_action: s.next_action ?? null,
    scheduled_date: s.scheduled_date ?? null,
    transfer_price: s.transfer_price ?? null,
    retainer_fee: s.retainer_fee ?? null,
    success_fee: s.success_fee ?? null,
    remarks_internal: s.remarks_internal ?? null,
    remarks_shared: s.remarks_shared ?? null,
    share_token: `preview-${s.id}`,
    share_enabled: s.share_enabled ?? false,
    created_by: "u1",
    created_at: daysAgo(30),
    updated_at: daysAgo(s.updatedDaysAgo),
  };
  return { ...base, assignees };
}

// ---- 可変ストア -------------------------------------------

const deals: DealWithAssignees[] = SEEDS.map(seedToDeal);
const histories = new Map<string, HistoryRow[]>(
  SEEDS.map((s) => [s.id, buildHistory(s.id, s.current_status)]),
);
let counter = 100;
let docCounter = 100;
let buyerCounter = 100;

// 買い顧客マスタ（買いニーズ）
const buyers: BuyerRow[] = [
  {
    id: "b1",
    company_name: "株式会社リテラ投資",
    contact_name: "投資企画部 高橋",
    contact_email: "takahashi@litera-inv.example.com",
    contact_phone: "03-1234-5678",
    desired_schemes: ["ma_business"],
    budget_min: 50_000_000,
    budget_max: 300_000_000,
    areas: ["東京都", "神奈川県"],
    industries: "飲食・サービス業、店舗型ビジネス",
    notes: "黒字案件を優先。キーマンの引継ぎ条件を重視。",
    status: "active",
    created_by: "u1",
    created_at: daysAgo(40),
    updated_at: daysAgo(3),
  },
  {
    id: "b2",
    company_name: "個人投資家 山本様",
    contact_name: "山本",
    contact_email: "yamamoto@example.com",
    contact_phone: null,
    desired_schemes: ["interior", "corporate"],
    budget_min: 1_000_000,
    budget_max: 10_000_000,
    areas: ["東京都23区"],
    industries: "美容・小売（居抜き歓迎）",
    notes: "スピード重視。初期費用を抑えたい。",
    status: "active",
    created_by: "u2",
    created_at: daysAgo(20),
    updated_at: daysAgo(1),
  },
  {
    id: "b3",
    company_name: "大手SIerF",
    contact_name: "経営企画 佐々木",
    contact_email: "sasaki@sier-f.example.com",
    contact_phone: "03-9876-5432",
    desired_schemes: ["ma_business"],
    budget_min: null,
    budget_max: 200_000_000,
    areas: ["全国"],
    industries: "IT・ソフトウェア開発、SaaS",
    notes: "エンジニア組織の獲得が主目的（アクハイヤー含む）。",
    status: "active",
    created_by: "u1",
    created_at: daysAgo(15),
    updated_at: daysAgo(2),
  },
];

// プレビュー用のサンプル画像（インラインSVGの data URL）
const SAMPLE_IMAGE_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'>" +
      "<rect width='100%' height='100%' fill='#e2e8f0'/>" +
      "<rect x='20' y='20' width='440' height='260' rx='12' fill='#f8fafc' stroke='#cbd5e1'/>" +
      "<text x='240' y='150' font-family='sans-serif' font-size='22' fill='#475569' text-anchor='middle'>サンプル画像（店舗外観）</text>" +
      "<text x='240' y='185' font-family='sans-serif' font-size='13' fill='#94a3b8' text-anchor='middle'>インラインプレビューのデモ</text>" +
      "</svg>",
  );

const documents = new Map<string, DealDocument[]>();

function seedDoc(
  dealId: string,
  partial: Omit<DealDocument, "id" | "deal_id" | "created_at"> & {
    daysAgo?: number;
  },
): DealDocument {
  const { daysAgo: ago = 3, ...rest } = partial;
  return {
    id: `doc-${docCounter++}`,
    deal_id: dealId,
    created_at: daysAgo(ago),
    ...rest,
  };
}

documents.set("d5", [
  seedDoc("d5", {
    category: "materials",
    kind: "file",
    name: "店舗外観.svg",
    mime_type: "image/svg+xml",
    size_bytes: 184_320,
    external_url: null,
    preview_url: SAMPLE_IMAGE_URL,
    daysAgo: 6,
  }),
  seedDoc("d5", {
    category: "financial",
    kind: "link",
    name: "詳細財務資料（Googleドライブ）",
    mime_type: null,
    size_bytes: null,
    external_url:
      "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz",
    preview_url:
      "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz",
    daysAgo: 4,
  }),
]);

documents.set("d6", [
  seedDoc("d6", {
    category: "contract",
    kind: "link",
    name: "契約書一式（Googleドライブ）",
    mime_type: null,
    size_bytes: null,
    external_url:
      "https://drive.google.com/drive/folders/9ZyXwVuTsRqPoNmLkJiHgFeDcBa",
    preview_url:
      "https://drive.google.com/drive/folders/9ZyXwVuTsRqPoNmLkJiHgFeDcBa",
    daysAgo: 9,
  }),
]);

function sortByUpdated(list: DealWithAssignees[]) {
  return [...list].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export const previewStore = {
  previewUser() {
    return {
      authId: PREVIEW_USER.id,
      email: PREVIEW_USER.email,
      profile: PREVIEW_USER,
    };
  },

  listUsers(): UserRow[] {
    return MOCK_USERS;
  },

  listDeals(): DealWithAssignees[] {
    return sortByUpdated(deals);
  },

  getDeal(id: string): DealWithAssignees | null {
    return deals.find((d) => d.id === id) ?? null;
  },

  getByToken(token: string): DealWithAssignees | null {
    return deals.find((d) => d.share_token === token && d.share_enabled) ?? null;
  },

  getHistory(id: string): HistoryRow[] {
    return [...(histories.get(id) ?? [])].sort((a, b) =>
      b.changed_at.localeCompare(a.changed_at),
    );
  },

  create(
    fields: Omit<DealRow, "id" | "created_at" | "updated_at" | "share_token"> & {
      share_token?: string | null;
    },
    assigneeIds: string[],
    primaryId: string | null,
  ): string {
    const id = `d${counter++}`;
    const now = new Date().toISOString();
    const deal: DealWithAssignees = {
      ...fields,
      id,
      share_token: `preview-${id}`,
      created_at: now,
      updated_at: now,
      assignees: assigneeIds.map((uid) => ({
        user_id: uid,
        is_primary: uid === primaryId,
        name: nameOf(uid),
      })),
    } as DealWithAssignees;
    deals.unshift(deal);
    histories.set(id, buildHistory(id, deal.current_status));
    return id;
  },

  update(
    id: string,
    fields: Partial<DealRow>,
    assigneeIds: string[],
    primaryId: string | null,
  ) {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;
    const prevStatus = deal.current_status;
    Object.assign(deal, fields, { updated_at: new Date().toISOString() });
    deal.assignees = assigneeIds.map((uid) => ({
      user_id: uid,
      is_primary: uid === primaryId,
      name: nameOf(uid),
    }));
    if (fields.current_status && fields.current_status !== prevStatus) {
      this.appendHistory(id, prevStatus, fields.current_status);
    }
  },

  setStatus(id: string, status: DealStatus) {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;
    const prev = deal.current_status;
    if (prev === status) return;
    deal.current_status = status;
    deal.updated_at = new Date().toISOString();
    this.appendHistory(id, prev, status);
  },

  setShare(id: string, enabled: boolean) {
    const deal = deals.find((d) => d.id === id);
    if (deal) deal.share_enabled = enabled;
  },

  remove(id: string) {
    const i = deals.findIndex((d) => d.id === id);
    if (i >= 0) deals.splice(i, 1);
    histories.delete(id);
  },

  // ---- 買い顧客 ------------------------------------------

  listBuyers(): BuyerRow[] {
    const rank: Record<string, number> = { active: 0, paused: 1, closed: 2 };
    return [...buyers].sort(
      (a, b) =>
        (rank[a.status] ?? 9) - (rank[b.status] ?? 9) ||
        b.updated_at.localeCompare(a.updated_at),
    );
  },

  getBuyer(id: string): BuyerRow | null {
    return buyers.find((b) => b.id === id) ?? null;
  },

  createBuyer(
    fields: Omit<BuyerRow, "id" | "created_at" | "updated_at">,
  ): string {
    const id = `b${buyerCounter++}`;
    const now = new Date().toISOString();
    buyers.unshift({ ...fields, id, created_at: now, updated_at: now });
    return id;
  },

  updateBuyer(id: string, fields: Partial<BuyerRow>) {
    const buyer = buyers.find((b) => b.id === id);
    if (buyer) {
      Object.assign(buyer, fields, { updated_at: new Date().toISOString() });
    }
  },

  removeBuyer(id: string) {
    const i = buyers.findIndex((b) => b.id === id);
    if (i >= 0) buyers.splice(i, 1);
  },

  // ---- 書類 ----------------------------------------------

  listDocuments(dealId: string): DealDocument[] {
    return [...(documents.get(dealId) ?? [])].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
  },

  addLink(
    dealId: string,
    input: { category: DocumentCategory; name: string; url: string },
  ) {
    const list = documents.get(dealId) ?? [];
    list.push({
      id: `doc-${docCounter++}`,
      deal_id: dealId,
      category: input.category,
      kind: "link",
      name: input.name,
      mime_type: null,
      size_bytes: null,
      external_url: input.url,
      preview_url: input.url,
      created_at: new Date().toISOString(),
    });
    documents.set(dealId, list);
  },

  addFile(
    dealId: string,
    input: {
      category: DocumentCategory;
      name: string;
      mime: string | null;
      size: number;
      dataUrl: string;
    },
  ) {
    const list = documents.get(dealId) ?? [];
    list.push({
      id: `doc-${docCounter++}`,
      deal_id: dealId,
      category: input.category,
      kind: "file",
      name: input.name,
      mime_type: input.mime,
      size_bytes: input.size,
      external_url: null,
      preview_url: input.dataUrl,
      created_at: new Date().toISOString(),
    });
    documents.set(dealId, list);
  },

  removeDocument(docId: string) {
    for (const [dealId, list] of documents) {
      const i = list.findIndex((d) => d.id === docId);
      if (i >= 0) {
        list.splice(i, 1);
        documents.set(dealId, list);
        return;
      }
    }
  },

  appendHistory(id: string, from: DealStatus, to: DealStatus) {
    const list = histories.get(id) ?? [];
    list.push({
      id: `${id}-h${list.length}`,
      deal_id: id,
      from_status: from,
      to_status: to,
      note: null,
      changed_by: PREVIEW_USER.id,
      changed_by_name: PREVIEW_USER.name,
      changed_at: new Date().toISOString(),
    });
    histories.set(id, list);
  },
};
