<!DOCTYPE html>

<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Yalé Design - Boutique</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&amp;family=Hanken+Grotesk:wght@400;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "inverse-surface": "#2f3131",
                        "primary-fixed": "#dae2fd",
                        "error": "#ba1a1a",
                        "tertiary-container": "#002113",
                        "on-background": "#1a1c1c",
                        "tertiary": "#000000",
                        "surface-muted": "#f8fafc",
                        "on-tertiary-container": "#009668",
                        "on-surface-variant": "#45464d",
                        "surface-variant": "#e2e2e2",
                        "text-secondary": "#64748b",
                        "primary-fixed-dim": "#bec6e0",
                        "on-primary-fixed": "#131b2e",
                        "on-primary": "#ffffff",
                        "error-container": "#ffdad6",
                        "on-tertiary": "#ffffff",
                        "secondary-container": "#fea619",
                        "primary": "#000000",
                        "outline": "#76777d",
                        "on-tertiary-fixed-variant": "#005236",
                        "surface-tint": "#565e74",
                        "on-surface": "#1a1c1c",
                        "gold-light": "#fef3c7",
                        "text-primary": "#0f172a",
                        "tertiary-fixed-dim": "#4edea3",
                        "on-secondary-container": "#684000",
                        "surface-bright": "#f9f9f9",
                        "surface-container-highest": "#e2e2e2",
                        "surface-dim": "#dadada",
                        "surface-container-high": "#e8e8e8",
                        "on-error-container": "#93000a",
                        "background": "#f9f9f9",
                        "surface-container-low": "#f3f3f4",
                        "on-error": "#ffffff",
                        "surface": "#f9f9f9",
                        "inverse-primary": "#bec6e0",
                        "secondary-fixed": "#ffddb8",
                        "tertiary-fixed": "#6ffbbe",
                        "surface-container-lowest": "#ffffff",
                        "on-tertiary-fixed": "#002113",
                        "on-secondary-fixed-variant": "#653e00",
                        "inverse-on-surface": "#f0f1f1",
                        "outline-variant": "#c6c6cd",
                        "on-primary-container": "#7c839b",
                        "surface-container": "#eeeeee",
                        "on-secondary": "#ffffff",
                        "secondary-fixed-dim": "#ffb95f",
                        "primary-container": "#131b2e",
                        "secondary": "#855300",
                        "on-primary-fixed-variant": "#3f465c",
                        "on-secondary-fixed": "#2a1700",
                        "border-subtle": "#e2e8f0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "section-gap": "2.5rem",
                        "element-gap": "1rem",
                        "container-margin": "1.25rem",
                        "grid-gutter": "1rem",
                        "touch-target": "3rem"
                    },
                    "fontFamily": {
                        "headline-lg": ["Manrope", "sans-serif"],
                        "display-hero": ["Manrope", "sans-serif"],
                        "price-display": ["Manrope", "sans-serif"],
                        "headline-md": ["Manrope", "sans-serif"],
                        "body-md": ["Hanken Grotesk", "sans-serif"],
                        "label-sm": ["Hanken Grotesk", "sans-serif"],
                        "body-lg": ["Hanken Grotesk", "sans-serif"]
                    },
                    "fontSize": {
                        "headline-lg": ["22px", { "lineHeight": "28px", "fontWeight": "700" }],
                        "headline-lg-mobile": ["18px", { "lineHeight": "24px", "fontWeight": "700" }],
                        "display-hero": ["28px", { "lineHeight": "36px", "letterSpacing": "-0.02em", "fontWeight": "800" }],
                        "price-display": ["18px", { "lineHeight": "24px", "fontWeight": "800" }],
                        "headline-md": ["18px", { "lineHeight": "24px", "fontWeight": "600" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }]
                    }
                },
            },
        }
    </script>
<style>
        body {
            background-color: theme('colors.background');
            color: theme('colors.on-background');
            font-family: 'Hanken Grotesk', sans-serif;
        }
        .ambient-shadow {
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
        }
    </style>
