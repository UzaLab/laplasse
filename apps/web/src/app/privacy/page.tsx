import Link from 'next/link'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'
import { PUBLIC_CONTENT } from '@/lib/pageLayout'

export const metadata = {
  title: 'Politique de Confidentialité — LaPlasse',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PublicPageHeader title="Confidentialité" backHref="/" />

      <article className={`${PUBLIC_CONTENT} py-12`}>
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
            conformément aux obligations légales applicables dans les territoires où LaPlasse est disponible.
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
