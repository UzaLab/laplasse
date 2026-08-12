<!DOCTYPE html>

<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" name="viewport"/>
<title>LaPlasse - Connexion</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600&amp;family=Manrope:wght@600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "primary-fixed-dim": "#bec6e0",
                        "on-primary-fixed": "#131b2e",
                        "surface-container-highest": "#e2e2e2",
                        "secondary-fixed-dim": "#ffb95f",
                        "on-primary-fixed-variant": "#3f465c",
                        "inverse-surface": "#2f3131",
                        "error": "#ba1a1a",
                        "on-secondary-fixed-variant": "#653e00",
                        "outline": "#76777d",
                        "secondary-container": "#fea619",
                        "background": "#f9f9f9",
                        "on-surface-variant": "#45464d",
                        "on-surface": "#1a1c1c",
                        "on-error": "#ffffff",
                        "primary-fixed": "#dae2fd",
                        "surface-container-high": "#e8e8e8",
                        "on-secondary-fixed": "#2a1700",
                        "surface-bright": "#f9f9f9",
                        "tertiary-fixed-dim": "#4edea3",
                        "surface-tint": "#565e74",
                        "text-primary": "#0f172a",
                        "on-secondary": "#ffffff",
                        "surface-muted": "#f8fafc",
                        "on-primary": "#ffffff",
                        "on-error-container": "#93000a",
                        "gold-light": "#fef3c7",
                        "surface": "#f9f9f9",
                        "on-tertiary": "#ffffff",
                        "text-secondary": "#64748b",
                        "on-primary-container": "#7c839b",
                        "on-secondary-container": "#684000",
                        "border-subtle": "#e2e8f0",
                        "inverse-on-surface": "#f0f1f1",
                        "on-tertiary-fixed": "#002113",
                        "primary": "#000000",
                        "inverse-primary": "#bec6e0",
                        "on-background": "#1a1c1c",
                        "tertiary": "#000000",
                        "surface-container": "#eeeeee",
                        "surface-variant": "#e2e2e2",
                        "primary-container": "#131b2e",
                        "on-tertiary-container": "#009668",
                        "surface-container-lowest": "#ffffff",
                        "error-container": "#ffdad6",
                        "on-tertiary-fixed-variant": "#005236",
                        "surface-dim": "#dadada",
                        "secondary-fixed": "#ffddb8",
                        "tertiary-container": "#002113",
                        "surface-container-low": "#f3f3f4",
                        "secondary": "#855300",
                        "tertiary-fixed": "#6ffbbe",
                        "outline-variant": "#c6c6cd"
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
                        "grid-gutter": "1rem",
                        "element-gap": "1rem"
                    },
                    "fontFamily": {
                        "label-sm": ["Hanken Grotesk"],
                        "body-md": ["Hanken Grotesk"],
                        "price-display": ["Manrope"],
                        "headline-md": ["Manrope"],
                        "display-hero": ["Manrope"],
                        "body-lg": ["Hanken Grotesk"],
                        "headline-lg": ["Manrope"]
                    },
                    "fontSize": {
                        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "price-display": ["18px", { "lineHeight": "24px", "fontWeight": "800" }],
                        "headline-md": ["18px", { "lineHeight": "24px", "fontWeight": "600" }],
                        "display-hero": ["28px", { "lineHeight": "36px", "letterSpacing": "-0.02em", "fontWeight": "800" }],
                        "display-hero-mobile": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.02em", "fontWeight": "800" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "headline-lg": ["22px", { "lineHeight": "28px", "fontWeight": "700" }],
                        "headline-lg-mobile": ["20px", { "lineHeight": "28px", "fontWeight": "700" }]
                    }
                },
            },
        }
    </script>
