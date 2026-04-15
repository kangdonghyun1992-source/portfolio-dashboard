"use client";

const TABS = [
  { id: "overview", label: "전체" },
  { id: "cash", label: "현금" },
  { id: "stocks", label: "주식" },
  { id: "crypto", label: "크립토" },
  { id: "pension", label: "연금" },
  { id: "property", label: "부동산" },
  { id: "debt", label: "부채" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export default function CategoryTabs({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-lg bg-muted/50 w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            active === tab.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
