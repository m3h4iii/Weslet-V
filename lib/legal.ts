// Legal & help texts shown in the app. Plain French, short paragraphs.
// Bump TERMS_VERSION when the CGU or privacy policy change: users are asked to accept again.

export const TERMS_VERSION = "2026-10";
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
      { h: "Cookies et stockage local", p: [
        "Weslet n'utilise aucun cookie publicitaire ni cookie de suivi. L'application enregistre sur votre appareil uniquement ce qui est nécessaire à son fonctionnement : votre session de connexion, vos préférences (tailles, favoris, son, notifications), votre panier et un identifiant anonyme d'appareil. Ces éléments ne sont pas partagés avec des tiers. Aucune bannière de consentement n'est donc nécessaire ; si Weslet ajoute un jour un outil de mesure tiers, votre accord vous sera demandé avant.",
      ] },
      { h: "Mesure d'audience", p: [
        "Nous comptons les vues, les ajouts au panier et les partages par pièce, rattachés à un identifiant anonyme, pour montrer aux Boutiques comment leurs pièces fonctionnent. Ces mesures ne contiennent ni votre nom, ni votre email, ni votre téléphone, et ne sont jamais recoupées avec votre identité. Aucun pixel Meta, Google Analytics ou TikTok n'est installé dans l'application.",
      ] },
      { h: "Uniquement les données nécessaires", p: [
        "Nous ne demandons que ce qui sert à une fonction précise : l'email pour vous connecter, le nom et le téléphone pour que le livreur vous joigne, l'adresse pour livrer. Aucun champ facultatif n'est obligatoire, et vous pouvez modifier ces informations à tout moment depuis Paramètres.",
      ] },
      { h: "Où sont vos données, et qui y accède", p: [
        "Vos données sont hébergées chez Supabase (serveurs situés dans l'Union européenne), chiffrées en transit, avec un accès limité ligne par ligne : vous ne voyez que vos commandes, une Boutique ne voit que les siennes. Seule l'équipe Weslet dispose d'un accès d'administration, pour le support et le fonctionnement du service.",
        "Nos prestataires techniques, qui n'accèdent aux données que pour fournir leur service : Supabase (base de données et comptes), Netlify (diffusion de l'application web), Resend (envoi des emails de connexion et de suivi), Expo (publication de l'application mobile). Aucun d'eux n'utilise vos données pour son propre compte.",
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
  {
    slug: "retours",
    title: "Retours et remboursements",
    updated: "Octobre 2026",
    sections: [
      { h: "Le principe", p: [
        "Chaque commande est conclue avec la Boutique qui vend la pièce ; Weslet s'assure que les conditions de retour sont claires, affichées avant l'achat, et respectées. En cas de désaccord, Weslet intervient comme médiateur.",
      ] },
      { h: "Vous changez d'avis", p: [
        "Vous pouvez demander un retour dans les 7 jours suivant la livraison, pour un article non porté, non lavé, avec ses étiquettes. Faites la demande depuis le suivi de votre commande ou auprès de la Boutique ; les frais de retour sont à votre charge sauf indication contraire sur la page de la Boutique. Les pièces personnalisées ou faites sur mesure ne peuvent pas être retournées, sauf défaut.",
      ] },
      { h: "La pièce est abîmée, ou ce n'est pas ce que vous avez commandé", p: [
        "Signalez-le dans les 48 heures après la livraison, avec des photos, depuis le suivi de votre commande. Le retour est alors gratuit et vous êtes remboursé intégralement, frais de livraison compris, ou la pièce est remplacée si vous le préférez.",
      ] },
      { h: "Le remboursement", p: [
        "Il intervient au plus tard 14 jours après réception de la pièce par la Boutique, par le même moyen que le paiement : remise en espèces par le livreur ou virement pour une commande payée à la livraison, recrédit de la carte pour un paiement en ligne. Une commande annulée avant expédition n'entraîne aucun frais.",
      ] },
      { h: "Si la Boutique ne répond pas", p: [
        `Écrivez à ${CONTACT_EMAIL} avec votre numéro de commande. Weslet répond sous 2 jours ouvrés, rappelle la Boutique à ses engagements et peut suspendre une Boutique qui ne les respecte pas.`,
      ] },
    ],
  },
  {
    slug: "mentions",
    title: "Mentions légales",
    updated: "Octobre 2026",
    sections: [
      { h: "Éditeur", p: [
        "Weslet est un service édité par Mehdi Hmida, porteur du projet, dans le cadre d'une société de droit tunisien en cours de constitution. Ces mentions seront complétées par la dénomination, le numéro d'immatriculation au registre national des entreprises, le matricule fiscal et le siège social dès l'immatriculation.",
        `Directeur de la publication : Mehdi Hmida. Contact : ${CONTACT_EMAIL}.`,
      ] },
      { h: "Hébergement", p: [
        "Application et sites : Netlify, Inc., 512 2nd Street, San Francisco, CA 94107, États-Unis. Données et comptes : Supabase, Inc., serveurs situés dans l'Union européenne.",
      ] },
      { h: "Propriété intellectuelle", p: [
        "Le nom Weslet, le logo et l'application sont la propriété de l'éditeur. Les photos, vidéos, noms et marques des pièces appartiennent aux Boutiques qui les publient, qui garantissent en disposer des droits. Toute reproduction sans autorisation est interdite.",
      ] },
      { h: "Données personnelles", p: [
        "Le traitement des données personnelles est décrit dans la Politique de confidentialité. Conformément à la loi organique n° 2004-63 relative à la protection des données à caractère personnel, vous disposez d'un droit d'accès, de rectification et de suppression, que vous pouvez exercer depuis Paramètres ou par email.",
      ] },
      { h: "Signaler un contenu", p: [
        `Une pièce contrefaite, une photo utilisée sans droit, un avis abusif : écrivez à ${CONTACT_EMAIL} avec le lien de la page concernée. Weslet retire le contenu signalé sous 48 heures lorsque le signalement est fondé.`,
      ] },
    ],
  },
];

export const legalPage = (slug: string) => LEGAL_PAGES.find((p) => p.slug === slug) ?? null;
