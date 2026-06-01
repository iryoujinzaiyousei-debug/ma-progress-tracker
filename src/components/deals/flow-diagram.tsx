function Node({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string | null;
  emphasis?: boolean;
}) {
  return (
    <div
      className={[
        "min-w-28 flex-1 rounded-lg border px-3 py-2 text-center",
        emphasis
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700",
      ].join(" ")}
    >
      <p
        className={`text-[10px] font-medium ${emphasis ? "text-slate-300" : "text-slate-400"}`}
      >
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function Arrow() {
  return <span className="shrink-0 px-1 text-slate-400">→</span>;
}

/** 商流：紹介元 → 弊社 → 紹介先 */
export function FlowDiagram({
  referrer,
  referred,
}: {
  referrer: string | null;
  referred: string | null;
}) {
  return (
    <div className="flex items-stretch gap-1">
      <Node label="紹介元" value={referrer} />
      <Arrow />
      <Node label="弊社" value="弊社" emphasis />
      <Arrow />
      <Node label="紹介先" value={referred} />
    </div>
  );
}
