"use client";

import { useState } from "react";
import { useAdminAdjustCreditsMutation } from "@/lib/graphql/generated";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type CreditAdjustDialogProps = {
  organizationId: string | null;
  onClose: () => void;
};

export function CreditAdjustDialog({
  organizationId,
  onClose,
}: CreditAdjustDialogProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const { mutate, isPending } = useAdminAdjustCreditsMutation({
    onSuccess: (data) => {
      toast.success("Credits Adjusted", {
        description: `Balance updated from ${data.adminAdjustCredits?.previousBalance} to ${data.adminAdjustCredits?.newBalance} credits`,
      });
      onClose();
    },
    onError: (error) => {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseInt(amount);
    if (isNaN(amountNum)) {
      toast.error("Invalid Amount", {
        description: "Please enter a valid number",
      });
      return;
    }

    if (!reason.trim()) {
      toast.error("Reason Required", {
        description: "Please provide a reason for the adjustment",
      });
      return;
    }

    if (organizationId) {
      mutate({
        organizationId,
        amount: amountNum,
        reason: reason.trim(),
      });
    }
  };

  const handleClose = () => {
    setAmount("");
    setReason("");
    onClose();
  };

  return (
    <Dialog
      open={!!organizationId}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription>
              Add or remove credits for this organization. Use negative numbers
              to deduct credits.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Credit Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100 (or -100 to deduct)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Positive numbers add credits, negative numbers remove credits
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Customer support adjustment, refund, promotional credits..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This will be logged for audit purposes
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adjusting..." : "Adjust Credits"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
