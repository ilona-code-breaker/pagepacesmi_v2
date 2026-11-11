import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/book-lookup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const { bookLookup } = await import("@/pagepace/server/api.server");
        return Response.json(await bookLookup(body?.query));
      },
    },
  },
});