</head>
<body class="antialiased pb-24 md:pb-0">
<!-- Top Navigation Container (Shared Component mapped structure) -->
<header class="fixed top-0 left-0 w-full z-50 transition-all duration-300" id="mainHeader">
<div class="flex justify-between items-center px-container-margin py-4 w-full">
<button class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors">
<span class="material-symbols-outlined">arrow_back</span>
</button>
<div class="flex gap-2">
<button class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors">
<span class="material-symbols-outlined">share</span>
</button>
<button class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors">
<span class="material-symbols-outlined">favorite</span>
</button>
</div>
</div>
</header>
<main>
<!-- Hero Section -->
<section class="relative h-[60vh] md:h-[70vh] w-full flex flex-col justify-end">
<!-- Background Image -->
<div class="absolute inset-0 z-0">
<img alt="Hero background" class="w-full h-full object-cover" data-alt="A luxurious, high-end boutique interior with premium items, shot in a warm, inviting light. The setting is a concept store with curated objects, shelves displaying artisanal goods, and soft, natural daylight filtering through the storefront." src="https://lh3.googleusercontent.com/aida/AP1WRLuvBdyG4KzdIB7KljMS5UPVJ5UK8lwH7S2XWAmb_olltPss7mP0V9eMLEYVRIdFlfkzJV22PL5mubroy4R177yiX_Di5MQ0AnisdeU2J4GhhIsYc1bqypqR7lsZAVV73gKy3m3J_UVPsFGqifmFpcqcUhjNWycE1eVXyZ1f4N0w7T4TKGQBGjiuxgJ3vup0sDrWMIeUtE2kI-YVhBRvccjdDTXOxKcp-bQ54bLw_kr0ICMvnaXAGY8cug"/>
<!-- Gradient Overlay -->
<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
</div>
<!-- Hero Content -->
<div class="relative z-10 px-container-margin pb-section-gap w-full max-w-7xl mx-auto">
<!-- Badges -->
<div class="flex flex-wrap gap-2 mb-4">
<span class="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center">
                        CONCEPT STORES
                    </span>
<span class="px-3 py-1 rounded-full bg-blue-500/20 text-blue-100 backdrop-blur-sm border border-blue-400/30 font-label-sm text-label-sm flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">verified</span>
                        Vérifié
                    </span>
<span class="px-3 py-1 rounded-full bg-green-500/20 text-green-100 backdrop-blur-sm border border-green-400/30 font-label-sm text-label-sm flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">schedule</span>
                        Ouvert
                    </span>
