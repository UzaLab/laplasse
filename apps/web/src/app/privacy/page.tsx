import Link from 'next/link'
import { MapPin, ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Politique de Confidentialité — LaPlasse',
}

export default function PrivacyPage() {
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

      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Politique de Confidentialité</h1>
        <p className="text-slate-500 text-sm mb-8">Dernière mise à jour : juin 2026</p>

        <section className="space-y-4 text-slate-700 leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900">1. Données collectées</h2>
          <p>
            Nous collectons les données nécessaires au fonctionnement du service : identité
            (nom, email), numéro de téléphone (vérification OTP pour les marchands), préférences
            (favoris), avis et historique de recherche.
          </p>

          <h2 className="text-xl font-bold text-slate-900">2. Finalités</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Authentification et gestion de compte</li>
            <li>Affichage et modération des contenus</li>
            <li>Amélioration de la recherche et de l&apos;expérience utilisateur</li>
            <li>Sécurité et prévention des abus</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900">3. Conservation</h2>
          <p>
            Les données sont conservées tant que le compte est actif, puis supprimées ou anonymisées
            conformément aux obligations légales applicables en Côte d&apos;Ivoire.
          </p>

          <h2 className="text-xl font-bold text-slate-900">4. Vos droits</h2>
          <p>
            Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données
            via la <Link href="/contact" className="text-brand-600 font-semibold">page contact</Link>.
          </p>

          <h2 className="text-xl font-bold text-slate-900">5. Sécurité</h2>
          <p>
            Les mots de passe sont hashés (bcrypt). Les communications en production sont chiffrées
            via HTTPS. L&apos;accès aux données est limité par rôle (RBAC).
          </p>
        </section>
      </article>
    </div>
  )
}
