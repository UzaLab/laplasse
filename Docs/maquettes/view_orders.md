<!DOCTYPE html>

<html class="dark:bg-surface-container-lowest" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>CIBOOKS - Détail de la Commande</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "surface": "#f7f9fb",
                        "surface-dim": "#d8dadc",
                        "on-error-container": "#93000a",
                        "secondary-fixed": "#dae2fd",
                        "outline": "#867461",
                        "on-secondary-fixed-variant": "#3f465c",
                        "background": "#f7f9fb",
                        "on-tertiary-fixed": "#0b1c30",
                        "primary": "#855300",
                        "on-surface": "#191c1e",
                        "on-secondary": "#ffffff",
                        "primary-fixed": "#ffddb8",
                        "on-tertiary": "#ffffff",
                        "surface-tint": "#855300",
                        "surface-container": "#eceef0",
                        "on-primary-container": "#613b00",
                        "on-background": "#191c1e",
                        "error": "#ba1a1a",
                        "surface-container-lowest": "#ffffff",
                        "on-primary": "#ffffff",
                        "surface-bright": "#f7f9fb",
                        "tertiary-container": "#a2b2cb",
                        "inverse-on-surface": "#eff1f3",
                        "secondary-container": "#dae2fd",
                        "outline-variant": "#d8c3ad",
                        "on-secondary-container": "#5c647a",
                        "on-primary-fixed": "#2a1700",
                        "tertiary": "#505f76",
                        "error-container": "#ffdad6",
                        "inverse-surface": "#2d3133",
                        "surface-container-highest": "#e0e3e5",
                        "primary-container": "#f59e0b",
                        "on-secondary-fixed": "#131b2e",
                        "tertiary-fixed": "#d3e4fe",
                        "surface-container-high": "#e6e8ea",
                        "primary-fixed-dim": "#ffb95f",
                        "tertiary-fixed-dim": "#b7c8e1",
                        "on-tertiary-fixed-variant": "#38485d",
                        "secondary": "#565e74",
                        "surface-variant": "#e0e3e5",
                        "inverse-primary": "#ffb95f",
                        "on-surface-variant": "#534434",
                        "on-primary-fixed-variant": "#653e00",
                        "surface-container-low": "#f2f4f6",
                        "on-error": "#ffffff",
                        "secondary-fixed-dim": "#bec6e0",
                        "on-tertiary-container": "#35455a"
                    },
                    borderRadius: {
                        "DEFAULT": "1rem",
                        "lg": "2rem",
                        "xl": "3rem",
                        "full": "9999px"
                    },
                    spacing: {
                        "margin-desktop": "2.5rem",
                        "stack-lg": "2rem",
                        "margin-mobile": "1rem",
                        "container-max": "1280px",
                        "stack-md": "1rem",
                        "gutter": "1.5rem",
                        "stack-sm": "0.5rem"
                    },
                    fontFamily: {
                        "body-lg": ["Outfit"],
                        "label-md": ["Outfit"],
                        "headline-lg": ["Outfit"],
                        "display-lg": ["Outfit"],
                        "label-sm": ["Outfit"],
                        "display-lg-mobile": ["Outfit"],
                        "headline-md": ["Outfit"],
                        "body-md": ["Outfit"]
                    },
                    fontSize: {
                        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
                        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "500" }],
                        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "600" }],
                        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
                        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "600" }],
                        "display-lg-mobile": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
                        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
                        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }]
                    }
                }
            }
        }
    </script>
<style>
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
        }
        
        /* Custom scrollbar for sidebar */
        .sidebar-scroll::-webkit-scrollbar {
            width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
        }
    </style>
