<!DOCTYPE html>

<html lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Sofitel Abidjan Hôtel Ivoire</title>
<!-- Font Setup -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
<!-- Tailwind Setup -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Manrope', 'sans-serif'],
          },
          colors: {
            primary: '#0f172a',
            'primary-container': '#334155',
            'on-primary': '#ffffff',
            'on-primary-container': '#f8fafc',
            secondary: '#475569',
            'secondary-container': '#e2e8f0',
            'on-secondary': '#ffffff',
            'on-secondary-container': '#0f172a',
            surface: '#f9f9f9',
            'surface-dim': '#dadada',
            'on-surface': '#1e293b',
            'on-surface-variant': '#64748b',
            'border-subtle': '#e2e8f0',
            outline: '#94a3b8',
            brand: {
              orange: '#f59e0b',
              green: '#10b981',
              blue: '#3b82f6'
            }
          },
          borderRadius: {
            'xl': '0.75rem',
            '2xl': '1rem',
            '3xl': '1.5rem'
          },
          boxShadow: {
            'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            'float': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  </script>
<style data-purpose="custom-styles">
    body {
      background-color: theme('colors.surface');
      color: theme('colors.on-surface');
      -webkit-tap-highlight-color: transparent;
      padding-bottom: 80px; /* Space for bottom nav */
    }
    
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    /* Input focus styles */
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: theme('colors.primary');
      box-shadow: 0 0 0 1px theme('colors.primary');
    }
  </style>
</head>
<body class="antialiased">
<!-- BEGIN: TopAppBar & Hero Section -->
<header class="relative w-full h-[350px]">
<!-- Hero Image -->
<div class="absolute inset-0 w-full h-full">
<img alt="Sofitel Abidjan Hôtel Ivoire" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida/AP1WRLslE2hDZHQheU_bywp4aPYxKm7z6qE79qWc5KK3aVbJgcQVLtgeBOFQlEsDr7gWDZm_fvMiGgPXhkhNR5B-6uZR8GGwENOSIobiREu04X89KEc9nJJP_YxREoVj7he_7eaAB_jtYEUR7wxC576zq22k7tCGw_olzAXyB4EL26_u_d78dmZAOzQEcqQwg3dfZsh_q3B_9kArAIvtpCGOur7rLYh5xMlfLTVZWVmcEHwbjU7MtEZq8CHyTH4"/>
<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
</div>
<!-- Top App Bar Content -->
<div class="absolute top-0 w-full flex items-center justify-between px-4 py-4 pt-safe z-10 text-white">
<button class="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-black/30 transition-colors">
<span class="material-icons text-sm">arrow_back</span>
<span class="text-sm font-medium">Retour</span>
</button>
<div class="flex items-center gap-2">
<button class="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/30 transition-colors">
<span class="material-icons text-[20px]">share</span>
</button>
<button class="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/30 transition-colors">
<span class="material-icons text-[20px]">favorite_border</span>
</button>
</div>
</div>
<!-- Hotel Info Overlay -->
<div class="absolute bottom-0 left-0 w-full p-4 text-white">
<div class="flex items-center gap-2 mb-2 overflow-x-auto hide-scrollbar">
<span class="px-3 py-1 bg-brand-orange text-xs font-bold rounded-full uppercase tracking-wide">Hôtels</span>
<span class="px-2 py-1 bg-brand-blue/80 backdrop-blur-sm text-xs font-bold rounded-full flex items-center gap-1">
<span class="material-icons text-[14px]">check_circle</span>
</span>
<span class="px-3 py-1 bg-brand-green/90 backdrop-blur-sm text-xs font-bold rounded-full flex items-center gap-1">
<span class="material-icons text-[14px]">schedule</span> Ouvert
        </span>
<span class="px-3 py-1 bg-black/40 backdrop-blur-sm text-xs font-bold rounded-full flex items-center gap-1">
<span class="material-icons text-[14px] text-brand-orange">star</span> 5 (35 avis)
        </span>
</div>
<h1 class="text-3xl font-bold leading-tight mb-2 text-shadow">Sofitel Abidjan Hôtel Ivoire</h1>
<p class="flex items-start gap-1 text-sm text-gray-200">
<span class="material-icons text-[18px] text-brand-orange shrink-0">location_on</span>
        Boulevard Hassan II, Cocody, Cocody, Abidjan
      </p>
