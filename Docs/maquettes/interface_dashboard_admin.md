<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CIBOOKS Admin | Tableau de Bord</title>
    
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
        /* Custom scrollbar for tables & sidebars */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    </style>
</head>
<body class="font-sans text-slate-800 bg-[#FAFAFA] flex h-screen overflow-hidden selection:bg-brand-200 selection:text-brand-900">

    <!-- ==================== SIDEBAR ==================== -->
    <aside class="w-72 bg-slate-900 text-white flex flex-col h-full flex-shrink-0 transition-transform duration-300 absolute md:relative z-50 transform -translate-x-full md:translate-x-0" id="sidebar">
        
        <!-- Logo & Branding -->
        <div class="h-20 flex items-center px-6 border-b border-slate-800">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                    <i data-lucide="book-open" class="w-6 h-6"></i>
                </div>
                <div>
                    <h1 class="text-xl font-extrabold tracking-tight">CIBOOKS<span class="text-brand-500">.</span></h1>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Administration</p>
                </div>
            </div>
            <!-- Close button mobile -->
            <button class="md:hidden ml-auto text-slate-400 hover:text-white" onclick="toggleSidebar()">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
        </div>

        <!-- Navigation Links -->
        <div class="flex-1 overflow-y-auto py-6 px-4 space-y-8">
            
            <!-- Section Menu Principal -->
            <div>
                <p class="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Menu Principal</p>
                <nav class="space-y-1">
                    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-500/10 text-brand-500 font-bold transition-colors">
                        <i data-lucide="layout-dashboard" class="w-5 h-5"></i> Vue d'ensemble
                    </a>
                    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-medium transition-colors">
                        <i data-lucide="activity" class="w-5 h-5 text-slate-400"></i> Analytiques
                    </a>
                </nav>
            </div>

            <!-- Section Catalogue -->
            <div>
                <p class="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Catalogue & Partenaires</p>
                <nav class="space-y-1">
                    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-medium transition-colors justify-between group">
                        <div class="flex items-center gap-3">
                            <i data-lucide="store" class="w-5 h-5 text-slate-400 group-hover:text-white transition-colors"></i> Établissements
                        </div>
                        <span class="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">12</span>
                    </a>
                    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-medium transition-colors group">
                        <i data-lucide="shopping-bag" class="w-5 h-5 text-slate-400 group-hover:text-white transition-colors"></i> Produits Boutique
                    </a>
                    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-medium transition-colors group">
                        <i data-lucide="tags" class="w-5 h-5 text-slate-400 group-hover:text-white transition-colors"></i> Catégories
                    </a>
                </nav>
            </div>

            <!-- Section Opérations -->
            <div>
                <p class="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Opérations</p>
                <nav class="space-y-1">
                    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-medium transition-colors group">
                        <i data-lucide="calendar-check" class="w-5 h-5 text-slate-400 group-hover:text-white transition-colors"></i> Réservations
                    </a>
                    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-medium transition-colors group justify-between">
                        <div class="flex items-center gap-3">
                            <i data-lucide="shopping-cart" class="w-5 h-5 text-slate-400 group-hover:text-white transition-colors"></i> Commandes
                        </div>
                        <span class="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">5</span>
                    </a>
                    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-medium transition-colors group">
                        <i data-lucide="users" class="w-5 h-5 text-slate-400 group-hover:text-white transition-colors"></i> Clients
                    </a>
                </nav>
            </div>
        </div>

        <!-- User Profile Bottom -->
        <div class="p-4 border-t border-slate-800">
            <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                <div class="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                    AK
                </div>
                <div class="overflow-hidden">
                    <p class="text-sm font-bold text-white truncate">Alexandre K.</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase">Super Admin</p>
                </div>
                <i data-lucide="chevron-up" class="w-4 h-4 text-slate-500 ml-auto shrink-0"></i>
            </div>
        </div>
    </aside>

    <!-- Overlay mobile -->
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 hidden md:hidden" id="sidebar-overlay" onclick="toggleSidebar()"></div>

    <!-- ==================== MAIN CONTENT ==================== -->
    <main class="flex-1 flex flex-col h-full overflow-hidden relative">
        
        <!-- Header -->
        <header class="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
            <div class="flex items-center gap-4">
                <button class="md:hidden text-slate-500 hover:text-slate-900" onclick="toggleSidebar()">
                    <i data-lucide="menu" class="w-6 h-6"></i>
                </button>
                <div class="hidden sm:flex items-center text-sm font-medium text-slate-500">
                    <span>Admin</span>
                    <i data-lucide="chevron-right" class="w-4 h-4 mx-1 text-slate-300"></i>
                    <span class="text-slate-900 font-bold">Vue d'ensemble</span>
                </div>
            </div>

            <div class="flex items-center gap-5">
                <!-- Search -->
                <div class="hidden md:flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all w-64">
                    <i data-lucide="search" class="w-4 h-4 text-slate-400 mr-2 shrink-0"></i>
                    <input type="text" placeholder="Rechercher ID, lieu..." class="bg-transparent outline-none text-sm w-full font-medium">
                </div>

                <!-- Environment Badge -->
                <span class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Production
                </span>

                <!-- Notifications -->
                <button class="relative text-slate-500 hover:text-slate-900 transition-colors">
                    <i data-lucide="bell" class="w-5 h-5"></i>
                    <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                </button>

                <!-- Settings -->
                <button class="text-slate-500 hover:text-slate-900 transition-colors">
                    <i data-lucide="settings" class="w-5 h-5"></i>
                </button>
            </div>
        </header>

        <!-- Dashboard Scrollable Area -->
        <div class="flex-1 overflow-y-auto p-6 md:p-8">
            
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 class="text-2xl font-extrabold text-slate-900">Tableau de bord</h2>
                    <p class="text-slate-500 text-sm mt-1">Données en temps réel des transactions et activités.</p>
                </div>
                <div class="flex items-center gap-2">
                    <select class="bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-brand-400">
                        <option>Aujourd'hui</option>
                        <option>7 derniers jours</option>
                        <option>Ce mois-ci</option>
                        <option>Cette année</option>
                    </select>
                    <button class="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <i data-lucide="download" class="w-4 h-4"></i> Exporter
                    </button>
                </div>
            </div>

            <!-- KPI Cards Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                
                <!-- Card 1: Revenus -->
                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                            <i data-lucide="wallet" class="w-5 h-5"></i>
                        </div>
                        <span class="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                            <i data-lucide="trending-up" class="w-3 h-3"></i> +12.5%
                        </span>
                    </div>
                    <p class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Revenus (Boutique)</p>
                    <h3 class="text-2xl font-extrabold text-slate-900">2.450.000 F</h3>
                </div>

                <!-- Card 2: Réservations -->
                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i data-lucide="calendar-check" class="w-5 h-5"></i>
                        </div>
                        <span class="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                            <i data-lucide="trending-up" class="w-3 h-3"></i> +5.2%
                        </span>
                    </div>
                    <p class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Réservations</p>
                    <h3 class="text-2xl font-extrabold text-slate-900">142</h3>
                </div>

                <!-- Card 3: Établissements Actifs -->
                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                            <i data-lucide="store" class="w-5 h-5"></i>
                        </div>
                        <span class="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            <i data-lucide="minus" class="w-3 h-3"></i> 0%
                        </span>
                    </div>
                    <p class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Lieux Actifs</p>
                    <div class="flex items-end gap-2">
                        <h3 class="text-2xl font-extrabold text-slate-900">84</h3>
                        <p class="text-sm font-medium text-amber-600 mb-1">+12 en attente</p>
                    </div>
                </div>

                <!-- Card 4: Nouveaux Clients -->
                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <i data-lucide="users" class="w-5 h-5"></i>
                        </div>
                        <span class="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                            <i data-lucide="trending-up" class="w-3 h-3"></i> +18.0%
                        </span>
                    </div>
                    <p class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Nouveaux Clients</p>
                    <h3 class="text-2xl font-extrabold text-slate-900">324</h3>
                </div>

            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                
                <!-- Chart Area (Mocked) -->
                <div class="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h3 class="text-lg font-extrabold text-slate-900">Évolution des revenus</h3>
                            <p class="text-sm text-slate-500">Marché Marketplace (E-commerce)</p>
                        </div>
                        <button class="text-slate-400 hover:text-slate-900"><i data-lucide="more-horizontal" class="w-5 h-5"></i></button>
                    </div>
                    
                    <!-- CSS Mocked Bar Chart -->
                    <div class="flex-1 flex items-end gap-2 h-48 mt-auto pt-6 border-b border-slate-100 relative">
                        <!-- Lignes de repère -->
                        <div class="absolute w-full border-t border-slate-100 top-0"></div>
                        <div class="absolute w-full border-t border-slate-100 top-1/2"></div>
                        
                        <!-- Barres -->
                        <div class="w-full bg-slate-100 rounded-t-sm h-[30%] hover:bg-brand-200 transition-colors relative group"><div class="absolute -top-8 hidden group-hover:block bg-slate-900 text-white text-xs py-1 px-2 rounded left-1/2 -translate-x-1/2 z-10">450k</div></div>
                        <div class="w-full bg-slate-100 rounded-t-sm h-[45%] hover:bg-brand-200 transition-colors relative group"><div class="absolute -top-8 hidden group-hover:block bg-slate-900 text-white text-xs py-1 px-2 rounded left-1/2 -translate-x-1/2 z-10">620k</div></div>
                        <div class="w-full bg-slate-100 rounded-t-sm h-[35%] hover:bg-brand-200 transition-colors relative group"></div>
                        <div class="w-full bg-brand-500 rounded-t-sm h-[70%] shadow-[0_0_15px_rgba(245,158,11,0.3)] relative group"><div class="absolute -top-8 hidden group-hover:block bg-slate-900 text-white text-xs py-1 px-2 rounded left-1/2 -translate-x-1/2 z-10">1.2M</div></div>
                        <div class="w-full bg-slate-100 rounded-t-sm h-[50%] hover:bg-brand-200 transition-colors relative group"></div>
                        <div class="w-full bg-slate-100 rounded-t-sm h-[65%] hover:bg-brand-200 transition-colors relative group"></div>
                        <div class="w-full bg-slate-100 rounded-t-sm h-[85%] hover:bg-brand-200 transition-colors relative group"></div>
                    </div>
                    <div class="flex justify-between mt-2 text-xs font-bold text-slate-400">
                        <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
                    </div>
                </div>

                <!-- Demandes Partenaires -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h3 class="text-lg font-extrabold text-slate-900">Validations B2B</h3>
                            <p class="text-sm text-amber-600 font-bold">12 en attente</p>
                        </div>
                    </div>
                    
                    <div class="space-y-4 flex-1 overflow-y-auto pr-2">
                        <!-- Demande 1 -->
                        <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-200 bg-slate-50 transition-colors">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=100" class="w-full h-full object-cover">
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-slate-900">Villa Maasai</p>
                                    <p class="text-[10px] font-bold text-slate-500 uppercase">Gastronomie</p>
                                </div>
                            </div>
                            <div class="flex gap-1 shrink-0">
                                <button class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors" title="Approuver">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                                <button class="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors" title="Détails">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Demande 2 -->
                        <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-200 bg-slate-50 transition-colors">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden text-slate-400">
                                    <i data-lucide="image" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-slate-900">Le Majestic Spa</p>
                                    <p class="text-[10px] font-bold text-slate-500 uppercase">Bien-être</p>
                                </div>
                            </div>
                            <div class="flex gap-1 shrink-0">
                                <button class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors" title="Approuver">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                                <button class="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors" title="Détails">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Demande 3 -->
                        <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-brand-200 bg-slate-50 transition-colors">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&q=80&w=100" class="w-full h-full object-cover">
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-slate-900">Yalé Concept Store</p>
                                    <p class="text-[10px] font-bold text-slate-500 uppercase">Mode</p>
                                </div>
                            </div>
                            <div class="flex gap-1 shrink-0">
                                <button class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors" title="Approuver">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                                <button class="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors" title="Détails">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button class="w-full text-center text-sm font-bold text-brand-600 mt-4 hover:text-brand-700 transition-colors">
                        Voir toutes les demandes
                    </button>
                </div>
            </div>

            <!-- Table Commandes / Transactions -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 class="text-lg font-extrabold text-slate-900">Transactions Récentes (Marketplace & Réservations)</h3>
                    <div class="flex gap-2">
                        <button class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">Filtrer</button>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th class="px-6 py-4 font-bold border-b border-slate-200">ID / Type</th>
                                <th class="px-6 py-4 font-bold border-b border-slate-200">Client</th>
                                <th class="px-6 py-4 font-bold border-b border-slate-200">Partenaire</th>
                                <th class="px-6 py-4 font-bold border-b border-slate-200">Montant</th>
                                <th class="px-6 py-4 font-bold border-b border-slate-200">Statut</th>
                                <th class="px-6 py-4 font-bold border-b border-slate-200 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm divide-y divide-slate-100">
                            <!-- Ligne 1 -->
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="px-6 py-4">
                                    <p class="font-bold text-slate-900">#CMD-8492</p>
                                    <p class="text-xs text-slate-500 flex items-center gap-1"><i data-lucide="shopping-bag" class="w-3 h-3 text-brand-500"></i> Boutique</p>
                                </td>
                                <td class="px-6 py-4 font-medium text-slate-700">Marc O.</td>
                                <td class="px-6 py-4 font-medium text-slate-700">Villa Maasai</td>
                                <td class="px-6 py-4 font-extrabold text-slate-900">12.000 F</td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                        En attente (Vendeur)
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button class="text-slate-400 hover:text-brand-600 transition-colors"><i data-lucide="external-link" class="w-5 h-5"></i></button>
                                </td>
                            </tr>
                            
                            <!-- Ligne 2 -->
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="px-6 py-4">
                                    <p class="font-bold text-slate-900">#RES-8491</p>
                                    <p class="text-xs text-slate-500 flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3 text-blue-500"></i> Réservation</p>
                                </td>
                                <td class="px-6 py-4 font-medium text-slate-700">Sarah B.</td>
                                <td class="px-6 py-4 font-medium text-slate-700">Noom Rooftop</td>
                                <td class="px-6 py-4 font-extrabold text-slate-900">-</td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                        Confirmée
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button class="text-slate-400 hover:text-brand-600 transition-colors"><i data-lucide="external-link" class="w-5 h-5"></i></button>
                                </td>
                            </tr>

                            <!-- Ligne 3 -->
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="px-6 py-4">
                                    <p class="font-bold text-slate-900">#CMD-8490</p>
                                    <p class="text-xs text-slate-500 flex items-center gap-1"><i data-lucide="shopping-bag" class="w-3 h-3 text-brand-500"></i> Boutique</p>
                                </td>
                                <td class="px-6 py-4 font-medium text-slate-700">Jean P.</td>
                                <td class="px-6 py-4 font-medium text-slate-700">Nappy Queen Spa</td>
                                <td class="px-6 py-4 font-extrabold text-slate-900">25.000 F</td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        Livré
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button class="text-slate-400 hover:text-brand-600 transition-colors"><i data-lucide="external-link" class="w-5 h-5"></i></button>
                                </td>
                            </tr>
                            
                            <!-- Ligne 4 -->
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="px-6 py-4">
                                    <p class="font-bold text-slate-900">#CMD-8489</p>
                                    <p class="text-xs text-slate-500 flex items-center gap-1"><i data-lucide="shopping-bag" class="w-3 h-3 text-brand-500"></i> Boutique</p>
                                </td>
                                <td class="px-6 py-4 font-medium text-slate-700">Marie C.</td>
                                <td class="px-6 py-4 font-medium text-slate-700">Bushman Café</td>
                                <td class="px-6 py-4 font-extrabold text-slate-900">45.000 F</td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                        Annulée
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button class="text-slate-400 hover:text-brand-600 transition-colors"><i data-lucide="external-link" class="w-5 h-5"></i></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="p-4 border-t border-slate-200 bg-slate-50 text-center">
                    <button class="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Voir les 240 transactions du mois</button>
                </div>
            </div>

            <!-- Footer (Dashboard) -->
            <footer class="mt-12 text-center text-sm font-medium text-slate-400">
                &copy; 2026 CIBOOKS Admin. Version 1.0 (Phase 1).
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