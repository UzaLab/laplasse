<!DOCTYPE html>

<html lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Le Gourmet d'Abidjan - LaPlasse</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-container-lowest": "#ffffff",
                        "inverse-on-surface": "#eff1f3",
                        "surface-container": "#eceef0",
                        "on-background": "#191c1e",
                        "inverse-primary": "#ffb95f",
                        "on-primary": "#ffffff",
                        "surface-tint": "#855300",
                        "surface-dim": "#d8dadc",
                        "error": "#ba1a1a",
                        "on-secondary-fixed-variant": "#3f465c",
                        "background": "#f7f9fb",
                        "on-primary-container": "#613b00",
                        "secondary-fixed": "#dae2fd",
                        "on-tertiary-fixed": "#0b1c30",
                        "on-secondary-fixed": "#131b2e",
                        "on-error": "#ffffff",
                        "primary-fixed": "#ffddb8",
                        "secondary-container": "#dae2fd",
                        "tertiary-fixed-dim": "#b7c8e1",
                        "on-tertiary-container": "#35455a",
                        "on-tertiary-fixed-variant": "#38485d",
                        "on-secondary": "#ffffff",
                        "tertiary-fixed": "#d3e4fe",
                        "primary-container": "#f59e0b",
                        "tertiary-container": "#a2b2cb",
                        "surface-container-highest": "#e0e3e5",
                        "surface-container-high": "#e6e8ea",
                        "secondary-fixed-dim": "#bec6e0",
                        "primary": "#855300",
                        "secondary": "#565e74",
                        "on-error-container": "#93000a",
                        "on-surface-variant": "#534434",
                        "on-surface": "#191c1e",
                        "on-secondary-container": "#5c647a",
                        "error-container": "#ffdad6",
                        "tertiary": "#505f76",
                        "surface": "#f7f9fb",
                        "surface-bright": "#f7f9fb",
                        "outline": "#867461",
                        "on-tertiary": "#ffffff",
                        "primary-fixed-dim": "#ffb95f",
                        "inverse-surface": "#2d3133",
                        "surface-variant": "#e0e3e5",
                        "on-primary-fixed": "#2a1700",
                        "surface-container-low": "#f2f4f6",
                        "on-primary-fixed-variant": "#653e00",
                        "outline-variant": "#d8c3ad"
                    },
                    "borderRadius": {
                        "DEFAULT": "1rem",
                        "lg": "2rem",
                        "xl": "3rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "margin-desktop": "2.5rem",
                        "margin-mobile": "1rem",
                        "gutter": "1.5rem",
                        "container-max": "1280px",
                        "stack-md": "1rem",
                        "stack-lg": "2rem",
                        "stack-sm": "0.5rem"
                    },
                    "fontFamily": {
                        "headline-md": ["Outfit"],
                        "body-lg": ["Outfit"],
                        "label-sm": ["Outfit"],
                        "headline-lg": ["Outfit"],
                        "body-md": ["Outfit"],
                        "display-lg-mobile": ["Outfit"],
                        "label-md": ["Outfit"],
                        "display-lg": ["Outfit"]
                    },
                    "fontSize": {
                        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "600" }],
                        "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "600" }],
                        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "display-lg-mobile": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500" }],
                        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }]
                    }
                }
            }
        }
    </script>
