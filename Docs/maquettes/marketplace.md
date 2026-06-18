<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marketplace | CIBOOKS</title>
    
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
        /* Hide scrollbar for horizontal scrollers */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Custom range slider */
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #f59e0b;
            cursor: pointer;
            margin-top: -6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            cursor: pointer;
            background: #e2e8f0;
            border-radius: 2px;
        }
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
            <div class="hidden lg:flex items-center gap-8 font-semibold text-sm text-slate-500">
                <a href="businesses.html" class="hover:text-slate-900 transition-colors">Découvrir</a>
                <a href="#" class="text-slate-900 relative after:content-[''] after:absolute after:-bottom-7 after:left-0 after:w-full after:h-0.5 after:bg-brand-500">Marketplace</a>
                <a href="#" class="hover:text-slate-900 transition-colors">Expériences</a>
            </div>

            <!-- Search Bar (Header) -->
            <div class="hidden md:flex flex-1 max-w-md mx-8 items-center px-4 bg-slate-50 rounded-full h-10 border border-slate-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 mr-2"></i>
                <input type="text" placeholder="Rechercher un produit, une marque..." class="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium">
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

    <!-- ==================== HEADER MARKETPLACE ==================== -->
    <header class="pt-32 pb-12 bg-white border-b border-slate-100">
        <div class="max-w-7xl mx-auto px-6">
            
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                <div class="max-w-2xl">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-widest mb-4 border border-brand-100">
                        <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i> Click & Collect ou Livraison
                    </div>
                    <h1 class="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">La Marketplace CIBOOKS</h1>
                    <p class="text-lg text-slate-500">L'art de vivre ivoirien, de la table de nos chefs à votre dressing. Achetez en direct auprès des meilleurs établissements d'Abidjan.</p>
                </div>
            </div>

            <!-- Boutiques à la une (Vendeurs) -->
            <div class="mb-4">
                <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Boutiques à la une</h3>
                <div class="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                    
                    <a href="boutique.html" class="flex flex-col items-center gap-2 min-w-[80px] group">
                        <div class="w-16 h-16 rounded-2xl bg-white border-2 border-slate-100 p-1 group-hover:border-brand-400 group-hover:shadow-lg transition-all">
                            <div class="w-full h-full rounded-xl overflow-hidden bg-slate-50">
                                <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=150" class="w-full h-full object-cover" alt="Villa Maasai">
                            </div>
                        </div>
                        <span class="text-xs font-bold text-slate-700 group-hover:text-brand-600 text-center">Villa Maasai</span>
                    </a>

                    <a href="#" class="flex flex-col items-center gap-2 min-w-[80px] group">
                        <div class="w-16 h-16 rounded-2xl bg-white border-2 border-slate-100 p-1 group-hover:border-brand-400 group-hover:shadow-lg transition-all">
                            <div class="w-full h-full rounded-xl overflow-hidden bg-slate-50">
                                <img src="https://images.unsplash.com/photo-1570554520913-ce219f885e35?auto=format&fit=crop&q=80&w=150" class="w-full h-full object-cover" alt="Noom">
                            </div>
                        </div>
                        <span class="text-xs font-bold text-slate-700 group-hover:text-brand-600 text-center">Noom</span>
                    </a>

                    <a href="#" class="flex flex-col items-center gap-2 min-w-[80px] group">
                        <div class="w-16 h-16 rounded-2xl bg-white border-2 border-slate-100 p-1 group-hover:border-brand-400 group-hover:shadow-lg transition-all">
                            <div class="w-full h-full rounded-xl overflow-hidden bg-slate-50">
                                <img src="https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&q=80&w=150" class="w-full h-full object-cover" alt="Yalé">
                            </div>
                        </div>
                        <span class="text-xs font-bold text-slate-700 group-hover:text-brand-600 text-center">Yalé Design</span>
                    </a>

                    <a href="#" class="flex flex-col items-center gap-2 min-w-[80px] group">
                        <div class="w-16 h-16 rounded-2xl bg-white border-2 border-slate-100 p-1 group-hover:border-brand-400 group-hover:shadow-lg transition-all">
                            <div class="w-full h-full rounded-xl overflow-hidden bg-slate-50">
                                <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=150" class="w-full h-full object-cover" alt="Bushman">
                            </div>
                        </div>
                        <span class="text-xs font-bold text-slate-700 group-hover:text-brand-600 text-center">Bushman</span>
                    </a>

                    <a href="#" class="flex flex-col items-center gap-2 min-w-[80px] group">
                        <div class="w-16 h-16 rounded-2xl bg-white border-2 border-slate-100 p-1 group-hover:border-brand-400 group-hover:shadow-lg transition-all">
                            <div class="w-full h-full rounded-xl overflow-hidden bg-slate-50">
                                <img src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=150" class="w-full h-full object-cover" alt="Nappy">
                            </div>
                        </div>
                        <span class="text-xs font-bold text-slate-700 group-hover:text-brand-600 text-center">Nappy Spa</span>
                    </a>
                </div>
            </div>

        </div>
    </header>

    <!-- ==================== CONTENU PRINCIPAL ==================== -->
    <main class="max-w-7xl mx-auto px-6 py-12">
        
        <div class="flex flex-col lg:flex-row gap-8 items-start">
            
            <!-- LEFT SIDEBAR: FILTERS -->
            <aside class="w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
                
                <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                            <i data-lucide="sliders-horizontal" class="w-5 h-5 text-brand-500"></i> Filtres
                        </h3>
                        <button class="text-xs font-bold text-slate-400 hover:text-slate-900">Effacer</button>
                    </div>

                    <!-- Univers / Catégories -->
                    <div class="mb-8">
                        <h4 class="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">Univers</h4>
                        <div class="space-y-3">
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-brand-500 bg-brand-500 flex items-center justify-center text-white">
                                    <i data-lucide="check" class="w-3 h-3"></i>
                                </div>
                                <span class="text-sm font-bold text-slate-900">Tous les produits</span>
                            </label>
                            
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-brand-400 transition-colors"></div>
                                <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">Épicerie Fine & Cave</span>
                            </label>

                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-brand-400 transition-colors"></div>
                                <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">Mode & Créateurs</span>
                            </label>

                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-brand-400 transition-colors"></div>
                                <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">Beauté & Bien-être</span>
                            </label>

                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-brand-400 transition-colors"></div>
                                <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">Cartes Cadeaux & Pass</span>
                            </label>
                        </div>
                    </div>

                    <div class="h-px w-full bg-slate-100 mb-8"></div>

                    <!-- Boutiques (Filtre) -->
                    <div class="mb-8">
                        <h4 class="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">Boutiques</h4>
                        <div class="space-y-3 max-h-48 overflow-y-auto no-scrollbar">
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-brand-400 transition-colors"></div>
                                <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">Villa Maasai</span>
                            </label>
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-brand-400 transition-colors"></div>
                                <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">Yalé Design</span>
                            </label>
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-brand-400 transition-colors"></div>
                                <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">Noom Rooftop</span>
                            </label>
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-brand-400 transition-colors"></div>
                                <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">Bushman Café</span>
                            </label>
                        </div>
                    </div>

                    <div class="h-px w-full bg-slate-100 mb-8"></div>

                    <!-- Prix -->
                    <div>
                        <h4 class="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">Fourchette de prix</h4>
                        <div class="mb-4">
                            <input type="range" min="0" max="100000" value="100000" class="w-full appearance-none bg-transparent">
                        </div>
                        <div class="flex items-center justify-between text-sm font-bold text-slate-600">
                            <span>0 F</span>
                            <span>Tout</span>
                        </div>
                    </div>
                </div>

            </aside>

            <!-- RIGHT MAIN: PRODUCTS -->
            <div class="flex-1 w-full">
                
                <!-- Header / Sort Bar -->
                <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                    <p class="text-slate-500 font-medium text-sm">Affichage de <span class="font-bold text-slate-900">142</span> produits</p>
                    
                    <div class="flex items-center gap-3 text-sm">
                        <span class="text-slate-400 font-medium">Trier par :</span>
                        <select class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 outline-none cursor-pointer focus:border-brand-400 transition-colors">
                            <option>Nouveautés</option>
                            <option>Meilleures ventes</option>
                            <option>Prix croissant</option>
                            <option>Prix décroissant</option>
                        </select>
                    </div>
                </div>

                <!-- Product Grid (Mixed Vendors) -->
                <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    
                    <!-- Product Card 1 (Villa Maasai) -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Epices">
                            <div class="absolute top-2 left-2 bg-brand-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Best-seller</div>
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-brand-600 font-bold uppercase tracking-wide mb-1 flex items-center gap-1"><i data-lucide="store" class="w-3 h-3"></i> Villa Maasai</p>
                            <a href="product-details.html" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Coffret Épices du Chef - Édition Signature</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">12.000 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 2 (Yalé Design) -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Robe">
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-blue-600 font-bold uppercase tracking-wide mb-1 flex items-center gap-1"><i data-lucide="store" class="w-3 h-3"></i> Yalé Design</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Robe Cocktail Wax Premium</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">35.000 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 3 (Bushman) -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Livre">
                            <div class="absolute top-2 left-2 bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Nouveau</div>
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-purple-600 font-bold uppercase tracking-wide mb-1 flex items-center gap-1"><i data-lucide="store" class="w-3 h-3"></i> Bushman Café</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Livre "Art of Babi" Édition Limitée</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">25.000 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 4 (Nappy Spa) -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Huile">
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-green-600 font-bold uppercase tracking-wide mb-1 flex items-center gap-1"><i data-lucide="store" class="w-3 h-3"></i> Nappy Queen Spa</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Huile de Karité Bio (100ml)</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">5.000 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 5 (Noom) -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Pass">
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-indigo-600 font-bold uppercase tracking-wide mb-1 flex items-center gap-1"><i data-lucide="store" class="w-3 h-3"></i> Noom Rooftop</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Day Pass Piscine VIP (Samedi)</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">25.000 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 6 (Bistrot) -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1581452934440-6644fcfcce01?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Vin">
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-red-600 font-bold uppercase tracking-wide mb-1 flex items-center gap-1"><i data-lucide="store" class="w-3 h-3"></i> Le Bistrot Parisien</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Bouteille Côte du Rhône (Cave)</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">18.000 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 7 (Kajazoma) -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1616047006789-b7af5afb8c2e?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Vase">
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-amber-800 font-bold uppercase tracking-wide mb-1 flex items-center gap-1"><i data-lucide="store" class="w-3 h-3"></i> Kajazoma Concept</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Vase Artisanal en Terre Cuite</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">35.000 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 8 (Comptoir) -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Miel">
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-yellow-600 font-bold uppercase tracking-wide mb-1 flex items-center gap-1"><i data-lucide="store" class="w-3 h-3"></i> Le Comptoir Bio</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Miel Pur de Korhogo (500g)</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">4.500 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Pagination -->
                <div class="mt-12 flex justify-center gap-2">
                    <button class="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-colors">
                        <i data-lucide="chevron-left" class="w-5 h-5"></i>
                    </button>
                    <button class="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center shadow-md">1</button>
                    <button class="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 transition-colors">2</button>
                    <button class="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 transition-colors">3</button>
                    <span class="w-10 h-10 flex items-center justify-center text-slate-400">...</span>
                    <button class="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 transition-colors">12</button>
                    <button class="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-colors">
                        <i data-lucide="chevron-right" class="w-5 h-5"></i>
                    </button>
                </div>

            </div>
        </div>
    </main>

    <!-- ==================== FOOTER ==================== -->
    <footer class="bg-white pt-16 pb-10 border-t border-slate-100 mt-8">
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
                        <li><a href="#" class="text-brand-600 transition-colors">Marketplace</a></li>
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