<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CIBOOKS Marchand | Ajouter un produit</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['"Outfit"', 'sans-serif'] },
                    colors: {
                        brand: {
                            50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24',
                            500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        /* Remove arrows from number inputs */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        
        /* Custom toggle switch */
        .toggle-checkbox:checked {
            right: 0;
            border-color: #f59e0b;
        }
        .toggle-checkbox:checked + .toggle-label {
            background-color: #f59e0b;
        }
    </style>
</head>
<body class="font-sans text-slate-800 bg-[#FAFAFA] flex h-screen overflow-hidden selection:bg-brand-200 selection:text-brand-900">

    <!-- SIDEBAR -->
    <aside class="w-72 bg-slate-900 text-white flex flex-col h-full flex-shrink-0 transition-transform duration-300 absolute md:relative z-50 transform -translate-x-full md:translate-x-0" id="sidebar">
        <div class="h-20 flex items-center px-6 border-b border-slate-800">
            <a href="merchant-dashboard.html" class="flex items-center gap-3">
                <div class="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i data-lucide="store" class="w-6 h-6"></i>
                </div>
                <div>
                    <h1 class="text-lg font-extrabold tracking-tight">Villa Maasai<span class="text-brand-500">.</span></h1>
                    <p class="text-[10px] text-brand-400 font-bold uppercase tracking-widest leading-none">Marchand</p>
                </div>
            </a>
            <button class="md:hidden ml-auto text-slate-400 hover:text-white" onclick="toggleSidebar()"><i data-lucide="x" class="w-6 h-6"></i></button>
        </div>

        <div class="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            <a href="merchant-dashboard.html" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-medium transition-colors">
                <i data-lucide="layout-dashboard" class="w-5 h-5"></i> Mon Tableau de bord
            </a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-medium transition-colors justify-between">
                <div class="flex items-center gap-3"><i data-lucide="shopping-bag" class="w-5 h-5"></i> Commandes</div>
                <span class="bg-amber-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">8</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-500/10 text-brand-500 font-bold">
                <i data-lucide="package" class="w-5 h-5"></i> Catalogue
            </a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-medium transition-colors">
                <i data-lucide="bar-chart-2" class="w-5 h-5"></i> Rapports
            </a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-medium transition-colors">
                <i data-lucide="settings" class="w-5 h-5"></i> Paramètres Boutique
            </a>
        </div>

        <div class="p-4 border-t border-slate-800">
            <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                <div class="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-white font-bold">VM</div>
                <div class="overflow-hidden">
                    <p class="text-sm font-bold text-white truncate">Gérant Boutique</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase">En ligne</p>
                </div>
            </div>
        </div>
    </aside>

    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 hidden md:hidden" id="sidebar-overlay" onclick="toggleSidebar()"></div>

    <!-- MAIN CONTENT -->
    <main class="flex-1 flex flex-col h-full overflow-hidden relative">
        
        <!-- HEADER -->
        <header class="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
            <div class="flex items-center gap-4">
                <button class="md:hidden text-slate-500" onclick="toggleSidebar()"><i data-lucide="menu" class="w-6 h-6"></i></button>
                
                <!-- Breadcrumbs -->
                <div class="hidden sm:flex items-center text-sm font-medium text-slate-500">
                    <a href="#" class="hover:text-slate-900">Catalogue</a>
                    <i data-lucide="chevron-right" class="w-4 h-4 mx-1 text-slate-300"></i>
                    <a href="#" class="hover:text-slate-900">Produits</a>
                    <i data-lucide="chevron-right" class="w-4 h-4 mx-1 text-slate-300"></i>
                    <span class="text-slate-900 font-bold">Ajouter un produit</span>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <a href="#" class="text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm hidden sm:block">Annuler</a>
                <button class="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-slate-900/10 hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <i data-lucide="save" class="w-4 h-4"></i> Enregistrer
                </button>
            </div>
        </header>

        <!-- FORM SCROLL AREA -->
        <div class="flex-1 overflow-y-auto p-4 md:p-8">
            <div class="max-w-5xl mx-auto">
                
                <div class="flex items-center gap-3 mb-8">
                    <a href="#" class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    </a>
                    <h2 class="text-2xl font-extrabold text-slate-900">Ajouter un produit</h2>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    
                    <!-- LEFT COLUMN (Main Info) -->
                    <div class="lg:col-span-2 space-y-6">
                        
                        <!-- Block 1: Informations Générales -->
                        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h3 class="text-lg font-extrabold text-slate-900 mb-6">Informations générales</h3>
                            
                            <div class="space-y-5">
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Titre du produit *</label>
                                    <input type="text" placeholder="Ex: Coffret Épices Signature" class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-medium outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all">
                                </div>
                                
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                    <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:bg-white focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
                                        <!-- Toolbar basique -->
                                        <div class="flex items-center gap-1 border-b border-slate-200 p-2 bg-white">
                                            <button class="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100"><i data-lucide="bold" class="w-4 h-4"></i></button>
                                            <button class="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100"><i data-lucide="italic" class="w-4 h-4"></i></button>
                                            <button class="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100"><i data-lucide="list" class="w-4 h-4"></i></button>
                                        </div>
                                        <textarea rows="5" placeholder="Décrivez votre produit en détail..." class="w-full bg-transparent text-slate-900 px-4 py-3 font-medium outline-none resize-y"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Block 2: Médias -->
                        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h3 class="text-lg font-extrabold text-slate-900 mb-6 flex items-center justify-between">
                                Médias
                                <span class="text-xs font-medium text-slate-400 font-normal">Formats: JPG, PNG, WEBP (Max 5Mo)</span>
                            </h3>
                            
                            <!-- Dropzone -->
                            <div class="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 hover:border-brand-300 transition-colors p-8 flex flex-col items-center justify-center text-center cursor-pointer group">
                                <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center text-brand-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <i data-lucide="upload-cloud" class="w-8 h-8"></i>
                                </div>
                                <h4 class="font-bold text-slate-900 mb-1">Glissez vos images ici</h4>
                                <p class="text-sm text-slate-500 mb-4">ou cliquez pour parcourir vos fichiers</p>
                                <button class="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:border-slate-300">
                                    Sélectionner des fichiers
                                </button>
                            </div>
                            
                            <!-- Gallery Preview (Empty State) -->
                            <div class="flex gap-4 mt-6 overflow-x-auto pb-2">
                                <div class="w-24 h-24 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 border-dashed shrink-0">
                                    <i data-lucide="image" class="w-8 h-8 opacity-50"></i>
                                </div>
                            </div>
                        </div>

                        <!-- Block 3: Tarification & Inventaire -->
                        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h3 class="text-lg font-extrabold text-slate-900 mb-6">Tarification & Inventaire</h3>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prix régulier (FCFA) *</label>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <i data-lucide="banknote" class="w-5 h-5 text-slate-400"></i>
                                        </div>
                                        <input type="number" placeholder="0" class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-12 pr-4 py-3 font-bold outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prix promotionnel (Optionnel)</label>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <i data-lucide="tag" class="w-5 h-5 text-slate-400"></i>
                                        </div>
                                        <input type="number" placeholder="0" class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-12 pr-4 py-3 font-bold outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all">
                                    </div>
                                </div>
                            </div>

                            <div class="h-px w-full bg-slate-100 mb-6"></div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quantité en stock</label>
                                    <input type="number" value="10" class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-bold outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">SKU (Optionnel)</label>
                                    <input type="text" placeholder="Ex: VM-EPICES-01" class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-medium outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN (Settings) -->
                    <div class="space-y-6">
                        
                        <!-- Block 4: Statut -->
                        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h3 class="text-sm font-extrabold text-slate-900 mb-4 uppercase tracking-wider">Statut du produit</h3>
                            
                            <select class="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-4 py-3 outline-none focus:border-brand-400 appearance-none cursor-pointer">
                                <option value="active">Actif (Visible sur la boutique)</option>
                                <option value="draft">Brouillon (Caché)</option>
                            </select>
                            
                            <div class="mt-4 flex items-center justify-between p-3 bg-brand-50 rounded-xl border border-brand-100">
                                <div>
                                    <h4 class="font-bold text-slate-900 text-sm">Mettre en vitrine</h4>
                                    <p class="text-xs text-slate-500">Afficher sur la page principale de votre lieu.</p>
                                </div>
                                <!-- Toggle -->
                                <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="toggle" id="toggle" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 transition-all duration-300"/>
                                    <label for="toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer transition-colors duration-300"></label>
                                </div>
                            </div>
                        </div>

                        <!-- Block 5: Organisation -->
                        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h3 class="text-sm font-extrabold text-slate-900 mb-4 uppercase tracking-wider">Organisation</h3>
                            
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Catégorie</label>
                                    <select class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-medium outline-none focus:border-brand-400 appearance-none cursor-pointer">
                                        <option value="">Sélectionner une catégorie...</option>
                                        <option value="epices">Épices & Condiments</option>
                                        <option value="vins">Cave à Vins</option>
                                        <option value="mode">Mode & Accessoires</option>
                                        <option value="bienetre">Beauté & Soins</option>
                                        <option value="pass">Cartes Cadeaux & Pass</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Étiquettes (Tags)</label>
                                    <input type="text" placeholder="Entrez un tag et appuyez sur Entrée" class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-medium outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all">
                                    
                                    <div class="flex flex-wrap gap-2 mt-3">
                                        <span class="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold border border-slate-200">
                                            Fait Maison <button class="hover:text-red-500"><i data-lucide="x" class="w-3 h-3"></i></button>
                                        </span>
                                        <span class="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold border border-slate-200">
                                            Chef <button class="hover:text-red-500"><i data-lucide="x" class="w-3 h-3"></i></button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Block 6: Expédition -->
                        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h3 class="text-sm font-extrabold text-slate-900 mb-4 uppercase tracking-wider">Modes de livraison</h3>
                            
                            <div class="space-y-3">
                                <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <div class="flex items-center justify-center w-5 h-5 rounded border-2 border-brand-500 bg-brand-500 text-white">
                                        <i data-lucide="check" class="w-3 h-3"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-bold text-slate-900">Click & Collect</p>
                                        <p class="text-xs text-slate-500">Le client récupère sur place.</p>
                                    </div>
                                    <i data-lucide="store" class="w-5 h-5 text-slate-400"></i>
                                </label>

                                <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <div class="flex items-center justify-center w-5 h-5 rounded border-2 border-brand-500 bg-brand-500 text-white">
                                        <i data-lucide="check" class="w-3 h-3"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-bold text-slate-900">Livraison (CIBOOKS)</p>
                                        <p class="text-xs text-slate-500">Expédié via notre flotte.</p>
                                    </div>
                                    <i data-lucide="truck" class="w-5 h-5 text-slate-400"></i>
                                </label>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            
            <footer class="mt-12 text-center text-sm font-medium text-slate-400 pb-8">
                &copy; 2026 CIBOOKS Partenaires. Tous droits réservés.
            </footer>
        </div>
    </main>

    <script>
        lucide.createIcons();
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        }
    </script>
</body>
</html>