<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>LaPlasse - Restauration</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-primary-fixed": "#2a1700",
                        "outline-variant": "#d8c3ad",
                        "error-container": "#ffdad6",
                        "surface-tint": "#855300",
                        "primary-container": "#f59e0b",
                        "on-surface": "#191c1e",
                        "primary-fixed-dim": "#ffb95f",
                        "on-primary-container": "#613b00",
                        "tertiary": "#505f76",
                        "on-primary-fixed-variant": "#653e00",
                        "on-secondary-fixed-variant": "#3f465c",
                        "secondary-fixed-dim": "#bec6e0",
                        "surface-container-high": "#e6e8ea",
                        "surface-container": "#eceef0",
                        "inverse-on-surface": "#eff1f3",
                        "surface-variant": "#e0e3e5",
                        "surface-container-lowest": "#ffffff",
                        "inverse-primary": "#ffb95f",
                        "outline": "#867461",
                        "tertiary-fixed-dim": "#b7c8e1",
                        "on-tertiary": "#ffffff",
                        "surface-bright": "#f7f9fb",
                        "tertiary-container": "#a2b2cb",
                        "on-secondary-container": "#5c647a",
                        "surface-dim": "#d8dadc",
                        "tertiary-fixed": "#d3e4fe",
                        "secondary-fixed": "#dae2fd",
                        "on-primary": "#ffffff",
                        "background": "#f7f9fb",
                        "on-surface-variant": "#534434",
                        "on-background": "#191c1e",
                        "surface-container-highest": "#e0e3e5",
                        "secondary-container": "#dae2fd",
                        "on-tertiary-container": "#35455a",
                        "on-tertiary-fixed": "#0b1c30",
                        "secondary": "#565e74",
                        "on-secondary": "#ffffff",
                        "primary": "#855300",
                        "on-tertiary-fixed-variant": "#38485d",
                        "on-secondary-fixed": "#131b2e",
                        "surface-container-low": "#f2f4f6",
                        "primary-fixed": "#ffddb8",
                        "surface": "#f7f9fb",
                        "error": "#ba1a1a",
                        "inverse-surface": "#2d3133",
                        "on-error-container": "#93000a",
                        "on-error": "#ffffff"
                    },
                    "borderRadius": {
                        "DEFAULT": "1rem",
                        "lg": "2rem",
                        "xl": "3rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-sm": "0.5rem",
                        "stack-md": "1rem",
                        "stack-lg": "2rem",
                        "margin-mobile": "1rem",
                        "gutter": "1.5rem",
                        "container-max": "1280px",
                        "margin-desktop": "2.5rem"
                    },
                    "fontFamily": {
                        "label-sm": ["Outfit"],
                        "headline-md": ["Outfit"],
                        "display-lg-mobile": ["Outfit"],
                        "headline-lg": ["Outfit"],
                        "label-md": ["Outfit"],
                        "body-lg": ["Outfit"],
                        "display-lg": ["Outfit"],
                        "body-md": ["Outfit"]
                    },
                    "fontSize": {
                        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "600" }],
                        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "display-lg-mobile": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "600" }],
                        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500" }],
                        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
                        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }]
                    }
                }
            }
        }
    </script>