</head>
<body class="bg-surface text-on-surface font-body-md antialiased overflow-x-hidden min-h-screen flex">
<!-- SideNavBar -->
<nav class="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant/50 p-stack-md z-40 sidebar-scroll overflow-y-auto text-on-surface">
<div class="mb-stack-lg px-4 flex justify-between items-center"><h1 class="font-headline-md text-headline-md font-bold text-primary">LaPlasse</h1></div>
<div class="flex-1 space-y-1">
<p class="px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-4 mb-2">Menu</p>
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">grid_view</span>
<span class="font-label-md text-label-md">Vue d'ensemble</span>
</a>
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">calendar_today</span>
<span class="font-label-md text-label-md">Mes réservations</span>
</a>
<a class="flex items-center gap-stack-md bg-primary-container text-on-primary-container rounded-full px-4 py-3 shadow-lg shadow-primary-container/20" href="#">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">shopping_bag</span>
<span class="font-label-md text-label-md">Mes commandes</span>
</a>
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">favorite</span>
<span class="font-label-md text-label-md">Mes favoris</span>
</a>
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">star</span>
<span class="font-label-md text-label-md">Mes avis</span>
</a>
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">loyalty</span>
<span class="font-label-md text-label-md">Mes points</span>
</a>
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">group_add</span>
<span class="font-label-md text-label-md">Parrainage</span>
</a>
<p class="px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-6 mb-2">Général</p>
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">notifications</span>
<span class="font-label-md text-label-md">Notifications</span>
<span class="ml-auto bg-primary-container text-on-primary-container text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
</a>
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">settings</span>
<span class="font-label-md text-label-md">Paramètres</span>
</a>
<p class="px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-6 mb-2">Business</p>
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">storefront</span>
<span class="font-label-md text-label-md">Inscrire mon commerce</span>
</a>
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">add_business</span>
<span class="font-label-md text-label-md">Créer ma boutique</span>
</a>
<p class="px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-6 mb-2">Découvrir</p>
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">explore</span>
<span class="font-label-md text-label-md">Explorer Abidjan</span>
</a>
</div>
<div class="mt-8 space-y-1">
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">help</span>
<span class="font-label-md text-label-md">Centre d'aide</span>
</a>
<a class="flex items-center gap-stack-md text-on-surface-variant px-4 py-3 rounded-full hover:bg-surface-container-high transition-all duration-200" href="#">
<span class="material-symbols-outlined text-[20px]">logout</span>
<span class="font-label-md text-label-md">Déconnexion</span>
</a>
</div>
</nav>
<!-- Main Content Area -->
<div class="flex-1 flex flex-col md:ml-64 w-full">
<!-- TopNavBar -->
<header class="sticky top-0 z-50 flex justify-between items-center w-full px-margin-desktop py-stack-md bg-surface/80 backdrop-blur-md shadow-sm">
<div class="flex items-center gap-4">
</div>
<div class="flex items-center gap-4">
<a class="flex items-center gap-2 text-primary-container font-label-md text-label-md hover:opacity-80 transition-all" href="#">
<span class="material-symbols-outlined text-[20px]">explore</span>
Explorer
</a>
<button class="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors active:scale-95">
<span class="material-symbols-outlined">notifications</span>
</button>
<div class="flex items-center gap-3 ml-2 pl-4 border-l border-outline-variant">
<div class="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm shadow-md">
KS
</div>
<div class="hidden md:block text-sm font-medium text-on-surface">
Karim
</div>
</div>
</div>
</header>
<!-- Canvas -->
<main class="flex-1 px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto w-full">
<div class="max-w-4xl mx-auto space-y-stack-lg">
<!-- Breadcrumbs & Back -->
<div class="flex items-center justify-between">
<div class="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
<a class="hover:text-primary-container transition-colors flex items-center gap-1" href="#">
<span class="material-symbols-outlined text-[18px]">arrow_back</span>
                            Retour aux commandes
                        </a>
</div>
<div class="flex gap-2">
<button class="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-full hover:bg-surface-container-highest transition-colors font-label-md text-label-md text-on-surface">
<span class="material-symbols-outlined text-[18px]">download</span>
                            Facture
                        </button>
<button class="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-full hover:bg-surface-container-highest transition-colors font-label-md text-label-md text-on-surface">
<span class="material-symbols-outlined text-[18px]">support_agent</span>
                            Support
                        </button>
</div>
</div>
<!-- Order Header Card -->
<div class="glass-panel rounded-3xl p-stack-lg relative overflow-hidden">
<div class="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-stack-md">
<div>
<h1 class="font-headline-lg text-headline-lg text-[#0F172A] mb-1">Commande #CB-8924</h1>
<p class="font-body-md text-body-md text-on-surface-variant">Placée le 24 Octobre 2023, 14:30</p>
</div>
<div class="flex items-center gap-3">
<div class="px-4 py-2 bg-primary-container/20 text-on-primary-container rounded-full font-label-md text-label-md flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                                En cours de livraison
                            </div>
<button class="px-5 py-2 bg-[#0F172A] text-white rounded-xl font-label-md text-label-md hover:bg-slate-800 transition-colors shadow-sm">
                                Suivre le colis
                            </button>
</div>
</div>
</div>
<!-- Bento Grid Layout for Details -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
<!-- Items List (Spans 2 columns) -->
<div class="md:col-span-2 glass-panel rounded-3xl p-stack-lg">
<h3 class="font-headline-md text-headline-md text-[#0F172A] mb-stack-md flex items-center gap-2">
<span class="material-symbols-outlined text-primary-container">shopping_cart</span>
                            Articles
                        </h3>
<div class="space-y-4">
<!-- Item 1 -->
<div class="flex gap-4 p-4 rounded-xl hover:bg-surface/50 transition-colors border border-transparent hover:border-outline-variant/50">
<div class="w-20 h-20 rounded-lg bg-surface-container-highest overflow-hidden flex-shrink-0">
<img alt="Product Image" class="w-full h-full object-cover" data-alt="A sleek, high-end hardcover art book sitting on a clean white surface. Soft studio lighting highlights the premium embossed cover. The aesthetic is minimalist, modern, and perfectly aligned with a luxury marketplace aesthetic. Bright and clear." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQCJO3Njp_wGZ-oPd9b7wTcvgJGgrAsGdeSPkU7I2_ppEtp0sdLUaDH7DrfH_O4QJZD8yncdDsXQyxCUrFX16nI_gFhNuEBEzM7k4hdofguH8uMmuvWsxzfi1H4dASmdBkoTiFFm6v0bYCVMbBW7FDAzJNqoBFUDFaOyZf-NwjcAAJf-hvPuQWdEKuT265O2kkZY9P7OyKIbtoDamnYUmGoeaxd6wa13rbaRqW0_jqhxibbNOtSdeyyfOFK2Dx3t7IFQEDCUSSgi8"/>
</div>
<div class="flex-1 flex flex-col justify-between">
<div class="flex justify-between items-start">
<div>
<h4 class="font-label-md text-label-md text-[#0F172A] font-semibold">The Monocle Guide to Better Living</h4>
<p class="font-label-sm text-label-sm text-on-surface-variant mt-1">Édition Premium, Couverture rigide</p>
</div>
<p class="font-label-md text-label-md font-semibold">29 500 FCFA</p>
</div>
<div class="text-on-surface-variant font-label-sm text-label-sm">
                                        Qté: 1
                                    </div>
