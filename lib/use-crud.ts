import { useState } from "react";

type TableName = "cash" | "stocks" | "crypto" | "liabilities" | "pension" | "real_estate";

export function useCrud(table: TableName, month: string, onDone?: () => void) {
  const [saving, setSaving] = useState(false);

  async function addRow(values: Record<string, string | number>) {
    setSaving(true);
    try {
      await fetch("/api/portfolio/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", table, month, values }),
      });
      onDone?.();
    } finally {
      setSaving(false);
    }
  }

  async function updateRow(id: number, values: Record<string, string | number>) {
    setSaving(true);
    try {
      await fetch("/api/portfolio/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", table, month, id, values }),
      });
      onDone?.();
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(id: number) {
    setSaving(true);
    try {
      await fetch("/api/portfolio/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", table, month, id }),
      });
      onDone?.();
    } finally {
      setSaving(false);
    }
  }

  return { saving, addRow, updateRow, deleteRow };
}
