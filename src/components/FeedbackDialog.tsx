"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      setContent("");
    } catch {
      setStatus("error");
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStatus("idle");
      setContent("");
    }
    setOpen(next);
  };

  return (
    <>
      <Button
        variant="outline"
        className="h-8 gap-2"
        onClick={() => setOpen(true)}
        aria-label="Give feedback"
      >
        <MessageSquarePlus className="h-4 w-4" />
        Feedback
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Help us improve UIGen by sharing your thoughts.
            </DialogDescription>
          </DialogHeader>

          {status === "success" ? (
            <p
              data-testid="feedback-success"
              className="py-4 text-center text-sm"
            >
              Thanks for your feedback!
            </p>
          ) : (
            <>
              <textarea
                aria-label="Your feedback"
                placeholder="What&apos;s on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={status === "submitting"}
                className="min-h-[120px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {status === "error" && (
                <p className="text-sm text-destructive">
                  Something went wrong. Please try again.
                </p>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={status === "submitting"}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim() || status === "submitting"}
                >
                  {status === "submitting" ? "Sending..." : "Send Feedback"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
