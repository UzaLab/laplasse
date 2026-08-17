<!DOCTYPE html><html class="light" lang="fr"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" name="viewport">
<title>LaPlasse - Courier Dashboard</title>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<!-- Google Fonts: Manrope & Hanken Grotesk -->
<link href="https://fonts.googleapis.com" rel="preconnect">
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect">
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600&amp;family=Manrope:wght@600;700;800&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Tailwind Configuration -->
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "background": "#f9f9f9",
                        "on-surface-variant": "#45464d",
                        "surface-bright": "#f9f9f9",
                        "primary-container": "#131b2e",
                        "on-primary-fixed": "#131b2e",
                        "on-primary-fixed-variant": "#3f465c",
                        "surface-dim": "#dadada",
                        "surface-container-high": "#e8e8e8",
                        "secondary-fixed": "#ffddb8",
                        "on-surface": "#1a1c1c",
                        "tertiary-container": "#002113",
                        "error-container": "#ffdad6",
                        "on-error-container": "#93000a",
                        "outline-variant": "#c6c6cd",
                        "tertiary-fixed": "#6ffbbe",
                        "tertiary": "#000000",
                        "inverse-surface": "#2f3131",
                        "error": "#ba1a1a",
                        "on-secondary-fixed": "#2a1700",
                        "on-tertiary-fixed": "#002113",
                        "gold-light": "#fef3c7",
                        "on-tertiary-fixed-variant": "#005236",
                        "surface-variant": "#e2e2e2",
                        "on-primary": "#ffffff",
                        "on-error": "#ffffff",
                        "surface-tint": "#565e74",
                        "border-subtle": "#e2e8f0",
                        "surface-container-low": "#f3f3f4",
                        "on-secondary-container": "#684000",
                        "secondary": "#855300",
                        "secondary-fixed-dim": "#ffb95f",
                        "on-tertiary-container": "#009668",
                        "primary": "#000000",
                        "inverse-primary": "#bec6e0",
                        "on-primary-container": "#7c839b",
                        "primary-fixed": "#dae2fd",
                        "on-background": "#1a1c1c",
                        "text-secondary": "#64748b",
                        "on-secondary-fixed-variant": "#653e00",
                        "surface": "#f9f9f9",
                        "secondary-container": "#fea619",
                        "on-tertiary": "#ffffff",
                        "primary-fixed-dim": "#bec6e0",
                        "inverse-on-surface": "#f0f1f1",
                        "on-secondary": "#ffffff",
                        "surface-container-lowest": "#ffffff",
                        "outline": "#76777d",
                        "tertiary-fixed-dim": "#4edea3",
                        "surface-muted": "#f8fafc",
                        "text-primary": "#0f172a",
                        "surface-container-highest": "#e2e2e2",
                        "surface-container": "#eeeeee"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "touch-target": "3rem",
                        "container-margin": "1.25rem",
                        "section-gap": "2.5rem",
                        "element-gap": "1rem",
                        "grid-gutter": "1rem"
                    },
                    "fontFamily": {
                        "body-md": ["Hanken Grotesk"],
                        "headline-lg": ["Manrope"],
                        "headline-md": ["Manrope"],
                        "body-lg": ["Hanken Grotesk"],
                        "price-display": ["Manrope"],
                        "label-sm": ["Hanken Grotesk"],
                        "display-hero": ["Manrope"]
                    },
                    "fontSize": {
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-lg": ["22px", { "lineHeight": "28px", "fontWeight": "700" }],
                        "headline-md": ["18px", { "lineHeight": "24px", "fontWeight": "600" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "price-display": ["18px", { "lineHeight": "24px", "fontWeight": "800" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "display-hero": ["28px", { "lineHeight": "36px", "letterSpacing": "-0.02em", "fontWeight": "800" }]
                    }
                }
            }
        }
    </script>
<style>
        /* Custom Utilities */
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Subtle glass effect for cards */
        .glass-card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(226, 232, 240, 0.8);
        }
        
        /* Ambient shadow for prominent elements */
        .ambient-shadow {
            box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.05);
        }
    </style>
