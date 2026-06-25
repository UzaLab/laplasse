<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>LaPlasse - Search Results</title>
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
                    "outline": "#867461",
                    "primary-fixed": "#ffddb8",
                    "inverse-surface": "#2d3133",
                    "secondary-fixed-dim": "#bec6e0",
                    "primary-fixed-dim": "#ffb95f",
                    "inverse-primary": "#ffb95f",
                    "surface-dim": "#d8dadc",
                    "tertiary-fixed-dim": "#b7c8e1",
                    "surface-variant": "#e0e3e5",
                    "on-error-container": "#93000a",
                    "surface-container-high": "#e6e8ea",
                    "surface": "#f7f9fb",
                    "on-primary-fixed": "#2a1700",
                    "secondary-container": "#dae2fd",
                    "on-secondary-fixed-variant": "#3f465c",
                    "surface-bright": "#f7f9fb",
                    "on-primary-container": "#613b00",
                    "on-surface": "#191c1e",
                    "primary": "#855300",
                    "on-primary": "#ffffff",
                    "error": "#ba1a1a",
                    "tertiary-container": "#a2b2cb",
                    "on-secondary": "#ffffff",
                    "surface-container-highest": "#e0e3e5",
                    "secondary": "#565e74",
                    "on-primary-fixed-variant": "#653e00",
                    "background": "#f7f9fb",
                    "on-surface-variant": "#534434",
                    "on-tertiary": "#ffffff",
                    "on-secondary-fixed": "#131b2e",
                    "inverse-on-surface": "#eff1f3",
                    "tertiary": "#505f76",
                    "surface-container-lowest": "#ffffff",
                    "surface-tint": "#855300",
                    "surface-container": "#eceef0",
                    "tertiary-fixed": "#d3e4fe",
                    "primary-container": "#f59e0b",
                    "on-secondary-container": "#5c647a",
                    "on-tertiary-fixed-variant": "#38485d",
                    "error-container": "#ffdad6",
                    "on-background": "#191c1e",
                    "secondary-fixed": "#dae2fd",
                    "on-tertiary-container": "#35455a",
                    "on-error": "#ffffff",
                    "on-tertiary-fixed": "#0b1c30",
                    "surface-container-low": "#f2f4f6",
                    "outline-variant": "#d8c3ad"
            },
            "borderRadius": {
                    "DEFAULT": "1rem",
                    "lg": "2rem",
                    "xl": "3rem",
                    "full": "9999px"
            },
            "spacing": {
                    "margin-mobile": "1rem",
                    "stack-sm": "0.5rem",
                    "gutter": "1.5rem",
                    "stack-md": "1rem",
                    "margin-desktop": "2.5rem",
                    "stack-lg": "2rem",
                    "container-max": "1280px"
            },
            "fontFamily": {
                    "label-sm": ["Outfit"],
                    "display-lg": ["Outfit"],
                    "body-md": ["Outfit"],
                    "body-lg": ["Outfit"],
                    "headline-md": ["Outfit"],
                    "label-md": ["Outfit"],
                    "display-lg-mobile": ["Outfit"],
                    "headline-lg": ["Outfit"]
            },
            "fontSize": {
                    "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "600"}],
                    "display-lg": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                    "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                    "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500"}],
                    "display-lg-mobile": ["36px", {"lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "headline-lg": ["32px", {"lineHeight": "40px", "fontWeight": "600"}]
            }
    },
        },
      }
    </script>
