// NOTE: On évite d'importer "@cloudflare/workers-types" ici car, selon l'environnement
// de build (Cloudflare Pages), les devDependencies peuvent ne pas être installées.
// Typage volontairement permissif pour ne pas bloquer le déploiement.
export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);

  // Redirect *.pages.dev -> devorbaits.com
  if (url.hostname.endsWith(".pages.dev")) {
    url.hostname = "devorbaits.com";
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
};
