<!DOCTYPE html>

<html class="dark" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>LaPlasse - Explorer</title>
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
                        "tertiary": "#505f76",
                        "surface-container": "#eceef0",
                        "surface-container-low": "#f2f4f6",
                        "on-primary": "#ffffff",
                        "surface": "#f7f9fb",
                        "on-surface": "#191c1e",
                        "tertiary-fixed": "#d3e4fe",
                        "primary-fixed-dim": "#ffb95f",
                        "on-tertiary-fixed-variant": "#38485d",
                        "on-primary-fixed": "#2a1700",
                        "surface-tint": "#855300",
                        "inverse-primary": "#ffb95f",
                        "secondary-container": "#dae2fd",
                        "on-secondary-fixed": "#131b2e",
                        "inverse-surface": "#2d3133",
                        "error": "#ba1a1a",
                        "surface-container-highest": "#e0e3e5",
                        "on-background": "#191c1e",
                        "primary-container": "#f59e0b",
                        "on-error-container": "#93000a",
                        "inverse-on-surface": "#eff1f3",
                        "secondary-fixed-dim": "#bec6e0",
                        "on-error": "#ffffff",
                        "outline-variant": "#d8c3ad",
                        "primary": "#855300",
                        "tertiary-container": "#a2b2cb",
                        "surface-container-lowest": "#ffffff",
                        "background": "#f7f9fb",
                        "on-surface-variant": "#534434",
                        "primary-fixed": "#ffddb8",
                        "on-tertiary": "#ffffff",
                        "on-secondary-fixed-variant": "#3f465c",
                        "outline": "#867461",
                        "surface-dim": "#d8dadc",
                        "surface-container-high": "#e6e8ea",
                        "secondary": "#565e74",
                        "on-primary-fixed-variant": "#653e00",
                        "on-secondary-container": "#5c647a",
                        "error-container": "#ffdad6",
                        "surface-variant": "#e0e3e5",
                        "secondary-fixed": "#dae2fd",
                        "on-tertiary-fixed": "#0b1c30",
                        "on-secondary": "#ffffff",
                        "on-primary-container": "#613b00",
                        "surface-bright": "#f7f9fb",
                        "tertiary-fixed-dim": "#b7c8e1",
                        "on-tertiary-container": "#35455a"
                    },
                    "borderRadius": {
                        "DEFAULT": "1rem",
                        "lg": "2rem",
                        "xl": "3rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "margin-mobile": "1rem",
                        "stack-md": "1rem",
                        "margin-desktop": "2.5rem",
                        "container-max": "1280px",
                        "stack-sm": "0.5rem",
                        "gutter": "1.5rem",
                        "stack-lg": "2rem"
                    },
                    "fontFamily": {
                        "headline-lg": ["Outfit"],
                        "label-sm": ["Outfit"],
                        "body-md": ["Outfit"],
                        "headline-md": ["Outfit"],
                        "display-lg": ["Outfit"],
                        "body-lg": ["Outfit"],
                        "display-lg-mobile": ["Outfit"],
                        "label-md": ["Outfit"]
                    },
                    "fontSize": {
                        "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "600" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "600" }],
                        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
                        "display-lg-mobile": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500" }]
                    }
                }
            }
        }
    </script>
