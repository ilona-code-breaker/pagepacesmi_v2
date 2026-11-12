import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/classify-genres")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const { classifyGenres } = await import("@/pagepace/server/api.server");
        return Response.json(await classifyGenres(body));
      },
    },
  },
});
