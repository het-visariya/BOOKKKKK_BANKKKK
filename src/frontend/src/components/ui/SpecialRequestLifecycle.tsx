import React from "react";

const SPECIAL_REQUEST_LIFECYCLE: { key: string; label: string; icon: string }[] = [
  { key: "requested", label: "Requested", icon: "📋" },
  { key: "approved", label: "Approved", icon: "✅" },
  { key: "ordered", label: "Ordered", icon: "📦" },
  { key: "arrived", label: "Reached Office", icon: "📚" },
  { key: "readyforcollection", label: "Ready For Collection", icon: "🎯" },
  { key: "issued", label: "Collected By Student", icon: "📗" },
  { key: "returned", label: "Returned", icon: "↩️" },
];

function resolveLifecycleStage(status?: string | null) {
  const s = String(status ?? "").toLowerCase();
  if (s === "returned") return 6;
  if (s === "issued" || s === "collected") return 5;
  if (s === "readyforcollection" || s === "ready_for_collection" || s === "ready") return 4;
  if (s === "arrived" || s === "reached office" || s === "reachedoffice") return 3;
  if (s === "ordered") return 2;
  if (s === "approved") return 1;
  return 0;
}

export default function SpecialRequestLifecycle({ status }: { status?: string | null }) {
  const activeIdx = resolveLifecycleStage(status);
  return (
    <div className="mt-3 pt-3 border-t border-border/60">
      <div className="text-xs font-medium text-muted-foreground mb-2">Procurement Lifecycle</div>
      <div className="flex items-center gap-0">
        {SPECIAL_REQUEST_LIFECYCLE.map((stage, i) => (
          <div key={stage.key} className="flex items-center">
            <div className={`flex flex-col items-center ${i <= activeIdx ? "opacity-100" : "opacity-40"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                i < activeIdx ? "bg-emerald-500 text-white" : i === activeIdx ? "bg-sky-600 text-white ring-2 ring-sky-300" : "bg-muted text-muted-foreground"
              }`}>
                {i < activeIdx ? "✓" : stage.icon.slice(0, 1)}
              </div>
              <span className={`text-[9px] mt-0.5 text-center leading-tight max-w-[40px] ${i === activeIdx ? "font-semibold text-sky-700" : "text-muted-foreground"}`}>
                {stage.label}
              </span>
            </div>
            {i < SPECIAL_REQUEST_LIFECYCLE.length - 1 && (
              <div className={`h-[2px] w-3 mx-0.5 mb-4 ${i < activeIdx ? "bg-emerald-400" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
