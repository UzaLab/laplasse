<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Panier | CIBOOKS</title>
    
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
        
        /* Remove arrows from number input */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    </style>
</head>
<body class="font-sans text-slate-800 bg-[#FAFAFA] selection:bg-brand-200 selection:text-brand-900">

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
                <a href="marketplace.html" class="hover:text-slate-900 transition-colors">Marketplace</a>
                <a href="#" class="hover:text-slate-900 transition-colors">Expériences</a>
            </div>

            <!-- Search Bar (Header) -->
            <div class="hidden md:flex flex-1 max-w-md mx-8 items-center px-4 bg-slate-50 rounded-full h-10 border border-slate-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 mr-2"></i>
                <input type="text" placeholder="Rechercher un produit, une marque..." class="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium">
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-5">
                <button class="text-brand-600 relative">
                    <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                    <span class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">3</span>
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

    <div class="pt-28 pb-8 bg-white border-b border-slate-100">
        <div class="max-w-7xl mx-auto px-6">
            <div class="flex items-center justify-center max-w-2xl mx-auto">
                <!-- Step 1 (Active) -->
                <div class="flex flex-col items-center gap-2 relative z-10">
                    <div class="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg shadow-slate-900/20">1</div>
                    <span class="text-xs font-bold text-slate-900 uppercase tracking-wider">Panier</span>
                </div>
                
                <!-- Line -->
                <div class="flex-1 h-1 bg-slate-100 mx-[-10px] z-0 rounded-full"></div>
                
                <!-- Step 2 -->
                <div class="flex flex-col items-center gap-2 relative z-10">
                    <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold">2</div>
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Livraison</span>
                </div>

                <!-- Line -->
                <div class="flex-1 h-1 bg-slate-100 mx-[-10px] z-0 rounded-full"></div>
                
                <!-- Step 3 -->
                <div class="flex flex-col items-center gap-2 relative z-10">
                    <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold">3</div>
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Paiement</span>
                </div>
            </div>
        </div>
    </div>

    <main class="max-w-7xl mx-auto px-6 py-12">
        <div class="mb-8">
            <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Mon Panier <span class="text-slate-400 font-medium text-2xl">(3 articles)</span></h1>
        </div>

        <div class="flex flex-col lg:flex-row gap-10 items-start">
            
            <!-- LEFT: CART ITEMS LIST -->
            <div class="w-full lg:flex-1 space-y-4">
                
                <!-- Cart Item 1 -->
                <div class="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center relative group transition-colors hover:border-brand-200">
                    <!-- Image -->
                    <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                        <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200" class="w-full h-full object-cover" alt="Epices">
                    </div>
                    
                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                        <a href="boutique.html" class="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1 flex items-center gap-1 hover:underline w-max">
                            <i data-lucide="store" class="w-3 h-3"></i> Villa Maasai
                        </a>
                        <a href="product-details.html" class="font-bold text-slate-900 text-base sm:text-lg hover:text-brand-600 transition-colors truncate block">Coffret Épices du Chef</a>
                        <p class="text-sm text-slate-500 mt-1 font-medium">12.000 FCFA / unité</p>
                    </div>

                    <!-- Controls & Price -->
                    <div class="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 mt-2 sm:mt-0">
                        <!-- Quantity Selector -->
                        <div class="inline-flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl">
                            <button class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-lg transition-all" onclick="updateQty('qty1', -1)">
                                <i data-lucide="minus" class="w-4 h-4"></i>
                            </button>
                            <input type="number" id="qty1" value="1" min="1" max="10" class="w-8 text-center font-bold text-slate-900 text-sm bg-transparent outline-none" readonly>
                            <button class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-lg transition-all" onclick="updateQty('qty1', 1)">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                        
                        <!-- Total Price -->
                        <span class="font-extrabold text-slate-900 text-lg sm:w-28 text-right">12.000 F</span>
                        
                        <!-- Remove Btn -->
                        <button class="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer l'article">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <!-- Cart Item 2 -->
                <div class="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center relative group transition-colors hover:border-brand-200">
                    <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                        <img src="https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=200" class="w-full h-full object-cover" alt="Robe">
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <a href="#" class="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1 hover:underline w-max">
                            <i data-lucide="store" class="w-3 h-3"></i> Yalé Design
                        </a>
                        <a href="#" class="font-bold text-slate-900 text-base sm:text-lg hover:text-brand-600 transition-colors truncate block">Robe Cocktail Wax Premium</a>
                        <p class="text-sm text-slate-500 mt-1 font-medium">Taille M • 35.000 FCFA / unité</p>
                    </div>

                    <div class="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 mt-2 sm:mt-0">
                        <div class="inline-flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl">
                            <button class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-lg transition-all" onclick="updateQty('qty2', -1)">
                                <i data-lucide="minus" class="w-4 h-4"></i>
                            </button>
                            <input type="number" id="qty2" value="1" min="1" max="10" class="w-8 text-center font-bold text-slate-900 text-sm bg-transparent outline-none" readonly>
                            <button class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-lg transition-all" onclick="updateQty('qty2', 1)">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <span class="font-extrabold text-slate-900 text-lg sm:w-28 text-right">35.000 F</span>
                        <button class="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer l'article">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <!-- Cart Item 3 -->
                <div class="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center relative group transition-colors hover:border-brand-200">
                    <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                        <img src="https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=200" class="w-full h-full object-cover" alt="Miel">
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <a href="#" class="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-1 flex items-center gap-1 hover:underline w-max">
                            <i data-lucide="store" class="w-3 h-3"></i> Le Comptoir Bio
                        </a>
                        <a href="#" class="font-bold text-slate-900 text-base sm:text-lg hover:text-brand-600 transition-colors truncate block">Miel Pur de Korhogo</a>
                        <p class="text-sm text-slate-500 mt-1 font-medium">Pot de 500g • 4.500 FCFA / unité</p>
                    </div>

                    <div class="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 mt-2 sm:mt-0">
                        <div class="inline-flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl">
                            <button class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-lg transition-all" onclick="updateQty('qty3', -1)">
                                <i data-lucide="minus" class="w-4 h-4"></i>
                            </button>
                            <input type="number" id="qty3" value="1" min="1" max="10" class="w-8 text-center font-bold text-slate-900 text-sm bg-transparent outline-none" readonly>
                            <button class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-lg transition-all" onclick="updateQty('qty3', 1)">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <span class="font-extrabold text-slate-900 text-lg sm:w-28 text-right">4.500 F</span>
                        <button class="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer l'article">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <!-- Back to shop link -->
                <div class="pt-4">
                    <a href="marketplace.html" class="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Continuer mes achats
                    </a>
                </div>

            </div>

            <!-- RIGHT: ORDER SUMMARY -->
            <div class="w-full lg:w-[400px] shrink-0">
                <div class="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/40 lg:sticky lg:top-28">
                    <h3 class="text-xl font-extrabold text-slate-900 mb-6">Résumé de la commande</h3>
                    
                    <div class="space-y-4 mb-6">
                        <div class="flex justify-between items-center text-slate-600 font-medium">
                            <span>Sous-total (3 articles)</span>
                            <span class="font-bold text-slate-900">51.500 F</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-600 font-medium">
                            <span>TVA (18%)</span>
                            <span class="font-bold text-slate-900">Inclus</span>
                        </div>
                        <div class="flex justify-between items-center text-slate-600 font-medium">
                            <span>Frais de livraison</span>
                            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">Calculé à l'étape 2</span>
                        </div>
                    </div>

                    <div class="h-px w-full bg-slate-100 mb-6"></div>

                    <!-- Promo code -->
                    <div class="mb-6">
                        <label class="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Code Promo</label>
                        <div class="flex gap-2">
                            <input type="text" placeholder="Entrez votre code" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all">
                            <button class="bg-slate-900 text-white px-4 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                                Appliquer
                            </button>
                        </div>
                    </div>

                    <div class="h-px w-full bg-slate-100 mb-6"></div>

                    <!-- Total -->
                    <div class="flex justify-between items-end mb-8">
                        <div>
                            <span class="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total estimé</span>
                            <span class="text-xs text-slate-400 font-medium">Toutes taxes comprises</span>
                        </div>
                        <span class="text-3xl font-extrabold text-brand-600 leading-none">51.500 F</span>
                    </div>

                    <!-- Checkout CTA -->
                    <button class="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group mb-6">
                        Procéder à la livraison <i data-lucide="arrow-right" class="w-5 h-5 group-hover:translate-x-1 transition-transform"></i>
                    </button>

                    <!-- Secure Payment badges -->
                    <div class="text-center">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-1">
                            <i data-lucide="lock" class="w-3 h-3"></i> Paiement 100% sécurisé
                        </p>
                        <div class="flex items-center justify-center gap-2">
                            <div class="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-600">VISA</div>
                            <div class="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-600">MasterCard</div>
                            <div class="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-600">Mobile Money</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </main>

    <!-- ==================== CROSS-SELLING ==================== -->
    <section class="py-16 bg-white border-t border-slate-100 mt-8">
        <div class="max-w-7xl mx-auto px-6">
            <div class="flex items-center justify-between mb-8">
                <h2 class="text-2xl font-extrabold text-slate-900">Complétez votre panier</h2>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <!-- Related Product 1 -->
                <div class="group cursor-pointer">
                    <div class="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <img src="https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Confiture">
                        <button class="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                            <i data-lucide="heart" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="px-2">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Villa Maasai</p>
                        <h4 class="font-bold text-slate-900 mb-2 truncate">Confiture Mangue Passion</h4>
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-brand-600">4.500 F</span>
                            <button class="text-[10px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-900 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Related Product 2 -->
                <div class="group cursor-pointer">
                    <div class="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <img src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Sirop">
                        <button class="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                            <i data-lucide="heart" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="px-2">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Le Comptoir Bio</p>
                        <h4 class="font-bold text-slate-900 mb-2 truncate">Sirop Hibiscus Premium</h4>
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-brand-600">6.500 F</span>
                            <button class="text-[10px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-900 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Related Product 3 -->
                <div class="group cursor-pointer hidden md:block">
                    <div class="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <img src="https://images.unsplash.com/photo-1582260662235-901e1d4084bd?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Verres">
                        <button class="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                            <i data-lucide="heart" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="px-2">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Kajazoma</p>
                        <h4 class="font-bold text-slate-900 mb-2 truncate">Set de 4 verres striés</h4>
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-brand-600">18.000 F</span>
                            <button class="text-[10px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-900 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Related Product 4 -->
                <div class="group cursor-pointer hidden md:block">
                    <div class="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
                        <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Livre">
                        <button class="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                            <i data-lucide="heart" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div class="px-2">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Bushman Café</p>
                        <h4 class="font-bold text-slate-900 mb-2 truncate">Livre "Art of Babi"</h4>
                        <div class="flex items-center justify-between">
                            <span class="font-extrabold text-brand-600">25.000 F</span>
                            <button class="text-[10px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-900 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                                Ajouter
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
                        <li><a href="marketplace.html" class="hover:text-brand-600 transition-colors">Marketplace</a></li>
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

        // Simple script for quantity visual update
        function updateQty(id, change) {
            const input = document.getElementById(id);
            let val = parseInt(input.value);
            val += change;
            if (val >= parseInt(input.min) && val <= parseInt(input.max)) {
                input.value = val;
            }
        }
    </script>
</body>
</html>