</head>
<body class="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-body-md selection:bg-primary selection:text-on-primary">
<!-- TopAppBar from JSON -->
<header class="w-full top-0 bg-surface dark:bg-inverse-surface z-40 transition-opacity duration-200">
<div class="flex items-center justify-between px-container-margin py-4">
<button aria-label="Close" class="w-touch-target h-touch-target flex items-center justify-center rounded-full hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary text-primary dark:text-inverse-primary">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">close</span>
</button>
<h1 class="font-display-hero-mobile text-display-hero-mobile text-primary dark:text-inverse-primary tracking-tighter md:font-display-hero md:text-display-hero">LaPlasse</h1>
<div class="w-touch-target h-touch-target"></div> <!-- Spacer for centering -->
</div>
</header>
<main class="flex-1 px-container-margin py-section-gap flex flex-col justify-center max-w-md mx-auto w-full md:hidden">
<div class="text-center mb-8">
<h2 class="font-headline-lg-mobile text-headline-lg-mobile text-text-primary mb-2">Connexion</h2>
<p class="font-body-md text-body-md text-text-secondary">Les meilleures adresses près de chez vous</p>
</div>
<!-- Auth Toggle -->
<div class="flex p-1 bg-surface-container-low rounded-lg mb-8 border border-border-subtle">
<button class="flex-1 py-2 text-center rounded-md bg-surface text-text-primary font-label-sm text-label-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all">Connexion</button>
<button class="flex-1 py-2 text-center rounded-md text-text-secondary hover:text-text-primary font-label-sm text-label-sm transition-all">Inscription</button>
</div>
<form class="space-y-6 flex-1 flex flex-col">
<div class="space-y-4">
<div class="relative">
<label class="block font-label-sm text-label-sm text-text-primary mb-1" for="email">Email</label>
<input class="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 font-body-md text-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline-variant" id="email" name="email" placeholder="votre@email.com" required="" type="email"/>
</div>
<div class="relative">
<div class="flex justify-between items-center mb-1">
<label class="block font-label-sm text-label-sm text-text-primary" for="password">Mot de passe</label>
<a class="font-label-sm text-label-sm text-secondary-container hover:text-secondary transition-colors" href="/forgot-password">Mot de passe oublié ?</a>
</div>
<div class="relative">
<input class="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 pr-12 font-body-md text-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline-variant" id="password" name="password" placeholder="••••••••" required="" type="password"/>
<button class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none w-touch-target h-touch-target flex items-center justify-center" type="button">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 0;">visibility_off</span>
</button>
</div>
</div>
</div>
<div class="mt-8 pt-4">
<button class="w-full bg-primary-container text-on-primary-fixed py-4 rounded-xl font-label-sm text-label-sm uppercase tracking-wider hover:bg-primary-container/90 transition-colors shadow-[0_4px_14px_rgba(19,27,46,0.15)] flex items-center justify-center gap-2" type="submit">
                    Se connecter
                    <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 0;">arrow_forward</span>
</button>
</div>
<div class="text-center mt-6">
<p class="font-body-md text-body-md text-text-secondary">
                    Pas encore de compte ? 
                    <a class="text-text-primary font-headline-md text-headline-md hover:underline decoration-1 underline-offset-4" href="/register">S'inscrire</a>
</p>
</div>
<div class="relative flex items-center justify-center my-6">
<div class="absolute inset-x-0 h-px bg-border-subtle"></div>
<span class="relative bg-surface px-4 font-label-sm text-label-sm text-outline-variant uppercase">ou</span>
</div>
<div class="text-center mb-8">
<a class="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border-subtle bg-surface-muted text-text-primary font-label-sm text-label-sm hover:bg-surface-container-low transition-colors" href="/merchant/signup">
<span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 0;">storefront</span>
                    Inscrire mon établissement
                    <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 0;">arrow_right_alt</span>
</a>
</div>
<div class="mt-auto text-center px-4">
<p class="font-label-sm text-label-sm text-outline font-normal leading-relaxed">
                    En vous connectant, vous acceptez nos <a class="underline decoration-1 underline-offset-2 hover:text-text-primary transition-colors" href="/terms">CGU</a> et notre <a class="underline decoration-1 underline-offset-2 hover:text-text-primary transition-colors" href="/privacy">politique de confidentialité</a>
</p>
</div>
</form>
</main>
<!-- Desktop View Note (Suppressed on Mobile) -->
<div class="hidden md:flex flex-1 items-center justify-center w-full min-h-[calc(100vh-80px)] bg-surface-muted px-container-margin py-section-gap">
<div class="bg-surface rounded-xl border border-border-subtle p-8 max-w-md w-full shadow-[0_4px_24px_rgba(19,27,46,0.05)] text-center">
<span class="material-symbols-outlined text-4xl text-outline mb-4" style="font-variation-settings: 'FILL' 0;">smartphone</span>
<h2 class="font-headline-lg text-headline-lg text-text-primary mb-2">Expérience Mobile</h2>
<p class="font-body-md text-body-md text-text-secondary">Cet écran de connexion est optimisé pour une utilisation mobile. Veuillez redimensionner votre fenêtre ou utiliser un appareil mobile.</p>
</div>
</div>
<!-- Navigation suppressed as this is a linear/transactional screen -->
</body></html>