import { describe, test, expect } from "vitest";
import {
  getDealWarnings,
  isTerminalStatus,
  STATUS_ORDER,
  STATUS_LABEL,
  DEAL_TYPE_LABEL,
  DEAL_TYPE_ORDER,
} from "./constants";

const NOW = new Date("2026-06-01T09:00:00+09:00");

function deal(overrides: Partial<Parameters<typeof getDealWarnings>[0]> = {}) {
  return {
    current_status: "nda" as const,
    updated_at: NOW.toISOString(),
    scheduled_date: "2026-06-30",
    next_action: "NDA案を送付",
    ...overrides,
  };
}

describe("getDealWarnings", () => {
  test("すべて入力済み・直近更新なら警告なし", () => {
    expect(getDealWarnings(deal(), NOW)).toEqual([]);
  });

  test("最終更新から3日以上で stale", () => {
    const old = new Date("2026-05-20T09:00:00+09:00").toISOString();
    expect(getDealWarnings(deal({ updated_at: old }), NOW)).toContain("stale");
  });

  test("更新からちょうど3日未満なら stale ではない", () => {
    const twoDaysAgo = new Date("2026-05-30T10:00:00+09:00").toISOString();
    expect(getDealWarnings(deal({ updated_at: twoDaysAgo }), NOW)).not.toContain(
      "stale",
    );
  });

  test("予定日が過去なら overdue", () => {
    expect(
      getDealWarnings(deal({ scheduled_date: "2026-05-01" }), NOW),
    ).toContain("overdue");
  });

  test("次回アクション未入力なら incomplete", () => {
    expect(getDealWarnings(deal({ next_action: null }), NOW)).toContain(
      "incomplete",
    );
  });

  test("予定日未入力なら incomplete", () => {
    expect(getDealWarnings(deal({ scheduled_date: null }), NOW)).toContain(
      "incomplete",
    );
  });

  test("終端ステータス（成約・引渡・失注・保留）は警告対象外", () => {
    for (const status of [
      "closed_won",
      "handover",
      "lost",
      "on_hold",
    ] as const) {
      const old = new Date("2026-01-01T00:00:00+09:00").toISOString();
      const result = getDealWarnings(
        deal({
          current_status: status,
          updated_at: old,
          scheduled_date: "2020-01-01",
          next_action: null,
        }),
        NOW,
      );
      expect(result).toEqual([]);
    }
  });
});

describe("定数の整合性", () => {
  test("isTerminalStatus は4種を終端と判定する", () => {
    expect(isTerminalStatus("closed_won")).toBe(true);
    expect(isTerminalStatus("inquiry")).toBe(false);
  });

  test("STATUS_ORDER は15件で全ステータスにラベルがある", () => {
    expect(STATUS_ORDER).toHaveLength(15);
    for (const s of STATUS_ORDER) {
      expect(STATUS_LABEL[s]).toBeTruthy();
    }
  });

  test("案件種別は3件で全種別にラベルがある", () => {
    expect(DEAL_TYPE_ORDER).toHaveLength(3);
    for (const t of DEAL_TYPE_ORDER) {
      expect(DEAL_TYPE_LABEL[t]).toBeTruthy();
    }
  });
});
