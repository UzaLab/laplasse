<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>La Boutique - Villa Maasai | CIBOOKS</title>
    
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

            <!-- Search Bar (Header) -->
            <div class="hidden md:flex flex-1 max-w-md mx-8 items-center px-4 bg-slate-50 rounded-full h-10 border border-slate-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 mr-2"></i>
                <input type="text" placeholder="Rechercher dans la boutique..." class="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium">
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

    <!-- ==================== HEADER BOUTIQUE ==================== -->
    <header class="pt-20">
        <!-- Cover Image -->
        <div class="relative h-[25vh] md:h-[35vh] w-full bg-slate-900">
            <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1600" class="w-full h-full object-cover opacity-60" alt="Villa Maasai Cover">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
            
            <div class="absolute bottom-0 left-0 w-full transform translate-y-1/2">
                <div class="max-w-7xl mx-auto px-6 flex items-end justify-between gap-6">
                    <div class="flex items-end gap-6">
                        <!-- Logo Vendeur -->
                        <div class="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white p-2 shadow-xl border-4 border-[#FAFAFA] shrink-0">
                            <div class="w-full h-full rounded-xl overflow-hidden bg-slate-100">
                                <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200" class="w-full h-full object-cover" alt="Logo Villa Maasai">
                            </div>
                        </div>
                        
                        <div class="pb-2 md:pb-4 text-white">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="bg-brand-500 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1">
                                    <i data-lucide="store" class="w-3 h-3"></i> Boutique Officielle
                                </span>
                            </div>
                            <h1 class="text-2xl md:text-4xl font-extrabold tracking-tight">Villa Maasai</h1>
                            <p class="text-sm md:text-base text-slate-300 flex items-center gap-1 mt-1">
                                <i data-lucide="map-pin" class="w-4 h-4 text-brand-500"></i> Zone 4, Abidjan
                            </p>
                        </div>
                    </div>

                    <!-- CTA Retour au lieu -->
                    <div class="hidden md:block pb-4">
                        <a href="place-details.html" class="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/20 transition-colors">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Voir l'établissement
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- ==================== CONTENU BOUTIQUE ==================== -->
    <main class="max-w-7xl mx-auto px-6 pt-24 md:pt-32 pb-16">
        
        <div class="flex flex-col lg:flex-row gap-8 items-start">
            
            <!-- LEFT SIDEBAR: FILTERS -->
            <aside class="w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
                
                <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                    <h3 class="font-extrabold text-slate-900 text-lg mb-6 flex items-center gap-2">
                        <i data-lucide="sliders-horizontal" class="w-5 h-5 text-brand-500"></i> Filtres
                    </h3>

                    <!-- Catégories -->
                    <div class="mb-8">
                        <h4 class="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">Catégories</h4>
                        <div class="space-y-3">
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-brand-500 bg-brand-500 flex items-center justify-center text-white">
                                    <i data-lucide="check" class="w-3 h-3"></i>
                                </div>
                                <span class="text-sm font-bold text-slate-900">Toutes les catégories</span>
                                <span class="text-xs text-slate-400 ml-auto group-hover:text-brand-600">24</span>
                            </label>
                            
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-brand-400 transition-colors"></div>
                                <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">Épices & Condiments</span>
                                <span class="text-xs text-slate-400 ml-auto group-hover:text-brand-600">8</span>
                            </label>

                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-brand-400 transition-colors"></div>
                                <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">Cave à Vins</span>
                                <span class="text-xs text-slate-400 ml-auto group-hover:text-brand-600">6</span>
                            </label>

                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-brand-400 transition-colors"></div>
                                <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">Cartes VIP & Pass</span>
                                <span class="text-xs text-slate-400 ml-auto group-hover:text-brand-600">3</span>
                            </label>

                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-brand-400 transition-colors"></div>
                                <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">Art de la table</span>
                                <span class="text-xs text-slate-400 ml-auto group-hover:text-brand-600">7</span>
                            </label>
                        </div>
                    </div>

                    <div class="h-px w-full bg-slate-100 mb-8"></div>

                    <!-- Prix -->
                    <div>
                        <h4 class="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">Fourchette de prix</h4>
                        <div class="mb-4">
                            <input type="range" min="0" max="100000" value="50000" class="w-full appearance-none bg-transparent">
                        </div>
                        <div class="flex items-center justify-between text-sm font-bold text-slate-600">
                            <span>0 F</span>
                            <span>Jusqu'à 50.000 F</span>
                        </div>
                    </div>
                </div>
                
                <!-- Contact Store Box -->
                <div class="mt-6 bg-brand-50 rounded-3xl p-5 border border-brand-100 text-center">
                    <i data-lucide="headset" class="w-8 h-8 text-brand-500 mx-auto mb-3"></i>
                    <h4 class="font-bold text-slate-900 text-sm mb-2">Une question ?</h4>
                    <p class="text-xs text-slate-600 mb-4">Contactez directement la boutique pour toute demande spécifique.</p>
                    <button class="w-full bg-white border border-brand-200 text-brand-700 py-2 rounded-xl text-sm font-bold hover:bg-brand-100 transition-colors">
                        Contacter le vendeur
                    </button>
                </div>

            </aside>

            <!-- RIGHT MAIN: PRODUCTS -->
            <div class="flex-1 w-full">
                
                <!-- Header / Sort Bar -->
                <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                    <p class="text-slate-500 font-medium text-sm">Affichage de <span class="font-bold text-slate-900">24</span> produits</p>
                    
                    <div class="flex items-center gap-3 text-sm">
                        <span class="text-slate-400 font-medium">Trier par :</span>
                        <select class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 outline-none cursor-pointer focus:border-brand-400 transition-colors">
                            <option>Recommandés</option>
                            <option>Nouveautés</option>
                            <option>Prix croissant</option>
                            <option>Prix décroissant</option>
                        </select>
                    </div>
                </div>

                <!-- Product Grid -->
                <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    
                    <!-- Product Card 1 -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Epices">
                            <div class="absolute top-2 left-2 bg-brand-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Best-seller</div>
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-brand-600 font-bold uppercase tracking-wide mb-1">Épices & Condiments</p>
                            <a href="product-details.html" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Coffret Épices du Chef - Édition Signature</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">12.000 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 2 -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1563122102-140685959c99?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="VIP Card">
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-brand-600 font-bold uppercase tracking-wide mb-1">Cartes VIP & Pass</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Carte Membre VIP Annuelle</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">50.000 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 3 -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Confiture">
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-brand-600 font-bold uppercase tracking-wide mb-1">Épices & Condiments</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Confiture Mangue Passion Bio</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">4.500 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 4 -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Vin">
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-brand-600 font-bold uppercase tracking-wide mb-1">Cave à Vins</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Vin Blanc Chenin Blanc (Afrique du Sud)</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">18.000 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 5 -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Sirop">
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-brand-600 font-bold uppercase tracking-wide mb-1">Épices & Condiments</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Sirop de Gingembre Maison</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">3.500 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 6 -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1582260662235-901e1d4084bd?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Verres">
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-brand-600 font-bold uppercase tracking-wide mb-1">Art de la table</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Set de 4 verres à Cocktail striés</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">18.000 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 7 -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col">
                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3">
                            <img src="https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Miel">
                            <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="px-1 flex-1 flex flex-col">
                            <p class="text-[10px] text-brand-600 font-bold uppercase tracking-wide mb-1">Épices & Condiments</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1 hover:text-brand-600 transition-colors">Miel Pur de la Savane (500g)</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-900">5.500 F</span>
                                <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors">
                                    <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Product Card 8 -->
                    <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group cursor-pointer flex flex-col relative overflow-hidden">
                        <!-- Out of stock overlay -->
                        <div class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold mb-2">Rupture de stock</span>
                            <button class="text-sm font-bold text-brand-600 hover:text-brand-700 underline">M'avertir</button>
                        </div>

                        <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3 opacity-50">
                            <img src="https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover" alt="Tablier">
                        </div>
                        <div class="px-1 flex-1 flex flex-col opacity-50">
                            <p class="text-[10px] text-brand-600 font-bold uppercase tracking-wide mb-1">Merchandising</p>
                            <a href="#" class="font-bold text-slate-900 text-sm mb-2 leading-tight flex-1">Tablier Noir Brodé "Chef"</a>
                            <div class="flex items-center justify-between mt-auto">
                                <span class="font-extrabold text-slate-500">15.000 F</span>
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
                    <button class="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-colors">
                        <i data-lucide="chevron-right" class="w-5 h-5"></i>
                    </button>
                </div>

            </div>
        </div>
    </main>

    <!-- ==================== FOOTER ==================== -->
    <footer class="bg-white pt-16 pb-10 border-t border-slate-100">
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