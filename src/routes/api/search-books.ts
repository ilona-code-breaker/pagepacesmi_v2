import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/search-books")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const { searchBooks } = await import("@/pagepace/server/api.server");
        return Response.json(await searchBooks(body?.query));
      },
    },
  },
});
