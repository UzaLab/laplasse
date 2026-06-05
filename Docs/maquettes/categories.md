<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Explorer les Catégories | CIBOOKS</title>
    
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
</head>
<body class="font-sans text-slate-800 bg-[#FAFAFA] selection:bg-brand-200 selection:text-brand-900">

    <nav class="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300" id="navbar">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <a href="index.html" class="flex items-center gap-2">
                <div class="w-8 h-8 bg-slate-900 text-brand-500 rounded-lg flex items-center justify-center">
                    <i data-lucide="book-open" class="w-5 h-5"></i>
                </div>
                <span class="text-xl font-extrabold tracking-tight text-slate-900">CIBOOKS</span>
            </a>
            <div class="flex items-center gap-5">
                <button class="text-slate-600 hover:text-brand-600 transition-colors"><i data-lucide="search" class="w-5 h-5"></i></button>
                <button class="text-slate-600 hover:text-brand-600 transition-colors relative">
                    <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                </button>
                <div class="w-px h-6 bg-slate-200 hidden md:block"></div>
                <button class="hidden md:flex items-center gap-2 text-sm font-bold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all">
                    Connexion
                </button>
            </div>
        </div>
    </nav>

    <main class="pt-32 pb-20">
        <div class="max-w-7xl mx-auto px-6">
            <div class="mb-12">
                <h1 class="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Explorer par univers</h1>
                <p class="text-lg text-slate-500 max-w-2xl">Plongez dans l'univers CIBOOKS. Que vous cherchiez une expérience culinaire, un moment de détente ou une pièce unique, tout commence ici.</p>
            </div>

            <!-- Grid Categories -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <!-- Category Card -->
                <a href="#" class="group block bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-500">
                    <div class="h-64 rounded-[24px] overflow-hidden relative mb-4">
                        <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div class="absolute bottom-4 left-4 text-white">
                            <h3 class="text-2xl font-extrabold">Gastronomie</h3>
                            <p class="text-sm font-medium opacity-90">124 lieux disponibles</p>
                        </div>
                    </div>
                    <div class="px-2 pb-2 flex justify-between items-center">
                        <span class="text-slate-500 text-sm font-bold uppercase tracking-wide">Découvrir</span>
                        <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                            <i data-lucide="arrow-right" class="w-5 h-5"></i>
                        </div>
                    </div>
                </a>

                <a href="#" class="group block bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-500">
                    <div class="h-64 rounded-[24px] overflow-hidden relative mb-4">
                        <img src="https://images.unsplash.com/photo-1570554520913-ce219f885e35?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div class="absolute bottom-4 left-4 text-white">
                            <h3 class="text-2xl font-extrabold">Bar & Lounge</h3>
                            <p class="text-sm font-medium opacity-90">48 établissements</p>
                        </div>
                    </div>
                    <div class="px-2 pb-2 flex justify-between items-center">
                        <span class="text-slate-500 text-sm font-bold uppercase tracking-wide">Découvrir</span>
                        <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                            <i data-lucide="arrow-right" class="w-5 h-5"></i>
                        </div>
                    </div>
                </a>

                <a href="#" class="group block bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-500">
                    <div class="h-64 rounded-[24px] overflow-hidden relative mb-4">
                        <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div class="absolute bottom-4 left-4 text-white">
                            <h3 class="text-2xl font-extrabold">Art & Culture</h3>
                            <p class="text-sm font-medium opacity-90">22 lieux d'exposition</p>
                        </div>
                    </div>
                    <div class="px-2 pb-2 flex justify-between items-center">
                        <span class="text-slate-500 text-sm font-bold uppercase tracking-wide">Découvrir</span>
                        <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                            <i data-lucide="arrow-right" class="w-5 h-5"></i>
                        </div>
                    </div>
                </a>

                <a href="#" class="group block bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-500">
                    <div class="h-64 rounded-[24px] overflow-hidden relative mb-4">
                        <img src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div class="absolute bottom-4 left-4 text-white">
                            <h3 class="text-2xl font-extrabold">Spa & Beauté</h3>
                            <p class="text-sm font-medium opacity-90">35 instituts</p>
                        </div>
                    </div>
                    <div class="px-2 pb-2 flex justify-between items-center">
                        <span class="text-slate-500 text-sm font-bold uppercase tracking-wide">Découvrir</span>
                        <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                            <i data-lucide="arrow-right" class="w-5 h-5"></i>
                        </div>
                    </div>
                </a>

                <a href="#" class="group block bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-500">
                    <div class="h-64 rounded-[24px] overflow-hidden relative mb-4">
                        <img src="https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div class="absolute bottom-4 left-4 text-white">
                            <h3 class="text-2xl font-extrabold">Mode & Créateurs</h3>
                            <p class="text-sm font-medium opacity-90">50 boutiques</p>
                        </div>
                    </div>
                    <div class="px-2 pb-2 flex justify-between items-center">
                        <span class="text-slate-500 text-sm font-bold uppercase tracking-wide">Découvrir</span>
                        <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                            <i data-lucide="arrow-right" class="w-5 h-5"></i>
                        </div>
                    </div>
                </a>

                <a href="#" class="group block bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-500">
                    <div class="h-64 rounded-[24px] overflow-hidden relative mb-4 bg-slate-200 flex items-center justify-center">
                         <i data-lucide="grid" class="w-16 h-16 text-slate-300"></i>
                         <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                         <div class="absolute bottom-4 left-4 text-white">
                             <h3 class="text-2xl font-extrabold">Tout voir</h3>
                             <p class="text-sm font-medium opacity-90">Parcourir la liste complète</p>
                         </div>
                    </div>
                    <div class="px-2 pb-2 flex justify-between items-center">
                        <span class="text-slate-500 text-sm font-bold uppercase tracking-wide">Découvrir</span>
                        <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                            <i data-lucide="arrow-right" class="w-5 h-5"></i>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    </main>

    <footer class="bg-white pt-16 pb-10 border-t border-slate-100">
        <div class="max-w-7xl mx-auto px-6 text-center">
            <div class="flex items-center justify-center gap-2 mb-6">
                <div class="w-8 h-8 bg-slate-900 text-brand-500 rounded-lg flex items-center justify-center">
                    <i data-lucide="book-open" class="w-5 h-5"></i>
                </div>
                <span class="text-xl font-extrabold tracking-tight text-slate-900">CIBOOKS</span>
            </div>
            <p class="text-sm text-slate-400 font-medium">&copy; 2026 CIBOOKS. Tous droits réservés.</p>
        </div>
    </footer>

    <script>
        lucide.createIcons();
        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 20) navbar.classList.add('shadow-sm');
            else navbar.classList.remove('shadow-sm');
        });
    </script>
</body>
</html>