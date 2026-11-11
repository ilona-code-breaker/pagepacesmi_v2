import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/archetype-celebration")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const { archetypeCelebration } = await import("@/pagepace/server/api.server");
        return Response.json(await archetypeCelebration(body));
      },
    },
  },
});
