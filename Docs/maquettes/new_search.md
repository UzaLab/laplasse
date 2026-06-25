<!DOCTYPE html>

<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0, viewport-fit=cover" name="viewport"/>
<title>LaPlasse - Vue Carte</title>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
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
        /* Map specific styles */
        .map-bg {
            background-color: #f0f4f8; /* Soft base for map */
            background-image: 
                radial-gradient(#d8c3ad 1px, transparent 1px),
                radial-gradient(#d8c3ad 1px, transparent 1px);
            background-size: 40px 40px;
            background-position: 0 0, 20px 20px;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        
        /* Map Pins */
        .map-pin {
            position: absolute;
            transform: translate(-50%, -100%);
            transition: all 0.3s ease;
        }
        .map-pin:hover, .map-pin.active {
            transform: translate(-50%, -110%) scale(1.1);
            z-index: 10;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface text-on-surface font-body-md overflow-hidden touch-none h-screen w-screen flex flex-col relative">
<!-- MAIN CANVAS: MAP BACKGROUND -->
<div class="absolute inset-0 z-0 map-bg w-full h-full" id="map-container">
<!-- Stylized Map Placeholder - In a real app this would be Mapbox/Google Maps -->
<!-- Map Pins (Static for demonstration) -->
<div class="map-pin top-[30%] left-[40%] cursor-pointer group" onclick="selectPin(0)">
<div class="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center shadow-md relative">
<span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">restaurant</span>
<div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary"></div>
<!-- Mini bubble on hover -->
<div class="absolute -top-10 bg-surface text-on-surface px-3 py-1 rounded-full text-label-sm font-label-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-outline-variant">
                    Le Sereno
                </div>
</div>
</div>
<div class="map-pin top-[45%] left-[65%] cursor-pointer group active" onclick="selectPin(1)">
<div class="bg-primary-container text-on-primary-container w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative border-2 border-surface">
<span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">spa</span>
<div class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-surface"></div>
<div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary-container"></div>
</div>
</div>
<div class="map-pin top-[60%] left-[30%] cursor-pointer group" onclick="selectPin(2)">
<div class="bg-surface text-on-surface w-10 h-10 rounded-full flex items-center justify-center shadow-md relative border border-outline-variant">
<span class="material-symbols-outlined text-xl text-tertiary">nightlife</span>
<div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-outline-variant"></div>
<div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-surface"></div>
<!-- Mini bubble on hover -->
<div class="absolute -top-10 bg-surface text-on-surface px-3 py-1 rounded-full text-label-sm font-label-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-outline-variant">
                    Sky Lounge
                </div>
</div>
</div>
</div>
<!-- FLOATING SEARCH BAR & FILTERS (Top Area) -->
<div class="absolute top-0 left-0 w-full z-40 px-margin-mobile pt-safe mt-4 flex flex-col gap-3 pointer-events-none">
<!-- Search Input -->
<div class="bg-surface/90 backdrop-blur-xl rounded-full shadow-sm border border-outline-variant/30 flex items-center px-4 py-3 pointer-events-auto transition-transform active:scale-[0.98]">
<span class="material-symbols-outlined text-on-surface-variant mr-3">search</span>
<input class="bg-transparent border-none focus:ring-0 text-body-md font-body-md w-full text-on-surface placeholder-on-surface-variant/70 p-0" placeholder="Rechercher à Dubaï..." type="text"/>
<button class="ml-2 bg-surface-container rounded-full p-2 hover:bg-surface-container-high transition-colors flex items-center justify-center">
<span class="material-symbols-outlined text-on-surface text-sm">tune</span>
</button>
</div>
<!-- Filter Pills (Scrollable) -->
<div class="flex gap-2 overflow-x-auto hide-scrollbar pb-2 pointer-events-auto">
<button class="bg-primary text-on-primary px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm flex items-center gap-2">
<span class="material-symbols-outlined text-sm">restaurant</span> Restaurants
            </button>
<button class="bg-surface/90 backdrop-blur-md text-on-surface border border-outline-variant/50 px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm hover:bg-surface-container-low transition-colors flex items-center gap-2">
<span class="material-symbols-outlined text-sm">spa</span> Spas
            </button>
<button class="bg-surface/90 backdrop-blur-md text-on-surface border border-outline-variant/50 px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm hover:bg-surface-container-low transition-colors flex items-center gap-2">
<span class="material-symbols-outlined text-sm">nightlife</span> Lounges
            </button>
<button class="bg-surface/90 backdrop-blur-md text-on-surface border border-outline-variant/50 px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm hover:bg-surface-container-low transition-colors flex items-center gap-2">
<span class="material-symbols-outlined text-sm">storefront</span> Boutiques
            </button>
</div>
</div>
<!-- FLOATING INFO CARDS (Bottom Area above Nav) -->
<div class="absolute bottom-[90px] w-full z-40 pointer-events-none">
<!-- Horizontal scroll snap container for location cards -->
<div class="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar px-margin-mobile gap-4 pb-4 pointer-events-auto" id="cards-container">
<!-- Card 1 (Active) -->
<div class="snap-center shrink-0 w-[85vw] max-w-[320px] bg-surface/95 backdrop-blur-xl rounded-3xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-outline-variant/30 flex p-3 gap-4 active:scale-[0.98] transition-transform">
<!-- Image -->
<div class="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative bg-surface-container">
<img class="w-full h-full object-cover" data-alt="A luxurious, high-end modern spa interior in Dubai. The space features minimalist architectural lines, warm ambient lighting, natural stone textures, and a pristine white aesthetic with subtle golden amber accents. The atmosphere is serene, premium, and perfectly aligned with a light-mode UI design. A shallow depth of field focuses on an elegant massage table or relaxation area." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-lB2HFWvJe_-ZQD0zwd7Hr3LxkKPZ-77LNKJXBAuDBPvqDVItI-EnEPiiqN4Fq5mAUXFldlKPly45CCQqD6gi56LEe8U3CBY-riz3u8QT5Sg_9NkNUdmW6nQOFXKmujiSMc9Y_8HuoUe1ruWsmLY3BetJGgf3Mv2obfQIN5s8fT14UcRAWPNFM5ioYV9qifSADBy2X84a2H9JcR-qvHJY2dbGcWqhcVggPXgxu1g2B_PC_6MubFbPhNZ4AuKAugt4rPrVIYhoeWs"/>
<!-- Heart Button -->
<button class="absolute top-2 right-2 bg-surface/50 backdrop-blur-sm p-1 rounded-full text-on-surface hover:text-error transition-colors">
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">favorite</span>
</button>
</div>
<!-- Content -->
<div class="flex flex-col justify-center py-1 flex-1">
<div class="flex items-center gap-1 mb-1">
<span class="material-symbols-outlined text-primary text-[14px]">star</span>
<span class="font-label-sm text-label-sm text-on-surface">4.9</span>
<span class="font-label-sm text-label-sm text-tertiary ml-1">(124 avis)</span>
</div>
<h3 class="font-headline-md text-[18px] leading-tight font-semibold text-on-surface mb-1">Eden Spa Dubai</h3>
<p class="font-body-md text-[14px] text-on-surface-variant line-clamp-1 mb-2">Downtown Dubai • 1.2 km</p>
<div class="flex items-center justify-between mt-auto">
<span class="font-label-sm text-label-sm text-primary bg-primary-container/20 px-2 py-0.5 rounded-sm">Ouvert</span>
<button class="bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
<span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
</div>
</div>
<!-- Card 2 -->
<div class="snap-center shrink-0 w-[85vw] max-w-[320px] bg-surface/80 backdrop-blur-md rounded-3xl shadow-sm border border-outline-variant/30 flex p-3 gap-4 active:scale-[0.98] transition-transform opacity-80 scale-95">
<div class="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative bg-surface-container">
<img class="w-full h-full object-cover" data-alt="A sophisticated fine dining restaurant interior. The aesthetic is modern minimalism with premium glassmorphism elements, featuring warm amber mood lighting, crisp white tablecloths, and high-end table settings. The environment feels exclusive, bright, and upscale, perfectly suited for a premium directory app in light mode." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUnCzfsfYSm3cIOT9oqDGvfWk2NJUJmDnUHxmzURcBLZ_MjMl_aMfn4j8FNkpEZBUW9pGGo36AzfEFhbkGfI6djOTFkkyJ11l6DH4Hs5NokuxQ4FUT1Op82yy4Mvedi4yQ1itIOwd8i9fXMu9zXOPUL8ArltsDbVw4crYf9BquPGC34EATOBT927DqXMDgpYPfiv10HPrNOC0xQXRKFjCTGcOpFhXy02-rcF9pQAQqmBX9y6JVD9P-lVI0Pjg-ezQDv_G03UKrrJ4"/>
</div>
<div class="flex flex-col justify-center py-1 flex-1">
<div class="flex items-center gap-1 mb-1">
<span class="material-symbols-outlined text-primary text-[14px]">star</span>
<span class="font-label-sm text-label-sm text-on-surface">4.7</span>
</div>
<h3 class="font-headline-md text-[18px] leading-tight font-semibold text-on-surface mb-1">Le Sereno</h3>
<p class="font-body-md text-[14px] text-on-surface-variant line-clamp-1 mb-2">Jumeirah • 3.4 km</p>
<div class="flex items-center justify-between mt-auto">
<span class="font-label-sm text-label-sm text-error bg-error-container/30 px-2 py-0.5 rounded-sm">Fermé</span>
</div>
</div>
</div>
</div>
</div>
<!-- BOTTOM NAV BAR (Shared Component JSON Applied) -->
<!-- Name: BottomNavBar, Type: label_icon -->
<!-- Content: ["Explorer", "Market", "Favoris", "Panier", "Profil"] -->
<!-- Icons: ["explore", "storefront", "favorite", "shopping_bag", "person"] -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-safe bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-xl shadow-[0_-4px_12px_rgba(0,0,0,0.05)] rounded-t-xl md:hidden">
<!-- Active Tab: Explorer (Map view is part of explore) -->
<a class="flex flex-col items-center justify-center bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-xl px-3 py-1 active:scale-90 transition-transform duration-200 hover:bg-surface-container-high dark:hover:bg-surface-variant transition-colors" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">explore</span>
<span class="font-label-sm text-label-sm mt-1">Explorer</span>
</a>
<a class="flex flex-col items-center justify-center text-tertiary dark:text-tertiary-fixed-dim px-3 py-1 active:scale-90 transition-transform duration-200 hover:bg-surface-container-high dark:hover:bg-surface-variant transition-colors" href="#">
<span class="material-symbols-outlined">storefront</span>
<span class="font-label-sm text-label-sm mt-1">Market</span>
</a>
<a class="flex flex-col items-center justify-center text-tertiary dark:text-tertiary-fixed-dim px-3 py-1 active:scale-90 transition-transform duration-200 hover:bg-surface-container-high dark:hover:bg-surface-variant transition-colors" href="#">
<span class="material-symbols-outlined">favorite</span>
<span class="font-label-sm text-label-sm mt-1">Favoris</span>
</a>
<a class="flex flex-col items-center justify-center text-tertiary dark:text-tertiary-fixed-dim px-3 py-1 active:scale-90 transition-transform duration-200 hover:bg-surface-container-high dark:hover:bg-surface-variant transition-colors" href="#">
<span class="material-symbols-outlined">shopping_bag</span>
<span class="font-label-sm text-label-sm mt-1">Panier</span>
</a>
<a class="flex flex-col items-center justify-center text-tertiary dark:text-tertiary-fixed-dim px-3 py-1 active:scale-90 transition-transform duration-200 hover:bg-surface-container-high dark:hover:bg-surface-variant transition-colors" href="#">
<span class="material-symbols-outlined">person</span>
<span class="font-label-sm text-label-sm mt-1">Profil</span>
</a>
</nav>
<script>
        // Simple interaction script to demonstrate map behavior
        function selectPin(index) {
            // Update pins
            const pins = document.querySelectorAll('.map-pin');
            pins.forEach((pin, i) => {
                if(i === index) {
                    pin.classList.add('active');
                    pin.querySelector('div').classList.remove('bg-surface', 'bg-primary');
                    pin.querySelector('div').classList.add('bg-primary-container');
                    pin.querySelector('span').classList.replace('text-tertiary', 'text-on-primary-container');
                    pin.querySelector('span').classList.replace('text-on-primary', 'text-on-primary-container');
                } else {
                    pin.classList.remove('active');
                }
            });
            
            // In a real app, this would scroll the cards container to the matching card
            const container = document.getElementById('cards-container');
            const cards = container.children;
            if(cards[index]) {
                cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    </script>
</body></html>