</div>
<!-- Rating -->
<div class="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 mb-4">
<span class="material-symbols-outlined text-secondary-container text-[16px] font-variation-settings-'FILL' 1" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-sm text-label-sm text-white">5 (35 avis)</span>
</div>
<!-- Title & Location -->
<h1 class="font-display-hero text-display-hero text-white mb-2 shadow-sm">Yalé Design</h1>
<div class="flex items-start gap-2 text-white/90 max-w-lg">
<span class="material-symbols-outlined mt-0.5">location_on</span>
<p class="font-body-lg text-body-lg text-shadow-sm">Boulevard des Martyrs, Cocody, Cocody Vallons, Abidjan</p>
</div>
</div>
</section>
<!-- Navigation Tabs (Mapped to Shared Component logic) -->
<div class="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border-subtle w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
<div class="flex flex-row gap-8 px-container-margin w-max max-w-7xl mx-auto">
<a class="font-headline-md text-headline-md py-4 text-primary border-b-2 border-secondary-container" href="#">Boutique</a>
<a class="font-headline-md text-headline-md py-4 text-text-secondary hover:text-primary transition-colors" href="#">Informations</a>
<a class="font-headline-md text-headline-md py-4 text-text-secondary hover:text-primary transition-colors" href="#">Horaires</a>
</div>
</div>
<div class="max-w-7xl mx-auto px-container-margin py-section-gap space-y-section-gap">
<!-- Products Grid Section -->
<section>
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-grid-gutter">
<!-- Product Card 1 -->
<div class="group relative bg-white rounded-xl border border-border-subtle overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
<div class="absolute top-2 left-2 z-10">
<span class="px-2 py-1 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-[10px] uppercase tracking-wider">BEST-SELLER</span>
</div>
<div class="aspect-[3/4] w-full overflow-hidden bg-surface-muted">
<img alt="Boubou Homme Premium" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A model wearing a premium African boubou outfit. The clothing features intricate patterns, rich colors, and high-quality fabric. The setting is modern and well-lit, emphasizing the luxurious texture of the garment." src="https://lh3.googleusercontent.com/aida/AP1WRLto8PxSQHqm4PGXzv2VDvFgZoCotvUg5ldg_FO6CTOmEAGO0LZj9hc4HtD9dIz0nz7DZu1EZ3IVwNmdsydDdfAfhGtDNJC4ntIW8VzfYnwoEwoHmXuU_1-xA93gq-jkFkkiaj9Z4DFteDWBM2fWf5Wv0e_wXao_gnXtxXC3t4igiupPrY1ZfMVAFBrVdQTMIKtETEiaMITFe058rH3L2h5OmJhOKnDLmt5Znu3To_B8s21H5JZ3V5EexVc"/>
</div>
<div class="p-4 flex flex-col flex-grow justify-between gap-4">
<div>
<h3 class="font-headline-md text-headline-md-mobile text-primary line-clamp-2">Boubou Homme Premium</h3>
</div>
<div class="flex items-end justify-between mt-auto">
<span class="font-price-display text-price-display text-secondary">50 000 FCFA</span>
<button class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-secondary-container hover:text-on-secondary-container transition-colors">
<span class="material-symbols-outlined text-[18px]">shopping_cart</span>
</button>
</div>
</div>
</div>
<!-- Product Card 2 -->
<div class="group relative bg-white rounded-xl border border-border-subtle overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
<div class="absolute top-2 left-2 z-10">
<span class="px-2 py-1 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-[10px] uppercase tracking-wider">BEST-SELLER</span>
</div>
<div class="aspect-[3/4] w-full overflow-hidden bg-surface-muted">
<img alt="Sac Tissé Main" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A beautifully hand-woven artisanal bag, showcasing intricate craftsmanship and natural materials. It is placed on a clean, light surface, highlighting its texture and high-end aesthetic." src="https://lh3.googleusercontent.com/aida/AP1WRLtmWaQKzqhmQWz9QOIq2ZZX-fkAaDg0ig3tAHnTnY7LVcpZyri5DU7-wPLjNMCd9qGWDQHjdequNEhzpEOF0SOsWRyRuCKcHgMoZKjS0BDkF43_lXdvE1S1a6NINE5lussHysjp9fR6Ju7DiJnM4QiNoPNfhTFxx8wbiP4jezRQ8-14W76Amaz7u7vI3D7FZzqsUmtP2T1kUd7efLKV6JQn55Fs_zQRSexMihiCkXopHiqta493IK17iuk"/>
</div>
<div class="p-4 flex flex-col flex-grow justify-between gap-4">
<div>
<h3 class="font-headline-md text-headline-md-mobile text-primary line-clamp-2">Sac Tissé Main</h3>
</div>
<div class="flex items-end justify-between mt-auto">
<span class="font-price-display text-price-display text-secondary">28 000 FCFA</span>
<button class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-secondary-container hover:text-on-secondary-container transition-colors">
<span class="material-symbols-outlined text-[18px]">shopping_cart</span>
</button>
</div>
</div>
</div>
<!-- Product Card 3 -->
<div class="group relative bg-white rounded-xl border border-border-subtle overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
<div class="absolute top-2 left-2 z-10">
<span class="px-2 py-1 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-[10px] uppercase tracking-wider">BEST-SELLER</span>
</div>
<div class="aspect-[3/4] w-full overflow-hidden bg-surface-muted">
<img alt="Robe Wax Élégance" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="An elegant dress made from vibrant Wax fabric, styled on a mannequin or model. The dress combines traditional African prints with a modern, sophisticated cut, perfect for a high-end boutique setting." src="https://lh3.googleusercontent.com/aida/AP1WRLsqjPBXPkJl59kE88J7E-lCoJ5Ih7zHtgypgEDRNfsg0rBCaMPDUqy8U6UVz_hknG3yNLN9UlcYNLr56YcCelAfyhC1ciF7_sNtMq4uSaeHdbYqcfWRPEygeOMguURQGF2NdnrXAn5vZfVaGToAJM0RyWU0EkC94bt9dteJx0eSxWYfGFvdQzpQYm9KBSoamtOwk2ZsvUT4sijfZgfiQ-1-9nsm3wAgF0GTOnHquSejJA-hNHnYm-Z_MyI"/>
</div>
<div class="p-4 flex flex-col flex-grow justify-between gap-4">
<div>
<h3 class="font-headline-md text-headline-md-mobile text-primary line-clamp-2">Robe Wax Élégance</h3>
</div>
<div class="flex items-end justify-between mt-auto">
<span class="font-price-display text-price-display text-secondary">42 000 FCFA</span>
<button class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-secondary-container hover:text-on-secondary-container transition-colors">
<span class="material-symbols-outlined text-[18px]">shopping_cart</span>
</button>
</div>
</div>
</div>
</div>
<div class="mt-8 flex justify-center">
<button class="font-label-sm text-label-sm text-secondary hover:text-secondary/80 transition-colors">Voir la boutique complète</button>
</div>
</section>
<!-- Trust Index Section -->
<section class="bg-white rounded-xl border border-border-subtle p-6 flex flex-col items-center text-center shadow-sm">
<h2 class="font-label-sm text-label-sm text-text-secondary uppercase tracking-widest mb-6">INDICE DE CONFIANCE</h2>
<div class="relative w-32 h-32 flex items-center justify-center mb-4">
<!-- Circular Gauge placeholder SVG -->
<svg class="absolute inset-0 w-full h-full transform -rotate-90" viewbox="0 0 100 100">
<circle cx="50" cy="50" fill="none" r="45" stroke="theme('colors.surface-variant')" stroke-width="8"></circle>
<circle class="transition-all duration-1000 ease-out" cx="50" cy="50" fill="none" r="45" stroke="theme('colors.on-tertiary-container')" stroke-dasharray="283" stroke-dashoffset="34" stroke-linecap="round" stroke-width="8"></circle>
</svg>
<span class="font-display-hero text-3xl font-bold text-primary relative z-10">88</span>
</div>
<h3 class="font-headline-lg text-headline-lg-mobile text-on-tertiary-container mb-2">Très fiable</h3>
<p class="font-body-md text-body-md text-text-secondary">35 avis · ✓ Vérifié</p>
<div class="flex gap-4 w-full mt-6">
<button class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-border-subtle font-label-sm text-label-sm text-primary hover:bg-surface-muted transition-colors">
<span class="material-symbols-outlined text-[18px]">share</span>
                        Partager
                    </button>
