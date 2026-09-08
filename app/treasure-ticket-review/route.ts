export const dynamic = "force-dynamic";

export async function GET() {
  const source = "https://raw.githubusercontent.com/shunnakamuraworkspace-ui/ringops/treasure-ticket-review-pages/treasure-ticket-review/index.html";
  const upstream = await fetch(source, { cache: "no-store" });

  if (!upstream.ok) {
    return new Response("TREASURE Ticket review is temporarily unavailable.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const html = await upstream.text();
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
