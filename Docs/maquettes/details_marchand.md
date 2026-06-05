<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Villa Maasai - CIBOOKS</title>
    
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
            <div class="hidden md:flex flex-1 max-w-md mx-8 items-center px-4 bg-slate-100 rounded-full h-10 border border-slate-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 mr-2"></i>
                <input type="text" placeholder="Rechercher..." class="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400">
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

    <!-- ==================== HEADER IMMERSIF ==================== -->
    <header class="pt-20">
        <div class="relative h-[40vh] md:h-[55vh] w-full">
            <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1600" class="w-full h-full object-cover" alt="Villa Maasai Interior">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            
            <!-- Floating Actions -->
            <div class="absolute top-6 right-6 flex gap-3">
                <button class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all">
                    <i data-lucide="share-2" class="w-5 h-5"></i>
                </button>
                <button class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-red-500 transition-all">
                    <i data-lucide="heart" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Place Info overlay -->
            <div class="absolute bottom-0 left-0 w-full">
                <div class="max-w-7xl mx-auto px-6 pb-10">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="bg-brand-500 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">Gastronomie & Jazz</span>
                        <span class="bg-white/20 backdrop-blur border border-white/20 text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <i data-lucide="star" class="w-3 h-3 fill-brand-400 text-brand-400"></i> 4.9 (840 avis)
                        </span>
                    </div>
                    <h1 class="text-4xl md:text-6xl font-extrabold text-white mb-2 tracking-tight">Villa Maasai</h1>
                    <p class="text-lg md:text-xl text-slate-200 font-medium flex items-center gap-2">
                        <i data-lucide="map-pin" class="w-5 h-5 text-brand-500"></i> Zone 4, Rue du Docteur Blanchard, Abidjan
                    </p>
                </div>
            </div>
        </div>
    </header>

    <!-- ==================== MAIN CONTENT ==================== -->
    <main class="max-w-7xl mx-auto px-6 py-12">
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            
            <!-- LEFT COLUMN: Description & Infos -->
            <div class="lg:col-span-2 space-y-12">
                
                <!-- About -->
                <section>
                    <h2 class="text-2xl font-bold text-slate-900 mb-4">À propos de ce lieu</h2>
                    <p class="text-slate-600 leading-relaxed text-lg mb-6">
                        La plus grande villa gastronomique d'Afrique de l'Ouest. Nichée au cœur de la Zone 4, la Villa Maasai offre une expérience sensorielle unique mêlant une architecture époustouflante, des concerts de jazz live et une cuisine fusion afro-contemporaine audacieuse.
                    </p>
                    <p class="text-slate-600 leading-relaxed text-lg">
                        Idéal pour les dîners d'affaires, les célébrations ou simplement pour savourer un cocktail signature sur notre terrasse végétale. Le chef revisite les classiques du terroir ivoirien avec des techniques modernes pour surprendre les palais les plus exigeants.
                    </p>
                </section>

                <!-- Amenities -->
                <section>
                    <h3 class="text-xl font-bold text-slate-900 mb-6">Équipements & Services</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="wifi" class="w-5 h-5 text-brand-500"></i> Wi-Fi Gratuit
                        </div>
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="car-front" class="w-5 h-5 text-brand-500"></i> Voiturier
                        </div>
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="music" class="w-5 h-5 text-brand-500"></i> Live Music (Jeu-Sam)
                        </div>
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="glass-water" class="w-5 h-5 text-brand-500"></i> Bar à Cocktails
                        </div>
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="wind" class="w-5 h-5 text-brand-500"></i> Terrasse Climatisée
                        </div>
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="utensils-crossed" class="w-5 h-5 text-brand-500"></i> Menu Végétarien
                        </div>
                    </div>
                </section>

                <!-- Photo Gallery -->
                <section>
                    <h3 class="text-xl font-bold text-slate-900 mb-6">Galerie</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <img src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=400" class="w-full h-40 object-cover rounded-2xl hover:opacity-90 transition-opacity cursor-pointer" alt="Plat">
                        <img src="https://images.unsplash.com/photo-1514362545857-3bc16549766b?auto=format&fit=crop&q=80&w=400" class="w-full h-40 object-cover rounded-2xl hover:opacity-90 transition-opacity cursor-pointer" alt="Cocktail">
                        <div class="relative w-full h-40 rounded-2xl overflow-hidden cursor-pointer group">
                            <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Restaurant">
                            <div class="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                                <span class="text-white font-bold flex items-center gap-2"><i data-lucide="image" class="w-5 h-5"></i> +12 Photos</span>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- Map Placeholder -->
                <section>
                    <h3 class="text-xl font-bold text-slate-900 mb-6">Localisation</h3>
                    <div class="w-full h-64 bg-slate-200 rounded-3xl overflow-hidden relative border border-slate-300">
                        <div class="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Abidjan_OpenStreetMap.png/640px-Abidjan_OpenStreetMap.png')] bg-cover bg-center grayscale-[30%]"></div>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <div class="w-14 h-14 bg-brand-500 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white animate-bounce">
                                <i data-lucide="map-pin" class="w-6 h-6 fill-current"></i>
                            </div>
                        </div>
                    </div>
                </section>

            </div>

            <!-- RIGHT COLUMN: Sticky Sidebar (Booking & Shop) -->
            <div class="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                
                <!-- Booking Widget -->
                <div class="bg-white border border-slate-200 p-6 rounded-[32px] shadow-xl shadow-slate-200/50">
                    <div class="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-sm font-bold w-max mb-6 border border-green-100">
                        <i data-lucide="clock" class="w-4 h-4"></i> Ouvert actuellement
                    </div>
                    
                    <h3 class="text-2xl font-extrabold text-slate-900 mb-6">Réserver une table</h3>
                    
                    <div class="space-y-4 mb-6">
                        <div class="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl cursor-pointer hover:border-brand-300 transition-colors">
                            <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm"><i data-lucide="calendar" class="w-5 h-5"></i></div>
                            <div>
                                <p class="text-[10px] uppercase font-bold text-slate-400">Date</p>
                                <p class="font-bold text-slate-900 text-sm">Aujourd'hui</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl cursor-pointer hover:border-brand-300 transition-colors">
                            <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm"><i data-lucide="clock" class="w-5 h-5"></i></div>
                            <div>
                                <p class="text-[10px] uppercase font-bold text-slate-400">Heure</p>
                                <p class="font-bold text-slate-900 text-sm">20:00</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl cursor-pointer hover:border-brand-300 transition-colors">
                            <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm"><i data-lucide="users" class="w-5 h-5"></i></div>
                            <div>
                                <p class="text-[10px] uppercase font-bold text-slate-400">Invités</p>
                                <p class="font-bold text-slate-900 text-sm">2 Personnes</p>
                            </div>
                        </div>
                    </div>
                    
                    <button class="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                        Vérifier les disponibilités
                    </button>
                </div>

                <!-- CIBOOKS Marketplace Integration -->
                <div class="bg-brand-50 border border-brand-200 p-6 rounded-[32px]">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-brand-500 text-white rounded-lg flex items-center justify-center shadow-md">
                                <i data-lucide="store" class="w-4 h-4"></i>
                            </div>
                            <h3 class="text-lg font-extrabold text-slate-900">La Boutique</h3>
                        </div>
                        <span class="text-[10px] bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded font-bold uppercase tracking-wider">Click & Collect</span>
                    </div>

                    <div class="space-y-4">
                        <!-- Product 1 -->
                        <div class="bg-white p-3 rounded-2xl border border-white hover:border-brand-300 transition-colors shadow-sm group">
                            <div class="flex items-center gap-4 mb-3">
                                <div class="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                    <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Epices">
                                </div>
                                <div>
                                    <h4 class="font-bold text-slate-900 text-sm">Coffret Épices du Chef</h4>
                                    <p class="text-xs text-slate-500 mt-0.5">Le secret de la sauce claire.</p>
                                </div>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-100 pt-3">
                                <span class="font-extrabold text-brand-600">12.000 FCFA</span>
                                <button class="text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-brand-500 transition-colors flex items-center gap-2">
                                    <i data-lucide="plus" class="w-4 h-4"></i> Ajouter
                                </button>
                            </div>
                        </div>

                        <!-- Product 2 -->
                        <div class="bg-white p-3 rounded-2xl border border-white hover:border-brand-300 transition-colors shadow-sm group">
                            <div class="flex items-center gap-4 mb-3">
                                <div class="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                    <img src="https://images.unsplash.com/photo-1563122102-140685959c99?auto=format&fit=crop&q=80&w=200" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="VIP Card">
                                </div>
                                <div>
                                    <h4 class="font-bold text-slate-900 text-sm">Carte Membre VIP</h4>
                                    <p class="text-xs text-slate-500 mt-0.5">Accès prioritaire & Lounge.</p>
                                </div>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-100 pt-3">
                                <span class="font-extrabold text-brand-600">50.000 FCFA</span>
                                <button class="text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-brand-500 transition-colors flex items-center gap-2">
                                    <i data-lucide="plus" class="w-4 h-4"></i> Ajouter
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <button class="w-full text-center text-sm font-bold text-brand-700 hover:text-brand-800 mt-4 underline underline-offset-4 decoration-brand-300">
                        Voir tout le catalogue (12 produits)
                    </button>
                </div>

            </div>
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
    </script>
</body>
</html>