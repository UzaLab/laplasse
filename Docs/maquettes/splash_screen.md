<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#f2cc0d",
                        "eventis-black": "#000000",
                        "background-light": "#ffffff",
                    },
                    fontFamily: {
                        "display": ["Plus Jakarta Sans", "sans-serif"]
                    },
                },
            },
        }
    </script>
<style type="text/tailwindcss">
        @layer utilities {
            .loading-ring {
                width: 32px;
                height: 32px;
                border: 1.5px solid #f2cc0d20;
                border-top-color: #f2cc0d;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #ffffff;
            height: 100dvh;
            overflow: hidden;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light flex flex-col items-center justify-between font-display text-eventis-black">
<div class="h-14 w-full"></div>
<div class="flex-1 flex flex-col items-center justify-center w-full px-8">
<div class="flex flex-col items-center gap-12">
<div class="relative flex items-center">
<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-eventis-black flex items-end">
                    EVENTIS<span class="w-2.5 h-2.5 bg-primary rounded-full mb-1.5 ml-0.5"></span>
</h1>
</div>
<div class="mt-4">
<div class="loading-ring"></div>
</div>
</div>
</div>
<div class="w-full flex flex-col items-center pb-12 px-6">
<div class="mb-10 flex flex-col items-center">
<p class="text-eventis-black text-center font-normal tracking-wide text-lg">
                Vivez des moments <span class="font-bold">d'exception</span>
</p>
</div>
<div class="h-1 w-32 bg-black/5 rounded-full"></div>
</div>
<div class="fixed top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
<div class="fixed bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

</body></html>