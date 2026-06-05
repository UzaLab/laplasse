<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CIBOOKS | L'élégance ivoirienne à portée de clic</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <!-- Google Fonts -->
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
    <nav class="fixed w-full z-50 glass-panel border-b border-slate-200/50 transition-all duration-300" id="navbar">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            
            <!-- Logo -->
            <div class="flex items-center gap-2 cursor-pointer">
                <div class="w-8 h-8 bg-slate-900 text-brand-500 rounded-lg flex items-center justify-center">
                    <i data-lucide="book-open" class="w-5 h-5"></i>
                </div>
                <span class="text-xl font-extrabold tracking-tight text-slate-900">CIBOOKS</span>
            </div>

            <!-- Desktop Links -->
            <div class="hidden md:flex items-center gap-8 font-semibold text-sm text-slate-500">
                <a href="#" class="text-slate-900 relative after:content-[''] after:absolute after:-bottom-7 after:left-0 after:w-full after:h-0.5 after:bg-brand-500">Découvrir</a>
                <a href="#" class="hover:text-slate-900 transition-colors">Marketplace</a>
                <a href="#" class="hover:text-slate-900 transition-colors">Expériences</a>
                <a href="#" class="hover:text-slate-900 transition-colors flex items-center gap-1">Carte <i data-lucide="map" class="w-4 h-4"></i></a>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-5">
                <button class="text-slate-600 hover:text-brand-600 transition-colors hidden md:block">
                    <i data-lucide="search" class="w-5 h-5"></i>
                </button>
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

    <!-- ==================== HERO SECTION ==================== -->
    <header class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <!-- Abstract Shapes Background -->
        <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-100 rounded-full blur-[100px] -z-10 opacity-60 translate-x-1/3 -translate-y-1/3"></div>
        <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[80px] -z-10 opacity-60 -translate-x-1/3 translate-y-1/3"></div>

        <div class="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            <!-- Hero Text -->
            <div class="flex-1 text-center lg:text-left">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
                    <i data-lucide="star" class="w-3.5 h-3.5 fill-brand-500"></i> Abidjan Premium Lifestyle
                </div>
                
                <h1 class="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
                    L'élégance ivoirienne, <br/>
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-amber-300">à portée de clic.</span>
                </h1>
                
                <p class="text-lg text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0">
                    Réservez votre table dans les lieux les plus exclusifs et achetez leurs produits signatures directement depuis notre marketplace hybride.
                </p>

                <!-- Floating Search Bar -->
                <div class="bg-white p-3 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 max-w-2xl mx-auto lg:mx-0 flex flex-col sm:flex-row gap-3">
                    <div class="flex-1 flex items-center px-4 bg-slate-50 rounded-xl border border-slate-100 h-14 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
                        <i data-lucide="search" class="w-5 h-5 text-slate-400 mr-3"></i>
                        <input type="text" placeholder="Restaurant, Spa, Concept Store..." class="w-full bg-transparent outline-none text-slate-900 font-medium placeholder:text-slate-400">
                    </div>
                    <button class="bg-slate-900 text-white h-14 px-8 rounded-xl font-bold hover:bg-slate-800 transition-colors whitespace-nowrap shadow-lg shadow-slate-900/20">
                        Explorer
                    </button>
                </div>
            </div>

            <!-- Hero Images Composition -->
            <div class="flex-1 relative hidden lg:block w-full max-w-lg">
                <div class="absolute inset-0 bg-gradient-to-tr from-brand-100 to-transparent rounded-[40px] transform rotate-3 scale-105 -z-10"></div>
                <img src="https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800" class="w-full h-[500px] object-cover rounded-[40px] shadow-2xl border-4 border-white" alt="Interior">
                
                <!-- Floating Mini Card -->
                <div class="absolute -bottom-8 -left-12 glass-panel p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce" style="animation-duration: 3s;">
                    <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200" class="w-14 h-14 rounded-xl object-cover shadow-sm" alt="Product">
                    <div>
                        <p class="text-[10px] font-bold text-brand-600 uppercase tracking-wide">Acheté à l'instant</p>
                        <p class="font-bold text-slate-900 text-sm">Coffret Épices Chef</p>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- ==================== CATEGORIES ==================== -->
    <section class="py-12 border-y border-slate-100 bg-white">
        <div class="max-w-7xl mx-auto px-6">
            <div class="flex flex-wrap justify-center gap-4 lg:gap-8">
                <!-- Cat 1 -->
                <button class="group flex items-center gap-3 px-6 py-3 rounded-full border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-all">
                    <i data-lucide="utensils-crossed" class="w-5 h-5 text-slate-400 group-hover:text-brand-600"></i>
                    <span class="font-bold text-slate-700 group-hover:text-brand-700">Gastronomie</span>
                </button>
                <!-- Cat 2 -->
                <button class="group flex items-center gap-3 px-6 py-3 rounded-full border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-all">
                    <i data-lucide="wine" class="w-5 h-5 text-slate-400 group-hover:text-brand-600"></i>
                    <span class="font-bold text-slate-700 group-hover:text-brand-700">Lounge & Rooftop</span>
                </button>
                <!-- Cat 3 -->
                <button class="group flex items-center gap-3 px-6 py-3 rounded-full border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-all">
                    <i data-lucide="gem" class="w-5 h-5 text-slate-400 group-hover:text-brand-600"></i>
                    <span class="font-bold text-slate-700 group-hover:text-brand-700">Concept Stores</span>
                </button>
                <!-- Cat 4 -->
                <button class="group flex items-center gap-3 px-6 py-3 rounded-full border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-all">
                    <i data-lucide="sparkles" class="w-5 h-5 text-slate-400 group-hover:text-brand-600"></i>
                    <span class="font-bold text-slate-700 group-hover:text-brand-700">Spas & Bien-être</span>
                </button>
            </div>
        </div>
    </section>

    <!-- ==================== HYBRID SHOWCASE (PLACES + SHOP) ==================== -->
    <section class="py-24 bg-[#FAFAFA]">
        <div class="max-w-7xl mx-auto px-6">
            
            <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h2 class="text-3xl font-extrabold text-slate-900 mb-2">La Sélection CIBOOKS</h2>
                    <p class="text-slate-500 text-lg">Les adresses incontournables et leurs produits exclusifs.</p>
                </div>
                <a href="#" class="inline-flex items-center gap-2 font-bold text-brand-600 hover:text-brand-700 transition-colors">
                    Voir toutes les adresses <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </a>
            </div>

            <!-- Grid 3 Columns -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                <!-- Spot Card 1 -->
                <article class="bg-white rounded-[32px] p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300 group">
                    <div class="h-56 rounded-[24px] overflow-hidden relative mb-5">
                        <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Villa Maasai">
                        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-slate-900 flex items-center gap-1 shadow-sm">
                            <i data-lucide="star" class="w-3.5 h-3.5 fill-brand-500 text-brand-500"></i> 4.9
                        </div>
                    </div>
                    
                    <div class="px-2">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <span class="text-brand-600 text-[10px] font-bold uppercase tracking-widest mb-1 block">Gastronomie & Jazz</span>
                                <h3 class="text-xl font-extrabold text-slate-900">Villa Maasai</h3>
                            </div>
                            <button class="w-10 h-10 rounded-full bg-slate-50 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center text-slate-400">
                                <i data-lucide="heart" class="w-5 h-5"></i>
                            </button>
                        </div>
                        <p class="text-sm text-slate-500 mb-6 flex items-center gap-1.5">
                            <i data-lucide="map-pin" class="w-4 h-4"></i> Zone 4, Abidjan
                        </p>

                        <!-- Micro-Marketplace Integration -->
                        <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-4 group-hover:border-brand-200 transition-colors cursor-pointer">
                            <div class="w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0">
                                <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200" class="w-full h-full object-cover" alt="Product">
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-1.5 mb-1">
                                    <i data-lucide="store" class="w-3 h-3 text-brand-600"></i>
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">La Boutique</span>
                                </div>
                                <h4 class="text-sm font-bold text-slate-900 truncate">Coffret Épices Chef</h4>
                                <p class="text-xs font-bold text-brand-600 mt-0.5">12.000 FCFA</p>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-900 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="mt-4 grid grid-cols-2 gap-3">
                            <button class="py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
                                Voir le lieu
                            </button>
                            <button class="py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
                                Réserver
                            </button>
                        </div>
                    </div>
                </article>

                <!-- Spot Card 2 -->
                <article class="bg-white rounded-[32px] p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300 group">
                    <div class="h-56 rounded-[24px] overflow-hidden relative mb-5">
                        <img src="https://images.unsplash.com/photo-1570554520913-ce219f885e35?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Noom Rooftop">
                        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-slate-900 flex items-center gap-1 shadow-sm">
                            <i data-lucide="star" class="w-3.5 h-3.5 fill-brand-500 text-brand-500"></i> 4.8
                        </div>
                    </div>
                    
                    <div class="px-2">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <span class="text-brand-600 text-[10px] font-bold uppercase tracking-widest mb-1 block">Bar & Piscine</span>
                                <h3 class="text-xl font-extrabold text-slate-900">Noom Rooftop</h3>
                            </div>
                            <button class="w-10 h-10 rounded-full bg-slate-50 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center text-slate-400">
                                <i data-lucide="heart" class="w-5 h-5"></i>
                            </button>
                        </div>
                        <p class="text-sm text-slate-500 mb-6 flex items-center gap-1.5">
                            <i data-lucide="map-pin" class="w-4 h-4"></i> Plateau, Abidjan
                        </p>

                        <!-- Micro-Marketplace Integration -->
                        <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-4 group-hover:border-brand-200 transition-colors cursor-pointer">
                            <div class="w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0">
                                <img src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=200" class="w-full h-full object-cover" alt="Product">
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-1.5 mb-1">
                                    <i data-lucide="store" class="w-3 h-3 text-brand-600"></i>
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">La Boutique</span>
                                </div>
                                <h4 class="text-sm font-bold text-slate-900 truncate">Day Pass VIP</h4>
                                <p class="text-xs font-bold text-brand-600 mt-0.5">25.000 FCFA</p>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-900 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="mt-4 grid grid-cols-2 gap-3">
                            <button class="py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
                                Voir le lieu
                            </button>
                            <button class="py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
                                Réserver
                            </button>
                        </div>
                    </div>
                </article>

                <!-- Spot Card 3 -->
                <article class="bg-white rounded-[32px] p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300 group">
                    <div class="h-56 rounded-[24px] overflow-hidden relative mb-5">
                        <img src="https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Yalé Design">
                        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-slate-900 flex items-center gap-1 shadow-sm">
                            <i data-lucide="star" class="w-3.5 h-3.5 fill-brand-500 text-brand-500"></i> 4.9
                        </div>
                    </div>
                    
                    <div class="px-2">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <span class="text-brand-600 text-[10px] font-bold uppercase tracking-widest mb-1 block">Mode Ivoirienne</span>
                                <h3 class="text-xl font-extrabold text-slate-900">Yalé Design</h3>
                            </div>
                            <button class="w-10 h-10 rounded-full bg-slate-50 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center text-slate-400">
                                <i data-lucide="heart" class="w-5 h-5"></i>
                            </button>
                        </div>
                        <p class="text-sm text-slate-500 mb-6 flex items-center gap-1.5">
                            <i data-lucide="map-pin" class="w-4 h-4"></i> Cocody Vallons
                        </p>

                        <!-- Micro-Marketplace Integration -->
                        <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-4 group-hover:border-brand-200 transition-colors cursor-pointer">
                            <div class="w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0">
                                <img src="https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=200" class="w-full h-full object-cover" alt="Product">
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-1.5 mb-1">
                                    <i data-lucide="store" class="w-3 h-3 text-brand-600"></i>
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">La Boutique</span>
                                </div>
                                <h4 class="text-sm font-bold text-slate-900 truncate">Robe Cocktail Wax</h4>
                                <p class="text-xs font-bold text-brand-600 mt-0.5">35.000 FCFA</p>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-900 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="mt-4 grid grid-cols-2 gap-3">
                            <button class="py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors col-span-2">
                                Voir la boutique complète
                            </button>
                        </div>
                    </div>
                </article>

            </div>
        </div>
    </section>

    <!-- ==================== MARKETPLACE DIRECT ==================== -->
    <section class="py-24 bg-white border-t border-slate-100">
        <div class="max-w-7xl mx-auto px-6">
            
            <div class="text-center max-w-2xl mx-auto mb-16">
                <i data-lucide="shopping-bag" class="w-8 h-8 text-brand-500 mx-auto mb-4"></i>
                <h2 class="text-3xl font-extrabold text-slate-900 mb-4">Achetez l'expérience.</h2>
                <p class="text-slate-500 text-lg">Parcourez les produits de vos lieux favoris et faites-vous livrer chez vous. L'artisanat et le goût d'Abidjan en livraison.</p>
            </div>

            <!-- Products Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                
                <!-- Product 1 -->
                <div class="group cursor-pointer">
                    <div class="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <img src="https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Miel">
                        <button class="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                            <i data-lucide="heart" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="px-2">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Le Comptoir Bio</p>
                        <h4 class="font-bold text-slate-900 mb-2">Miel Pur de Korhogo</h4>
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-brand-600">4.500 F</span>
                            <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:bg-brand-500 transition-colors">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Product 2 -->
                <div class="group cursor-pointer">
                    <div class="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <img src="https://images.unsplash.com/photo-1616047006789-b7af5afb8c2e?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Vase">
                        <button class="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                            <i data-lucide="heart" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="px-2">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Kajazoma</p>
                        <h4 class="font-bold text-slate-900 mb-2">Vase Artisanal Baoulé</h4>
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-brand-600">35.000 F</span>
                            <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:bg-brand-500 transition-colors">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Product 3 -->
                <div class="group cursor-pointer">
                    <div class="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Livre">
                        <div class="absolute top-4 left-4 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                            Nouveau
                        </div>
                        <button class="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                            <i data-lucide="heart" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="px-2">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Bushman Café</p>
                        <h4 class="font-bold text-slate-900 mb-2">Livre "Art of Babi"</h4>
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-brand-600">25.000 F</span>
                            <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:bg-brand-500 transition-colors">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Product 4 -->
                <div class="group cursor-pointer">
                    <div class="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <img src="https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Huile">
                        <button class="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                            <i data-lucide="heart" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="px-2">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Nappy Queen Spa</p>
                        <h4 class="font-bold text-slate-900 mb-2">Huile Karité Bio</h4>
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-brand-600">5.000 F</span>
                            <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:bg-brand-500 transition-colors">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            <div class="text-center mt-12">
                <button class="inline-flex items-center gap-2 font-bold text-slate-900 border-b-2 border-slate-900 pb-1 hover:text-brand-600 hover:border-brand-600 transition-colors">
                    Explorer la Marketplace <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    </section>

    <!-- ==================== B2B CTA SECTION ==================== -->
    <section class="py-24 bg-slate-900 text-white relative overflow-hidden">
        <!-- Decor -->
        <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#fbbf24 1px, transparent 1px); background-size: 32px 32px;"></div>
        
        <div class="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div class="flex-1 text-center md:text-left">
                <h2 class="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">Vous tenez un établissement de qualité ?</h2>
                <p class="text-slate-400 text-lg mb-8 max-w-xl mx-auto md:mx-0">
                    Rejoignez CIBOOKS. Gérez vos réservations et vendez vos produits en ligne sur une seule plateforme dédiée au premium ivoirien.
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <button class="bg-brand-500 text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20">
                        Inscrire mon établissement
                    </button>
                    <button class="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors">
                        Découvrir les offres Pro
                    </button>
                </div>
            </div>
            
            <div class="flex-1 w-full max-w-md hidden md:block">
                <div class="bg-slate-800 p-6 rounded-[32px] border border-slate-700 shadow-2xl transform rotate-3">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-12 h-12 bg-slate-700 rounded-full"></div>
                        <div>
                            <div class="w-32 h-4 bg-slate-600 rounded-full mb-2"></div>
                            <div class="w-20 h-3 bg-slate-700 rounded-full"></div>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div class="bg-slate-700/50 p-4 rounded-2xl flex justify-between items-center border border-slate-600">
                            <div class="w-24 h-3 bg-slate-500 rounded-full"></div>
                            <div class="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center"><i data-lucide="check" class="w-4 h-4 text-green-400"></i></div>
                        </div>
                        <div class="bg-slate-700/50 p-4 rounded-2xl flex justify-between items-center border border-slate-600">
                            <div class="w-32 h-3 bg-slate-500 rounded-full"></div>
                            <div class="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center"><i data-lucide="shopping-bag" class="w-4 h-4 text-brand-400"></i></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== FOOTER ==================== -->
    <footer class="bg-white pt-20 pb-10 border-t border-slate-100">
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
                    <div class="flex gap-4">
                        <a href="#" class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><i data-lucide="instagram" class="w-5 h-5"></i></a>
                        <a href="#" class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><i data-lucide="twitter" class="w-5 h-5"></i></a>
                        <a href="#" class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><i data-lucide="facebook" class="w-5 h-5"></i></a>
                    </div>
                </div>

                <!-- Links col 1 -->
                <div>
                    <h4 class="font-extrabold text-slate-900 mb-6">Explorer</h4>
                    <ul class="space-y-4 text-sm text-slate-500 font-medium">
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Restaurants</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Bars & Lounges</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Spas & Bien-être</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Concept Stores</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Marketplace</a></li>
                    </ul>
                </div>

                <!-- Links col 2 -->
                <div>
                    <h4 class="font-extrabold text-slate-900 mb-6">Business</h4>
                    <ul class="space-y-4 text-sm text-slate-500 font-medium">
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Inscrire son lieu</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Accès Partenaire</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Solutions de paiement</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Tarifs Pro</a></li>
                    </ul>
                </div>

                <!-- Links col 3 -->
                <div>
                    <h4 class="font-extrabold text-slate-900 mb-6">Aide & Contact</h4>
                    <ul class="space-y-4 text-sm text-slate-500 font-medium">
                        <li><a href="#" class="hover:text-brand-600 transition-colors">FAQ Utilisateurs</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Nous contacter</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Conditions Générales</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Politique de confidentialité</a></li>
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
        // Initialize Icons
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