</head>
<body class="bg-background text-text-primary antialiased flex flex-col min-h-screen">
<!-- Top App Bar (Shared Component) -->
<header class="w-full top-0 bg-surface dark:bg-inverse-surface flex items-center justify-between px-container-margin py-4 sticky z-40 transition-opacity duration-200">
<div class="flex items-center gap-4">
<button aria-label="Menu" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-variant transition-colors">
<span class="material-symbols-outlined text-primary dark:text-inverse-primary" style="font-variation-settings: 'FILL' 0;">menu</span>
</button>
<h1 class="font-display-hero text-[24px] text-primary dark:text-inverse-primary tracking-tighter">LaPlasse</h1>
</div>
<div class="flex items-center gap-3">
<button aria-label="Notifications" class="w-10 h-10 rounded-full flex items-center justify-center relative hover:bg-surface-variant transition-colors">
<span class="material-symbols-outlined text-primary dark:text-inverse-primary" style="font-variation-settings: 'FILL' 0;">notifications</span>
<span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
</button>
<div class="w-10 h-10 rounded-full overflow-hidden border border-border-subtle cursor-pointer hover:opacity-80 transition-opacity">
<img alt="Profile" class="w-full h-full object-cover" data-alt="A close-up portrait of a professional driver or courier, warm natural lighting, modern corporate style, high quality photography, soft focus background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPYswk-vLCa1lF6FJvSzUQXXJtg6FFO_JUApEIzCjhTVBANTke1R1UM6FUFuQifEo4Pxfc-jGk3vn0LlR8iVqPkN062rLlrcZd983NQuLqNPvfc7djUMjpK8GdEi-TO4j8aK7ximitAllcFYdVFZ67tZ0DZw_gP3-H27e60OsKjQbNTiVPEJL7Qilui6cn-kOpLVfXowmg8YAvFryMYSbYXGwTjcWxWfXr6swvyAHKTx51ujP7oVIq">
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="flex-1 px-container-margin pb-32 pt-2 flex flex-col gap-section-gap">
<!-- Header Section -->
<section class="flex flex-col gap-2">
<p class="font-body-md text-text-secondary">Espace Coursier</p>
<h2 class="font-headline-lg text-text-primary">Bonjour, Flotte 👋</h2>
<p class="font-body-lg text-on-surface-variant mt-1">Prêt pour votre prochaine mission ?</p>
</section>
<!-- Availability Toggle Section -->
<section class="glass-card rounded-xl p-6 ambient-shadow flex flex-col gap-2">
<div class="flex items-start gap-4">
<div class="w-12 h-12 rounded-full bg-tertiary-fixed/20 flex items-center justify-center shrink-0">
<span class="material-symbols-outlined text-on-tertiary-container" style="font-variation-settings: 'FILL' 1;">gps_fixed</span>
</div>
<div><div class="inline-flex px-3 py-1 rounded-full bg-tertiary-fixed/20 text-on-tertiary-container font-label-sm mb-2">Actif</div>
<h3 class="font-headline-md text-text-primary">Disponibilité</h3>
<p class="font-body-md text-text-secondary mt-1">Synchronisation GPS active. Vous êtes visible pour recevoir des courses dans votre zone.</p>
</div>
</div>
<div class="w-full flex flex-col gap-4 mt-4"><div class="w-full bg-on-tertiary-container text-on-primary py-4 rounded-full flex items-center justify-center gap-2 font-headline-md"><span class="material-symbols-outlined">visibility</span> En ligne</div><div class="flex items-center gap-2 text-text-secondary font-body-md"><span class="material-symbols-outlined text-[18px]">location_on</span> Position GPS synchronisée (5.3725, -3.9560)</div></div>
</section>
<!-- Stats Bento Grid -->
<section class="grid grid-cols-2 md:grid-cols-4 gap-grid-gutter">
<!-- Stat Card 1 -->
<div class="glass-card rounded-lg p-4 flex flex-col gap-2 ambient-shadow">
<div class="flex items-center gap-2 text-text-secondary">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 0;">verified_user</span>
<span class="font-label-sm">Statut</span>
</div>
<div class="font-headline-md text-text-primary flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span> Actif
                </div>
</div>
<!-- Stat Card 2 -->
<div class="glass-card rounded-lg p-4 flex flex-col gap-2 ambient-shadow">
<div class="flex items-center gap-2 text-text-secondary">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 0;">location_on</span>
<span class="font-label-sm">Ville</span>
</div>
<div class="font-headline-md text-text-primary">Abidjan</div>
</div>
<!-- Stat Card 3 -->
<div class="glass-card rounded-lg p-4 flex flex-col gap-2 ambient-shadow">
<div class="flex items-center gap-2 text-text-secondary">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 0;">two_wheeler</span>
<span class="font-label-sm">Véhicule</span>
</div>
<div class="font-headline-md text-text-primary">Moto</div>
</div>
<!-- Stat Card 4 -->
<div class="glass-card rounded-lg p-4 flex flex-col gap-2 ambient-shadow">
<div class="flex items-center gap-2 text-text-secondary">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 0;">star</span>
<span class="font-label-sm">Note globale</span>
</div>
<div class="font-headline-md text-secondary-container flex items-baseline gap-1">
                    5.0 <span class="font-body-md text-text-secondary">/ 5</span>
</div>
</div>
</section>
<!-- CTA Section -->
<section class="relative rounded-xl overflow-hidden bg-primary-container text-on-primary p-6 md:p-8 flex flex-col items-start gap-6 shadow-xl">
<!-- Decorative Background Element -->
<div class="absolute top-0 right-0 w-64 h-64 bg-primary-fixed opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
<div class="relative z-10 max-w-md">
<h3 class="font-headline-lg text-on-primary">Missions disponibles</h3>
<p class="font-body-lg text-inverse-primary mt-2">Découvrez les nouvelles courses autour de vous et maximisez vos revenus aujourd'hui.</p>
</div>
<button class="relative z-10 w-full sm:w-auto px-8 py-3 bg-on-tertiary-container text-on-primary rounded-full font-headline-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 active:scale-95">Voir les missions</button>
</section>
</main>
<!-- Bottom Nav Bar (Shared Component - Suppressed on MD/WEB, visible on mobile) -->
<nav class="md:hidden fixed bottom-0 w-full flex justify-around items-center bg-surface dark:bg-inverse-surface px-6 py-3 pb-safe z-50 rounded-t-xl shadow-[0_-4px_10px_rgba(19,27,46,0.05)] border-t border-outline-variant dark:border-outline">
<!-- Active Tab (Intent: Dashboard/Home) -> Translates to Établissements per JSON limitations, but semantically we must stick to JSON strings -->
<a aria-current="page" class="flex flex-col items-center justify-center bg-primary-container dark:bg-primary text-on-primary-fixed rounded-xl px-4 py-1 active:scale-95 transition-transform" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">apartment</span>
<span class="font-label-sm text-label-sm mt-1">Établissements</span>
</a>
<!-- Inactive Tab -->
<a class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant px-4 py-1 hover:text-primary dark:hover:text-inverse-primary transition-colors active:scale-95 transition-transform" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">support_agent</span>
<span class="font-label-sm text-label-sm mt-1">Assistance</span>
</a>
</nav>


</body></html>