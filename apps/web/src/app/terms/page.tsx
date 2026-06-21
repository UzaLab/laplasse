import Link from 'next/link'
import { MapPin, ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Conditions Générales d\'Utilisation — LaPlasse',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-900" style={{ textDecoration: 'none' }}>
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-brand-500" />
            <span className="font-extrabold text-slate-900">LaPlasse</span>
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12 prose prose-slate">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Conditions Générales d&apos;Utilisation</h1>
        <p className="text-slate-500 text-sm mb-8">Dernière mise à jour : juin 2026</p>

        <section className="space-y-4 text-slate-700 leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900">1. Objet</h2>
          <p>
            LaPlasse est une plateforme de découverte, de réservation et d&apos;achat auprès
            de commerces locaux premium. Les présentes CGU régissent l&apos;accès et
            l&apos;utilisation du site et des services associés par les consommateurs et les
            marchands partenaires.
          </p>

          <h2 className="text-xl font-bold text-slate-900">2. Inscription et compte</h2>
          <p>
            L&apos;utilisateur s&apos;engage à fournir des informations exactes lors de la création
            de son compte. Il est responsable de la confidentialité de ses identifiants.
          </p>

          <h2 className="text-xl font-bold text-slate-900">3. Contenus et avis</h2>
          <p>
            Les avis publiés sont soumis à modération. Tout contenu illicite, diffamatoire ou trompeur
            peut être supprimé. LaPlasse se réserve le droit de suspendre un compte en cas de violation.
          </p>

          <h2 className="text-xl font-bold text-slate-900">4. Marchands</h2>
          <p>
            Les établissements inscrits garantissent l&apos;exactitude des informations publiées
            (horaires, coordonnées, description). La vérification par LaPlasse ne constitue pas une
            garantie commerciale.
          </p>

          <h2 className="text-xl font-bold text-slate-900">5. Limitation de responsabilité</h2>
          <p>
            LaPlasse met en relation utilisateurs et commerces. Les transactions, réservations ou
            prestations réalisées hors plateforme relèvent de la responsabilité des parties concernées.
          </p>

          <h2 className="text-xl font-bold text-slate-900">6. Contact</h2>
          <p>
            Pour toute question : <Link href="/contact" className="text-brand-600 font-semibold">page contact</Link>.
          </p>
        </section>
      </article>
    </div>
  )
}
