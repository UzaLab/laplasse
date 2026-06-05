<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Les Établissements - CIBOOKS</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <!-- Google Fonts (Outfit) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Outfit"', 'sans-serif'],
                    },
                    colors: {
                        brand: {
                            50: '#fffbeb',
                            100: '#fef3c7',
                            200: '#fde68a',
                            300: '#fcd34d',
                            400: '#fbbf24',
                            500: '#f59e0b', // Amber main
                            600: '#d97706',
                            700: '#b45309',
                            800: '#92400e',
                            900: '#78350f',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.5);
        }
        /* Hide scrollbar for category scroller */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="font-sans text-slate-800 bg-[#FAFAFA] selection:bg-brand-200 selection:text-brand-900">

    <!-- ==================== NAVIGATION ==================== -->
    <nav class="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300" id="navbar">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            
            <!-- Logo -->
            <a href="index.html" class="flex items-center gap-2 cursor-pointer">
                <div class="w-8 h-8 bg-slate-900 text-brand-500 rounded-lg flex items-center justify-center">
                    <i data-lucide="book-open" class="w-5 h-5"></i>
                </div>
                <span class="text-xl font-extrabold tracking-tight text-slate-900">CIBOOKS</span>
            </a>

            <!-- Desktop Links -->
            <div class="hidden md:flex items-center gap-8 font-semibold text-sm text-slate-500">
                <a href="#" class="text-slate-900 relative after:content-[''] after:absolute after:-bottom-7 after:left-0 after:w-full after:h-0.5 after:bg-brand-500">Découvrir</a>
                <a href="#" class="hover:text-slate-900 transition-colors">Marketplace</a>
                <a href="#" class="hover:text-slate-900 transition-colors flex items-center gap-1">Carte <i data-lucide="map" class="w-4 h-4"></i></a>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-5">
                <button class="text-slate-600 hover:text-brand-600 transition-colors relative">
                    <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                    <span class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">2</span>
                </button>
                <div class="w-px h-6 bg-slate-200 hidden md:block"></div>
                <button class="hidden md:flex items-center gap-2 text-sm font-bold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                    <i data-lucide="user" class="w-4 h-4"></i> Connexion
                </button>
                <button class="md:hidden text-slate-900">
                    <i data-lucide="menu" class="w-6 h-6"></i>
                </button>
            </div>
        </div>
    </nav>

    <!-- ==================== HEADER & FILTRES ==================== -->
    <header class="pt-32 pb-12 bg-white border-b border-slate-100">
        <div class="max-w-7xl mx-auto px-6">
            
            <div class="max-w-3xl mb-10">
                <h1 class="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">L'annuaire des lieux d'exception.</h1>
                <p class="text-lg text-slate-500">Trouvez votre prochaine expérience. Que ce soit pour un dîner d'affaires, une sortie entre amis ou une session shopping luxe.</p>
            </div>

            <!-- Barre de recherche -->
            <div class="flex flex-col md:flex-row gap-4 mb-8">
                <div class="flex-1 flex items-center px-4 bg-slate-50 border border-slate-200 rounded-2xl h-14 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
                    <i data-lucide="search" class="w-5 h-5 text-slate-400 mr-3"></i>
                    <input type="text" placeholder="Nom du lieu, spécialité..." class="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-400 font-medium">
                </div>
                
                <div class="flex-1 md:max-w-xs flex items-center px-4 bg-slate-50 border border-slate-200 rounded-2xl h-14 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
                    <i data-lucide="map-pin" class="w-5 h-5 text-slate-400 mr-3"></i>
                    <select class="w-full bg-transparent outline-none text-slate-900 font-medium cursor-pointer appearance-none">
                        <option value="">Tous les quartiers</option>
                        <option value="zone4">Zone 4 / Marcory</option>
                        <option value="cocody">Cocody</option>
                        <option value="plateau">Plateau</option>
                        <option value="assinie">Assinie</option>
                    </select>
                </div>
                
                <button class="bg-slate-900 text-white px-8 rounded-2xl font-bold hover:bg-slate-800 transition-colors h-14 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2">
                    <i data-lucide="sliders-horizontal" class="w-4 h-4"></i> Filtrer
                </button>
            </div>

            <!-- Catégories Rapides -->
            <div class="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                <button class="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold whitespace-nowrap shadow-md">
                    Tout voir (124)
                </button>
                <button class="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold whitespace-nowrap hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center gap-2">
                    <i data-lucide="utensils-crossed" class="w-4 h-4"></i> Gastronomie
                </button>
                <button class="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold whitespace-nowrap hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center gap-2">
                    <i data-lucide="wine" class="w-4 h-4"></i> Lounges & Bars
                </button>
                <button class="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold whitespace-nowrap hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center gap-2">
                    <i data-lucide="gem" class="w-4 h-4"></i> Concept Stores
                </button>
                <button class="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold whitespace-nowrap hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center gap-2">
                    <i data-lucide="sparkles" class="w-4 h-4"></i> Spas & Beauté
                </button>
            </div>
        </div>
    </header>

    <!-- ==================== MAIN CONTENT (GRID) ==================== -->
    <main class="max-w-7xl mx-auto px-6 py-12">
        
        <div class="flex items-center justify-between mb-8">
            <h2 class="text-xl font-bold text-slate-900">Résultats : 124 établissements</h2>
            <div class="flex items-center gap-2 text-sm font-medium text-slate-500">
                Trier par : 
                <select class="bg-transparent font-bold text-slate-900 outline-none cursor-pointer">
                    <option>Les mieux notés</option>
                    <option>Nouveautés</option>
                    <option>À proximité</option>
                </select>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            <!-- Carte Business 1 -->
            <article class="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                <div class="h-48 rounded-2xl overflow-hidden relative mb-4">
                    <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Villa Maasai">
                    <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1">
                        <i data-lucide="star" class="w-3 h-3 fill-brand-500 text-brand-500"></i> 4.9
                    </div>
                    <button class="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                        <i data-lucide="heart" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <div class="px-2 flex-1 flex flex-col">
                    <div class="mb-3">
                        <span class="text-brand-600 text-[10px] font-bold uppercase tracking-widest mb-1 block">Gastronomie & Jazz</span>
                        <h3 class="text-lg font-extrabold text-slate-900 leading-tight">Villa Maasai</h3>
                        <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i> Zone 4, Rue du Docteur Blanchard
                        </p>
                    </div>

                    <!-- En Vitrine (Boutique) -->
                    <div class="mt-auto bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><i data-lucide="store" class="w-3 h-3 text-brand-500"></i> En vitrine</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200" class="w-10 h-10 rounded-lg object-cover" alt="Epices">
                            <div class="flex-1 min-w-0">
                                <h4 class="text-xs font-bold text-slate-900 truncate">Coffret Épices Chef</h4>
                                <p class="text-[10px] font-extrabold text-brand-600">12.000 FCFA</p>
                            </div>
                        </div>
                    </div>

                    <!-- Action -->
                    <a href="place-details.html" class="mt-4 w-full block text-center py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-brand-500 transition-colors">
                        Voir le lieu
                    </a>
                </div>
            </article>

            <!-- Carte Business 2 -->
            <article class="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                <div class="h-48 rounded-2xl overflow-hidden relative mb-4">
                    <img src="https://images.unsplash.com/photo-1570554520913-ce219f885e35?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Noom Rooftop">
                    <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1">
                        <i data-lucide="star" class="w-3 h-3 fill-brand-500 text-brand-500"></i> 4.8
                    </div>
                    <button class="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                        <i data-lucide="heart" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <div class="px-2 flex-1 flex flex-col">
                    <div class="mb-3">
                        <span class="text-brand-600 text-[10px] font-bold uppercase tracking-widest mb-1 block">Bar & Piscine</span>
                        <h3 class="text-lg font-extrabold text-slate-900 leading-tight">Noom Rooftop</h3>
                        <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i> Plateau, Abidjan
                        </p>
                    </div>

                    <!-- En Vitrine (Boutique) -->
                    <div class="mt-auto bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><i data-lucide="store" class="w-3 h-3 text-brand-500"></i> En vitrine</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <img src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=200" class="w-10 h-10 rounded-lg object-cover" alt="Pass">
                            <div class="flex-1 min-w-0">
                                <h4 class="text-xs font-bold text-slate-900 truncate">Day Pass VIP</h4>
                                <p class="text-[10px] font-extrabold text-brand-600">25.000 FCFA</p>
                            </div>
                        </div>
                    </div>

                    <!-- Action -->
                    <a href="place-details.html" class="mt-4 w-full block text-center py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-brand-500 transition-colors">
                        Voir le lieu
                    </a>
                </div>
            </article>

            <!-- Carte Business 3 -->
            <article class="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                <div class="h-48 rounded-2xl overflow-hidden relative mb-4">
                    <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Bushman">
                    <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1">
                        <i data-lucide="star" class="w-3 h-3 fill-brand-500 text-brand-500"></i> 4.7
                    </div>
                    <button class="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                        <i data-lucide="heart" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <div class="px-2 flex-1 flex flex-col">
                    <div class="mb-3">
                        <span class="text-brand-600 text-[10px] font-bold uppercase tracking-widest mb-1 block">Art & Rooftop</span>
                        <h3 class="text-lg font-extrabold text-slate-900 leading-tight">Bushman Café</h3>
                        <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i> Riviéra M'Pouto
                        </p>
                    </div>

                    <!-- En Vitrine (Boutique) -->
                    <div class="mt-auto bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><i data-lucide="store" class="w-3 h-3 text-brand-500"></i> En vitrine</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200" class="w-10 h-10 rounded-lg object-cover" alt="Livre">
                            <div class="flex-1 min-w-0">
                                <h4 class="text-xs font-bold text-slate-900 truncate">Livre d'Art de Babi</h4>
                                <p class="text-[10px] font-extrabold text-brand-600">25.000 FCFA</p>
                            </div>
                        </div>
                    </div>

                    <!-- Action -->
                    <a href="place-details.html" class="mt-4 w-full block text-center py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-brand-500 transition-colors">
                        Voir le lieu
                    </a>
                </div>
            </article>

            <!-- Carte Business 4 -->
            <article class="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                <div class="h-48 rounded-2xl overflow-hidden relative mb-4">
                    <img src="https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Yalé">
                    <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1">
                        <i data-lucide="star" class="w-3 h-3 fill-brand-500 text-brand-500"></i> 4.9
                    </div>
                    <button class="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                        <i data-lucide="heart" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <div class="px-2 flex-1 flex flex-col">
                    <div class="mb-3">
                        <span class="text-brand-600 text-[10px] font-bold uppercase tracking-widest mb-1 block">Mode Ivoirienne</span>
                        <h3 class="text-lg font-extrabold text-slate-900 leading-tight">Yalé Design</h3>
                        <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i> Cocody Vallons
                        </p>
                    </div>

                    <!-- En Vitrine (Boutique) -->
                    <div class="mt-auto bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><i data-lucide="store" class="w-3 h-3 text-brand-500"></i> En vitrine</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <img src="https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=200" class="w-10 h-10 rounded-lg object-cover" alt="Robe">
                            <div class="flex-1 min-w-0">
                                <h4 class="text-xs font-bold text-slate-900 truncate">Robe Cocktail Wax</h4>
                                <p class="text-[10px] font-extrabold text-brand-600">35.000 FCFA</p>
                            </div>
                        </div>
                    </div>

                    <!-- Action -->
                    <a href="place-details.html" class="mt-4 w-full block text-center py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-brand-500 transition-colors">
                        Voir le lieu
                    </a>
                </div>
            </article>

            <!-- Carte Business 5 -->
            <article class="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                <div class="h-48 rounded-2xl overflow-hidden relative mb-4">
                    <img src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Spa">
                    <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1">
                        <i data-lucide="star" class="w-3 h-3 fill-brand-500 text-brand-500"></i> 4.8
                    </div>
                    <button class="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                        <i data-lucide="heart" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <div class="px-2 flex-1 flex flex-col">
                    <div class="mb-3">
                        <span class="text-brand-600 text-[10px] font-bold uppercase tracking-widest mb-1 block">Spa & Bien-être</span>
                        <h3 class="text-lg font-extrabold text-slate-900 leading-tight">Nappy Queen Spa</h3>
                        <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i> Riviéra 3
                        </p>
                    </div>

                    <!-- En Vitrine (Boutique) -->
                    <div class="mt-auto bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><i data-lucide="store" class="w-3 h-3 text-brand-500"></i> En vitrine</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <img src="https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=200" class="w-10 h-10 rounded-lg object-cover" alt="Huile">
                            <div class="flex-1 min-w-0">
                                <h4 class="text-xs font-bold text-slate-900 truncate">Huile Karité Bio</h4>
                                <p class="text-[10px] font-extrabold text-brand-600">5.000 FCFA</p>
                            </div>
                        </div>
                    </div>

                    <!-- Action -->
                    <a href="place-details.html" class="mt-4 w-full block text-center py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-brand-500 transition-colors">
                        Voir le lieu
                    </a>
                </div>
            </article>

            <!-- Carte Business 6 -->
            <article class="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                <div class="h-48 rounded-2xl overflow-hidden relative mb-4">
                    <img src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Bistrot">
                    <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1">
                        <i data-lucide="star" class="w-3 h-3 fill-brand-500 text-brand-500"></i> 4.6
                    </div>
                    <button class="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                        <i data-lucide="heart" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <div class="px-2 flex-1 flex flex-col">
                    <div class="mb-3">
                        <span class="text-brand-600 text-[10px] font-bold uppercase tracking-widest mb-1 block">Brasserie Française</span>
                        <h3 class="text-lg font-extrabold text-slate-900 leading-tight">Le Bistrot Parisien</h3>
                        <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-3 h-3"></i> Bietry, Abidjan
                        </p>
                    </div>

                    <!-- En Vitrine (Boutique) -->
                    <div class="mt-auto bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><i data-lucide="store" class="w-3 h-3 text-brand-500"></i> En vitrine</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <img src="https://images.unsplash.com/photo-1581452934440-6644fcfcce01?auto=format&fit=crop&q=80&w=200" class="w-10 h-10 rounded-lg object-cover" alt="Vin">
                            <div class="flex-1 min-w-0">
                                <h4 class="text-xs font-bold text-slate-900 truncate">Bouteille Côte du Rhône</h4>
                                <p class="text-[10px] font-extrabold text-brand-600">18.000 FCFA</p>
                            </div>
                        </div>
                    </div>

                    <!-- Action -->
                    <a href="place-details.html" class="mt-4 w-full block text-center py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-brand-500 transition-colors">
                        Voir le lieu
                    </a>
                </div>
            </article>

        </div>
        
        <!-- Pagination / Charger Plus -->
        <div class="mt-16 text-center">
            <button class="bg-white border-2 border-slate-900 text-slate-900 px-8 py-3 rounded-2xl font-bold hover:bg-slate-900 hover:text-white transition-colors">
                Charger plus d'établissements
            </button>
        </div>

    </main>

    <!-- ==================== FOOTER ==================== -->
    <footer class="bg-white pt-16 pb-10 border-t border-slate-100 mt-12">
        <div class="max-w-7xl mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <!-- Brand col -->
                <div class="md:col-span-1">
                    <div class="flex items-center gap-2 mb-6">
                        <div class="w-8 h-8 bg-slate-900 text-brand-500 rounded-lg flex items-center justify-center">
                            <i data-lucide="book-open" class="w-5 h-5"></i>
                        </div>
                        <span class="text-xl font-extrabold tracking-tight text-slate-900">CIBOOKS</span>
                    </div>
                    <p class="text-sm text-slate-500 mb-6">La plateforme de référence pour découvrir, réserver et acheter auprès des meilleurs établissements de Côte d'Ivoire.</p>
                </div>

                <!-- Links col 1 -->
                <div>
                    <h4 class="font-extrabold text-slate-900 mb-6">Explorer</h4>
                    <ul class="space-y-4 text-sm text-slate-500 font-medium">
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Restaurants</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Bars & Lounges</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Marketplace</a></li>
                    </ul>
                </div>

                <!-- Links col 2 -->
                <div>
                    <h4 class="font-extrabold text-slate-900 mb-6">Business</h4>
                    <ul class="space-y-4 text-sm text-slate-500 font-medium">
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Inscrire son lieu</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Accès Partenaire</a></li>
                    </ul>
                </div>
            </div>

            <div class="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400 font-medium">
                <p>&copy; 2026 CIBOOKS. Tous droits réservés.</p>
                <p class="flex items-center gap-1">Conçu avec <i data-lucide="heart" class="w-4 h-4 text-red-500 fill-red-500"></i> à Babi.</p>
            </div>
        </div>
    </footer>

    <!-- Init script -->
    <script>
        lucide.createIcons();
        
        // Navbar blur effect on scroll
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('shadow-sm');
            } else {
                navbar.classList.remove('shadow-sm');
            }
        });
    </script>
</body>
</html>