</div>
</div>
<!-- Divider -->
<hr class="border-outline-variant/50"/>
<!-- Item 2 -->
<div class="flex gap-4 p-4 rounded-xl hover:bg-surface/50 transition-colors border border-transparent hover:border-outline-variant/50">
<div class="w-20 h-20 rounded-lg bg-surface-container-highest overflow-hidden flex-shrink-0">
<img alt="Product Image" class="w-full h-full object-cover" data-alt="A curated set of premium minimalist architectural magazines stacked neatly. Bright, soft lighting emphasizes the high-quality paper texture and elegant typography on the covers. The setting is modern and sophisticated, appealing to a design-conscious audience." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0Gl91NiLysedUhJHnFUuJbqZIiEzSjW5WNbFTPwokaPx083N3lB56ibruMr4B7sJRL4bDYvi1nITZnv-cLEea6lNqwqhL8vecou4WLXm3Pfb0piC9QL1HpVu4UYagbejwarMWRUn_J6iVNOBRRhvfcjJA38kpbeRuGXAjJPnFDF0X7pnYOdURXZq07ZyuU5_ycJbj2rQz2cnqc3gZxwvpQvGiLiUakPvXpfBNQShGtc4PUApLM8TnL_ZiP0Lee7onmQpL6giHWQs"/>
</div>
<div class="flex-1 flex flex-col justify-between">
<div class="flex justify-between items-start">
<div>
<h4 class="font-label-md text-label-md text-[#0F172A] font-semibold">Cereal Magazine Vol. 22</h4>
<p class="font-label-sm text-label-sm text-on-surface-variant mt-1">Magazine</p>
</div>
<p class="font-label-md text-label-md font-semibold">23 500 FCFA</p>
</div>
<div class="text-on-surface-variant font-label-sm text-label-sm">
                                        Qté: 2 (11 750 FCFA/u)
                                    </div>
</div>
</div>
</div>
</div>
<!-- Sidebar info (Spans 1 column) -->
<div class="space-y-stack-md">
<!-- Delivery Info -->
<div class="glass-panel rounded-3xl p-6">
<h3 class="font-label-md text-label-md text-[#0F172A] font-semibold mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
<span class="material-symbols-outlined text-primary-container text-[18px]">local_shipping</span>
                                Livraison
                            </h3>
<div class="space-y-4">
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant mb-1">Méthode</p>
<p class="font-body-md text-body-md text-[#0F172A]">Colissimo Express (24h)</p>
<p class="font-label-sm text-label-sm text-primary-container mt-1">N° Suivi: FR-88492011</p>
</div>
<hr class="border-outline-variant/50"/>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant mb-1">Adresse</p>
<p class="font-body-md text-body-md text-[#0F172A] font-medium">Jean Dupont</p>
<p class="font-body-md text-body-md text-on-surface-variant text-sm mt-1">
                                        124 Rue de la Paix<br/>
                                        75001 Paris<br/>
                                        France
                                    </p>
</div>
</div>
</div>
<!-- Payment Summary -->
<div class="glass-panel rounded-3xl p-6 bg-surface-container-lowest">
<h3 class="font-label-md text-label-md text-[#0F172A] font-semibold mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
<span class="material-symbols-outlined text-primary-container text-[18px]">receipt_long</span>
                                Paiement
                            </h3>
<div class="space-y-3 font-body-md text-body-md">
<div class="flex justify-between text-on-surface-variant">
<span class="">Sous-total</span>
<span class="">53 000 FCFA</span>
</div>
<div class="flex justify-between text-on-surface-variant">
<span class="">Frais de port</span>
<span class="">3 800 FCFA</span>
</div>
<div class="flex justify-between text-on-surface-variant">
<span class="">TVA (20%)</span>
<span class="">10 600 FCFA</span>
</div>
<hr class="border-outline-variant my-2"/>
<div class="flex justify-between font-headline-md text-headline-md text-[#0F172A] pt-2">
<span class="">Total</span>
<span class="">67 400 FCFA</span>
</div>
<div class="mt-4 flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant bg-surface-container p-2 rounded-lg">
<span class="material-symbols-outlined text-[16px]">credit_card</span>
                                    Carte Visa terminant par •••• 4242
                                </div>
</div>
</div>
</div>
</div>
</div>
</main>
</div>
</body></html>