</div>
</header>
<!-- END: TopAppBar & Hero Section -->
<!-- BEGIN: Tabs Navigation -->
<nav class="sticky top-0 z-40 bg-surface border-b border-border-subtle shadow-sm flex overflow-x-auto hide-scrollbar">
<button class="flex-1 min-w-[120px] py-4 text-sm font-bold text-primary border-b-2 border-brand-orange text-center whitespace-nowrap">Chambres</button>
<button class="flex-1 min-w-[120px] py-4 text-sm font-medium text-on-surface-variant hover:bg-surface-dim/50 text-center whitespace-nowrap">Informations</button>
<button class="flex-1 min-w-[120px] py-4 text-sm font-medium text-on-surface-variant hover:bg-surface-dim/50 text-center whitespace-nowrap">Horaires</button>
<button class="flex-1 min-w-[120px] py-4 text-sm font-medium text-on-surface-variant hover:bg-surface-dim/50 text-center whitespace-nowrap">Galerie</button>
</nav>
<!-- END: Tabs Navigation -->
<main class="p-4 space-y-6">
<!-- BEGIN: Nos Chambres Section -->
<section>
<h2 class="flex items-center gap-2 font-bold text-lg mb-4 text-primary">
<span class="material-icons text-brand-orange">bed</span> Nos chambres
      </h2>
<div class="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 snap-x">
<!-- Room Card -->
<article class="min-w-[280px] w-[85vw] max-w-[320px] snap-center bg-white rounded-2xl border-2 border-brand-orange shadow-soft overflow-hidden flex flex-col relative">
<!-- Stand-in for missing image -->
<div class="h-40 bg-gray-100 flex items-center justify-center">
<span class="text-gray-400 text-sm">Pas de photo</span>
</div>
<div class="p-4 flex-1 flex flex-col">
<div class="flex justify-between items-start mb-1">
<h3 class="font-bold text-primary leading-tight">Chambre Deluxe Lagune</h3>
<span class="material-icons text-brand-orange text-xl">bed</span>
</div>
<p class="text-xs text-on-surface-variant mb-3">Tarif par nuit — Chambre Deluxe Lagune</p>
<div class="mt-auto flex items-end justify-between">
<div>
<span class="font-bold text-lg text-primary">185 000 F</span>
<span class="text-xs text-on-surface-variant">/ nuit</span>
</div>
</div>
<div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
<button class="text-brand-orange text-sm font-bold flex items-center gap-1">
<span class="material-icons text-[16px]">open_in_new</span> Détails
              </button>
<span class="text-brand-orange text-xs font-bold uppercase tracking-wider">Sélectionnée</span>
</div>
</div>
</article>
</div>
</section>
<!-- END: Nos Chambres Section -->
<!-- BEGIN: Calendar Section -->
<section class="bg-white rounded-3xl p-5 shadow-soft border border-border-subtle">
<div class="flex items-center justify-between mb-6">
<h2 class="flex items-center gap-2 font-bold text-lg text-primary">
<span class="material-icons text-brand-orange">calendar_today</span> Août 2026
        </h2>
<div class="flex gap-2">
<button class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
<span class="material-icons text-sm">chevron_left</span>
</button>
<button class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50">
<span class="material-icons text-sm">chevron_right</span>
</button>
</div>
</div>
<div class="bg-blue-50/50 rounded-xl p-4 mb-4">
<p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Votre Séjour</p>
<div class="flex items-center gap-2 text-sm text-primary font-medium mb-1">
<span>Arrivée : —</span>
<span>Départ : —</span>
</div>
<p class="text-xs text-gray-500">Cliquez sur une date d'arrivée, puis sur une date de départ</p>
</div>
<!-- Calendar Grid Placeholder (Simplified for visual match) -->
<div class="grid grid-cols-7 gap-1 text-center mb-4">
<!-- Days header -->
<div class="text-[10px] font-bold text-gray-400 py-2">DIM</div>
<div class="text-[10px] font-bold text-gray-400 py-2">LUN</div>
<div class="text-[10px] font-bold text-gray-400 py-2">MAR</div>
<div class="text-[10px] font-bold text-gray-400 py-2">MER</div>
<div class="text-[10px] font-bold text-gray-400 py-2">JEU</div>
<div class="text-[10px] font-bold text-gray-400 py-2">VEN</div>
<div class="text-[10px] font-bold text-gray-400 py-2">SAM</div>
<!-- Dates (Sample data to match visual) -->
<div class="aspect-square flex items-center justify-center text-sm text-gray-300"></div>
<div class="aspect-square flex items-center justify-center text-sm text-gray-300"></div>
<div class="aspect-square flex items-center justify-center text-sm text-gray-300"></div>
<div class="aspect-square flex items-center justify-center text-sm text-gray-300"></div>
<div class="aspect-square flex items-center justify-center text-sm text-gray-300"></div>
<div class="aspect-square flex items-center justify-center text-sm text-gray-300"></div>
<div class="aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400"><span class="text-sm">1</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400"><span class="text-sm">2</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400"><span class="text-sm">3</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400"><span class="text-sm">4</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400"><span class="text-sm">5</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400"><span class="text-sm">6</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400"><span class="text-sm">7</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400"><span class="text-sm">8</span></div>
<!-- Available dates -->
<div class="aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400"><span class="text-sm">9</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-green-50 rounded-lg"><span class="text-sm font-bold text-primary">10</span><span class="text-[8px] text-green-600 font-bold">185k</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-green-50 rounded-lg"><span class="text-sm font-bold text-primary">11</span><span class="text-[8px] text-green-600 font-bold">185k</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-green-50 rounded-lg"><span class="text-sm font-bold text-primary">12</span><span class="text-[8px] text-green-600 font-bold">185k</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-green-50 rounded-lg"><span class="text-sm font-bold text-primary">13</span><span class="text-[8px] text-green-600 font-bold">185k</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-green-50 rounded-lg"><span class="text-sm font-bold text-primary">14</span><span class="text-[8px] text-green-600 font-bold">185k</span></div>
<div class="aspect-square flex flex-col items-center justify-center bg-green-50 rounded-lg"><span class="text-sm font-bold text-primary">15</span><span class="text-[8px] text-green-600 font-bold">185k</span></div>
</div>
<p class="text-[10px] text-gray-500 text-center mb-6">Vert = disponible · sélectionnez arrivée puis départ</p>
<button class="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-transform">
        Réserver
      </button>
