"use client";

import { useEffect, useState } from "react";
import { Page } from "@/components/chrome";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, TextArea } from "@/components/ui/input";
import { SyncEditor } from "@/components/sync-editor";
import {
  CheckIcon,
  CloudIcon,
  LoaderIcon,
  PencilIcon,
  TimerIcon,
  XIcon,
} from "@/components/icons";
import { authClient } from "@/lib/auth-client";
import { stripLrcToPlain } from "@/lib/lrc";
import { cn } from "@/lib/utils";

interface MySub {
  id: string;
  title: string;
  artist: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  createdAt: string;
  synced: boolean;
}

const STATUS_VARIANT = {
  pending: "muted",
  approved: "accent",
  rejected: "danger",
} as const;

async function fetchSubs(): Promise<MySub[]> {
  try {
    const r = await fetch("/api/submit");
    const j = (await r.json().catch(() => null)) as {
      submissions?: MySub[];
    } | null;
    if (r.ok && Array.isArray(j?.submissions)) return j.submissions;
  } catch {
    /* offline — keep whatever is on screen */
  }
  return [];
}

export default function Contribute() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <Page>
      <section className="flex flex-col gap-2 pt-4 sm:pt-8">
        <p className="font-mono text-xs uppercase tracking-widest text-mint">
          Contribute
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Be the source.
        </h1>
        <p className="max-w-xl text-fog">
          Every lyric this API serves lives in our own database. Nothing is
          scraped at request time — people add and correct songs here, an admin
          reviews the queue, and the approved version goes live.
        </p>
      </section>

      {isPending && (
        <p className="flex items-center gap-2 font-mono text-xs text-fog">
          <LoaderIcon className="size-3.5" />
          Checking your session…
        </p>
      )}

      {!isPending && !session && <AuthCard />}

      {session && <ContributionForm userName={session.user.name} email={session.user.email} />}
    </Page>
  );
}

function AuthCard() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res =
      mode === "up"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) setErr(res.error.message ?? "Sign-in failed");
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-1.5">
        {(
          [
            { id: "in", label: "Sign in" },
            { id: "up", label: "Create account" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setMode(t.id);
              setErr("");
            }}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors duration-200",
              mode === t.id
                ? "bg-raised font-medium text-paper"
                : "text-fog hover:text-paper",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {mode === "up" && (
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="nxyy"
              autoComplete="name"
              required
            />
          </Field>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              minLength={8}
              required
            />
          </Field>
        </div>
        {err && (
          <p className="flex items-center gap-2 text-sm text-danger">
            <XIcon className="size-4 shrink-0" />
            {err}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? <LoaderIcon /> : null}
            {mode === "up" ? "Create account" : "Sign in"}
          </Button>
          <p className="text-sm text-fog">
            Accounts exist to attribute contributions, nothing else.
          </p>
        </div>
      </form>
    </Card>
  );
}

function ContributionForm({
  userName,
  email,
}: {
  userName: string;
  email: string;
}) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [type, setType] = useState<"new" | "correction" | "sync">(
    "correction",
  );
  const [plain, setPlain] = useState("");
  const [synced, setSynced] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [syncOpen, setSyncOpen] = useState(false);
  const [mine, setMine] = useState<MySub[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchSubs().then((subs) => {
      if (!cancelled) setMine(subs);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setOk("");
    try {
      const r = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          type,
          reason: reason || undefined,
          plainLyrics: plain || undefined,
          syncedLyrics: synced || undefined,
        }),
      });
      const j = (await r.json().catch(() => null)) as { error?: string } | null;
      if (!r.ok) {
        setErr(
          r.status === 401
            ? "Your session expired. Sign in again."
            : (j?.error ?? `Submission failed (${r.status})`),
        );
      } else {
        setOk("Submitted. It's sitting in the review queue.");
        setPlain("");
        setSynced("");
        setReason("");
        setMine(await fetchSubs());
      }
    } catch {
      setErr("No response. Is the dev server running?");
    }
    setBusy(false);
  }

  return (
    <>
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <span className="grid size-9 place-items-center rounded-lg bg-mint text-abyss">
          <PencilIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            Signed in as {userName}
          </p>
          <p className="truncate font-mono text-xs text-fog">{email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void authClient.signOut()}>
          Sign out
        </Button>
      </Card>

      <Card className="p-4 sm:p-5">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_160px]">
            <Field label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Beautiful"
                required
              />
            </Field>
            <Field label="Artist">
              <Input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Eminem"
                required
              />
            </Field>
            <Field label="Type">
              <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                <option value="new">New song</option>
                <option value="correction">Correction</option>
                <option value="sync">Sync fix</option>
              </Select>
            </Field>
          </div>

          <Field label="Plain lyrics">
            <TextArea
              value={plain}
              onChange={(e) => setPlain(e.target.value)}
              rows={6}
              placeholder={"One line per row, no timestamps."}
              className="font-mono text-[13px]"
            />
          </Field>

          <Field
            label={
              <>
                Synced lyrics (LRC){" "}
                <span className="font-mono text-xs text-fog/70">
                  [mm:ss.xx] timestamps
                </span>
              </>
            }
          >
            <TextArea
              value={synced}
              onChange={(e) => setSynced(e.target.value)}
              rows={6}
              placeholder={"[00:12.34] Line one\n[00:17.02] Line two"}
              className="font-mono text-[13px]"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3 -mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSyncOpen((v) => !v)}
              disabled={!synced.trim() && !plain.trim()}
            >
              <CloudIcon />
              {syncOpen ? "Close the sync editor" : "Time it with SoundCloud"}
            </Button>
            <p className="text-xs text-fog">
              {synced.trim() || plain.trim()
                ? "Play the track and stamp each line as it lands."
                : "Paste lyrics first, then time them against the track."}
            </p>
          </div>

          <Field label="Note for the reviewer (optional)">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Fixed the offset on the chorus"
              maxLength={1000}
            />
          </Field>

          {err && (
            <p className="flex items-center gap-2 text-sm text-danger">
              <XIcon className="size-4 shrink-0" />
              {err}
            </p>
          )}
          {ok && (
            <p className="flex items-center gap-2 text-sm text-mint">
              <CheckIcon className="size-4 shrink-0" />
              {ok}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy || !title || !artist}>
              {busy ? <LoaderIcon /> : <PencilIcon />}
              Submit for review
            </Button>
            <p className="text-sm text-fog">
              Approved contributions become part of the catalogue.
            </p>
          </div>
        </form>
      </Card>

      {syncOpen && (
        <SyncEditor
          initialLyrics={synced.trim() || plain.trim()}
          onClose={() => setSyncOpen(false)}
          onApply={(lrc) => {
            setSynced(lrc);
            if (!plain.trim()) setPlain(stripLrcToPlain(lrc));
            setSyncOpen(false);
            setOk("Timing applied — give it a read below, then submit.");
          }}
        />
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight">
          Your submissions
        </h2>
        {mine.length === 0 ? (
          <p className="font-mono text-xs text-fog">
            Nothing yet. Your first contribution shows up here.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {mine.map((s) => (
              <Card key={s.id} className="flex flex-wrap items-center gap-2.5 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {s.artist} — {s.title}
                  </p>
                  <p className="truncate font-mono text-xs text-fog">
                    {s.type} · {new Date(s.createdAt).toLocaleDateString()}
                    {s.reason ? ` · ${s.reason}` : ""}
                  </p>
                </div>
                {s.synced && (
                  <Badge variant="accent">
                    <TimerIcon className="size-3" /> synced
                  </Badge>
                )}
                <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
