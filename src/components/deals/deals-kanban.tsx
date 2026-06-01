"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import type { DealWithAssignees } from "@/lib/deals";
import { updateDealStatus } from "@/app/(internal)/deals/actions";
import {
  STATUS_ORDER,
  STATUS_LABEL,
  STATUS_COLOR,
  getDealWarnings,
  type DealStatus,
} from "@/lib/constants";
import { formatYenShort, formatDate } from "@/lib/format";
import { TypeBadge } from "./type-badge";
import { WarningBadges } from "./warning-badges";

function Card({ deal }: { deal: DealWithAssignees }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
  });
  const primary =
    deal.assignees.find((a) => a.is_primary) ?? deal.assignees[0];
  const stale = getDealWarnings(deal).includes("stale");

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => router.push(`/deals/${deal.id}`)}
      className={[
        "cursor-grab touch-none rounded-lg border bg-white p-3 shadow-sm transition active:cursor-grabbing",
        isDragging ? "opacity-40" : "hover:shadow-md",
        stale ? "border-yellow-300 bg-yellow-50/60" : "border-slate-200",
      ].join(" ")}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-slate-900">
          {deal.deal_name}
        </p>
      </div>
      <TypeBadge type={deal.deal_type} />
      <WarningBadges deal={deal} className="mt-2" />
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{primary?.name ?? "未割当"}</span>
        <span className="tabular-nums">
          {formatYenShort(deal.transfer_price)}
        </span>
      </div>
      {deal.scheduled_date && (
        <p className="mt-1 text-xs text-slate-400">
          予定 {formatDate(deal.scheduled_date)}
        </p>
      )}
    </div>
  );
}

function Column({
  status,
  deals,
}: {
  status: DealStatus;
  deals: DealWithAssignees[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const c = STATUS_COLOR[status];

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div
        className={`mb-2 flex items-center justify-between rounded-md border-t-2 bg-white px-3 py-2 shadow-sm ${c.column}`}
      >
        <span className="text-sm font-semibold text-slate-700">
          {STATUS_LABEL[status]}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {deals.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-1 flex-col gap-2 rounded-lg p-1.5 transition-colors ${
          isOver ? "bg-slate-200/70" : "bg-slate-100/60"
        }`}
      >
        {deals.map((deal) => (
          <Card key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}

export function DealsKanban({
  deals: initialDeals,
}: {
  deals: DealWithAssignees[];
}) {
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const grouped = useMemo(() => {
    const map = new Map<DealStatus, DealWithAssignees[]>();
    for (const s of STATUS_ORDER) map.set(s, []);
    for (const d of deals) map.get(d.current_status)?.push(d);
    return map;
  }, [deals]);

  const activeDeal = deals.find((d) => d.id === activeId) ?? null;

  function handleStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleEnd(e: DragEndEvent) {
    setActiveId(null);
    const dealId = String(e.active.id);
    const newStatus = e.over?.id as DealStatus | undefined;
    if (!newStatus || !STATUS_ORDER.includes(newStatus)) return;

    const target = deals.find((d) => d.id === dealId);
    if (!target || target.current_status === newStatus) return;

    const prev = deals;
    // 楽観的更新
    setDeals((cur) =>
      cur.map((d) =>
        d.id === dealId
          ? { ...d, current_status: newStatus, updated_at: new Date().toISOString() }
          : d,
      ),
    );

    startTransition(async () => {
      const res = await updateDealStatus(dealId, newStatus);
      if (res?.error) {
        setDeals(prev); // ロールバック
        toast.error(`ステータス更新に失敗しました：${res.error}`);
      } else {
        toast.success(`「${STATUS_LABEL[newStatus]}」に更新しました`);
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUS_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            deals={grouped.get(status) ?? []}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? (
          <div className="w-72 rotate-2 rounded-lg border border-slate-300 bg-white p-3 shadow-lg">
            <p className="text-sm font-medium text-slate-900">
              {activeDeal.deal_name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatYenShort(activeDeal.transfer_price)}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
