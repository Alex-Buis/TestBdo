// Protection anti-hotlink : empêche d'autres sites d'afficher directement
// tes images (icônes, artworks) en pointant vers leur URL sur ton domaine.
// N'empêche pas un humain de télécharger l'image (impossible en pur front),
// mais bloque le "vol de bande passante" + la réutilisation automatique.
//
// Un accès sans en-tête Referer (navigation directe, favoris, certains
// navigateurs/vpn qui le suppriment) reste autorisé pour ne pas casser
// l'usage normal du site.

export const config = {
  matcher: '/assets/:path*',
};

export default function middleware(request) {
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      const allowedHosts = [host, 'localhost:3000'];
      if (!allowedHosts.includes(refererHost)) {
        return new Response('Hotlinking not allowed', { status: 403 });
      }
    } catch (err) {
      // Referer illisible : on laisse passer plutôt que de bloquer par erreur.
    }
  }

  return undefined;
}
