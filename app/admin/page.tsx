"use client";

import { useState } from "react";
import { Page } from "@/components/chrome";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckIcon,
  LoaderIcon,
  ShieldIcon,
  TimerIcon,
  XIcon,
} from "@/components/icons";

interface Sub {
  id: string;
  title: string;
  artist: string;
  plainLyrics: string | null;
  syncedLyrics: string | null;
  type: string;
  reason: string | null;
}

export default function Admin() {
  const [key, setKey] = useState("");
  const [subs, setSubs] = useState<Sub[]>([]);
  const [msg, setMsg] = useState("Enter your admin key to load the queue.");
  const [busy, setBusy] = useState("");

  async function load(e?: React.FormEvent) {
    e?.preventDefault();
    setMsg("Loading…");
    const r = await fetch("/api/moderate", {
      headers: { "x-admin-key": key },
    });
    const j = await r.json();
    if (!r.ok) {
      setSubs([]);
      setMsg(j.error ?? "Access denied. Wrong key?");
      return;
    }
    setSubs(j.submissions);
    setMsg(
      j.submissions.length === 0
        ? "Queue is clear. Nothing waiting."
        : `${j.submissions.length} waiting for review.`,
    );
  }

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id + action);
    await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ id, action }),
    });
    setBusy("");
    await load();
  }

  return (
    <Page>
      <section className="flex flex-col gap-2 pt-4 sm:pt-8">
        <p className="font-mono text-xs uppercase tracking-widest text-mint">
          Moderation
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Review queue.
        </h1>
        <p className="max-w-xl text-fog">
          Community submissions land here. Approve the good ones into the
          shared database, reject the rest.
        </p>
      </section>

      <Card className="p-4">
        <form onSubmit={load} className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <ShieldIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fog" />
            <Input
              type="password"
              placeholder="ADMIN_KEY"
              aria-label="Admin key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="pl-10 font-mono text-sm"
            />
          </div>
          <Button type="submit">Load queue</Button>
        </form>
      </Card>

      <p className="flex items-center gap-2 font-mono text-xs text-fog">
        <span className="size-1.5 rounded-full bg-mint" aria-hidden="true" />
        {msg}
      </p>

      <div className="flex flex-col gap-3">
        {subs.map((s) => (
          <Card key={s.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold tracking-tight">
                {s.artist} — {s.title}
              </h2>
              <Badge>{s.type}</Badge>
              {s.syncedLyrics && (
                <Badge variant="accent">
                  <TimerIcon className="size-3" /> synced
                </Badge>
              )}
            </div>
            {s.reason && (
              <p className="mt-2 text-sm text-fog">
                <span className="font-medium text-paper">Why: </span>
                {s.reason}
              </p>
            )}
            <pre className="slim-scroll mt-3 max-h-44 overflow-auto rounded-lg border border-edge bg-abyss p-3.5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-paper/85">
              {(s.syncedLyrics ?? s.plainLyrics ?? "").slice(0, 2000)}
            </pre>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => act(s.id, "approve")}
                disabled={busy !== ""}
              >
                {busy === s.id + "approve" ? <LoaderIcon /> : <CheckIcon />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="dangerOutline"
                onClick={() => act(s.id, "reject")}
                disabled={busy !== ""}
              >
                <XIcon />
                Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}
