<!DOCTYPE html>

<html lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>LaPlasse Restauration - Accueil</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
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
                      "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "600"}],
                      "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                      "display-lg-mobile": ["36px", {"lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                      "headline-lg": ["32px", {"lineHeight": "40px", "fontWeight": "600"}],
                      "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500"}],
                      "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                      "display-lg": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                      "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}]
              }
            }
          }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined[data-weight="fill"] {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        
        /* Hide scrollbar for horizontal scrolling but keep functionality */
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
<body class="bg-background text-on-background antialiased min-h-screen pb-24 md:pb-0">
<!-- TopAppBar (from JSON blueprint) -->
<header class="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-xl shadow-sm">
<div class="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-stack-md max-w-container-max mx-auto">
<button class="p-2 rounded-full hover:bg-surface-variant/50 dark:hover:bg-inverse-surface/50 transition-colors active:scale-95 duration-200">
<span class="material-symbols-outlined text-primary dark:text-primary-fixed" data-icon="search">search</span>
</button>
<h1 class="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed tracking-tight">LaPlasse</h1>
<button class="p-2 rounded-full hover:bg-surface-variant/50 dark:hover:bg-inverse-surface/50 transition-colors active:scale-95 duration-200">
<span class="material-symbols-outlined text-primary dark:text-primary-fixed" data-icon="user_profile_picture">account_circle</span>
</button>
</div>
</header>
<!-- Main Content Area -->
<main class="pt-[72px] md:pt-[88px] max-w-container-max mx-auto w-full md:hidden">
<!-- Filter Chips Section -->
<section class="px-margin-mobile py-stack-sm overflow-x-auto hide-scrollbar flex gap-2 sticky top-[72px] bg-background/95 backdrop-blur-sm z-40 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.02)]">
<button class="whitespace-nowrap px-4 py-2 bg-surface-container-high rounded-full font-label-md text-label-md text-on-surface hover:bg-surface-variant transition-colors active:scale-95 border border-outline-variant/30 flex items-center gap-1">
<span class="material-symbols-outlined text-[18px]" data-icon="schedule">schedule</span>
                Moins de 30 min
            </button>
<button class="whitespace-nowrap px-4 py-2 bg-surface-container-high rounded-full font-label-md text-label-md text-on-surface hover:bg-surface-variant transition-colors active:scale-95 border border-outline-variant/30 flex items-center gap-1">
<span class="material-symbols-outlined text-[18px]" data-icon="star">star</span>
                Mieux notés
            </button>
<button class="whitespace-nowrap px-4 py-2 bg-surface-container-high rounded-full font-label-md text-label-md text-on-surface hover:bg-surface-variant transition-colors active:scale-95 border border-outline-variant/30 flex items-center gap-1">
<span class="material-symbols-outlined text-[18px]" data-icon="local_shipping">local_shipping</span>
                Livraison gratuite
            </button>
<button class="whitespace-nowrap px-4 py-2 bg-surface-container-high rounded-full font-label-md text-label-md text-on-surface hover:bg-surface-variant transition-colors active:scale-95 border border-outline-variant/30 flex items-center gap-1">
<span class="material-symbols-outlined text-[18px]" data-icon="tune">tune</span>
                Plus
            </button>
</section>
<!-- Vertical List of Compact Cards -->
<section class="px-margin-mobile py-stack-md flex flex-col gap-stack-md">
<!-- Compact Restaurant Card 1 -->
<article class="bg-surface-container-lowest rounded-xl p-3 flex gap-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] border border-outline-variant/20 active:scale-[0.98] transition-transform relative overflow-hidden">
<div class="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative">
<img class="w-full h-full object-cover" data-alt="A high-quality, perfectly lit photograph of a delicious Neapolitan pizza with fresh basil and mozzarella. The image is bright, warm, and appetizing, emphasizing the premium quality of the food. The aesthetic matches a high-end food delivery app, focusing on fresh ingredients and rich colors." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRfTQdlJzhYLTnOm-bHxmHJf4FKrK6qUM8gEdJdMhDB-Ugu2CdhZ1fuKwjFwgpZl_wShOtE0_en6QXi0XRIWnO3CSv4rVgeHwL2hToMA_4BXpV6r9GVYg_VI19CYRUisH8WYWIfQg6vF087Ks_ygzbPwN0HC3W6TETdSK1abiQShO7ohC3MO8bbgglT-wZFjrutx9ks4N7XZsD4LQ-lFLkTBCIY4DqbSZ6ZgYrGleTmyvCZzyOrvtA7pqJT6xr5Xk0jllSm3Ow7a0"/>
<div class="absolute top-1 left-1 bg-error text-on-error font-label-sm text-label-sm px-1.5 py-0.5 rounded-md">
                        -10%
                    </div>
</div>
<div class="flex flex-col justify-center flex-grow">
<h2 class="font-headline-md text-[18px] leading-[24px] font-bold text-on-surface line-clamp-1">Luigi's Pizza Artigianale</h2>
<p class="font-body-md text-body-md text-on-surface-variant text-sm mt-0.5 line-clamp-1">Italien • Pizza • Pâtes</p>
<div class="flex items-center gap-3 mt-2">
<div class="flex items-center gap-1 text-primary">
<span class="material-symbols-outlined text-[16px]" data-icon="schedule" data-weight="fill">schedule</span>
<span class="font-label-sm text-label-sm">15-25 min</span>
</div>
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[16px]" data-icon="payments">payments</span>
<span class="font-label-sm text-label-sm">$$</span>
</div>
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[16px] text-primary" data-icon="star" data-weight="fill">star</span>
<span class="font-label-sm text-label-sm">4.8</span>
</div>
</div>
</div>
</article>
<!-- Compact Restaurant Card 2 -->
<article class="bg-surface-container-lowest rounded-xl p-3 flex gap-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] border border-outline-variant/20 active:scale-[0.98] transition-transform relative overflow-hidden">
<div class="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative">
<img class="w-full h-full object-cover" data-alt="A vibrant and fresh sushi platter featuring salmon nigiri and tuna maki. The lighting is crisp and clean, highlighting the glistening texture of the raw fish. The composition is modern and elegant, suitable for a premium culinary marketplace directory. The mood is appetizing and refined." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYwtKhAyDgyyYfcfvGnNSnl2_0qPED8EDFlusCgeVIyfZ9XftGWkuN1RVXe2CPff5rGCv20svAh3v2rnTjn0RF-A_G57ncvOdJopH5b-xCnvvmDTQABWTaZ7KImzs9DfQA2Dg2L6tA5wO2xXsbgwokfJiQGPKeAqTnCPgEV5DXAB424gLB9DkariIJQXXZ_xDXG5sHyIMGUv9lS2nkPVa6hgty7ecumpma89TsSIK1dWgaXhlsTfmrqin2qj0_TxHml5yE4dd06g8"/>
</div>
<div class="flex flex-col justify-center flex-grow">
<h2 class="font-headline-md text-[18px] leading-[24px] font-bold text-on-surface line-clamp-1">Sakura Sushi Bar</h2>
<p class="font-body-md text-body-md text-on-surface-variant text-sm mt-0.5 line-clamp-1">Japonais • Sushi • Sain</p>
<div class="flex items-center gap-3 mt-2">
<div class="flex items-center gap-1 text-on-surface">
<span class="material-symbols-outlined text-[16px]" data-icon="schedule">schedule</span>
<span class="font-label-sm text-label-sm">20-30 min</span>
</div>
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[16px]" data-icon="payments">payments</span>
<span class="font-label-sm text-label-sm">$$$</span>
</div>
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[16px] text-primary" data-icon="star" data-weight="fill">star</span>
<span class="font-label-sm text-label-sm">4.9</span>
</div>
</div>
</div>
</article>
<!-- Compact Restaurant Card 3 -->
<article class="bg-surface-container-lowest rounded-xl p-3 flex gap-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] border border-outline-variant/20 active:scale-[0.98] transition-transform relative overflow-hidden opacity-90">
<div class="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative">
<img class="w-full h-full object-cover" data-alt="A juicy, gourmet double cheeseburger with crispy fries on a wooden board. The scene is brightly lit with a warm, inviting glow, emphasizing the melted cheese and fresh brioche bun. The aesthetic is modern comfort food, fitting for a curated local eatery app. High resolution and vivid colors." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhvcHq5WrhkDwSiLuYlfAEVfjfJ1cNHuYgKMjkEYhWLido79A1qf-LGuMZYVLYoiDcM9BIENLqrRudUjrWwdi7DD5X8NqGJSCuhgeOQWQKxXoXfJQqf_OKkjhV_yDQKYHhe8TlF2HCRqek164qMUu1DHPi53ry94rIqO0KgGA7Y_0BjELNfkDEx_6pangIrJP6OXLu_E00zMa9YipFoQr4YrGNeN7Rym5UBvD37zMg32kWSqjU1kYrmtHbfWalg_uN8zovz6geMx8"/>
<div class="absolute top-1 left-1 bg-primary text-on-primary font-label-sm text-label-sm px-1.5 py-0.5 rounded-md">
                        Livraison 0€
                    </div>
</div>
<div class="flex flex-col justify-center flex-grow">
<h2 class="font-headline-md text-[18px] leading-[24px] font-bold text-on-surface line-clamp-1">Burger District</h2>
<p class="font-body-md text-body-md text-on-surface-variant text-sm mt-0.5 line-clamp-1">Américain • Burgers • Street Food</p>
<div class="flex items-center gap-3 mt-2">
<div class="flex items-center gap-1 text-on-surface">
<span class="material-symbols-outlined text-[16px]" data-icon="schedule">schedule</span>
<span class="font-label-sm text-label-sm">10-20 min</span>
</div>
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[16px]" data-icon="payments">payments</span>
<span class="font-label-sm text-label-sm">$</span>
</div>
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[16px] text-primary" data-icon="star" data-weight="fill">star</span>
<span class="font-label-sm text-label-sm">4.6</span>
</div>
</div>
</div>
</article>
<!-- Compact Restaurant Card 4 -->
<article class="bg-surface-container-lowest rounded-xl p-3 flex gap-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] border border-outline-variant/20 active:scale-[0.98] transition-transform relative overflow-hidden">
<div class="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative">
<img class="w-full h-full object-cover" data-alt="A beautifully plated green salad with quinoa, avocado, and pomegranate seeds. Bright, natural daylight highlights the fresh, vibrant greens and textures. The composition is clean, minimalistic, and health-focused, matching a premium wellness and dining application. Subtle shadows add depth to the modern presentation." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlyA0TwDYaU_k-rC-ZTEXyeCgfp7x5hCXQ6R9rYdb-_H8KX8C66vUAFg0KZUItmIOLbOThco-N5WOUfm0QWxgySi5rKzdl9yzMGJqGyYmvAEUdyc8MCSHyU3_KW73nS-mHnRITS6x86Z5I_GWg_tQSCq4Dp03Bf8R1CCB1_fZRYHp1Adp5iyAbDlDQG_vpPMmOI8O3emnBFPfIApPBU0NL7OMcb3KmqLj-oEFMkzGyk9luTyJgcvGiPkWznkQaQgzZIHyOvJ_5V7w"/>
</div>
<div class="flex flex-col justify-center flex-grow">
<h2 class="font-headline-md text-[18px] leading-[24px] font-bold text-on-surface line-clamp-1">Green Bowl &amp; Co</h2>
<p class="font-body-md text-body-md text-on-surface-variant text-sm mt-0.5 line-clamp-1">Healthy • Végétarien • Salades</p>
<div class="flex items-center gap-3 mt-2">
<div class="flex items-center gap-1 text-on-surface">
<span class="material-symbols-outlined text-[16px]" data-icon="schedule">schedule</span>
<span class="font-label-sm text-label-sm">25-35 min</span>
</div>
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[16px]" data-icon="payments">payments</span>
<span class="font-label-sm text-label-sm">$$</span>
</div>
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[16px] text-primary" data-icon="star" data-weight="fill">star</span>
<span class="font-label-sm text-label-sm">4.7</span>
</div>
</div>
</div>
</article>
<!-- Compact Restaurant Card 5 -->
<article class="bg-surface-container-lowest rounded-xl p-3 flex gap-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] border border-outline-variant/20 active:scale-[0.98] transition-transform relative overflow-hidden">
<div class="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative">
<img class="w-full h-full object-cover" data-alt="A steaming bowl of authentic Vietnamese Pho with fresh herbs, lime, and thin slices of beef. Captured from a slightly elevated angle with soft, inviting lighting that highlights the rich broth. The scene conveys warmth and culinary authenticity, designed for a high-end food discovery platform." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRS2HOlxS10fYWTzewJlXe45guRTgWxTZzH2IhF5qgW8QhVkZr2nLAZHeFQNAdLh3dmBf0qxX445CxOhZuQSBY0V_uoHVjiTiCdzyAoyayDrSuHK0ZF-vXq3E5a8I-_BhdYUsWPwxO0qkOMEshHETMCaE-Ey1wxPIOxsVuORoHn2qrJpF3xsC0aM-1m7fyrkWxMm16IltZ4mupowtxkTgi8ezRvPF2fSYTqhVGNUWNIeANBqxj_NyaDUe_FlQp9DBfUGId0XKS8IA"/>
</div>
<div class="flex flex-col justify-center flex-grow">
<h2 class="font-headline-md text-[18px] leading-[24px] font-bold text-on-surface line-clamp-1">Pho Authentique</h2>
<p class="font-body-md text-body-md text-on-surface-variant text-sm mt-0.5 line-clamp-1">Vietnamien • Soupes • Asiatique</p>
<div class="flex items-center gap-3 mt-2">
<div class="flex items-center gap-1 text-on-surface">
<span class="material-symbols-outlined text-[16px]" data-icon="schedule">schedule</span>
<span class="font-label-sm text-label-sm">30-40 min</span>
</div>
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[16px]" data-icon="payments">payments</span>
<span class="font-label-sm text-label-sm">$$</span>
</div>
<div class="flex items-center gap-1 text-on-surface-variant">
<span class="material-symbols-outlined text-[16px] text-primary" data-icon="star" data-weight="fill">star</span>
<span class="font-label-sm text-label-sm">4.8</span>
</div>
</div>
</div>
</article>
</section>
</main>
<!-- Desktop Notice (Since prompt asked for Mobile Home Screen, we hide main content on desktop and show a notice, or just let it scale. I will let it scale but center it as per typical mobile-first layout viewed on desktop) -->
<div class="hidden md:flex min-h-screen items-center justify-center p-8 text-center text-on-surface-variant font-body-lg text-body-lg">
        Please view on a mobile device for the intended experience.
    </div>
<!-- BottomNavBar (from JSON blueprint, Active on 'Explore') -->
<nav class="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2 px-margin-mobile bg-surface dark:bg-inverse-surface border-t-0 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.1)] rounded-t-lg z-50">
<!-- Active Tab: Explore -->
<a class="flex flex-col items-center justify-center bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-xl px-4 py-1.5 active:scale-90 duration-150 transition-all" href="#">
<span class="material-symbols-outlined" data-icon="explore" data-weight="fill">explore</span>
<span class="font-label-sm text-label-sm-mobile md:text-label-sm mt-1">Explore</span>
</a>
<!-- Inactive Tab: Market -->
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-4 py-1.5 hover:text-primary dark:hover:text-primary-fixed transition-all active:scale-90 duration-150" href="#">
<span class="material-symbols-outlined" data-icon="shopping_bag">shopping_bag</span>
<span class="font-label-sm text-label-sm-mobile md:text-label-sm mt-1">Market</span>
</a>
<!-- Inactive Tab: Saved -->
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-4 py-1.5 hover:text-primary dark:hover:text-primary-fixed transition-all active:scale-90 duration-150" href="#">
<span class="material-symbols-outlined" data-icon="bookmark">bookmark</span>
<span class="font-label-sm text-label-sm-mobile md:text-label-sm mt-1">Saved</span>
</a>
<!-- Inactive Tab: Profile -->
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-4 py-1.5 hover:text-primary dark:hover:text-primary-fixed transition-all active:scale-90 duration-150" href="#">
<span class="material-symbols-outlined" data-icon="person">person</span>
<span class="font-label-sm text-label-sm-mobile md:text-label-sm mt-1">Profile</span>
</a>
</nav>
</body></html>