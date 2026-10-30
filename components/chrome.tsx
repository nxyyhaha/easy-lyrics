import Link from "next/link";
import type { ReactNode } from "react";
import { BookIcon, MusicIcon, PencilIcon } from "@/components/icons";

export function Nav() {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-mint text-abyss">
          <MusicIcon className="size-4" strokeWidth={2.4} />
        </span>
        <span className="font-display text-base font-bold tracking-tight">
          easy-lyrics
        </span>
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        <Link
          href="/contribute"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-fog transition-colors duration-200 hover:bg-raised hover:text-paper"
        >
          <PencilIcon className="size-4" />
          Contribute
        </Link>
        <Link
          href="/guide"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-fog transition-colors duration-200 hover:bg-raised hover:text-paper"
        >
          <BookIcon className="size-4" />
          Guide
        </Link>
      </nav>
    </header>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <Nav />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-5 pb-14 sm:px-6">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-4xl px-5 pb-6 sm:px-6">
        <p className="flex items-center justify-between border-t border-edge pt-4 font-mono text-xs text-fog">
          <span>easy-lyrics · open source</span>
          <Link href="/guide#sources" className="hover:text-paper">
            sources
          </Link>
        </p>
      </footer>
    </div>
  );
}
