<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mes Réservations | CIBOOKS</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
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
    </style>
</head>
<body class="font-sans text-slate-800 bg-[#FAFAFA] flex h-screen overflow-hidden selection:bg-brand-200 selection:text-brand-900">

    <aside class="w-72 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 transition-transform duration-300 absolute lg:relative z-50 transform -translate-x-full lg:translate-x-0" id="sidebar">
        <div class="h-20 flex items-center px-6 border-b border-slate-100 shrink-0">
            <a href="index.html" class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-900 text-brand-500 rounded-xl flex items-center justify-center shadow-md">
                    <i data-lucide="book-open" class="w-6 h-6"></i>
                </div>
                <h1 class="text-xl font-extrabold tracking-tight text-slate-900">CIBOOKS<span class="text-brand-500">.</span></h1>
            </a>
            <button class="lg:hidden ml-auto text-slate-400 hover:text-slate-900" onclick="toggleSidebar()"><i data-lucide="x" class="w-6 h-6"></i></button>
        </div>

        <div class="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            <a href="user-dashboard.html" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 font-medium transition-colors">
                <i data-lucide="layout-dashboard" class="w-5 h-5"></i> Vue d'ensemble
            </a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold shadow-md shadow-slate-900/10">
                <i data-lucide="calendar-check" class="w-5 h-5 text-brand-500"></i> Mes Réservations
            </a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 font-medium transition-colors">
                <i data-lucide="shopping-bag" class="w-5 h-5"></i> Mes Commandes
            </a>
        </div>
    </aside>

    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 hidden lg:hidden" id="sidebar-overlay" onclick="toggleSidebar()"></div>

    <main class="flex-1 flex flex-col h-full overflow-hidden relative">
        <header class="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
            <button class="lg:hidden text-slate-500" onclick="toggleSidebar()"><i data-lucide="menu" class="w-6 h-6"></i></button>
            <h2 class="font-bold text-slate-900">Mes Réservations</h2>
            <div class="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">AK</div>
        </header>

        <div class="flex-1 overflow-y-auto p-6 lg:p-8">
            <div class="max-w-4xl mx-auto">
                <div class="flex gap-2 mb-8 p-1 bg-white border border-slate-200 rounded-2xl w-max">
                    <button class="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm">À venir</button>
                    <button class="px-6 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors">Historique</button>
                </div>

                <div class="space-y-6">
                    <!-- Reservation Card 1 -->
                    <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 hover:border-brand-300 transition-colors">
                        <div class="w-full md:w-40 h-32 md:h-auto rounded-2xl overflow-hidden shrink-0">
                            <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="text-xl font-extrabold text-slate-900">Villa Maasai</h3>
                                <span class="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200">Confirmée</span>
                            </div>
                            <div class="flex flex-wrap gap-4 text-sm text-slate-500 font-medium mb-4">
                                <span class="flex items-center gap-1.5"><i data-lucide="calendar" class="w-4 h-4 text-brand-500"></i> 15 Juin 2026</span>
                                <span class="flex items-center gap-1.5"><i data-lucide="clock" class="w-4 h-4 text-brand-500"></i> 20:30</span>
                                <span class="flex items-center gap-1.5"><i data-lucide="users" class="w-4 h-4 text-brand-500"></i> 4 pers.</span>
                            </div>
                            <div class="flex gap-3">
                                <button class="text-sm font-bold text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-xl">Modifier</button>
                                <button class="text-sm font-bold text-red-600 hover:text-red-700 border border-red-100 bg-red-50 px-4 py-2 rounded-xl">Annuler</button>
                            </div>
                        </div>
                    </div>

                    <!-- Reservation Card 2 -->
                    <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 hover:border-brand-300 transition-colors">
                        <div class="w-full md:w-40 h-32 md:h-auto rounded-2xl overflow-hidden shrink-0">
                            <img src="https://images.unsplash.com/photo-1570554520913-ce219f885e35?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="text-xl font-extrabold text-slate-900">Noom Rooftop</h3>
                                <span class="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">En attente</span>
                            </div>
                            <div class="flex flex-wrap gap-4 text-sm text-slate-500 font-medium mb-4">
                                <span class="flex items-center gap-1.5"><i data-lucide="calendar" class="w-4 h-4 text-brand-500"></i> 18 Juin 2026</span>
                                <span class="flex items-center gap-1.5"><i data-lucide="clock" class="w-4 h-4 text-brand-500"></i> 19:00</span>
                                <span class="flex items-center gap-1.5"><i data-lucide="users" class="w-4 h-4 text-brand-500"></i> 2 pers.</span>
                            </div>
                            <div class="flex gap-3">
                                <button class="text-sm font-bold text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-xl">Modifier</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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