</section>
<!-- END: Calendar Section -->
<!-- BEGIN: Booking Form Section -->
<section class="bg-white rounded-3xl p-5 shadow-soft border border-border-subtle">
<h2 class="flex items-center gap-2 font-bold text-lg text-primary mb-1">
<span class="material-icons text-brand-orange">event_note</span> Réserver une chambre
      </h2>
<p class="text-xs text-on-surface-variant mb-6 leading-relaxed">
        Séjour — disponibilité par nuit, confirmation par l'établissement
      </p>
<form class="space-y-4">
<!-- Room Select -->
<div class="relative">
<select class="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-primary appearance-none focus:ring-1 focus:ring-primary">
<option>Chambre Deluxe Lagune — 185 000 F</option>
</select>
<span class="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
</div>
<div class="bg-amber-50 text-amber-900 text-sm font-bold px-4 py-3 rounded-xl text-center">
          Tarif indicatif : 185 000 F / nuit
        </div>
<!-- Dates Inputs -->
<div class="relative">
<input class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary" placeholder="mm/dd/yyyy" type="text"/>
<span class="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">calendar_today</span>
</div>
<div class="relative">
<input class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary" placeholder="mm/dd/yyyy" type="text"/>
<span class="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">calendar_today</span>
</div>
<!-- User Info Inputs -->
<input class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary" placeholder="Votre nom *" type="text"/>
<input class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary" placeholder="Téléphone *" type="tel"/>
<div class="relative">
<span class="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">people_outline</span>
<input class="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary" type="number" value="2"/>
</div>
<textarea class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary resize-none" placeholder="Notes (optionnel)" rows="2"></textarea>
<button class="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-transform mt-2" type="button">
          Réserver une chambre
        </button>
<p class="text-[10px] text-gray-500 text-center px-4">
          Confirmation par l'établissement — sans débit immédiat.
        </p>
<p class="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
<span class="material-icons text-[12px]">lock</span> Connexion optionnelle — <a class="underline" href="#">se connecter</a>
</p>
</form>
</section>
<!-- END: Booking Form Section -->
<!-- BEGIN: Trust Index -->
<section>
<h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Indice de Confiance</h3>
<div class="flex items-center gap-4 mb-6">
<div class="w-16 h-16 rounded-full border-4 border-brand-green flex items-center justify-center">
<span class="text-2xl font-bold text-primary">98</span>
</div>
<div>
<h4 class="text-lg font-bold text-brand-green">Excellent</h4>
<p class="text-sm text-gray-500 flex items-center gap-1">
            35 avis · <span class="material-icons text-[14px]">check</span> Vérifié
          </p>
</div>
</div>
<div class="flex gap-4">
<button class="flex-1 border border-gray-200 rounded-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-gray-50">
<span class="material-icons text-[18px]">share</span> Partager
        </button>