<style>
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background antialiased font-sans flex flex-col min-h-screen">
<!-- TopAppBar -->
<header class="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-xl shadow-sm">
<div class="flex items-center justify-between px-margin-mobile h-16 w-full">
<button aria-label="Menu" class="text-on-surface-variant dark:text-surface-variant hover:opacity-80 transition-opacity active:scale-95 transition-transform">
<span class="material-symbols-outlined" data-icon="search">search</span>
</button>
<h1 class="font-display-lg-mobile text-display-lg-mobile text-primary dark:text-primary-fixed-dim tracking-tight">LaPlasse</h1>
<button aria-label="Notifications" class="text-on-surface-variant dark:text-surface-variant hover:opacity-80 transition-opacity active:scale-95 transition-transform">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
</div>
</header>
<!-- Main Content -->
<main class="flex-1 pt-20 pb-24 px-margin-mobile overflow-y-auto hide-scrollbar">
<!-- Hero Section -->
<section class="mb-stack-lg">
<h2 class="font-headline-md text-headline-md text-on-surface mb-stack-sm">Bonjour, Alex</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Prêt à découvrir de nouvelles pépites aujourd'hui ?</p>
<!-- Search Bar -->
<div class="mt-stack-md relative">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-tertiary">search</span>
<input class="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 pl-12 pr-4 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm" placeholder="Rechercher un établissement ou un produit" type="text"/>
</div>
</section>
<!-- Categories -->
<section class="mb-stack-lg">
<div class="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
<button class="flex flex-col items-center min-w-[80px] gap-2 group">
<div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
<span class="material-symbols-outlined text-[28px]" data-icon="restaurant">restaurant</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Restaurants</span>
</button>
<button class="flex flex-col items-center min-w-[80px] gap-2 group">
<div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
<span class="material-symbols-outlined text-[28px]" data-icon="spa">spa</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Spas</span>
</button>
<button class="flex flex-col items-center min-w-[80px] gap-2 group">
<div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
<span class="material-symbols-outlined text-[28px]" data-icon="nightlife">nightlife</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Lounges</span>
</button>
<button class="flex flex-col items-center min-w-[80px] gap-2 group">
<div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
<span class="material-symbols-outlined text-[28px]" data-icon="shopping_basket">shopping_basket</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Shopping</span>
</button>
</div>
</section>
<!-- Featured Establishments -->
<section class="mb-stack-lg">
<div class="flex justify-between items-end mb-stack-md">
<h3 class="font-headline-md text-headline-md text-on-surface">Établissements à la une</h3>
<a class="font-label-md text-label-md text-primary hover:underline" href="#">Voir tout</a>
</div>
<div class="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-margin-mobile px-margin-mobile">
<!-- Card 1 -->
<div class="min-w-[280px] bg-surface-container-lowest rounded-3xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-outline-variant/30 overflow-hidden shrink-0">
<div class="h-48 w-full bg-cover bg-center" data-alt="A high-end modern restaurant interior with warm ambient lighting, plush seating, and elegant table settings. The atmosphere is sophisticated and inviting, captured with a soft focus on the background." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuA7pJ857veaDojyjyG51ji6iFgLC8hiTo10-S9YVCeDY-5EV6ysdhCfrL_BddprdWwZL3NIM7jQqzAyym4vI0Mtuuh2NPjuh6qLcUdvfmkQILja-P-uDxAREuD26-cHISHQvo76_5zS4P6uRPD7g-aBWIYYVcDF1tegp8xQKhlmtO6YCyxLlhsPrTOYJS0lGqaK66UazfhrIMea8Q5N9DZVlGnHHrINPr3N6nI-mQpxvQhr2l9aBIT4ea_6JoOkLnaxifV88K2SSm0')"></div>
<div class="p-4">
<div class="flex justify-between items-start mb-1">
<h4 class="font-body-lg text-body-lg text-on-surface font-semibold">Le Gourmet Parisien</h4>
<div class="flex items-center text-primary">
<span class="material-symbols-outlined text-[16px] mr-1" data-icon="star" data-weight="fill" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-sm text-label-sm">4.8</span>
</div>
</div>
<p class="font-body-md text-body-md text-on-surface-variant mb-3">Restaurant • Cocody, Abidjan</p>
<div class="flex gap-2">
<span class="px-3 py-1 bg-surface-container rounded-full font-label-sm text-label-sm text-tertiary">Français</span>
<span class="px-3 py-1 bg-surface-container rounded-full font-label-sm text-label-sm text-tertiary">Premium</span>
</div>
</div>
</div>
<!-- Card 2 -->
<div class="min-w-[280px] bg-surface-container-lowest rounded-3xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-outline-variant/30 overflow-hidden shrink-0">
<div class="h-48 w-full bg-cover bg-center" data-alt="A luxurious spa relaxation room with minimal modern design. Soft warm lighting, bamboo accents, and comfortable reclining chairs create a tranquil and serene environment." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDKirdk1v7NH-QI5HHvAkzcK4jyT3awR0hSl7bZqXlZ1UvTkRhFq7Y5W507fMAPb4fEpWPRHHh5FWlaJRO_dVfOTafZ_d50ZpyiAHmiP9QCFIWVzBWXLIdqr9vS20S0HuR_O4Y8VHOA8nN5asnRCnUF5mBxeyac9H0lIbVyb8RUmkqh4Jhmv0OMAYtJIktrs5ZCnMPI873s4C4rzblUju8Mf___IxPsIx_ybfkg9vC52xIeHVWLI7ZM1Oo0tNUqubZvjodGleDM4I0')"></div>
<div class="p-4">
<div class="flex justify-between items-start mb-1">
<h4 class="font-body-lg text-body-lg text-on-surface font-semibold">Zen Oasis Spa</h4>
<div class="flex items-center text-primary">
<span class="material-symbols-outlined text-[16px] mr-1" data-icon="star" data-weight="fill" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-sm text-label-sm">4.9</span>
</div>
</div>
<p class="font-body-md text-body-md text-on-surface-variant mb-3">Spa &amp; Bien-être • Marcory</p>
<div class="flex gap-2">
<span class="px-3 py-1 bg-surface-container rounded-full font-label-sm text-label-sm text-tertiary">Massage</span>
<span class="px-3 py-1 bg-surface-container rounded-full font-label-sm text-label-sm text-tertiary">Détente</span>
</div>
</div>
</div>
</div>
</section>
<!-- Marketplace Arrivals -->
<section>
<div class="flex justify-between items-end mb-stack-md">
<h3 class="font-headline-md text-headline-md text-on-surface">Nouveautés Marketplace</h3>
<a class="font-label-md text-label-md text-primary hover:underline" href="#">Voir tout</a>
</div>
<div class="grid grid-cols-2 gap-4">
<!-- Product 1 -->
<div class="bg-surface-container-lowest rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden flex flex-col">
<div class="aspect-square w-full bg-cover bg-center bg-surface-container-low" data-alt="A premium artisanal leather bag displayed on a clean minimalist surface. Soft, highly diffused light highlights the texture of the leather, creating an elegant and modern product photography shot." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDULGjYW2ptDyhWCqlZGtNqq0uTSvQVviDfmNzGsUIejqZTTITEGKCGOUTH5Cg_fx2TCglx2PpbwPTHsyCXE335vdIkIO2WcHqbLA53MiCkk3obsTueLbXHUZ7fkAyCjk8-YpuQpKR2ba9fxiYNENUy1n9g0LgL8oinHLC2TjbUG_-2YL5REeDnbKgvj9CzTAhxJM6bdCvzcEREnSIkpCcIOWFKTKjqwB_woZejGvxVHaykSCSigOippOYQRlkkTZMQNf1C8lmx6L0')"></div>
<div class="p-3 flex flex-col flex-1 justify-between">
<div>
<h5 class="font-body-md text-body-md text-on-surface font-medium line-clamp-2 mb-1">Sac en Cuir Artisanal Premium</h5>
<p class="font-label-sm text-label-sm text-on-surface-variant mb-2">Maroquinerie d'Art</p>
</div>
<div class="flex justify-between items-center mt-auto">
<span class="font-headline-md text-headline-md text-primary">45 000 FCFA</span>
<button class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:opacity-90 transition-opacity">
<span class="material-symbols-outlined text-[18px]" data-icon="add">add</span>
</button>
</div>
</div>
</div>
<!-- Product 2 -->
<div class="bg-surface-container-lowest rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden flex flex-col">
<div class="aspect-square w-full bg-cover bg-center bg-surface-container-low" data-alt="A beautifully crafted ceramic vase with dried flowers set against a neutral, softly lit background. The composition is minimal and sophisticated, evoking a sense of calm and premium quality." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCQXm6b1kO0cf4WbsSxAJ2K7eZBa3Xfmq2GVY0Hx7rNQ5BVJ2j9uDgsrk7Hjaox6ysKaJ_GCYDnIzju8F0zaT3hSiIUnVWyog85cMhsmkmhybnQxzmnOboZHmC0Na8tXDFzpIRWi7xk946tW6dn2gdaPH__EWkN-ULPKTai6gyCR9FuSe4WdAPY7QIA4TE7NPkKqvYBSeJqIGcr4qD2vnQCuqCzm8HzHOkjU4YImoxoCLLOEEeYmYLL-VafYdMX8XouC8QXLFFjKSw')"></div>
<div class="p-3 flex flex-col flex-1 justify-between">
<div>
<h5 class="font-body-md text-body-md text-on-surface font-medium line-clamp-2 mb-1">Vase Céramique Fait Main</h5>
<p class="font-label-sm text-label-sm text-on-surface-variant mb-2">Déco &amp; Maison</p>
</div>
<div class="flex justify-between items-center mt-auto">
<span class="font-headline-md text-headline-md text-primary">15 000 FCFA</span>
<button class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:opacity-90 transition-opacity">
<span class="material-symbols-outlined text-[18px]" data-icon="add">add</span>
</button>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 w-full rounded-t-xl z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-xl shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden pb-safe">
<div class="flex justify-around items-center px-4 py-2">
<!-- Active Tab: Explorer -->
<button class="flex flex-col items-center justify-center bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-xl px-3 py-1 active:scale-90 transition-transform duration-200">
<span class="material-symbols-outlined mb-1" data-icon="explore" data-weight="fill" style="font-variation-settings: 'FILL' 1;">explore</span>
<span class="font-label-sm text-label-sm">Explorer</span>
</button>
<!-- Inactive Tabs -->
<button class="flex flex-col items-center justify-center text-tertiary dark:text-tertiary-fixed-dim px-3 py-1 hover:bg-surface-container-high dark:hover:bg-surface-variant transition-colors active:scale-90 transition-transform duration-200">
<span class="material-symbols-outlined mb-1" data-icon="storefront">storefront</span>
<span class="font-label-sm text-label-sm">Market</span>
</button>
<button class="flex flex-col items-center justify-center text-tertiary dark:text-tertiary-fixed-dim px-3 py-1 hover:bg-surface-container-high dark:hover:bg-surface-variant transition-colors active:scale-90 transition-transform duration-200">
<span class="material-symbols-outlined mb-1" data-icon="favorite">favorite</span>
<span class="font-label-sm text-label-sm">Favoris</span>
</button>
<button class="flex flex-col items-center justify-center text-tertiary dark:text-tertiary-fixed-dim px-3 py-1 hover:bg-surface-container-high dark:hover:bg-surface-variant transition-colors active:scale-90 transition-transform duration-200">
<span class="material-symbols-outlined mb-1" data-icon="shopping_bag">shopping_bag</span>
<span class="font-label-sm text-label-sm">Panier</span>
</button>
<button class="flex flex-col items-center justify-center text-tertiary dark:text-tertiary-fixed-dim px-3 py-1 hover:bg-surface-container-high dark:hover:bg-surface-variant transition-colors active:scale-90 transition-transform duration-200">
<span class="material-symbols-outlined mb-1" data-icon="person">person</span>
<span class="font-label-sm text-label-sm">Profil</span>
</button>
</div>
</nav>
</body></html>