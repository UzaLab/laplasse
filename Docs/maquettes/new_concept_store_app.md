<!DOCTYPE html>

<html lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Spa Éden Cocody - Réservation</title>
<!-- Font -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Tailwind Configuration -->
<script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Manrope', 'sans-serif'],
          },
          colors: {
            surface: '#f9f9f9',
            'surface-container-lowest': '#ffffff',
            primary: '#0f172a',
            'on-primary': '#ffffff',
            secondary: '#f1f5f9',
            'on-secondary': '#0f172a',
            outline: '#e2e8f0',
            'on-surface': '#0f172a',
            'on-surface-variant': '#475569',
            error: '#dc2626',
            'on-error': '#ffffff',
            success: '#22c55e',
            warning: '#f59e0b',
          },
          borderRadius: {
            'xl': '1rem', // Round Eight equivalent
            '2xl': '1.5rem',
          },
          boxShadow: {
            'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          }
        }
      }
    }
  </script>
<!-- Icons -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"/>
<style data-purpose="custom-styles">
    body {
      background-color: theme('colors.surface');
      color: theme('colors.on-surface');
      -webkit-font-smoothing: antialiased;
    }
    
    .hero-gradient {
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%);
    }

    .tab-active {
      border-bottom: 2px solid theme('colors.primary');
      color: theme('colors.primary');
      font-weight: 700;
    }

    .tab-inactive {
      color: theme('colors.on-surface-variant');
      border-bottom: 1px solid theme('colors.outline');
    }
    
    .bottom-nav-shadow {
      box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
    }
  </style>
</head>
<body class="pb-24">
<!-- BEGIN: Hero Section -->
<header class="relative h-[340px] w-full">
<img alt="Spa Éden Cocody" class="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida/AP1WRLv3qOfyGEGXT3t-cVqeddM-IiBYpSduXFzmk2i4AUHYS7RDeuHJizXR9EHQZY-xZaMvhGzV0x74_GFVPWSUtx7Olromh553rSWXkLOefdsjoy34aX_89JapjPszJn18f3KNaY1zcjXiTLqxWduXN04JrSFgZmxGSG9Vtn9v5D65gIxJuXd6GBNCHh7dIFSivNW-4XIiYklWOBPsu2SfeiJ5QobZx3TmuLs2mzWwZx7YHwOdxEduEPrYyg"/>
<div class="absolute inset-0 hero-gradient"></div>
<!-- Top Actions -->
<div class="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
<button class="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
<i class="fa-solid fa-arrow-left"></i>
</button>
<div class="flex gap-2">
<button class="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
<i class="fa-solid fa-share-nodes"></i>
</button>
<button class="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
<i class="fa-regular fa-heart"></i>
</button>
</div>
</div>
<!-- Info Overlay -->
<div class="absolute bottom-4 left-4 right-4 z-10 text-white">
<div class="flex flex-wrap items-center gap-2 mb-2">
<span class="bg-warning text-black text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">Spas &amp; Bien-être</span>
<span class="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
<i class="fa-solid fa-check"></i>
</span>
<span class="bg-error text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
<i class="fa-regular fa-clock"></i> Fermé
        </span>
</div>
<div class="flex items-center gap-1 mb-1 text-sm font-medium">
<i class="fa-solid fa-star text-white text-xs"></i>
<span>5 (35 avis)</span>
</div>
<h1 class="text-3xl font-bold mb-1">Spa Éden Cocody</h1>
<div class="flex items-start gap-1.5 text-sm text-gray-200">
<i class="fa-solid fa-location-dot mt-1"></i>
<p>Rue des Jardins, Cocody, Cocody, Abidjan</p>
</div>
</div>
</header>
<!-- END: Hero Section -->
<!-- BEGIN: Navigation Tabs -->
<nav class="flex bg-surface-container-lowest sticky top-0 z-20">
<button class="flex-1 py-4 text-sm tab-active">
      Prestations
    </button>
<button class="flex-1 py-4 text-sm font-medium tab-inactive">
      Informations
    </button>
<button class="flex-1 py-4 text-sm font-medium tab-inactive">
      Horaires
    </button>