<button class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-border-subtle font-label-sm text-label-sm text-primary hover:bg-surface-muted transition-colors">
<span class="material-symbols-outlined text-[18px]">favorite_border</span>
                        Sauvegarder
                    </button>
</div>
</section>
<!-- Reviews Section -->
<section class="bg-surface-muted p-6 rounded-xl border border-border-subtle">
<div class="flex items-center justify-between mb-8">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-secondary-container text-[24px]">star</span>
<h2 class="font-headline-lg text-headline-lg-mobile text-primary">Avis clients</h2>
<div class="flex items-baseline gap-1">
<span class="font-headline-md text-secondary-container">5/5</span>
<span class="font-body-md text-text-secondary">(35 avis)</span>
</div>
</div>
<button class="hidden md:flex items-center gap-2 bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-label-sm text-label-sm hover:opacity-90 transition-opacity">
<span class="material-symbols-outlined text-[18px]">edit</span>
                        Laisser un avis
                    </button>
</div>
<button class="md:hidden w-full flex items-center justify-center gap-2 bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-label-sm text-label-sm hover:opacity-90 transition-opacity mb-8">
<span class="material-symbols-outlined text-[18px]">edit</span>
                    Laisser un avis
                </button>
<div class="space-y-4">
<!-- Review Item 1 -->
<div class="bg-white p-5 rounded-lg border border-border-subtle">
<div class="flex items-start justify-between mb-3">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-gold-light text-secondary flex items-center justify-center font-headline-md">U</div>
<div>
<p class="font-headline-md text-[14px] text-primary">Utilisateur Test</p>
<p class="font-body-md text-[12px] text-text-secondary">23 juin 2026</p>
</div>
</div>
<div class="flex text-secondary-container">
<span class="material-symbols-outlined text-[16px] font-variation-settings-'FILL' 1" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px] font-variation-settings-'FILL' 1" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px] font-variation-settings-'FILL' 1" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px] font-variation-settings-'FILL' 1" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px] font-variation-settings-'FILL' 1" style="font-variation-settings: 'FILL' 1;">star</span>
</div>
</div>
<h4 class="font-headline-md text-[15px] text-primary mb-1">La mode ivoirienne à son meilleur</h4>
<p class="font-body-md text-text-secondary">Yalé Design est un trésor. Des créations uniques qui valorisent le savoir-faire ivoirien.</p>
</div>
<!-- Review Item 2 -->
<div class="bg-white p-5 rounded-lg border border-border-subtle">
<div class="flex items-start justify-between mb-3">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-gold-light text-secondary flex items-center justify-center font-headline-md">U</div>
<div>
<p class="font-headline-md text-[14px] text-primary">Utilisateur Test</p>
<p class="font-body-md text-[12px] text-text-secondary">23 juin 2026</p>
</div>
</div>
<div class="flex text-secondary-container">
<span class="material-symbols-outlined text-[16px] font-variation-settings-'FILL' 1" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px] font-variation-settings-'FILL' 1" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px] font-variation-settings-'FILL' 1" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px] font-variation-settings-'FILL' 1" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px] font-variation-settings-'FILL' 1" style="font-variation-settings: 'FILL' 1;">star</span>
</div>
</div>
<h4 class="font-headline-md text-[15px] text-primary mb-1">La mode ivoirienne à son meilleur</h4>
<p class="font-body-md text-text-secondary">Yalé Design est un trésor. Des créations uniques qui valorisent le savoir-faire ivoirien.</p>
</div>
</div>
<div class="mt-6 flex justify-center">
<button class="font-label-sm text-label-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
                        Charger d'autres avis (4/35)
                    </button>
