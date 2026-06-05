<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coffret Épices du Chef - CIBOOKS</title>
    
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
        
        /* Custom quantity input styling */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    </style>
</head>
<body class="font-sans text-slate-800 bg-[#FAFAFA] selection:bg-brand-200 selection:text-brand-900">

    <!-- ==================== NAVIGATION ==================== -->
    <nav class="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300 shadow-sm" id="navbar">
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
                <input type="text" placeholder="Rechercher un produit, un lieu..." class="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium">
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

    <!-- ==================== BREADCRUMBS ==================== -->
    <div class="pt-28 pb-4 bg-white">
        <div class="max-w-7xl mx-auto px-6">
            <nav class="flex items-center gap-2 text-sm font-medium text-slate-500">
                <a href="index.html" class="hover:text-slate-900 transition-colors">Accueil</a>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                <a href="#" class="hover:text-slate-900 transition-colors">Marketplace</a>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                <a href="#" class="hover:text-slate-900 transition-colors">Épicerie Fine</a>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                <span class="text-slate-900 font-bold">Coffret Épices du Chef</span>
            </nav>
        </div>
    </div>

    <!-- ==================== MAIN PRODUCT SECTION ==================== -->
    <main class="bg-white pb-16">
        <div class="max-w-7xl mx-auto px-6">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                
                <!-- LEFT COLUMN: Image Gallery -->
                <div class="lg:col-span-7">
                    <!-- Main Image -->
                    <div class="aspect-[4/3] w-full bg-slate-50 rounded-[32px] overflow-hidden relative border border-slate-100 group">
                        <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200" alt="Coffret Epices" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-zoom-in">
                        
                        <!-- Badges -->
                        <div class="absolute top-4 left-4 flex flex-col gap-2">
                            <span class="bg-white/90 backdrop-blur-sm text-brand-600 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                                <i data-lucide="sparkles" class="w-3 h-3"></i> Best-Seller
                            </span>
                        </div>
                        
                        <!-- Wishlist button overlay -->
                        <button class="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white transition-all shadow-sm">
                            <i data-lucide="heart" class="w-6 h-6"></i>
                        </button>
                    </div>

                    <!-- Thumbnails -->
                    <div class="grid grid-cols-4 gap-4 mt-4">
                        <button class="aspect-square rounded-2xl overflow-hidden border-2 border-slate-900 relative">
                            <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=300" class="w-full h-full object-cover" alt="Thumb 1">
                        </button>
                        <button class="aspect-square rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-300 transition-colors relative opacity-60 hover:opacity-100">
                            <img src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=300" class="w-full h-full object-cover" alt="Thumb 2">
                        </button>
                        <button class="aspect-square rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-300 transition-colors relative opacity-60 hover:opacity-100">
                            <img src="https://images.unsplash.com/photo-1606913084603-3e7702b01627?auto=format&fit=crop&q=80&w=300" class="w-full h-full object-cover" alt="Thumb 3">
                        </button>
                        <button class="aspect-square rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-300 transition-colors relative opacity-60 hover:opacity-100 bg-slate-50 flex items-center justify-center group">
                            <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=300" class="w-full h-full object-cover blur-sm opacity-50" alt="Thumb 4">
                            <span class="absolute inset-0 flex items-center justify-center text-slate-900 font-bold group-hover:scale-110 transition-transform">+2</span>
                        </button>
                    </div>
                </div>

                <!-- RIGHT COLUMN: Product Info -->
                <div class="lg:col-span-5 flex flex-col h-full">
                    
                    <!-- Vendeur / Établissement -->
                    <a href="place-details.html" class="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors mb-4 w-max">
                        <div class="w-6 h-6 rounded-md bg-slate-100 overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=100" class="w-full h-full object-cover" alt="Logo Vendeur">
                        </div>
                        Villa Maasai
                        <i data-lucide="chevron-right" class="w-4 h-4"></i>
                    </a>

                    <!-- Title & Rating -->
                    <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                        Coffret Épices du Chef - Édition Signature
                    </h1>
                    
                    <div class="flex items-center gap-4 mb-6">
                        <div class="flex items-center gap-1">
                            <i data-lucide="star" class="w-4 h-4 fill-brand-400 text-brand-400"></i>
                            <i data-lucide="star" class="w-4 h-4 fill-brand-400 text-brand-400"></i>
                            <i data-lucide="star" class="w-4 h-4 fill-brand-400 text-brand-400"></i>
                            <i data-lucide="star" class="w-4 h-4 fill-brand-400 text-brand-400"></i>
                            <i data-lucide="star-half" class="w-4 h-4 fill-brand-400 text-brand-400"></i>
                            <span class="text-sm font-bold text-slate-900 ml-1">4.8</span>
                            <span class="text-sm text-slate-400 underline cursor-pointer ml-1">(24 avis)</span>
                        </div>
                        <div class="w-1 h-1 rounded-full bg-slate-300"></div>
                        <span class="text-sm font-bold text-green-600 flex items-center gap-1">
                            <i data-lucide="check-circle-2" class="w-4 h-4"></i> En stock (5)
                        </span>
                    </div>

                    <!-- Price -->
                    <div class="mb-8">
                        <div class="flex items-end gap-3">
                            <span class="text-4xl font-extrabold text-brand-600">12.000 FCFA</span>
                        </div>
                        <p class="text-sm text-slate-500 mt-1">Taxes incluses. Frais de livraison calculés à l'étape suivante.</p>
                    </div>

                    <!-- Short Description -->
                    <p class="text-slate-600 leading-relaxed text-base mb-8">
                        Retrouvez l'âme de la Villa Maasai dans votre cuisine. Ce coffret premium rassemble les 4 épices signatures utilisées par notre Chef pour ses marinades et sauces claires. Idéal pour sublimer vos viandes et poissons.
                    </p>

                    <div class="h-px w-full bg-slate-100 mb-8"></div>

                    <!-- Add to Cart Form -->
                    <div class="space-y-6">
                        <!-- Quantity -->
                        <div>
                            <label class="block text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Quantité</label>
                            <div class="inline-flex items-center p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                                <button class="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm transition-all" onclick="document.getElementById('qty').stepDown()">
                                    <i data-lucide="minus" class="w-4 h-4"></i>
                                </button>
                                <input type="number" id="qty" value="1" min="1" max="5" class="w-12 text-center bg-transparent font-bold text-slate-900 outline-none" readonly>
                                <button class="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm transition-all" onclick="document.getElementById('qty').stepUp()">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Buttons -->
                        <div class="flex flex-col sm:flex-row gap-4 pt-2">
                            <button class="flex-1 bg-slate-900 text-white h-14 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group">
                                <i data-lucide="shopping-bag" class="w-5 h-5 group-hover:-translate-y-1 transition-transform"></i> Ajouter au panier
                            </button>
                            <button class="flex-1 bg-brand-50 border-2 border-brand-200 text-brand-700 h-14 rounded-2xl font-bold hover:bg-brand-100 hover:border-brand-300 transition-colors">
                                Acheter maintenant
                            </button>
                        </div>
                    </div>

                    <!-- Features / Delivery Info -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                            <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 shrink-0 shadow-sm">
                                <i data-lucide="truck" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-900 text-sm">Livraison Rapide</h4>
                                <p class="text-xs text-slate-500 mt-0.5">Partout à Abidjan sous 24h.</p>
                            </div>
                        </div>
                        
                        <div class="bg-brand-50 p-4 rounded-2xl border border-brand-100 flex items-start gap-3">
                            <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-600 shrink-0 shadow-sm">
                                <i data-lucide="store" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-900 text-sm">Click & Collect</h4>
                                <p class="text-xs text-slate-500 mt-0.5">Retrait gratuit à la Villa Maasai.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </main>

    <!-- ==================== TABS SECTION (DETAILS) ==================== -->
    <section class="border-t border-slate-100 bg-[#FAFAFA] py-16">
        <div class="max-w-7xl mx-auto px-6">
            
            <div class="max-w-3xl mx-auto">
                <!-- Tab Headers -->
                <div class="flex items-center justify-center gap-8 border-b border-slate-200 mb-8">
                    <button class="pb-4 font-bold text-brand-600 border-b-2 border-brand-500">Description détaillée</button>
                    <button class="pb-4 font-medium text-slate-500 hover:text-slate-800 transition-colors">Composition & Origine</button>
                    <button class="pb-4 font-medium text-slate-500 hover:text-slate-800 transition-colors">Avis clients (24)</button>
                </div>

                <!-- Tab Content 1 (Active) -->
                <div class="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed">
                    <p>
                        Créé par notre chef exécutif, ce coffret est un voyage gustatif au cœur de la gastronomie ivoirienne modernisée. Chaque mélange a été torréfié et moulu artisanalement dans nos cuisines de la Villa Maasai.
                    </p>
                    <h3 class="text-slate-900 font-bold mt-8 mb-4">Le coffret comprend :</h3>
                    <ul class="space-y-3">
                        <li class="flex items-start gap-3">
                            <i data-lucide="check" class="w-5 h-5 text-brand-500 shrink-0 mt-0.5"></i>
                            <span><strong>Mélange "Kedjenou Secret" (50g) :</strong> Un équilibre parfait de gingembre, piment doux et herbes aromatiques pour réussir vos volailles.</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <i data-lucide="check" class="w-5 h-5 text-brand-500 shrink-0 mt-0.5"></i>
                            <span><strong>Poudre de Soumara Premium (40g) :</strong> L'umami africain par excellence, sélectionné auprès de coopératives de Katiola.</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <i data-lucide="check" class="w-5 h-5 text-brand-500 shrink-0 mt-0.5"></i>
                            <span><strong>Épices Braisé (60g) :</strong> Le rub incontournable pour vos poissons et poulets grillés.</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <i data-lucide="check" class="w-5 h-5 text-brand-500 shrink-0 mt-0.5"></i>
                            <span><strong>Piment Noir Fumé (30g) :</strong> Pour les amateurs de sensations fortes, avec un goût fumé unique.</span>
                        </li>
                    </ul>
                    <p class="mt-8">
                        Présenté dans un luxueux coffret en bois local, c'est également le cadeau idéal pour les passionnés de cuisine.
                    </p>
                </div>
            </div>

        </div>
    </section>

    <!-- ==================== CROSS-SELL / RELATED ==================== -->
    <section class="py-16 bg-white border-t border-slate-100">
        <div class="max-w-7xl mx-auto px-6">
            <div class="flex items-center justify-between mb-8">
                <h2 class="text-2xl font-extrabold text-slate-900">Dans la même boutique</h2>
                <a href="place-details.html" class="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">Voir la boutique Villa Maasai <i data-lucide="arrow-right" class="w-4 h-4"></i></a>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <!-- Related Product 1 -->
                <div class="group cursor-pointer">
                    <div class="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <img src="https://images.unsplash.com/photo-1563122102-140685959c99?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="VIP Card">
                        <button class="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                            <i data-lucide="heart" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="px-2">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Villa Maasai</p>
                        <h4 class="font-bold text-slate-900 mb-2 truncate">Carte Membre VIP Annuelle</h4>
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-brand-600">50.000 F</span>
                            <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:bg-brand-500 transition-colors">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Related Product 2 -->
                <div class="group cursor-pointer">
                    <div class="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <img src="https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Confiture">
                        <button class="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                            <i data-lucide="heart" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="px-2">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Villa Maasai</p>
                        <h4 class="font-bold text-slate-900 mb-2 truncate">Confiture Mangue Passion</h4>
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-brand-600">4.500 F</span>
                            <button class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:bg-brand-500 transition-colors">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

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