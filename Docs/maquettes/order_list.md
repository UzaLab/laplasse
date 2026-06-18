<!DOCTYPE html>

<html lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>LaPlasse - Mes Commandes</title>
<!-- Fonts & Icons -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Tailwind Configuration -->
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "secondary-container": "#dae2fd",
                    "secondary-fixed-dim": "#bec6e0",
                    "on-error-container": "#93000a",
                    "on-tertiary-fixed-variant": "#38485d",
                    "error": "#ba1a1a",
                    "on-background": "#191c1e",
                    "on-surface-variant": "#534434",
                    "background": "#f7f9fb",
                    "on-secondary-fixed-variant": "#3f465c",
                    "tertiary-fixed-dim": "#b7c8e1",
                    "surface-container": "#eceef0",
                    "surface-bright": "#f7f9fb",
                    "tertiary-fixed": "#d3e4fe",
                    "surface-tint": "#855300",
                    "inverse-on-surface": "#eff1f3",
                    "surface": "#f7f9fb",
                    "on-tertiary-fixed": "#0b1c30",
                    "on-surface": "#191c1e",
                    "surface-container-lowest": "#ffffff",
                    "surface-variant": "#e0e3e5",
                    "inverse-primary": "#ffb95f",
                    "surface-container-low": "#f2f4f6",
                    "primary-container": "#f59e0b",
                    "outline": "#867461",
                    "primary-fixed": "#ffddb8",
                    "on-primary-fixed-variant": "#653e00",
                    "primary-fixed-dim": "#ffb95f",
                    "on-primary-fixed": "#2a1700",
                    "primary": "#855300",
                    "secondary-fixed": "#dae2fd",
                    "inverse-surface": "#2d3133",
                    "error-container": "#ffdad6",
                    "surface-container-highest": "#e0e3e5",
                    "on-tertiary": "#ffffff",
                    "surface-container-high": "#e6e8ea",
                    "outline-variant": "#d8c3ad",
                    "on-primary": "#ffffff",
                    "surface-dim": "#d8dadc",
                    "on-secondary-fixed": "#131b2e",
                    "on-error": "#ffffff",
                    "on-tertiary-container": "#35455a",
                    "on-secondary": "#ffffff",
                    "secondary": "#565e74",
                    "tertiary-container": "#a2b2cb",
                    "tertiary": "#505f76",
                    "on-primary-container": "#613b00",
                    "on-secondary-container": "#5c647a"
            },
            "borderRadius": {
                    "DEFAULT": "1rem",
                    "lg": "2rem",
                    "xl": "3rem",
                    "full": "9999px"
            },
            "spacing": {
                    "stack-md": "1rem",
                    "stack-sm": "0.5rem",
                    "margin-desktop": "2.5rem",
                    "stack-lg": "2rem",
                    "gutter": "1.5rem",
                    "container-max": "1280px",
                    "margin-mobile": "1rem"
            },
            "fontFamily": {
                    "body-lg": ["Outfit"],
                    "label-md": ["Outfit"],
                    "headline-md": ["Outfit"],
                    "display-lg": ["Outfit"],
                    "label-sm": ["Outfit"],
                    "body-md": ["Outfit"],
                    "display-lg-mobile": ["Outfit"],
                    "headline-lg": ["Outfit"]
            },
            "fontSize": {
                    "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                    "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500"}],
                    "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                    "display-lg": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "600"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "display-lg-mobile": ["36px", {"lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "headline-lg": ["32px", {"lineHeight": "40px", "fontWeight": "600"}]
            }
          }
        }
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        /* Hide scrollbar for tabs */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
</head>
<body class="bg-surface text-on-surface font-body-lg flex h-screen overflow-hidden antialiased selection:bg-primary-container selection:text-on-primary-container">
<!-- Minimalist Sidebar -->
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
<main class="flex-1 flex flex-col h-screen overflow-hidden relative md:ml-64">
<!-- Header -->
<header class="flex justify-between items-center py-stack-md px-margin-mobile md:px-margin-desktop bg-surface/80 backdrop-blur-xl z-50 shrink-0 border-b border-outline-variant/10"><div class="flex items-center gap-4"></div>
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
</div></header>
<!-- Scrollable Canvas -->
<div class="flex-1 overflow-y-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
<div class="max-w-container-max mx-auto w-full">
<!-- Page Title -->
<div class="mb-stack-lg">
<h1 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">Mes commandes</h1>
<p class="font-body-lg text-body-md md:text-body-lg text-on-surface-variant max-w-2xl">Suivez vos achats et l'historique de vos livraisons.</p>
</div>
<!-- Filtering Tabs -->
<div class="flex gap-3 mb-stack-lg overflow-x-auto pb-4 scrollbar-hide">
<button class="px-6 py-3 rounded-full bg-on-surface text-surface font-label-md text-label-md whitespace-nowrap shadow-sm">Toutes</button>
<button class="px-6 py-3 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md whitespace-nowrap border border-outline-variant/20">En cours</button>
<button class="px-6 py-3 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md whitespace-nowrap border border-outline-variant/20">Livrées</button>
<button class="px-6 py-3 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md whitespace-nowrap border border-outline-variant/20">Annulées</button>
</div>
<!-- Order List -->
<div class="flex flex-col gap-stack-md"><!-- Card 1: En cours -->
<article class="bg-surface-container-lowest rounded-xl p-stack-sm flex flex-col md:flex-row items-start md:items-center gap-4 border border-outline-variant/30 shadow-sm transition-transform hover:-translate-y-0.5 duration-300 group">
<div class="w-full md:w-24 h-32 md:h-24 rounded-lg bg-surface-container overflow-hidden shrink-0 relative">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0ohIgAJckckM3Yg2_KSEfy6cES4ybXLsEOCx_Niefa8qvWhJJ4a8tgmjGrwRh1nATTDsy65fZVpPnM--TNQhmfjRJLHXKMT8OYX0yQv7tCW7DXH8ZRNeQP3BD6D3Zs0TaiKW6113Ckt6jxAzMiGvpX_BROnNgHOkW5x6WLhoJu-s79gBuGV8BMDrFRZSV8DZtqTqP1Ds1L_ISzwiGmRE9XZ-ul6AlgKY6Vw8GppC6w346jAKQTQSFbUQFAwfhddn1qNxyXqxh-nQ"/>
</div>
<div class="flex-1 w-full px-2 md:px-0">
<div class="flex items-center gap-2 mb-1">
<span class="font-label-sm text-label-sm text-on-surface-variant">#CB-8924</span>
<span class="font-body-md text-body-md text-on-surface-variant">12 Oct 2023</span>
</div>
<h3 class="font-label-md text-label-md text-on-surface mb-2 line-clamp-1">The Monocle Guide + 2 autres articles</h3>
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed/40 text-on-primary-fixed-variant font-label-sm text-label-sm">
<span class="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
En cours
</div>
</div>
<div class="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 px-2 md:px-0">
<div class="font-label-md text-label-md font-bold text-on-surface">67 400 FCFA</div>
<button class="px-4 py-2 rounded-full bg-surface text-on-surface font-label-sm text-label-sm border border-outline-variant/40">Détails</button>
</div>
</article>
<!-- Card 2: Livrée -->
<article class="bg-surface-container-lowest rounded-xl p-stack-sm flex flex-col md:flex-row items-start md:items-center gap-4 border border-outline-variant/30 shadow-sm transition-transform hover:-translate-y-0.5 duration-300 group">
<div class="w-full md:w-24 h-32 md:h-24 rounded-lg bg-surface-container overflow-hidden shrink-0 relative">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB115cFGtmUFQrSImMqkeKGEBjQfAkYDEuygE_E4LsXORYEV3ST7ZNeeLCh4CpKzOOJ2YqmtW3XRR00D8zQf0AWgYeWVcHT5a2c5rpTY9kjp7gRvvhwr8oZyYSIhsWsMnRUfwIpR4qDqXC_BqbbbxVB5VCaOKtYKC9YS98xDsjO0G9ZzdFQMxxdK3zaBBaknnMAh7x3mwSkd1RUC31mzExq7ddx-h0XXKI34KlQk46D61pnPzyUwt6haxiE8tuUAcctMIdaaMZUeNI"/>
</div>
<div class="flex-1 w-full px-2 md:px-0">
<div class="flex items-center gap-2 mb-1">
<span class="font-label-sm text-label-sm text-on-surface-variant">#CB-8810</span>
<span class="font-body-md text-body-md text-on-surface-variant">05 Oct 2023</span>
</div>
<h3 class="font-label-md text-label-md text-on-surface mb-2 line-clamp-1">Machine à café intelligente</h3>
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed-variant font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[14px]">check_circle</span>
Livrée
</div>
</div>
<div class="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 px-2 md:px-0">
<div class="font-label-md text-label-md font-bold text-on-surface">145 000 FCFA</div>
<button class="px-4 py-2 rounded-full bg-surface text-on-surface font-label-sm text-label-sm border border-outline-variant/40">Détails</button>
</div>
</article>
<!-- Card 3: Livrée -->
<article class="bg-surface-container-lowest rounded-xl p-stack-sm flex flex-col md:flex-row items-start md:items-center gap-4 border border-outline-variant/30 shadow-sm transition-transform hover:-translate-y-0.5 duration-300 group">
<div class="w-full md:w-24 h-32 md:h-24 rounded-lg bg-surface-container overflow-hidden shrink-0 relative">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQCJO3Njp_wGZ-oPd9b7wTcvgJGgrAsGdeSPkU7I2_ppEtp0sdLUaDH7DrfH_O4QJZD8yncdDsXQyxCUrFX16nI_gFhNuEBEzM7k4hdofguH8uMmuvWsxzfi1H4dASmdBkoTiFFm6v0bYCVMbBW7FDAzJNqoBFUDFaOyZf-NwjcAAJf-hvPuQWdEKuT265O2kkZY9P7OyKIbtoDamnYUmGoeaxd6wa13rbaRqW0_jqhxibbNOtSdeyyfOFK2Dx3t7IFQEDCUSSgi8"/>
</div>
<div class="flex-1 w-full px-2 md:px-0">
<div class="flex items-center gap-2 mb-1">
<span class="font-label-sm text-label-sm text-on-surface-variant">#CB-8750</span>
<span class="font-body-md text-body-md text-on-surface-variant">01 Oct 2023</span>
</div>
<h3 class="font-label-md text-label-md text-on-surface mb-2 line-clamp-1">The Monocle Guide to Better Living</h3>
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed-variant font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[14px]">check_circle</span>
Livrée
</div>
</div>
<div class="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 px-2 md:px-0">
<div class="font-label-md text-label-md font-bold text-on-surface">29 500 FCFA</div>
<button class="px-4 py-2 rounded-full bg-surface text-on-surface font-label-sm text-label-sm border border-outline-variant/40">Détails</button>
</div>
</article>
<!-- Card 4: Annulée -->
<article class="bg-surface-container-lowest rounded-xl p-stack-sm flex flex-col md:flex-row items-start md:items-center gap-4 border border-outline-variant/30 shadow-sm transition-transform hover:-translate-y-0.5 duration-300 group">
<div class="w-full md:w-24 h-32 md:h-24 rounded-lg bg-surface-container overflow-hidden shrink-0 relative grayscale">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTy4JuhAL9PyuYI5oZZMRuzpK2K5ywyvbCXdCTTNvdIl7WC43LL8Pakbazpcrm9jOggCLsEqCt-EjjAcfk99CHVwqfZC82d9fYYtxGOYLuaIt8JSw65ahr1Y07UchfDAvll9K5zttaiqxzoov89KdMjEpW3Xxk0DI-qmyIMT-zMpjFSz8c_NLih6qfcj9tmIT_6-E90ePXOkgvecoTB4_wsS1RuFOOeXbnqqh48A8M-2yGlLP7A63qdOwXv8Fi6wf4Myj-JDgY2bU"/>
</div>
<div class="flex-1 w-full px-2 md:px-0">
<div class="flex items-center gap-2 mb-1">
<span class="font-label-sm text-label-sm text-on-surface-variant">#CB-8705</span>
<span class="font-body-md text-body-md text-on-surface-variant">28 Sep 2023</span>
</div>
<h3 class="font-label-md text-label-md text-on-surface mb-2 line-clamp-1">Set de bols en céramique artisanale</h3>
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error-container/50 text-on-error-container font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[14px]">cancel</span>
Annulée
</div>
</div>
<div class="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 px-2 md:px-0">
<div class="font-label-md text-label-md font-bold text-on-surface-variant line-through">32 500 FCFA</div>
<button class="px-4 py-2 rounded-full bg-surface text-on-surface font-label-sm text-label-sm border border-outline-variant/40">Détails</button>
</div>
</article>
<!-- Card 5: Livrée -->
<article class="bg-surface-container-lowest rounded-xl p-stack-sm flex flex-col md:flex-row items-start md:items-center gap-4 border border-outline-variant/30 shadow-sm transition-transform hover:-translate-y-0.5 duration-300 group">
<div class="w-full md:w-24 h-32 md:h-24 rounded-lg bg-surface-container overflow-hidden shrink-0 relative">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0Gl91NiLysedUhJHnFUuJbqZIiEzSjW5WNbFTPwokaPx083N3lB56ibruMr4B7sJRL4bDYvi1nITZnv-cLEea6lNqwqhL8vecou4WLXm3Pfb0piC9QL1HpVu4UYagbejwarMWRUn_J6iVNOBRRhvfcjJA38kpbeRuGXAjJPnFDF0X7pnYOdURXZq07ZyuU5_ycJbj2rQz2cnqc3gZxwvpQvGiLiUakPvXpfBNQShGtc4PUApLM8TnL_ZiP0Lee7onmQpL6giHWQs"/>
</div>
<div class="flex-1 w-full px-2 md:px-0">
<div class="flex items-center gap-2 mb-1">
<span class="font-label-sm text-label-sm text-on-surface-variant">#CB-8690</span>
<span class="font-body-md text-body-md text-on-surface-variant">20 Sep 2023</span>
</div>
<h3 class="font-label-md text-label-md text-on-surface mb-2 line-clamp-1">Cereal Magazine Vol. 22</h3>
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed-variant font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[14px]">check_circle</span>
Livrée
</div>
</div>
<div class="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 px-2 md:px-0">
<div class="font-label-md text-label-md font-bold text-on-surface">23 500 FCFA</div>
<button class="px-4 py-2 rounded-full bg-surface text-on-surface font-label-sm text-label-sm border border-outline-variant/40">Détails</button>
</div>
</article></div>
<!-- Padding for bottom scrolling -->
<div class="flex items-center justify-center gap-2 mt-stack-lg">
<button class="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-colors">
<span class="material-symbols-outlined">chevron_left</span>
</button>
<button class="w-10 h-10 rounded-full flex items-center justify-center bg-primary-container text-on-primary-container font-label-md shadow-sm">1</button>
<button class="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-colors font-label-md">2</button>
<button class="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-colors font-label-md">3</button>
<button class="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-colors">
<span class="material-symbols-outlined">chevron_right</span>
</button>
</div><div class="h-24"></div>
</div>
</div>
</main>
</body></html>