<button class="flex-1 border border-gray-200 rounded-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-gray-50">
<span class="material-icons text-[18px]">favorite_border</span> Sauvegarder
        </button>
</div>
</section>
<!-- END: Trust Index -->
<!-- BEGIN: Reviews Section -->
<section>
<div class="flex justify-between items-center mb-4">
<h2 class="flex items-center gap-2 font-bold text-lg text-primary">
<span class="material-icons text-brand-orange text-xl">star_border</span> Avis clients <span class="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full ml-1">5/5</span> <span class="text-sm font-normal text-gray-400 ml-1">(35 avis)</span>
</h2>
</div>
<button class="bg-brand-orange text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 mb-6 text-sm shadow-sm">
<span class="material-icons text-[18px]">star</span> Laisser un avis
      </button>
<div class="space-y-4">
<!-- Review Card 1 -->
<article class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
<div class="flex justify-between items-start mb-3">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">U</div>
<div>
<p class="font-bold text-sm text-primary">Utilisateur Test</p>
<p class="text-[10px] text-gray-400">23 juin 2026</p>
</div>
</div>
<div class="flex text-brand-orange">
<span class="material-icons text-[14px]">star</span>
<span class="material-icons text-[14px]">star</span>
<span class="material-icons text-[14px]">star</span>
<span class="material-icons text-[14px]">star</span>
<span class="material-icons text-[14px]">star</span>
</div>
</div>
<h4 class="font-bold text-sm text-primary mb-1">Hôtel de légende</h4>
<p class="text-sm text-gray-600 leading-relaxed">
            L'ivoire c'est Abidjan. Que ce soit pour le restaurant gastronomique ou la piscine olympique, c'est toujours une expérience d'exception.
          </p>
</article>
</div>
<button class="w-full py-4 text-sm font-bold text-gray-500 hover:text-primary transition-colors text-center mt-4">
        Charger d'autres avis <span class="font-normal text-gray-400">(4/35)</span>
</button>
<button class="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-2">
<span class="material-icons text-[14px]">flag</span> Signaler cette fiche
      </button>
</section>
<!-- END: Reviews Section -->
<!-- BEGIN: Recommendations Section -->
<section class="pb-8">
<h2 class="font-bold text-xl text-primary mb-4">Vous aimerez aussi</h2>
<!-- Recommendation Card -->
<article class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
<div class="h-32 w-full bg-gray-200">
<img alt="Hôtel Golf Abidjan" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida/AP1WRLvenMcP2xyULLRMB4J1PpI4meIzNXpl67nDAcl-w3s47LWH6hSFeJPN8CqupCMhDji-UsUukXUqJv9ux8y5FMxjHskkANaJn-9E-oHqmDSCvm8amsgtzrqgSdFCqLIMlOpm3n_tmMNTm6LdEbqeqMrbPC3X1V94kH1_xXH0gaj19Af1yeCv5o-QjisSucRD6A0SU1TqA5X-6Fzt8kSC-FRtvcwu-HjTOxRcr6vyyajK58Lui8P71w_mxcc"/>
</div>
<div class="p-4 flex justify-between items-start">
<div>
<h3 class="font-bold text-primary text-sm mb-1">Hôtel Golf Abidjan</h3>
<p class="text-xs text-gray-500 flex items-center gap-1">
<span class="material-icons text-[14px]">location_on</span> Cocody
            </p>
</div>
<button class="text-gray-400 hover:text-primary">
<span class="material-icons text-[20px]">favorite_border</span>
</button>
</div>
</article>
</section>
<!-- END: Recommendations Section -->
</main>
<!-- BEGIN: Bottom Navigation -->
<nav class="fixed bottom-0 w-full z-50 bg-white border-t border-gray-200 px-4 py-3 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)] flex justify-between items-center gap-2">
<button class="w-12 h-12 rounded-full bg-brand-green flex items-center justify-center text-white shrink-0 shadow-md">
<span class="material-icons">chat</span>
</button>
<div class="flex gap-2 flex-1 max-w-[300px]">
<button class="flex-1 bg-white border border-gray-200 text-primary font-bold py-3 px-2 rounded-xl text-sm shadow-sm flex items-center justify-center gap-1 whitespace-nowrap">
<span class="material-icons text-[18px]">bed</span> Chambres
      </button>
<button class="flex-1 bg-primary text-white font-bold py-3 px-2 rounded-xl text-sm shadow-sm flex items-center justify-center gap-1 whitespace-nowrap">
<span class="material-icons text-[18px]">calendar_today</span> Réserver
      </button>
</div>
</nav>
<!-- END: Bottom Navigation -->
</body></html>