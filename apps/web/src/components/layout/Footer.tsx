import Link from 'next/link'
import { BookOpen, Globe, Share2, LinkIcon, Heart } from 'lucide-react'
import { BRAND_FOOTER_TAGLINE } from '@/lib/brandCopy'

export function Footer() {
  return (
    <footer className="bg-white pt-20 pb-10 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-slate-900 text-brand-500 rounded-lg flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">LaPlasse</span>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              {BRAND_FOOTER_TAGLINE}
            </p>
            <div className="flex gap-4">
              {[Globe, Share2, LinkIcon].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Colonnes de liens */}
          {[
            {
              title: 'Explorer',
              links: [
                { label: 'Restaurants', href: '#' },
                { label: 'Bars & Lounges', href: '#' },
                { label: 'Spas & Bien-être', href: '#' },
                { label: 'Concept Stores', href: '#' },
                { label: 'Marketplace', href: '/marketplace' },
              ],
            },
            {
              title: 'Business',
              links: [
                { label: 'Inscrire son lieu', href: '#' },
                { label: 'Devenir livreur', href: '/courier/signup' },
                { label: 'Partenaire logistique', href: '/logistics/signup' },
                { label: 'Solutions de paiement', href: '#' },
                { label: 'Tarifs Pro', href: '#' },
              ],
            },
            {
              title: 'Aide & Contact',
              links: [
                { label: 'FAQ Utilisateurs', href: '#' },
                { label: 'Nous contacter', href: '#' },
                { label: 'Conditions Générales', href: '#' },
                { label: 'Confidentialité', href: '#' },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-extrabold text-slate-900 mb-6">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400 font-medium">
          <p>© 2026 LaPlasse. Tous droits réservés.</p>
          <p className="flex items-center gap-1">
            Conçu avec <Heart size={14} className="text-red-500 fill-red-500" /> pour l&apos;excellence locale.
          </p>
        </div>
      </div>
    </footer>
  )
}
