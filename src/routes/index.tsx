import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";

// PagePace keeps books in the browser, so it renders only after the page loads.
const PagePaceApp = lazy(() => import("@/pagepace/App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PagePace – Reading Tracker & Reader Archetypes" },
      { name: "description", content: "Track your books, reading pace, streaks, shelves and favourite quotes, and discover your reader archetype." },
      { property: "og:title", content: "PagePace – Reading Tracker & Reader Archetypes" },
      { property: "og:description", content: "Track your books, reading pace, streaks, shelves and favourite quotes, and discover your reader archetype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Loading() {
  return <div className="flex min-h-screen items-center justify-center text-stone-400 font-serif">Opening your library…</div>;
}

function Index() {
  useEffect(() => {
    import("@/pagepace/pwa").then((m) => m.setupOfflineSupport());
  }, []);
  return (
    <ClientOnly fallback={<Loading />}>
      <Suspense fallback={<Loading />}>
        <PagePaceApp />
      </Suspense>
    </ClientOnly>
  );
}
