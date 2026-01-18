import type { PagesFunction } from "@cloudflare/workers-types";

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // Redirect *.pages.dev -> devorbaits.com
  if (url.hostname.endsWith(".pages.dev")) {
    url.hostname = "devorbaits.com";
    return Response.redirect(url.toString(), 301) as unknown as import("@cloudflare/workers-types").Response;
  }

  return context.next();
};
