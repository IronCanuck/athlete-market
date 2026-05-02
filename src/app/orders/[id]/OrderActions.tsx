"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PackageCheck, XCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/types/db";

type Role = "athlete" | "buyer";

export function OrderActions({
  orderId,
  status,
  role,
  athleteId,
  buyerId,
  gigId,
}: {
  orderId: string;
  status: OrderStatus;
  role: Role;
  athleteId: string;
  buyerId: string;
  gigId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  async function setStatus(next: OrderStatus, extra: Record<string, string> = {}) {
    setBusy(true);
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ status: next, ...extra })
      .eq("id", orderId);
    setBusy(false);
    router.refresh();
  }

  async function submitReview() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("reviews").insert({
      order_id: orderId,
      buyer_id: buyerId,
      athlete_id: athleteId,
      gig_id: gigId,
      rating,
      comment: comment || null,
    });
    setBusy(false);
    if (!error) {
      setReviewing(false);
      router.refresh();
    }
  }

  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <div className="card space-y-2 p-5 text-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
        Actions
      </div>
      {children}
    </div>
  );

  if (role === "athlete") {
    return (
      <Wrap>
        {status === "pending" ? (
          <>
            <Button className="w-full" onClick={() => setStatus("accepted")} disabled={busy}>
              <CheckCircle2 className="h-4 w-4" /> Accept order
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setStatus("cancelled", { cancelled_at: new Date().toISOString() })} disabled={busy}>
              <XCircle className="h-4 w-4" /> Decline
            </Button>
          </>
        ) : null}
        {status === "accepted" ? (
          <Button className="w-full" onClick={() => setStatus("delivered", { delivered_at: new Date().toISOString() })} disabled={busy}>
            <PackageCheck className="h-4 w-4" /> Mark as delivered
          </Button>
        ) : null}
        {status === "delivered" ? (
          <p className="text-[var(--color-fg-muted)]">
            Waiting for the buyer to accept the delivery.
          </p>
        ) : null}
        {(status === "completed" || status === "cancelled") ? (
          <p className="text-[var(--color-fg-muted)]">No further actions.</p>
        ) : null}
      </Wrap>
    );
  }

  // Buyer
  return (
    <Wrap>
      {status === "pending" ? (
        <>
          <p className="text-[var(--color-fg-muted)]">
            Waiting for the athlete to accept your order.
          </p>
          <Button variant="outline" className="w-full" onClick={() => setStatus("cancelled", { cancelled_at: new Date().toISOString() })} disabled={busy}>
            <XCircle className="h-4 w-4" /> Cancel
          </Button>
        </>
      ) : null}
      {status === "accepted" ? (
        <p className="text-[var(--color-fg-muted)]">
          The athlete is working on your order.
        </p>
      ) : null}
      {status === "delivered" ? (
        <Button className="w-full" onClick={() => setStatus("completed", { completed_at: new Date().toISOString() })} disabled={busy}>
          <CheckCircle2 className="h-4 w-4" /> Accept delivery
        </Button>
      ) : null}
      {status === "completed" ? (
        reviewing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} type="button" onClick={() => setRating(i + 1)}>
                  <Star className={`h-5 w-5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience…" />
            <Button className="w-full" onClick={submitReview} disabled={busy}>
              Submit review
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={() => setReviewing(true)}>
            <Star className="h-4 w-4" /> Leave a review
          </Button>
        )
      ) : null}
    </Wrap>
  );
}