<style>
        body { font-family: 'Outfit', sans-serif; background-color: #f7f9fb; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 1; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .sticky-tab { position: sticky; top: 0; z-index: 40; }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="text-on-surface antialiased pb-24 md:pb-0">
<!-- Top Navigation (Mobile) -->
<header class="md:hidden fixed top-0 w-full z-50 flex items-center justify-between px-margin-mobile h-16 bg-surface/80 backdrop-blur-xl shadow-sm transition-all duration-300" id="mobile-header">
<button aria-label="Retour" class="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest shadow-sm active:scale-95 transition-transform">
<span class="material-symbols-outlined text-primary">arrow_back</span>
</button>
<div class="flex gap-2">
<button aria-label="Partager" class="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest shadow-sm active:scale-95 transition-transform">
<span class="material-symbols-outlined text-primary">share</span>
</button>
<button aria-label="Favoris" class="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest shadow-sm active:scale-95 transition-transform">
<span class="material-symbols-outlined text-primary">favorite_border</span>
</button>
</div>
</header>
<!-- Top Navigation (Desktop) - Replaced with TopAppBar from JSON style guide but adapted for detailed view without nav links since it's a subpage -->
<header class="hidden md:flex fixed top-0 w-full z-50 items-center justify-between px-margin-desktop h-20 bg-surface/80 backdrop-blur-xl shadow-sm transition-all duration-300" id="desktop-header">
<div class="flex items-center gap-4">
<button aria-label="Retour" class="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest shadow-sm hover:opacity-80 active:scale-95 transition-all">
<span class="material-symbols-outlined text-primary">arrow_back</span>
</button>
<h1 class="font-headline-lg text-headline-lg text-primary tracking-tight opacity-0 transition-opacity duration-300" id="header-title">Le Gourmet d'Abidjan</h1>
</div>
<div class="flex gap-4">
<button aria-label="Rechercher" class="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-lowest shadow-sm hover:opacity-80 active:scale-95 transition-all">
<span class="material-symbols-outlined text-primary">search</span>
</button>
<button aria-label="Favoris" class="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-lowest shadow-sm hover:opacity-80 active:scale-95 transition-all">
<span class="material-symbols-outlined text-primary">favorite_border</span>
</button>
</div>
</header>
<main class="max-w-container-max mx-auto md:px-margin-desktop md:pt-24 md:pb-12">
<!-- Hero Section -->
<div class="relative w-full h-[353px] md:h-[442px] md:rounded-3xl overflow-hidden mb-6 md:mb-8">
<img class="w-full h-full object-cover" data-alt="A luxurious restaurant interior featuring elegant modern decor. Warm amber lighting casts a soft glow over polished wooden tables and plush seating. The atmosphere is sophisticated and inviting, captured with high-end architectural photography style. Soft focus background hints at a lively but refined dining experience." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo6bUCxm0pRBi-jHQ_tuGnbUeadGSNzLuaIc_flKlMfQxHE1ULypwzSe-xgL3w9BubQw7ngzBq-Djx899g-qmHKsKYwuGHV5Gx0sKgtF_wKbPiQfmUbVEa7Nedl2GKFyCJKTKVi5gpGXLzxMmt2Z_x0yTtdd-QE6ev1VSZArfw6uBz-nBxvKxPkkpO-RshcoLo7Y7O_Ck-f4njgfl9ulmoO_R9QnqoUuE8S5hXtGtr9k7Z9_20Xmb0giYEWmQLGDiBbEjrFW7oMQk"/>
<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
<!-- Quick Info Overlay -->
<div class="absolute bottom-0 left-0 w-full p-6 md:p-8 text-white">
<div class="flex items-center gap-2 mb-2">
<span class="px-3 py-1 bg-primary-container text-on-primary-container font-label-sm text-label-sm rounded-full shadow-sm">Premium</span>
<span class="px-3 py-1 bg-surface-container-lowest/20 backdrop-blur-md text-white font-label-sm text-label-sm rounded-full">Cuisine Française</span>
</div>
<h1 class="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg mb-2">Le Gourmet d'Abidjan</h1>
<div class="flex items-center gap-4 font-body-md text-body-md opacity-90">
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-[20px] text-primary-container">star</span>
<span class="font-bold">4.8</span>
<span>(124 avis)</span>
</div>
<div class="w-1 h-1 rounded-full bg-white/50"></div>
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-[20px]">schedule</span>
<span>25-35 min</span>
</div>
<div class="w-1 h-1 rounded-full bg-white/50"></div>
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-[20px]">delivery_dining</span>
<span>1,500 FCFA</span>
</div>
</div>
</div>
</div>
<!-- Desktop Layout Container -->
<div class="flex flex-col md:flex-row gap-gutter relative">
<!-- Main Content Area (Menu) -->
<div class="flex-1 w-full max-w-3xl">
<!-- Sticky Tab Bar -->
<div class="sticky-tab bg-surface/90 backdrop-blur-md pb-4 pt-2 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 md:pt-0 mb-6 border-b border-surface-variant/50">
<div class="flex overflow-x-auto hide-scrollbar gap-2 md:gap-4 snap-x">
<button class="snap-start shrink-0 px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-md text-label-md transition-colors shadow-sm">Entrées</button>
<button class="snap-start shrink-0 px-6 py-2.5 bg-surface-container-lowest text-on-surface-variant rounded-full font-label-md text-label-md hover:bg-surface-container-high transition-colors shadow-sm">Plats</button>
<button class="snap-start shrink-0 px-6 py-2.5 bg-surface-container-lowest text-on-surface-variant rounded-full font-label-md text-label-md hover:bg-surface-container-high transition-colors shadow-sm">Desserts</button>
<button class="snap-start shrink-0 px-6 py-2.5 bg-surface-container-lowest text-on-surface-variant rounded-full font-label-md text-label-md hover:bg-surface-container-high transition-colors shadow-sm">Boissons</button>
</div>
</div>
<!-- Menu Sections -->
<div class="space-y-stack-lg px-margin-mobile md:px-0">
<!-- Entrées Section -->
<section class="scroll-mt-32" id="entrees">
<h2 class="font-headline-md text-headline-md text-primary mb-stack-md flex items-center gap-2">
<span>Entrées</span>
<div class="flex-1 h-px bg-surface-variant ml-4"></div>
</h2>
<div class="grid grid-cols-1 gap-4">
<!-- Menu Item Card 1 -->
<div class="bg-surface-container-lowest rounded-3xl p-4 flex gap-4 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-surface-variant hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]">
<div class="flex-1 flex flex-col justify-between">
<div>
<h3 class="font-label-md text-label-md text-on-surface mb-1">Tartare de Saumon Frais</h3>
<p class="font-body-md text-body-md text-on-surface-variant line-clamp-2 text-sm leading-relaxed mb-2">Saumon d'Écosse finement haché, avocat, citron vert, et notes de coriandre fraîche.</p>
</div>
<div class="font-label-sm text-label-sm text-primary">12,000 FCFA</div>
</div>
<div class="w-28 h-28 shrink-0 rounded-2xl overflow-hidden relative shadow-inner">
<img class="w-full h-full object-cover" data-alt="Close up food photography of a delicate salmon tartare presented as a perfect cylinder on a white ceramic plate. Garnished with micro-greens and vibrant avocado puree. Bright, clean lighting typical of a high-end French restaurant menu." src="https://lh3.googleusercontent.com/aida-public/AB6AXuARw9QZ53H9YaSealeDWgJ3fLPklkI0dwtinK2YDgIHHSPMzH6sMyIiG-iY5YDc_DNDG2VuGjkXcla7wmpmtz0iFmSbJAUogVAlLzGV3d3i-7ZBXdNSeJuXoqb__VSLW4CRyeFd_aBH4fG-KYMibFjKvK3qCPjOlQQaUsHuTu8GIPAKECF1xOa9TAhsF1_drvnbZbGCiNDs-plHJSs8S9T4Eev1gbBA1n7pviJtnnZKUO6epHW7KXholk_UT1raHk81reDUO4Dwz38"/>
<button class="absolute bottom-2 right-2 w-8 h-8 bg-surface-container-lowest rounded-full shadow-sm flex items-center justify-center text-primary active:scale-90 transition-transform">
<span class="material-symbols-outlined text-[18px]">add</span>
</button>
</div>
</div>
<!-- Menu Item Card 2 -->
<div class="bg-surface-container-lowest rounded-3xl p-4 flex gap-4 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-surface-variant hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]">
<div class="flex-1 flex flex-col justify-between">
<div>
<div class="flex items-center gap-2 mb-1">
<h3 class="font-label-md text-label-md text-on-surface">Soupe à l'Oignon Gratinée</h3>
<span class="material-symbols-outlined text-[16px] text-primary-container" title="Populaire">local_fire_department</span>
</div>
<p class="font-body-md text-body-md text-on-surface-variant line-clamp-2 text-sm leading-relaxed mb-2">Bouillon de bœuf riche, oignons caramélisés, croûton au gruyère fondu.</p>
</div>
<div class="font-label-sm text-label-sm text-primary">9,500 FCFA</div>
</div>
<div class="w-28 h-28 shrink-0 rounded-2xl overflow-hidden relative shadow-inner bg-surface-container">
<!-- Using pattern instead of image as instructed to minimize bloat, though image is usually better here -->
<div class="w-full h-full bg-gradient-to-br from-surface-variant to-surface-dim opacity-50"></div>
<button class="absolute bottom-2 right-2 w-8 h-8 bg-surface-container-lowest rounded-full shadow-sm flex items-center justify-center text-primary active:scale-90 transition-transform">
<span class="material-symbols-outlined text-[18px]">add</span>
</button>
</div>
</div>
</div>
</section>
<!-- Plats Section -->
<section class="scroll-mt-32" id="plats">
<h2 class="font-headline-md text-headline-md text-primary mb-stack-md flex items-center gap-2">
<span>Plats Principaux</span>
<div class="flex-1 h-px bg-surface-variant ml-4"></div>
</h2>
<div class="grid grid-cols-1 gap-4">
<!-- Menu Item Card 3 -->
<div class="bg-surface-container-lowest rounded-3xl p-4 flex gap-4 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-surface-variant hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]">
<div class="flex-1 flex flex-col justify-between">
<div>
<h3 class="font-label-md text-label-md text-on-surface mb-1">Filet de Bœuf Rossini</h3>
<p class="font-body-md text-body-md text-on-surface-variant line-clamp-2 text-sm leading-relaxed mb-2">Cœur de filet, escalope de foie gras poêlée, sauce aux truffes, purée mousseline.</p>
</div>
<div class="font-label-sm text-label-sm text-primary">28,000 FCFA</div>
</div>
<div class="w-28 h-28 shrink-0 rounded-2xl overflow-hidden relative shadow-inner">
<img class="w-full h-full object-cover" data-alt="A perfectly cooked medium-rare beef tenderloin topped with seared foie gras, glistening with a rich dark truffle reduction. Served beside a smooth, creamy potato purée on a slate-colored plate. High-contrast, moody culinary lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZ9e0kx_ZtyW9u9hhOQ9vrofB615kTbXEFYetGyoQxWzY6nb6b0kfWy52AGlVnFOTmBoTxvpkr6M1Mwqr3o02bIdjmny8lyuJYndQzVEt9Y8nWfieJBmg8sFsI2EPYHV-zq8JP2-ribqZkuDFQ0dF71eG22jH9ziBlH6eGIFGIA4EpMCFg_Wo7-vUqjaz_iBUgocWgacrZEKw-ZCuW5cZq4U3SHgZDK2UGqgtfUb8TeVN-OKT3GBreMxNIKvGEY_3IDGHgC3YRF3c"/>
<button class="absolute bottom-2 right-2 w-8 h-8 bg-surface-container-lowest rounded-full shadow-sm flex items-center justify-center text-primary active:scale-90 transition-transform">
<span class="material-symbols-outlined text-[18px]">add</span>
</button>
</div>
</div>
</div>
</section>
</div>
</div>
<!-- Desktop Sidebar (Cart / Info) -->
<div class="hidden md:block w-80 shrink-0 sticky top-28 self-start space-y-6">
<!-- Info Card -->
<div class="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-surface-variant">
<h3 class="font-label-md text-label-md text-on-surface mb-4">Informations</h3>
<div class="space-y-4">
<div class="flex items-start gap-3">
<span class="material-symbols-outlined text-primary mt-0.5">location_on</span>
<div>
<p class="font-body-md text-body-md text-on-surface text-sm">Zone 4, Rue Paul Langevin</p>
<p class="font-body-md text-body-md text-on-surface-variant text-sm">Abidjan, Côte d'Ivoire</p>
</div>
</div>
<div class="flex items-start gap-3">
<span class="material-symbols-outlined text-primary mt-0.5">schedule</span>
<div>
<p class="font-body-md text-body-md text-on-surface text-sm">Ouvert aujourd'hui</p>
<p class="font-body-md text-body-md text-on-surface-variant text-sm">12:00 - 15:00, 19:00 - 23:30</p>
</div>
</div>
</div>
</div>
<!-- Cart Preview (Empty State) -->
<div class="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-surface-variant flex flex-col items-center text-center">
<div class="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
<span class="material-symbols-outlined text-[32px] text-tertiary">shopping_bag</span>
</div>
<p class="font-body-md text-body-md text-on-surface-variant mb-6">Votre panier est vide pour le moment.</p>
<button class="w-full py-3 bg-surface-container-high text-on-surface-variant rounded-xl font-label-md text-label-md opacity-50 cursor-not-allowed">
                        Passer la commande
                    </button>
</div>
</div>
</div>
</main>
<!-- Floating Action Button (Mobile View Cart) -->
<div class="md:hidden fixed bottom-6 left-0 w-full px-margin-mobile z-40">
<button class="w-full h-14 bg-primary text-on-primary rounded-xl shadow-lg flex items-center justify-between px-6 active:scale-95 transition-transform">
<div class="flex items-center gap-3">
<div class="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-label-sm text-label-sm">
                    1
                </div>
<span class="font-label-md text-label-md">Voir le panier</span>
</div>
<span class="font-label-sm text-label-sm">12,000 FCFA</span>
</button>
</div>
<!-- Scripts -->
<script>
        // Simple scroll listener to change header opacity
        const mobileHeader = document.getElementById('mobile-header');
        const desktopHeader = document.getElementById('desktop-header');
        const headerTitle = document.getElementById('header-title');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 150) {
                if(mobileHeader) mobileHeader.classList.add('shadow-md');
                if(headerTitle) headerTitle.classList.remove('opacity-0');
            } else {
                if(mobileHeader) mobileHeader.classList.remove('shadow-md');
                if(headerTitle) headerTitle.classList.add('opacity-0');
            }
        });
    </script>
</body></html>