<style>
        body {
            font-family: 'Outfit', sans-serif;
            background-color: theme('colors.background');
            color: theme('colors.on-background');
            -webkit-font-smoothing: antialiased;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .icon-fill {
            font-variation-settings: 'FILL' 1;
        }
        
        /* Hide scrollbar for horizontal scrolling containers */
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background min-h-screen pb-24 md:pb-0">
<!-- TopAppBar (From JSON) -->
<header class="fixed top-0 w-full z-50 shadow-sm bg-surface/80 backdrop-blur-xl">
<div class="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-stack-md max-w-container-max mx-auto">
<button class="p-2 -ml-2 text-on-surface-variant hover:bg-surface-variant/50 transition-colors rounded-full active:scale-95 duration-200">
<span class="material-symbols-outlined" data-icon="search">search</span>
</button>
<h1 class="font-headline-md text-headline-md font-bold text-primary tracking-tight">LaPlasse</h1>
<button class="w-10 h-10 rounded-full overflow-hidden hover:bg-surface-variant/50 transition-colors active:scale-95 duration-200">
<img alt="User Profile" class="w-full h-full object-cover" data-alt="A refined, professional headshot of a user against a light, minimalist background. The lighting is soft and natural, emphasizing high-end aesthetic. The user is wearing modern, elegant clothing, fitting for a premium lifestyle application. The overall tone is sophisticated and welcoming, perfectly aligned with the LaPlasse brand identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjb4b6BmNrrQjh12mnrZI8YyoINQPafma1JqRgiipYnGyauyC5zgvdQzNtfiQKtgcc0LaPJjtXEyPuFFa1cCISMKGc_LQjLJ8n49IHM6J-ma2tnqm3OW1WwZjN-20gP4-OPzQ-QH-aLleX5VUuHsZEZtYp6F0iSqdmSpeHS57d5O1WGb1NzLXCvXyDxtZOGNRhsLX3bc7W3KENvLgQL62pu3XniFoBjCIz_1cMBNR-wfKHSHWfASeqM8JR9kSBYhIVOl9lZF5P8e4"/>
</button>
</div>
</header>
<main class="pt-[88px] px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto space-y-stack-lg">
<!-- Search & Filter Area -->
<section class="space-y-stack-md">
<!-- Search Input -->
<div class="relative group">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input class="w-full bg-surface-container-low border border-outline-variant/50 text-on-surface font-body-md text-body-md rounded-xl py-4 pl-12 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" placeholder="Search establishments, products..." type="text" value="Luxe"/>
<button class="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined" data-icon="close">close</span>
</button>
</div>
<!-- Tabs -->
<div class="flex space-x-2 border-b border-outline-variant/30 pb-2">
<button class="flex-1 pb-2 border-b-2 border-primary text-primary font-label-sm text-label-sm md:text-label-md tracking-wide transition-colors">
                    Établissements
                </button>
<button class="flex-1 pb-2 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm md:text-label-md tracking-wide transition-colors">
                    Produits
                </button>
</div>
<div class="flex items-center justify-between">
<p class="font-body-md text-body-md text-on-surface-variant">24 results for "Luxe"</p>
<button class="flex items-center space-x-1 text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined text-sm" data-icon="tune">tune</span>
<span class="font-label-sm text-label-sm">Filters</span>
</button>
</div>
</section>
<!-- Active Tab Content: Establishments -->
<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
<!-- Result Card 1 -->
<article class="bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/30 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
<div class="relative h-64 w-full overflow-hidden">
<img alt="Restaurant Interior" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="Interior view of a highly luxurious, modern restaurant. The space features dramatic, warm ambient lighting, plush velvet seating in rich earth tones, and sleek metallic accents. Large floor-to-ceiling windows offer a distant city view. The overall aesthetic is premium, sophisticated, and exclusive, embodying a high-end dining experience perfect for a modern marketplace directory." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDH8-dePgAGVyyK5NDIFkgxPVfFInn7ipEj4rVSvb9HmWxkcJMno_7KEkLxPZ8TU7nELVMO2pyKi1BvD1v2lYYv89j5MS0GM4GkXMwnvrnuVQThrsDtCFPvnEPN6sx7wQeRvtbnCWSbB_yTiI_kC9FYvDb1jcWu92XkmlbCtdtJdSy8Kr9gLI_-XEAesuv76Sua9mMKL1gQJX24GkZYf1Sf8n0BAHrmpFIh5IsUc5KpO7YtL2I7TuRwZJt5tGVhU3RsVm2u59H_f0"/>
<div class="absolute top-4 right-4 bg-surface/80 backdrop-blur-md rounded-full p-2 text-on-surface cursor-pointer hover:text-primary transition-colors">
<span class="material-symbols-outlined" data-icon="bookmark">bookmark</span>
</div>
<div class="absolute bottom-4 left-4 flex space-x-2">
<span class="bg-surface/80 backdrop-blur-md text-on-surface font-label-sm text-label-sm px-3 py-1 rounded-full">Restaurant</span>
<span class="bg-surface/80 backdrop-blur-md text-on-surface font-label-sm text-label-sm px-3 py-1 rounded-full flex items-center"><span class="material-symbols-outlined text-[14px] mr-1 text-primary icon-fill">star</span> 4.9</span>
</div>
</div>
<div class="p-5">
<div class="flex justify-between items-start mb-2">
<h3 class="font-headline-md text-headline-md text-on-surface truncate pr-4">Le Cinq Luxe</h3>
<p class="font-label-sm text-label-sm text-on-surface-variant shrink-0 mt-1">$$$$</p>
</div>
<p class="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-4">Exceptional contemporary French cuisine in a breathtaking modern glass dining room.</p>
<div class="flex items-center text-on-surface-variant font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[16px] mr-1">location_on</span>
<span>8th Arr., Paris • 2.4 km</span>
</div>
</div>
</article>
<!-- Result Card 2 -->
<article class="bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/30 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
<div class="relative h-64 w-full overflow-hidden">
<img alt="Spa Interior" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A serene, ultra-luxurious spa interior. The room features a glowing vitality pool surrounded by smooth, dark slate stone and minimalist, light wood architectural elements. Soft, indirect lighting creates a tranquil, warm amber glow. The atmosphere is calming, exclusive, and high-end, representing a premium wellness destination for a sophisticated directory app." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLRpHVkhp8ENShtH4VY5XUMfTVeRlep6x4GJSAgZ0VDnJTUNJsblefI6wuqWKtz-YvsrExo9T9ODZm4q_uFa-hC3vNG9g3uiULP2CoL01J2ah4wI28_lVUmA5aXVJKBVlyPAUvPoUqplXtFolbg299aLjioi3MyOV28DxxnqV5bl67RhCEja3vnc1YTbj588OtCbduNdXc2p2Vu7v6JrPZcqUj0QB2RFnnn0vS3aLhswdRn-A5NNfNhaC9scn28Pse2Kv0LUYFuV4"/>
<div class="absolute top-4 right-4 bg-surface/80 backdrop-blur-md rounded-full p-2 text-on-surface cursor-pointer hover:text-primary transition-colors">
<span class="material-symbols-outlined" data-icon="bookmark">bookmark</span>
</div>
<div class="absolute bottom-4 left-4 flex space-x-2">
<span class="bg-surface/80 backdrop-blur-md text-on-surface font-label-sm text-label-sm px-3 py-1 rounded-full">Wellness</span>
<span class="bg-surface/80 backdrop-blur-md text-on-surface font-label-sm text-label-sm px-3 py-1 rounded-full flex items-center"><span class="material-symbols-outlined text-[14px] mr-1 text-primary icon-fill">star</span> 4.8</span>
</div>
</div>
<div class="p-5">
<div class="flex justify-between items-start mb-2">
<h3 class="font-headline-md text-headline-md text-on-surface truncate pr-4">Aura Spa &amp; Retreat</h3>
<p class="font-label-sm text-label-sm text-on-surface-variant shrink-0 mt-1">$$$</p>
</div>
<p class="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-4">Holistic wellness therapies merging ancient traditions with modern luxury amenities.</p>
<div class="flex items-center text-on-surface-variant font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[16px] mr-1">location_on</span>
<span>1st Arr., Paris • 1.1 km</span>
</div>
</div>
</article>
<!-- Result Card 3 -->
<article class="bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/30 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
<div class="relative h-64 w-full overflow-hidden">
<img alt="Boutique Interior" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A chic, high-end boutique storefront interior. The space is minimalist, featuring stark white walls, brushed brass clothing racks displaying a sparse collection of elegant garments, and a striking modern chandelier. The lighting is bright and clean, emphasizing the premium quality of the merchandise and the sophisticated retail environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPdYgfBDxsR5o8Ky4sTbEFAS6tr7FiSx_cJ2xAycEppgCYDKApkGnJC0HUpLQZj5gHiPTkKqVhRxnUnqiFlzmmtR6sMYpHZUD1EupKcHaRw0WIVaHadydQ2gXo3VKIJlLlEYDwXxo-BaEHHD5ldqxTd2oVpRxPHpI8EnRukaSEIQ2Ad-oTcQrUKG5fT74ffJ26aoGdyEVshFh-9oD0J6t_ILfXQ-fBTuWgwWw7f9ECMnvrSXKwWGqY6_h2oy5zTqvnfNmkUeKeSb8"/>
<div class="absolute top-4 right-4 bg-surface/80 backdrop-blur-md rounded-full p-2 text-on-surface cursor-pointer hover:text-primary transition-colors">
<span class="material-symbols-outlined" data-icon="bookmark">bookmark</span>
</div>
<div class="absolute bottom-4 left-4 flex space-x-2">
<span class="bg-surface/80 backdrop-blur-md text-on-surface font-label-sm text-label-sm px-3 py-1 rounded-full">Retail</span>
<span class="bg-surface/80 backdrop-blur-md text-on-surface font-label-sm text-label-sm px-3 py-1 rounded-full flex items-center"><span class="material-symbols-outlined text-[14px] mr-1 text-primary icon-fill">star</span> 5.0</span>
</div>
</div>
<div class="p-5">
<div class="flex justify-between items-start mb-2">
<h3 class="font-headline-md text-headline-md text-on-surface truncate pr-4">Maison de Luxe</h3>
<p class="font-label-sm text-label-sm text-on-surface-variant shrink-0 mt-1">$$$$</p>
</div>
<p class="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-4">Curated selection of avant-garde designer apparel in an exclusive setting.</p>
<div class="flex items-center text-on-surface-variant font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[16px] mr-1">location_on</span>
<span>Le Marais, Paris • 3.0 km</span>
</div>
</div>
</article>
</section>
<!-- Cross-Discovery Section: Most Popular in Products -->
<section class="mt-stack-lg border-t border-outline-variant/30 pt-stack-lg">
<div class="flex justify-between items-end mb-stack-md">
<div>
<h2 class="font-headline-md text-headline-md text-on-surface mb-1">Most Popular in Produits</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Discover premium items related to "Luxe"</p>
</div>
<button class="text-primary font-label-sm text-label-sm hover:text-primary-fixed-variant transition-colors flex items-center">
                    View All <span class="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
</button>
</div>
<!-- Horizontal Scroll Area -->
<div class="flex overflow-x-auto hide-scrollbar space-x-4 pb-4 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
<!-- Product Card 1 -->
<div class="w-[280px] shrink-0 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden group cursor-pointer">
<div class="h-40 w-full bg-surface-container overflow-hidden">
<img alt="Premium Perfume" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="Close-up shot of a luxurious, elegantly designed perfume bottle sitting on a sleek marble surface. The lighting is soft and directional, highlighting the amber liquid inside and the metallic gold accents of the bottle cap. The background is slightly blurred, emphasizing the premium quality and sophisticated branding of the product." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvfV62gkIHF5HSA4sIEel8I7M-Ta-t6ntYf4B4yFY5e_U9ZWnoLT81xp7ZgktSBhsmEBQUZDMv4uS4eYx_riIoNj2mBWDpDCvmRIhit4NE9B3mcXYbCXddD25lBIE24gEZZ4CWQlch2F-stTU39CU8xi5Ysy721HNezYks_YiG9IlZdC2AYpOOjB_E7yFG6VyZQvU9CskNwz0AN-Skv9IjH_lxpXrqsxIepJbi9-eR7rjaKjFNHj_lgCNVpuAnfFYW1VhbrSYhnXY"/>
</div>
<div class="p-4">
<h4 class="font-label-sm text-label-sm text-on-surface mb-1">Essence d'Or Perfume</h4>
<p class="font-body-md text-body-md text-on-surface-variant text-sm mb-3">Maison de Luxe</p>
<div class="flex justify-between items-center">
<span class="font-label-sm text-label-sm text-primary">€245</span>
<button class="bg-surface-variant text-on-surface-variant rounded-full p-1.5 hover:bg-primary hover:text-on-primary transition-colors">
<span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
</button>
</div>
</div>
</div>
<!-- Product Card 2 -->
<div class="w-[280px] shrink-0 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden group cursor-pointer">
<div class="h-40 w-full bg-surface-container overflow-hidden">
<img alt="Artisan Handbag" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A beautifully crafted artisan leather handbag displayed on a minimalist, illuminated pedestal. The bag is a rich, warm cognac color with meticulous stitching and solid brass hardware. The setting is clean and high-key, drawing all attention to the premium craftsmanship and luxurious texture of the leather accessory." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTwDm1iZRPjV9CujNEUHuqP07DfbDa8aJqXDO0FlEO1XZ5V3SoICNVnGB7boAF4jTE9CFIKVNaWtd30jfYqh-oY83eMwa5POORJgFrsUOiSMdsO30BP0sC3BiwH_aP0IJ8DiJdwqsq4NfIfy-9G7Xj6oJyxTDtvnSOcXyD9ExQED8JpqPocl1mXvsdd__KalB4pinPCFgvHrqFn_rTxVeCXF1BTGGdLoNPvZHgNuy1SWSCrBg4YJLHWoUMOUCtryAIIB2u8QC-C0w"/>
</div>
<div class="p-4">
<h4 class="font-label-sm text-label-sm text-on-surface mb-1">Artisan Leather Tote</h4>
<p class="font-body-md text-body-md text-on-surface-variant text-sm mb-3">Atelier Parisien</p>
<div class="flex justify-between items-center">
<span class="font-label-sm text-label-sm text-primary">€890</span>
<button class="bg-surface-variant text-on-surface-variant rounded-full p-1.5 hover:bg-primary hover:text-on-primary transition-colors">
<span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
</button>
</div>
</div>
</div>
<!-- Product Card 3 -->
<div class="w-[280px] shrink-0 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden group cursor-pointer">
<div class="h-40 w-full bg-surface-container overflow-hidden">
<img alt="Luxury Watch" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A macro shot of a sophisticated mechanical watch face, showcasing intricate gears and a pristine sapphire crystal. The watch is resting on dark velvet, with sharp, focused lighting highlighting the polished metallic surfaces and elegant hands. The image conveys ultimate precision, luxury, and timeless design." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDG_dbiWUeKF6D7Ns5wZwtsMEkX5U6W8GkCauMACNYAinlB_7pfT-_s5_VxDqVm84ISnH_vsagIfTd-mVOiP_YchS0xhGg-0xN5eXMTP6JsiLwYatqD3ZbzSI1X1XMS9IDsdHUhvEijeLO1DWGz3voyEBn0_byqg-zzO7aL_ArGJEKtPD78drWXQz9zA6_fqC-LD7XAA1gzWaKnVnh0giuENjI5jnhqkZKyGXFdsBQl5Z4op9a3r3L48UdpIGLKSmSyLAFYVkoAPMM"/>
</div>
<div class="p-4">
<h4 class="font-label-sm text-label-sm text-on-surface mb-1">Chronographe Luxe</h4>
<p class="font-body-md text-body-md text-on-surface-variant text-sm mb-3">Horlogerie Fine</p>
<div class="flex justify-between items-center">
<span class="font-label-sm text-label-sm text-primary">€3,200</span>
<button class="bg-surface-variant text-on-surface-variant rounded-full p-1.5 hover:bg-primary hover:text-on-primary transition-colors">
<span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
</button>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- BottomNavBar (From JSON) -->
<nav class="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 px-margin-mobile bg-surface/80 backdrop-blur-xl border-t border-outline-variant/30 rounded-t-lg shadow-lg z-50">
<!-- Explore (Active based on search context) -->
<a class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1.5 active:scale-90 duration-150 group" href="#">
<span class="material-symbols-outlined icon-fill group-hover:text-primary transition-all" data-icon="explore">explore</span>
<span class="font-label-sm text-label-sm-mobile group-hover:text-primary transition-all mt-1">Explore</span>
</a>
<!-- Market -->
<a class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1.5 hover:text-primary transition-all active:scale-90 duration-150 group" href="#">
<span class="material-symbols-outlined group-hover:text-primary transition-all" data-icon="shopping_bag">shopping_bag</span>
<span class="font-label-sm text-label-sm-mobile group-hover:text-primary transition-all mt-1">Market</span>
</a>
<!-- Saved -->
<a class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1.5 hover:text-primary transition-all active:scale-90 duration-150 group" href="#">
<span class="material-symbols-outlined group-hover:text-primary transition-all" data-icon="bookmark">bookmark</span>
<span class="font-label-sm text-label-sm-mobile group-hover:text-primary transition-all mt-1">Saved</span>
</a>
<!-- Profile -->
<a class="flex flex-col items-center justify-center text-on-surface-variant px-4 py-1.5 hover:text-primary transition-all active:scale-90 duration-150 group" href="#">
<span class="material-symbols-outlined group-hover:text-primary transition-all" data-icon="person">person</span>
<span class="font-label-sm text-label-sm-mobile group-hover:text-primary transition-all mt-1">Profile</span>
</a>
</nav>
</body></html>