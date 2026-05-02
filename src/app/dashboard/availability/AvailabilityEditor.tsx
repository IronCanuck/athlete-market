"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Row = {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export function AvailabilityEditor({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(
    initial.length
      ? initial
      : [{ day_of_week: 1, start_time: "16:00", end_time: "20:00" }]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<Row>) {
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function save() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("Not signed in.");
      return;
    }
    await supabase.from("availability").delete().eq("athlete_id", user.id);
    if (rows.length) {
      const { error } = await supabase.from("availability").insert(
        rows.map((r) => ({
          athlete_id: user.id,
          day_of_week: r.day_of_week,
          start_time: r.start_time,
          end_time: r.end_time,
        }))
      );
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <Card className="p-6">
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 items-end gap-2">
            <div className="col-span-4">
              <Select
                label={i === 0 ? "Day" : undefined}
                value={r.day_of_week}
                onChange={(e) => update(i, { day_of_week: Number(e.target.value) })}
              >
                {DAYS.map((d, idx) => (
                  <option key={idx} value={idx}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div className="col-span-3">
              <Input
                label={i === 0 ? "Start" : undefined}
                type="time"
                value={r.start_time}
                onChange={(e) => update(i, { start_time: e.target.value })}
              />
            </div>
            <div className="col-span-3">
              <Input
                label={i === 0 ? "End" : undefined}
                type="time"
                value={r.end_time}
                onChange={(e) => update(i, { end_time: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setRows((p) => p.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={() => setRows((p) => [...p, { day_of_week: 0, start_time: "09:00", end_time: "12:00" }])}>
          <Plus className="h-4 w-4" /> Add window
        </Button>
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save availability"}
        </Button>
      </div>
    </Card>
  );
}