<style>
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
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
<body class="bg-surface text-on-surface font-body-md min-h-screen pb-24">
<!-- TopAppBar -->
<header class="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-xl shadow-sm border-b-0">
<div class="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-stack-md max-w-container-max mx-auto">
<div class="flex items-center gap-4 w-full">
<span class="material-symbols-outlined text-primary dark:text-primary-fixed" style="font-variation-settings: 'FILL' 1;">search</span>
<input class="w-full bg-surface-container-low border-0 focus:ring-2 focus:ring-primary-container rounded-full px-4 py-2 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant transition-colors" placeholder="Restaurants, dishes..." type="text"/>
<div class="flex-shrink-0 w-10 h-10 rounded-full bg-surface-variant overflow-hidden border-2 border-surface flex items-center justify-center">
<img class="w-full h-full object-cover" data-alt="A portrait photo of a smiling professional person, well lit, looking at the camera, wearing a casual modern outfit. Studio lighting, clean background, premium quality image, high resolution." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzI42qllAM16P2ZyZ4R7uuSlmbR_rwHbwSqdvtaKFTUaa_waUI5lt6IxnrnibyjSelYhPF2FyxbXpbETQJDaehgdaGlydOr4B2vdcY67_RH9RgwTPcOyT1jDZ4Cf4lBdBDXdMhf8YlQdV7ywYYuvukvNYYQ1KY0bAsHPdJgFIdYH6SwkVk1xf2_5Q7VeSrw7-DVbLXQzJQ_OuQiSSpOmqeRf3S4ZgXsG1wewkiRzWcR9hfeXpHMQMKgsKgygpdjIMcdgkCKqBd0gQ"/>
</div>
</div>
</div>
</header>
<main class="pt-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto flex flex-col gap-stack-lg">
<!-- Categories -->
<section>
<div class="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
<div class="flex flex-col items-center gap-2 snap-start flex-shrink-0 w-20">
<div class="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center shadow-sm">
<span class="material-symbols-outlined text-primary text-3xl">lunch_dining</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Burger</span>
</div>
<div class="flex flex-col items-center gap-2 snap-start flex-shrink-0 w-20">
<div class="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center shadow-sm">
<span class="material-symbols-outlined text-primary text-3xl">set_meal</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Sushi</span>
</div>
<div class="flex flex-col items-center gap-2 snap-start flex-shrink-0 w-20">
<div class="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center shadow-sm">
<span class="material-symbols-outlined text-primary text-3xl">local_pizza</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Pizza</span>
</div>
<div class="flex flex-col items-center gap-2 snap-start flex-shrink-0 w-20">
<div class="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center shadow-sm">
<span class="material-symbols-outlined text-primary text-3xl">restaurant</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Local</span>
</div>
<div class="flex flex-col items-center gap-2 snap-start flex-shrink-0 w-20">
<div class="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center shadow-sm">
<span class="material-symbols-outlined text-primary text-3xl">ramen_dining</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Asian</span>
</div>
<div class="flex flex-col items-center gap-2 snap-start flex-shrink-0 w-20">
<div class="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center shadow-sm">
<span class="material-symbols-outlined text-primary text-3xl">bakery_dining</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Dessert</span>
</div>
</div>
</section>
<!-- Promos Carousel -->
<section>
<h2 class="font-headline-md text-headline-md text-on-surface mb-stack-md">Offres Spéciales</h2>
<div class="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
<div class="relative w-[280px] h-[160px] flex-shrink-0 rounded-xl overflow-hidden snap-start shadow-md bg-surface-variant">
<img class="absolute inset-0 w-full h-full object-cover" data-alt="A delicious overhead shot of a gourmet burger and fries meal on a rustic wooden table. Warm, inviting lighting highlighting the juicy patty and melted cheese. Premium food photography style, vibrant colors, shallow depth of field, sharp focus on the burger." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwYGoqG1CXFtxSZIWlgIXh0hPmb8e24OW2qZYIvhRA7SdSB9UYQHKEPL4gLnhtfJ32k2eLNVx6xH8010RZsRokxa7lLWUURZ_FG7ENR3cetEa6-fjpTOSx7v5_sDYbQ464GcdOBFWjJQRJ7H9aVCgTguVa6LQmhwzVaUxE5dve0Sg0zoB50IcL1GcYEH5Dc7_OMT_eQy9an_M-P7KKBVRuOt3JRh5AGot1c_pf7MayK3sIVNqWuvq42Gx_oj9HpOLy2KFmkUOG6fY"/>
<div class="absolute inset-0 bg-gradient-to-t from-on-surface/80 to-transparent"></div>
<div class="absolute bottom-4 left-4 text-surface-container-lowest">
<span class="bg-primary-container text-on-primary-container font-label-sm text-label-sm px-2 py-1 rounded-full mb-1 inline-block">-20%</span>
<h3 class="font-headline-md text-[20px] leading-tight font-bold">Burger Mania</h3>
</div>
</div>
<div class="relative w-[280px] h-[160px] flex-shrink-0 rounded-xl overflow-hidden snap-start shadow-md bg-surface-variant">
<img class="absolute inset-0 w-full h-full object-cover" data-alt="A beautifully arranged platter of fresh sushi rolls and sashimi on a sleek black slate board. Subtle backlighting accentuates the glossy texture of the fish. Elegant, modern aesthetic, high contrast, professional food styling, vibrant colors, minimalist composition." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOIos3j7mIlInVp43GvSgeIWIpnlh2KrgkUX3mmyDpbI1ZE3gjHA-TDJXnh0mlISI8Ov2QtEbmW4zgDO7mzHJp4xR35ZEfov9C32o_gRhbh1DeBY9cL7zqn6CLNRk_ptDjeGAX50lOhr0WLzNnz7ClxhPlFRUeU4b0hkkq1y1CVljiEJcJlaC-swqB-nOgKv_wKkHL1dQv55IBhJHLoOLk7YVKq7vsAD2TXT2CqyEJVwosGaPA6klgWqGLVOACtJKGue56oOfF1Ic"/>
<div class="absolute inset-0 bg-gradient-to-t from-on-surface/80 to-transparent"></div>
<div class="absolute bottom-4 left-4 text-surface-container-lowest">
<span class="bg-primary-container text-on-primary-container font-label-sm text-label-sm px-2 py-1 rounded-full mb-1 inline-block">Free Delivery</span>
<h3 class="font-headline-md text-[20px] leading-tight font-bold">Sushi Time</h3>
</div>
</div>
</div>
</section>
<!-- Main Feed -->
<section class="flex flex-col gap-6">
<h2 class="font-headline-md text-headline-md text-on-surface mb-2">Restaurants à proximité</h2>
<!-- Restaurant Card 1 -->
<article class="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-surface-variant flex flex-col hover:shadow-lg transition-shadow duration-300">
<div class="relative h-48 w-full">
<img class="absolute inset-0 w-full h-full object-cover rounded-t-3xl" data-alt="A bright, appetizing photograph of a large pepperoni pizza fresh out of the oven. Golden crispy crust, bubbling cheese, and perfectly charred pepperoni slices. Warm ambient lighting, rustic pizzeria setting, high-resolution food photography, rich colors." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9qoVAzTTsstqEeS-N3BLMTLxwo6uVbf8eghYNrKzd4y_1wFKlM5EKjWEvwwjRhTPi6pEAXmCQfTqZfZZ4jWP3nsJY9ME9C1uoduV8QKva3zLbAdwGG79ocAuSHc6bc554aIcRFxCJC7DWezUpCBQjTfxN6X-__rTczKjC1j-Yh5navsRBYeLyfqevCMuERWbFNvOfJWhXxr_O4tf5Z8WgE4jctYGN2nqcjKyH-MOpkeFlpv_KrHKwrmNX32fdcozzNln5d40ojvE"/>
<button class="absolute top-4 right-4 w-10 h-10 bg-surface/90 backdrop-blur-md rounded-full flex items-center justify-center text-on-surface hover:text-primary-container transition-colors shadow-sm">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">favorite</span>
</button>
<div class="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
<span class="material-symbols-outlined text-primary-container text-[18px]" style="font-variation-settings: 'FILL' 1;">schedule</span>
<span class="font-label-md text-label-md text-on-surface">20-30 min</span>
</div>
</div>
<div class="p-4 flex flex-col gap-2">
<div class="flex justify-between items-start">
<div>
<h3 class="font-headline-md text-[22px] leading-tight font-bold text-on-surface">Mama Mia Pizzeria</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Italian • Pizza • Pasta</p>
</div>
<div class="flex items-center gap-1 bg-surface-variant px-2 py-1 rounded-lg">
<span class="material-symbols-outlined text-primary-container text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-md text-label-md font-bold text-on-surface">4.8</span>
</div>
</div>
<div class="flex items-center gap-4 mt-2">
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]">two_wheeler</span>
<span class="font-label-sm text-label-sm">Livraison: 1,500 FCFA</span>
</div>
</div>
</div>
</article>
<!-- Restaurant Card 2 -->
<article class="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] border border-surface-variant flex flex-col hover:shadow-lg transition-shadow duration-300">
<div class="relative h-48 w-full">
<img class="absolute inset-0 w-full h-full object-cover rounded-t-3xl" data-alt="A close-up shot of an authentic local African dish featuring grilled chicken, plantains, and savory sauce on a traditional plate. Natural daylight illuminating the rich textures and colors of the food. Cultural setting, appetizing styling, high-quality resolution." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDem5oTjT7iqeq46n1jMN7Rv5nDJyJd3GlcyGN9hCtGQnubXOD8xMLe88oxULGDznPVjuH9TNEO-bOOoCKY2dzqZ519J7ivH97fFMkbt8MkTF9Cy2s6FYhi4RP_L6qZCmy_UVh9RdPQEFNXEs7nhnyWtTTv2k18pcflcTyF8-I1zatiXTcy5obb0zg4Rwg2Euj_paj0V0vuKZii3BHzm1LvcCZXXnjHoRUC29AptGf72dLJCdWtx4F4dgHLEebhao9A29LlZVj0bGc"/>
<button class="absolute top-4 right-4 w-10 h-10 bg-surface/90 backdrop-blur-md rounded-full flex items-center justify-center text-on-surface hover:text-primary-container transition-colors shadow-sm">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">favorite</span>
</button>
<div class="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
<span class="material-symbols-outlined text-primary-container text-[18px]" style="font-variation-settings: 'FILL' 1;">schedule</span>
<span class="font-label-md text-label-md text-on-surface">30-45 min</span>
</div>
</div>
<div class="p-4 flex flex-col gap-2">
<div class="flex justify-between items-start">
<div>
<h3 class="font-headline-md text-[22px] leading-tight font-bold text-on-surface">Saveurs Locales</h3>
<p class="font-body-md text-body-md text-on-surface-variant">African • Grilled • Traditional</p>
</div>
<div class="flex items-center gap-1 bg-surface-variant px-2 py-1 rounded-lg">
<span class="material-symbols-outlined text-primary-container text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-md text-label-md font-bold text-on-surface">4.5</span>
</div>
</div>
<div class="flex items-center gap-4 mt-2">
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]">two_wheeler</span>
<span class="font-label-sm text-label-sm">Livraison: 1,000 FCFA</span>
</div>
</div>
</div>
</article>
</section>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 left-0 w-full flex justify-around items-center py-2 px-margin-mobile bg-surface dark:bg-inverse-surface border-t border-outline-variant/30 md:hidden z-50 rounded-t-lg shadow-lg">
<a class="flex flex-col items-center justify-center bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-xl px-4 py-1.5 active:scale-90 duration-150 group" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">explore</span>
<span class="font-label-sm text-label-sm-mobile md:text-label-sm mt-1">Explore</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-4 py-1.5 hover:text-primary dark:hover:text-primary-fixed transition-all active:scale-90 duration-150 group" href="#">
<span class="material-symbols-outlined group-hover:fill-current" style="font-variation-settings: 'FILL' 0;">shopping_bag</span>
<span class="font-label-sm text-label-sm-mobile md:text-label-sm mt-1">Market</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-4 py-1.5 hover:text-primary dark:hover:text-primary-fixed transition-all active:scale-90 duration-150 group" href="#">
<span class="material-symbols-outlined group-hover:fill-current" style="font-variation-settings: 'FILL' 0;">bookmark</span>
<span class="font-label-sm text-label-sm-mobile md:text-label-sm mt-1">Saved</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-4 py-1.5 hover:text-primary dark:hover:text-primary-fixed transition-all active:scale-90 duration-150 group" href="#">
<span class="material-symbols-outlined group-hover:fill-current" style="font-variation-settings: 'FILL' 0;">person</span>
<span class="font-label-sm text-label-sm-mobile md:text-label-sm mt-1">Profile</span>
</a>
</nav>
</body></html>