<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Suite Royale Lagune - CIBOOKS</title>
    
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
                <input type="text" placeholder="Rechercher un lieu, un hôtel..." class="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400">
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-5">
                <button class="text-slate-600 hover:text-brand-600 transition-colors relative">
                    <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                    <span class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">1</span>
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
        <div class="relative h-[45vh] md:h-[60vh] w-full">
            <img src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1600" class="w-full h-full object-cover" alt="Suite Royale">
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
                        <a href="#" class="bg-slate-800/80 backdrop-blur border border-slate-600 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-2 hover:bg-slate-800 transition-colors">
                            <i data-lucide="chevron-left" class="w-3 h-3"></i> Retour à l'hôtel
                        </a>
                        <span class="bg-brand-500 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">Suite Premium</span>
                    </div>
                    <h1 class="text-4xl md:text-6xl font-extrabold text-white mb-2 tracking-tight">Suite Royale Lagune</h1>
                    <p class="text-lg md:text-xl text-slate-200 font-medium flex items-center gap-2">
                        <i data-lucide="building" class="w-5 h-5 text-brand-500"></i> La Maison Palmier, Cocody Ambassades
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
                    <div class="flex items-center gap-6 mb-6 pb-6 border-b border-slate-200">
                        <div class="flex flex-col">
                            <span class="text-2xl font-extrabold text-slate-900">85 m²</span>
                            <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Superficie</span>
                        </div>
                        <div class="w-px h-10 bg-slate-200"></div>
                        <div class="flex flex-col">
                            <span class="text-2xl font-extrabold text-slate-900 flex items-center gap-2">3 <i data-lucide="users" class="w-5 h-5 text-slate-400"></i></span>
                            <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Voyageurs max.</span>
                        </div>
                        <div class="w-px h-10 bg-slate-200"></div>
                        <div class="flex flex-col">
                            <span class="text-2xl font-extrabold text-slate-900 flex items-center gap-2">1 <i data-lucide="bed-double" class="w-5 h-5 text-slate-400"></i></span>
                            <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Lit King Size</span>
                        </div>
                    </div>

                    <h2 class="text-2xl font-bold text-slate-900 mb-4">À propos de cette suite</h2>
                    <p class="text-slate-600 leading-relaxed text-lg mb-6">
                        Véritable havre de paix au cœur d'Abidjan, la Suite Royale Lagune vous offre une vue panoramique imprenable sur la lagune Ébrié depuis sa terrasse privative. Conçue avec des matériaux nobles et des touches d'artisanat local, elle incarne le luxe contemporain ivoirien.
                    </p>
                    <p class="text-slate-600 leading-relaxed text-lg">
                        Elle dispose d'un espace salon séparé, d'une somptueuse salle de bain en marbre avec baignoire îlot, d'une douche à l'italienne et d'un dressing spacieux. L'accès exclusif au Club Lounge est inclus avec votre réservation.
                    </p>
                </section>

                <!-- Amenities -->
                <section>
                    <h3 class="text-xl font-bold text-slate-900 mb-6">Équipements de la chambre</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="wifi" class="w-5 h-5 text-brand-500"></i> Wi-Fi Haut Débit
                        </div>
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="bath" class="w-5 h-5 text-brand-500"></i> Baignoire Îlot
                        </div>
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="coffee" class="w-5 h-5 text-brand-500"></i> Machine Nespresso
                        </div>
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="tv" class="w-5 h-5 text-brand-500"></i> Smart TV 65"
                        </div>
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="wind" class="w-5 h-5 text-brand-500"></i> Climatisation Indiv.
                        </div>
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="bell" class="w-5 h-5 text-brand-500"></i> Room Service 24/7
                        </div>
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="safe" class="w-5 h-5 text-brand-500"></i> Coffre-fort
                        </div>
                        <div class="flex items-center gap-3 text-slate-700 font-medium">
                            <i data-lucide="glass-water" class="w-5 h-5 text-brand-500"></i> Minibar Premium
                        </div>
                    </div>
                </section>

                <!-- Photo Gallery -->
                <section>
                    <h3 class="text-xl font-bold text-slate-900 mb-6">Galerie</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400" class="w-full h-40 object-cover rounded-2xl hover:opacity-90 transition-opacity cursor-pointer" alt="Chambre detail">
                        <img src="https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&q=80&w=400" class="w-full h-40 object-cover rounded-2xl hover:opacity-90 transition-opacity cursor-pointer" alt="Salle de bain">
                        <div class="relative w-full h-40 rounded-2xl overflow-hidden cursor-pointer group">
                            <img src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Salon">
                            <div class="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                                <span class="text-white font-bold flex items-center gap-2"><i data-lucide="image" class="w-5 h-5"></i> +8 Photos</span>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- Policies -->
                <section class="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <h3 class="text-xl font-bold text-slate-900 mb-4">Règles de l'établissement</h3>
                    <ul class="space-y-3 text-slate-600">
                        <li class="flex gap-3"><i data-lucide="clock" class="w-5 h-5 text-slate-400 shrink-0"></i> <b>Arrivée :</b> À partir de 14:00</li>
                        <li class="flex gap-3"><i data-lucide="clock" class="w-5 h-5 text-slate-400 shrink-0"></i> <b>Départ :</b> Jusqu'à 12:00</li>
                        <li class="flex gap-3"><i data-lucide="info" class="w-5 h-5 text-slate-400 shrink-0"></i> <b>Annulation :</b> Gratuite jusqu'à 48h avant l'arrivée. En cas d'annulation tardive, la première nuit sera facturée.</li>
                        <li class="flex gap-3"><i data-lucide="ban" class="w-5 h-5 text-slate-400 shrink-0"></i> Non-fumeur, animaux non admis.</li>
                    </ul>
                </section>

            </div>

            <!-- RIGHT COLUMN: Sticky Sidebar (Booking & Shop) -->
            <div class="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                
                <!-- Booking Widget -->
                <div class="bg-white border border-slate-200 p-6 rounded-[32px] shadow-xl shadow-slate-200/50">
                    <div class="mb-6 flex items-end gap-2">
                        <span class="text-3xl font-extrabold text-slate-900">250.000 <span class="text-xl">FCFA</span></span>
                        <span class="text-slate-500 font-medium mb-1">/ nuit</span>
                    </div>
                    
                    <div class="space-y-4 mb-6">
                        <!-- Dates -->
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-slate-50 border border-slate-200 p-3 rounded-2xl cursor-pointer hover:border-brand-300 transition-colors">
                                <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">Arrivée</p>
                                <p class="font-bold text-slate-900 text-sm">12 Oct 2026</p>
                            </div>
                            <div class="bg-slate-50 border border-slate-200 p-3 rounded-2xl cursor-pointer hover:border-brand-300 transition-colors">
                                <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">Départ</p>
                                <p class="font-bold text-slate-900 text-sm">15 Oct 2026</p>
                            </div>
                        </div>

                        <!-- Guests -->
                        <div class="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-2xl cursor-pointer hover:border-brand-300 transition-colors">
                            <div>
                                <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">Voyageurs</p>
                                <p class="font-bold text-slate-900 text-sm">2 Adultes</p>
                            </div>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400"></i>
                        </div>
                    </div>

                    <!-- Price summary -->
                    <div class="space-y-3 mb-6 pb-6 border-b border-slate-100 text-sm text-slate-600">
                        <div class="flex justify-between">
                            <span>250.000 FCFA x 3 nuits</span>
                            <span>750.000 FCFA</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Taxes de séjour</span>
                            <span>9.000 FCFA</span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center mb-6 text-lg font-extrabold text-slate-900">
                        <span>Total</span>
                        <span>759.000 FCFA</span>
                    </div>
                    
                    <button class="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-brand-500 hover:text-white transition-colors shadow-lg shadow-slate-900/20">
                        Réserver cette suite
                    </button>
                    <p class="text-center text-xs text-slate-400 font-medium mt-4">Vous ne serez débité qu'à l'hôtel.</p>
                </div>

                <!-- CIBOOKS Marketplace Integration (Hotel Extras) -->
                <div class="bg-brand-50 border border-brand-200 p-6 rounded-[32px]">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-brand-500 text-white rounded-lg flex items-center justify-center shadow-md">
                                <i data-lucide="store" class="w-4 h-4"></i>
                            </div>
                            <h3 class="text-lg font-extrabold text-slate-900">Extras & Boutique</h3>
                        </div>
                    </div>
                    <p class="text-sm text-slate-600 mb-4">Agrémentez votre séjour. À commander maintenant, livré dans votre chambre à votre arrivée.</p>

                    <div class="space-y-4">
                        <!-- Product 1 -->
                        <div class="bg-white p-3 rounded-2xl border border-white hover:border-brand-300 transition-colors shadow-sm group">
                            <div class="flex items-center gap-4 mb-3">
                                <div class="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                    <img src="https://images.unsplash.com/photo-1595982181512-8706346ce307?auto=format&fit=crop&q=80&w=200" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Champagne">
                                </div>
                                <div>
                                    <h4 class="font-bold text-slate-900 text-sm">Accueil Champagne</h4>
                                    <p class="text-xs text-slate-500 mt-0.5">Bouteille glacée + fraises.</p>
                                </div>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-100 pt-3">
                                <span class="font-extrabold text-brand-600">85.000 FCFA</span>
                                <button class="text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-brand-500 transition-colors flex items-center gap-2">
                                    <i data-lucide="plus" class="w-4 h-4"></i> Ajouter
                                </button>
                            </div>
                        </div>

                        <!-- Product 2 -->
                        <div class="bg-white p-3 rounded-2xl border border-white hover:border-brand-300 transition-colors shadow-sm group">
                            <div class="flex items-center gap-4 mb-3">
                                <div class="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                                    <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=200" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Massage">
                                </div>
                                <div>
                                    <h4 class="font-bold text-slate-900 text-sm">Pass Spa Privilège</h4>
                                    <p class="text-xs text-slate-500 mt-0.5">Accès illimité + 1 Massage 60min.</p>
                                </div>
                            </div>
                            <div class="flex items-center justify-between border-t border-slate-100 pt-3">
                                <span class="font-extrabold text-brand-600">45.000 FCFA</span>
                                <button class="text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-brand-500 transition-colors flex items-center gap-2">
                                    <i data-lucide="plus" class="w-4 h-4"></i> Ajouter
                                </button>
                            </div>
                        </div>
                    </div>
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
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Hôtels & Séjours</a></li>
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Marketplace</a></li>
                    </ul>
                </div>

                <!-- Links col 2 -->
                <div>
                    <h4 class="font-extrabold text-slate-900 mb-6">Business</h4>
                    <ul class="space-y-4 text-sm text-slate-500 font-medium">
                        <li><a href="#" class="hover:text-brand-600 transition-colors">Inscrire son établissement</a></li>
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