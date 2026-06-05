<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Espace Client | CIBOOKS</title>
    
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
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="font-sans text-slate-800 bg-[#FAFAFA] flex h-screen overflow-hidden selection:bg-brand-200 selection:text-brand-900">

    <!-- ==================== SIDEBAR ==================== -->
    <aside class="w-72 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 transition-transform duration-300 absolute lg:relative z-50 transform -translate-x-full lg:translate-x-0" id="sidebar">
        
        <!-- Logo & Branding -->
        <div class="h-20 flex items-center px-6 border-b border-slate-100 shrink-0">
            <a href="index.html" class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-900 text-brand-500 rounded-xl flex items-center justify-center shadow-md">
                    <i data-lucide="book-open" class="w-6 h-6"></i>
                </div>
                <div>
                    <h1 class="text-xl font-extrabold tracking-tight text-slate-900">CIBOOKS<span class="text-brand-500">.</span></h1>
                </div>
            </a>
            <!-- Close button mobile -->
            <button class="lg:hidden ml-auto text-slate-400 hover:text-slate-900" onclick="toggleSidebar()">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
        </div>

        <!-- Navigation Links -->
        <div class="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold transition-colors shadow-md shadow-slate-900/10">
                <i data-lucide="layout-dashboard" class="w-5 h-5 text-brand-500"></i> Vue d'ensemble
            </a>
            
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors">
                <i data-lucide="calendar-check" class="w-5 h-5"></i> Mes Réservations
            </a>
            
            <a href="#" class="flex items-center justify-between px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors group">
                <div class="flex items-center gap-3">
                    <i data-lucide="shopping-bag" class="w-5 h-5"></i> Mes Commandes
                </div>
                <span class="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full group-hover:bg-brand-200">2</span>
            </a>
            
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors">
                <i data-lucide="heart" class="w-5 h-5"></i> Mes Favoris
            </a>
            
            <div class="h-px bg-slate-100 my-4 mx-4"></div>
            
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors">
                <i data-lucide="wallet" class="w-5 h-5"></i> CIBOOKS Pay
            </a>

            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors">
                <i data-lucide="settings" class="w-5 h-5"></i> Paramètres
            </a>
        </div>

        <!-- Help & Logout -->
        <div class="p-4 border-t border-slate-100 space-y-2">
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors">
                <i data-lucide="help-circle" class="w-5 h-5"></i> Centre d'aide
            </a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-bold transition-colors">
                <i data-lucide="log-out" class="w-5 h-5"></i> Déconnexion
            </a>
        </div>
    </aside>

    <!-- Overlay mobile -->
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 hidden lg:hidden" id="sidebar-overlay" onclick="toggleSidebar()"></div>

    <!-- ==================== MAIN CONTENT ==================== -->
    <main class="flex-1 flex flex-col h-full overflow-hidden relative">
        
        <!-- Header -->
        <header class="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
            <div class="flex items-center gap-4">
                <button class="lg:hidden text-slate-500 hover:text-slate-900" onclick="toggleSidebar()">
                    <i data-lucide="menu" class="w-6 h-6"></i>
                </button>
                
                <!-- Breadcrumbs -->
                <div class="hidden sm:flex items-center text-sm font-medium text-slate-500">
                    <span class="text-slate-900 font-bold">Mon Espace</span>
                </div>
            </div>

            <div class="flex items-center gap-4 sm:gap-6">
                <!-- CTA Explorer -->
                <a href="index.html" class="hidden sm:flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">
                    <i data-lucide="compass" class="w-4 h-4"></i> Explorer
                </a>

                <div class="w-px h-6 bg-slate-200 hidden sm:block"></div>

                <!-- Notifications -->
                <button class="relative text-slate-500 hover:text-slate-900 transition-colors">
                    <i data-lucide="bell" class="w-5 h-5"></i>
                    <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                </button>

                <!-- User Dropdown Menu -->
                <div class="flex items-center gap-3 cursor-pointer group">
                    <div class="text-right hidden sm:block">
                        <p class="text-sm font-bold text-slate-900 leading-none">Alexandre K.</p>
                        <p class="text-[10px] text-brand-600 font-bold uppercase mt-1">Membre Gold</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-md ring-2 ring-transparent group-hover:ring-brand-200 transition-all">
                        AK
                    </div>
                </div>
            </div>
        </header>

        <!-- Dashboard Scrollable Area -->
        <div class="flex-1 overflow-y-auto p-6 lg:p-8">
            
            <div class="max-w-6xl mx-auto">
                <!-- Welcome Section -->
                <div class="mb-8">
                    <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Bonjour, Alexandre ! 👋</h2>
                    <p class="text-slate-500 mt-2 text-base">Ravi de vous revoir. Voici un résumé de vos activités récentes.</p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
                    
                    <!-- Widget 1: Prochaine Réservation (Highlight) -->
                    <div class="lg:col-span-2 bg-slate-900 text-white rounded-[32px] p-1 relative overflow-hidden shadow-xl shadow-slate-900/10">
                        <!-- BG Decoration -->
                        <div class="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
                        
                        <div class="bg-slate-900 rounded-[28px] p-6 lg:p-8 h-full relative z-10 flex flex-col sm:flex-row gap-6 items-center">
                            
                            <div class="w-full sm:w-1/3 aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden shrink-0 shadow-lg relative">
                                <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover" alt="Villa Maasai">
                                <div class="absolute top-3 left-3 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-white/20">
                                    <i data-lucide="star" class="w-3 h-3 text-brand-400 fill-brand-400"></i> 4.9
                                </div>
                            </div>
                            
                            <div class="flex-1 w-full">
                                <span class="inline-flex items-center gap-1.5 bg-brand-500 text-slate-900 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 shadow-sm">
                                    <span class="w-2 h-2 rounded-full bg-slate-900 animate-pulse"></span> Prochaine Réservation
                                </span>
                                
                                <h3 class="text-2xl font-extrabold text-white mb-2 leading-tight">Dîner à la Villa Maasai</h3>
                                
                                <div class="space-y-2 mb-6">
                                    <p class="text-slate-300 flex items-center gap-2 text-sm font-medium">
                                        <i data-lucide="calendar" class="w-4 h-4 text-brand-400"></i> Ce soir, à 20:00
                                    </p>
                                    <p class="text-slate-300 flex items-center gap-2 text-sm font-medium">
                                        <i data-lucide="users" class="w-4 h-4 text-brand-400"></i> 2 Personnes (Table intime)
                                    </p>
                                </div>
                                
                                <div class="flex gap-3">
                                    <button class="bg-white text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
                                        Voir l'itinéraire
                                    </button>
                                    <button class="bg-white/10 text-white border border-white/20 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/20 transition-colors">
                                        Modifier
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Widget 2: Wallet & Loyalty -->
                    <div class="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-start mb-6">
                                <div class="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
                                    <i data-lucide="award" class="w-6 h-6"></i>
                                </div>
                                <span class="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold">CIBOOKS Club</span>
                            </div>
                            
                            <p class="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Points Fidélité</p>
                            <div class="flex items-baseline gap-2 mb-2">
                                <h3 class="text-4xl font-extrabold text-slate-900">2,450</h3>
                                <span class="text-sm font-bold text-slate-400">pts</span>
                            </div>
                            <p class="text-sm text-slate-500 font-medium">Vous êtes à 550 pts du statut <span class="font-bold text-slate-900">Platinum</span>.</p>
                        </div>

                        <div class="mt-8 pt-6 border-t border-slate-100">
                            <button class="w-full flex items-center justify-between text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors group">
                                Voir la boutique cadeaux
                                <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
                            </button>
                        </div>
                    </div>

                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    
                    <!-- Section: Commandes Boutique (Marketplace) -->
                    <div class="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 class="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                <i data-lucide="shopping-bag" class="w-5 h-5 text-slate-400"></i> Commandes en cours
                            </h3>
                            <a href="#" class="text-sm font-bold text-brand-600 hover:text-brand-700">Tout voir</a>
                        </div>
                        
                        <div class="p-4 space-y-3 flex-1 overflow-y-auto">
                            <!-- Order 1 -->
                            <div class="bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:border-brand-200 transition-colors cursor-pointer group">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 shadow-sm">
                                            <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=100" class="w-full h-full object-cover">
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-slate-900 text-sm">Coffret Épices Chef</h4>
                                            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Villa Maasai</p>
                                        </div>
                                    </div>
                                    <span class="font-extrabold text-slate-900 text-sm">12.000 F</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> En préparation
                                    </span>
                                    <span class="text-xs text-slate-400 font-medium">Livraison prévue : Demain</span>
                                </div>
                            </div>

                            <!-- Order 2 -->
                            <div class="bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:border-brand-200 transition-colors cursor-pointer group">
                                <div class="flex justify-between items-start mb-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 shadow-sm">
                                            <img src="https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=100" class="w-full h-full object-cover">
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-slate-900 text-sm">Robe Cocktail Wax</h4>
                                            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Yalé Design</p>
                                        </div>
                                    </div>
                                    <span class="font-extrabold text-slate-900 text-sm">35.000 F</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        <i data-lucide="truck" class="w-3 h-3"></i> En cours de livraison
                                    </span>
                                    <button class="text-xs font-bold text-brand-600 hover:text-brand-700">Suivre</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section: Favoris (Lieux) -->
                    <div class="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 class="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                <i data-lucide="heart" class="w-5 h-5 text-red-500 fill-red-100"></i> Lieux Favoris
                            </h3>
                            <a href="#" class="text-sm font-bold text-brand-600 hover:text-brand-700">Gérer</a>
                        </div>
                        
                        <div class="p-6">
                            <div class="flex gap-4 overflow-x-auto hide-scroll pb-4">
                                
                                <!-- Fav 1 -->
                                <div class="min-w-[160px] group cursor-pointer">
                                    <div class="aspect-[4/5] rounded-2xl overflow-hidden relative mb-3 shadow-sm border border-slate-100 group-hover:border-brand-300 transition-colors">
                                        <img src="https://images.unsplash.com/photo-1570554520913-ce219f885e35?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                        <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:bg-white transition-colors">
                                            <i data-lucide="heart" class="w-4 h-4 fill-current"></i>
                                        </button>
                                        <div class="absolute bottom-2 left-2 right-2">
                                            <span class="bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg">Rooftop</span>
                                        </div>
                                    </div>
                                    <h4 class="font-bold text-slate-900 text-sm truncate">Noom Rooftop</h4>
                                    <p class="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><i data-lucide="star" class="w-3 h-3 text-brand-500 fill-brand-500"></i> 4.8</p>
                                </div>

                                <!-- Fav 2 -->
                                <div class="min-w-[160px] group cursor-pointer">
                                    <div class="aspect-[4/5] rounded-2xl overflow-hidden relative mb-3 shadow-sm border border-slate-100 group-hover:border-brand-300 transition-colors">
                                        <img src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                        <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:bg-white transition-colors">
                                            <i data-lucide="heart" class="w-4 h-4 fill-current"></i>
                                        </button>
                                        <div class="absolute bottom-2 left-2 right-2">
                                            <span class="bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg">Spa</span>
                                        </div>
                                    </div>
                                    <h4 class="font-bold text-slate-900 text-sm truncate">Nappy Queen Spa</h4>
                                    <p class="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><i data-lucide="star" class="w-3 h-3 text-brand-500 fill-brand-500"></i> 4.8</p>
                                </div>

                                <!-- Fav 3 -->
                                <div class="min-w-[160px] group cursor-pointer">
                                    <div class="aspect-[4/5] rounded-2xl overflow-hidden relative mb-3 shadow-sm border border-slate-100 group-hover:border-brand-300 transition-colors">
                                        <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                        <button class="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:bg-white transition-colors">
                                            <i data-lucide="heart" class="w-4 h-4 fill-current"></i>
                                        </button>
                                        <div class="absolute bottom-2 left-2 right-2">
                                            <span class="bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg">Art & Café</span>
                                        </div>
                                    </div>
                                    <h4 class="font-bold text-slate-900 text-sm truncate">Bushman Café</h4>
                                    <p class="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><i data-lucide="star" class="w-3 h-3 text-brand-500 fill-brand-500"></i> 4.7</p>
                                </div>

                            </div>
                            
                            <button class="w-full py-3 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-sm hover:border-slate-200 hover:bg-slate-50 transition-colors mt-2">
                                Découvrir de nouveaux lieux
                            </button>
                        </div>
                    </div>

                </div>

            </div>
            
            <!-- Footer -->
            <footer class="mt-12 text-center text-sm font-medium text-slate-400 pb-4">
                &copy; 2026 CIBOOKS. <a href="#" class="hover:text-slate-600">Confidentialité</a> • <a href="#" class="hover:text-slate-600">CGU</a>
            </footer>

        </div>
    </main>

    <script>
        // Init Icons
        lucide.createIcons();

        // Mobile Sidebar Toggle Logic
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        function toggleSidebar() {
            const isClosed = sidebar.classList.contains('-translate-x-full');
            if (isClosed) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        }
    </script>
</body>
</html>