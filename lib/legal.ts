// Legal & help texts shown in the app. Plain French, short paragraphs.
// Bump TERMS_VERSION when the CGU or privacy policy change: users are asked to accept again.

export const TERMS_VERSION = "2026-09";
export const CONTACT_EMAIL = "hello@weslet.tn";

export type LegalPage = { slug: string; title: string; updated: string; sections: { h: string; p: string[] }[] };

export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: "cgu",
    title: "Conditions d'utilisation",
    updated: "Septembre 2026",
    sections: [
      { h: "1. Ce qu'est Weslet", p: [
        "Weslet est une place de marché mobile qui met en relation des boutiques et créateurs tunisiens (« les Boutiques ») avec des acheteurs (« vous »). Weslet ne vend pas les articles : chaque commande est un contrat entre vous et la Boutique. Weslet organise la mise en relation, le paiement et le suivi de la livraison.",
        "En créant un compte ou en passant une commande, vous acceptez les présentes conditions et la politique de confidentialité.",
      ] },
      { h: "2. Votre compte", p: [
        "Vous devez avoir 18 ans ou l'autorisation d'un parent. Un compte est personnel ; vous êtes responsable des commandes passées depuis celui-ci. La connexion se fait par code envoyé par email : ne partagez pas ce code.",
      ] },
      { h: "3. Commandes et paiement", p: [
        "Les prix sont affichés en dinars tunisiens, toutes taxes comprises, plus les frais de livraison indiqués avant confirmation. Une commande est ferme à sa confirmation. Le paiement se fait à la livraison (espèces) ou en ligne via un prestataire agréé.",
        "En paiement à la livraison, vous vous engagez à être joignable au numéro indiqué et à régler le montant au livreur. Des refus répétés à la livraison peuvent entraîner l'obligation de payer en ligne pour les commandes suivantes, ou la fermeture du compte.",
      ] },
      { h: "4. Livraison", p: [
        "La Boutique prépare la commande ; un transporteur partenaire la livre à l'adresse indiquée. Les délais affichés sont indicatifs. Vous pouvez suivre chaque commande dans l'application.",
      ] },
      { h: "5. Retours et échanges", p: [
        "Vous pouvez refuser un colis à la livraison s'il est endommagé ou ne correspond pas à la commande. Après réception, une demande de retour ou d'échange (taille, défaut) doit être faite sous 7 jours depuis la page de la commande ; la Boutique y répond sous 48 heures. Les articles portés, lavés ou sans étiquette ne sont pas repris, sauf défaut.",
      ] },
      { h: "6. Avis", p: [
        "Après une commande livrée, vous pouvez noter la Boutique. Les avis doivent être sincères et respectueux. Weslet retire les avis injurieux, hors sujet ou manifestement faux.",
      ] },
      { h: "7. Responsabilité", p: [
        "Les Boutiques sont responsables de la description, de la qualité et de la conformité de leurs articles. Weslet fait son possible pour que la plateforme fonctionne sans interruption mais ne garantit pas une disponibilité permanente.",
      ] },
      { h: "8. Modifications et contact", p: [
        `Weslet peut modifier ces conditions ; vous en serez informé dans l'application. Questions : ${CONTACT_EMAIL}.`,
      ] },
    ],
  },
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    updated: "Septembre 2026",
    sections: [
      { h: "Ce que nous collectons", p: [
        "Pour votre compte : votre email, votre nom et votre téléphone. Pour vos commandes : l'adresse de livraison et l'historique des commandes. Pour améliorer l'application : les pièces que vous consultez et ajoutez au panier, associées à un identifiant anonyme de votre appareil, jamais à votre identité tant que vous n'êtes pas connecté.",
        "Vos tailles, favoris et boutiques suivies sont enregistrés sur votre appareil.",
      ] },
      { h: "Pourquoi", p: [
        "Livrer vos commandes (votre nom, téléphone et adresse sont transmis à la Boutique et au transporteur, uniquement pour cette commande). Vous envoyer les codes de connexion et le suivi de vos commandes. Montrer aux Boutiques combien de personnes voient leurs pièces, sans jamais révéler qui.",
      ] },
      { h: "Ce que nous ne faisons pas", p: [
        "Nous ne vendons pas vos données. Nous n'envoyons pas de publicité de tiers. Nous ne lisons pas votre carnet d'adresses ni vos photos.",
      ] },
      { h: "Où sont vos données", p: [
        "Sur des serveurs sécurisés d'un hébergeur européen, chiffrées en transit. Seule l'équipe Weslet y accède, pour le support et le fonctionnement du service.",
      ] },
      { h: "Vos droits", p: [
        `Vous pouvez consulter, corriger ou supprimer vos données à tout moment. La suppression du compte est possible depuis Paramètres → Supprimer mon compte : vos informations personnelles sont effacées ; les commandes déjà livrées sont conservées anonymisées pour la comptabilité des Boutiques. Pour toute demande : ${CONTACT_EMAIL}.`,
      ] },
    ],
  },
  {
    slug: "regles",
    title: "Règles de la communauté",
    updated: "Septembre 2026",
    sections: [
      { h: "Pour les acheteurs", p: [
        "Commandez ce que vous comptez recevoir : chaque refus à la livraison coûte à la Boutique et au livreur. Répondez au téléphone le jour de la livraison. Laissez des avis honnêtes, sur la Boutique et l'article, pas sur le livreur.",
      ] },
      { h: "Pour les boutiques", p: [
        "Photos et vidéos de vos propres articles, réellement en stock. Tailles et stock à jour. Commandes confirmées sous 24 heures, expédiées sous 3 jours ouvrés. Réponse aux retours sous 48 heures. Pas de contournement de la plateforme pour vendre en dehors après une mise en relation.",
      ] },
      { h: "Interdit", p: [
        "Contrefaçons, articles interdits à la vente, contenus offensants, avis frauduleux, harcèlement. Weslet suspend les comptes qui ne respectent pas ces règles.",
      ] },
    ],
  },
  {
    slug: "faq",
    title: "Questions fréquentes",
    updated: "Septembre 2026",
    sections: [
      { h: "Comment je commande ?", p: ["Choisissez une pièce, sa taille, ajoutez-la au panier, puis « Commander ». Entrez votre adresse, confirmez. Vous recevez un numéro de commande et vous suivez la livraison dans l'app."] },
      { h: "Comment je paie ?", p: ["À la livraison, en espèces au livreur. Le paiement en ligne (carte, e-dinar) arrive bientôt, avec la livraison offerte."] },
      { h: "Combien coûte la livraison ?", p: ["7 DT par boutique, partout en Tunisie. Si vous commandez chez deux boutiques, vous recevez deux colis et payez deux fois la livraison."] },
      { h: "Quel est le délai ?", p: ["En général 2 à 5 jours ouvrés selon la ville. La Boutique confirme d'abord la commande, puis vous voyez chaque étape dans l'app."] },
      { h: "La taille ne va pas, je fais quoi ?", p: ["Depuis la page de la commande, sous 7 jours après réception, demandez un échange ou un retour. La Boutique vous répond sous 48 h."] },
      { h: "Le stock est-il fiable ?", p: ["Oui : les tailles affichées sont celles réellement en stock, taille par taille, mises à jour en direct. Une taille barrée est épuisée."] },
      { h: "Pourquoi un code par email plutôt qu'un mot de passe ?", p: ["Rien à retenir, rien à voler. Le code arrive en quelques secondes ; vérifiez les spams la première fois."] },
      { h: "Je suis une boutique, comment je rejoins Weslet ?", p: ["Créez votre compte vendeur sur le site des boutiques, décrivez ce que vous vendez, et l'équipe Weslet vous accompagne : mise en ligne des premières pièces, conseils photo et vidéo, première commande. Programme Starter pour les nouvelles boutiques, Premium pour les marques établies."] },
      { h: "Comment supprimer mon compte ?", p: ["Paramètres → Supprimer mon compte. C'est immédiat et définitif."] },
      { h: "Comment vous contacter ?", p: [`${CONTACT_EMAIL}, ou depuis Paramètres → Nous contacter.`] },
    ],
  },
];

export const legalPage = (slug: string) => LEGAL_PAGES.find((p) => p.slug === slug) ?? null;