</div>
</section>
<div class="flex items-center gap-2 text-text-secondary pb-8">
<span class="material-symbols-outlined text-[16px]">flag</span>
<span class="font-label-sm text-[12px]">Signaler cette fiche</span>
</div>
</div>
</main>
<!-- Bottom Navigation Bar (Shared Component exact implementation for mobile) -->
<nav class="md:hidden fixed bottom-0 left-0 w-full z-50 border-t border-border-subtle bg-surface/95 backdrop-blur-md ambient-shadow rounded-t-xl px-container-margin py-3 flex gap-element-gap justify-between items-center transition-transform duration-300" id="bottomNav">
<!-- Utility Action -->
<button class="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#25D366] text-white rounded-full hover:opacity-90 active:scale-95 transition-all duration-150 shadow-md">
<!-- Using chat icon as approximation for WhatsApp based on JSON -->
<span class="material-symbols-outlined">chat</span>
</button>
<!-- Primary Conversion Action (Active State mapping) -->
<button class="flex-grow flex items-center justify-center bg-primary-container text-on-primary-container rounded-lg px-6 py-3 font-headline-md hover:opacity-90 active:scale-95 transition-all duration-150 gap-2">
<span class="material-symbols-outlined">storefront</span>
<span>Boutique</span>
</button>
<!-- Back to top action based on design -->
<button class="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-surface-container-high text-primary rounded-full hover:opacity-90 active:scale-95 transition-all duration-150" onclick="window.scrollTo({top:0, behavior:'smooth'})">
<span class="material-symbols-outlined">arrow_upward</span>
</button>
</nav>
<script>
        // Simple scroll behavior for top header
        let lastScroll = 0;
        const header = document.getElementById('mainHeader');
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 100) {
                // Scrolled down, add background to header buttons or change header bg
                header.classList.add('bg-black/50', 'backdrop-blur-md');
            } else {
                header.classList.remove('bg-black/50', 'backdrop-blur-md');
            }
            lastScroll = currentScroll;
        });
    </script>
</body></html>