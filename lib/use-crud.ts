import { useState } from "react";

type TableName = "cash" | "stocks" | "crypto" | "liabilities" | "pension" | "real_estate";

export function useCrud(table: TableName, month: string) {
  const [saving, setSaving] = useState(false);

  async function addRow(values: Record<string, string | number>): Promise<number | null> {
    setSaving(true);
    try {
      const res = await fetch("/api/portfolio/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", table, month, values }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return typeof json.id === "number" ? json.id : null;
    } finally {
      setSaving(false);
    }
  }

  async function updateRow(id: number, values: Record<string, string | number>): Promise<boolean> {
    setSaving(true);
    try {
      const res = await fetch("/api/portfolio/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", table, month, id, values }),
      });
      return res.ok;
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(id: number): Promise<boolean> {
    setSaving(true);
    try {
      const res = await fetch("/api/portfolio/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", table, month, id }),
      });
      return res.ok;
    } finally {
      setSaving(false);
    }
  }

  return { saving, addRow, updateRow, deleteRow };
}