</nav>
<!-- END: Navigation Tabs -->
<!-- BEGIN: Main Content -->
<main class="p-4 space-y-6">
<!-- Conditions Card -->
<section class="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline/50">
<h2 class="text-lg font-bold mb-4 text-on-surface">Conditions de réservation</h2>
<div class="space-y-4 text-sm text-on-surface-variant leading-relaxed">
<p><strong class="text-on-surface font-semibold">Acompte de 30 %</strong> à la confirmation.</p>
<p><strong class="text-on-surface font-semibold">Annulation :</strong> Annulation gratuite jusqu'à 24 h avant le créneau. Passé ce délai, l'acompte est conservé.</p>
<p><strong class="text-on-surface font-semibold">Absence (no-show) :</strong> En cas d'absence sans prévenir, l'acompte versé n'est pas remboursé.</p>
</div>
</section>
<!-- Services Section -->
<section>
<div class="mb-4">
<h2 class="text-xl font-bold text-on-surface">2 prestations</h2>
<p class="text-sm text-on-surface-variant mt-1">Tarifs et durées indicatifs — choisissez un créneau pour réserver</p>
</div>
<div class="space-y-4">
<!-- Service Item 1 -->
<article class="bg-surface-container-lowest rounded-xl p-4 shadow-soft border border-outline/50">
<div class="flex justify-between items-start mb-4">
<div class="flex gap-3">
<div class="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-on-surface-variant shrink-0">
<i class="fa-solid fa-spa"></i>
</div>
<div>
<h3 class="font-bold text-lg leading-tight text-on-surface">Massage relaxant<br/>60 min</h3>
<div class="flex items-center gap-1 text-sm text-on-surface-variant mt-1">
<i class="fa-regular fa-clock"></i>
<span>60 min</span>
</div>
</div>
</div>
<div class="text-right">
<div class="font-bold text-lg text-on-surface">35 000 F</div>
<div class="text-xs font-semibold text-success mt-0.5 text-right w-20 leading-tight">Acompte 10 500 F</div>
</div>
</div>
<div class="flex gap-2 mb-2">
<button class="flex-1 py-2.5 px-4 rounded-xl border border-outline font-semibold text-sm text-on-surface hover:bg-secondary transition-colors">
              Détails
            </button>
<button class="flex-1 py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-colors">
              Réserver
            </button>
</div>
<p class="text-center text-[10px] text-on-surface-variant">Acompte de 30 % (10 500 F) à payer à la confirmation.</p>
</article>
<!-- Service Item 2 -->
<article class="bg-surface-container-lowest rounded-xl p-4 shadow-soft border border-outline/50">
<div class="flex justify-between items-start mb-4">
<div class="flex gap-3">
<div class="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-on-surface-variant shrink-0">
<i class="fa-regular fa-face-smile"></i>
</div>
<div>
<h3 class="font-bold text-lg leading-tight text-on-surface">Soin visage<br/>premium</h3>
<div class="flex items-center gap-1 text-sm text-on-surface-variant mt-1">
<i class="fa-regular fa-clock"></i>
<span>45 min</span>
</div>
</div>
</div>
<div class="text-right">
<div class="font-bold text-lg text-on-surface">28 000 F</div>
<div class="text-xs font-semibold text-success mt-0.5 text-right w-20 leading-tight">Acompte 8 400 F</div>
</div>
</div>
<div class="flex gap-2 mb-2">
<button class="flex-1 py-2.5 px-4 rounded-xl border border-outline font-semibold text-sm text-on-surface hover:bg-secondary transition-colors">
              Détails
            </button>
<button class="flex-1 py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-colors">
              Réserver
            </button>
</div>
<p class="text-center text-[10px] text-on-surface-variant">Acompte de 30 % (8 400 F) à payer à la confirmation.</p>
</article>
</div>
</section>
</main>
<!-- END: Main Content -->
<!-- BEGIN: Bottom Navigation -->
<div class="fixed bottom-0 left-0 right-0 bg-surface-container-lowest p-3 flex items-center justify-between bottom-nav-shadow z-30 rounded-t-2xl">
<button class="w-12 h-12 bg-success text-white rounded-full flex items-center justify-center shadow-md">
<i class="fa-brands fa-whatsapp text-2xl"></i>
</button>
<button class="flex flex-col items-center justify-center gap-1 text-on-surface">
<i class="fa-solid fa-list-ul"></i>
<span class="text-[10px] font-semibold">Prestations</span>
</button>
<button class="bg-primary text-on-primary py-3 px-6 rounded-xl font-bold flex items-center gap-2 flex-1 max-w-[200px] justify-center">
<i class="fa-regular fa-calendar"></i>
      Prendre RDV
    </button>
</div>
<!-- END: Bottom Navigation -->
</body></html>