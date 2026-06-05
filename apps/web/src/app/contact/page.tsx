import Link from 'next/link'
import { MapPin, ChevronLeft, Mail, MessageCircle, Clock } from 'lucide-react'

export const metadata = {
  title: 'Contact & Support — LaPlasse',
}

export default function ContactPage() {
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

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Contact & Support</h1>
        <p className="text-slate-500 mb-10">
          Une question, un problème avec votre compte ou un signalement ? Notre équipe vous répond sous 24–48h.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 mb-10">
          <a
            href="mailto:support@laplasse.ci"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-300 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-4">
              <Mail size={20} />
            </div>
            <h2 className="font-bold text-slate-900 mb-1">Email</h2>
            <p className="text-sm text-brand-600 font-semibold">support@laplasse.ci</p>
          </a>

          <a
            href="https://wa.me/2250000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-green-300 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
              <MessageCircle size={20} />
            </div>
            <h2 className="font-bold text-slate-900 mb-1">WhatsApp</h2>
            <p className="text-sm text-green-600 font-semibold">Discuter avec le support</p>
          </a>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
          <Clock size={22} className="text-slate-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-slate-900 mb-1">Horaires de réponse</h3>
            <p className="text-sm text-slate-600">
              Lundi – Vendredi, 9h – 18h (GMT). Les marchands en attente de vérification sont traités
              sous 24–48h ouvrées.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-12">
          <Link href="/terms" className="hover:text-slate-600">CGU</Link>
          {' · '}
          <Link href="/privacy" className="hover:text-slate-600">Confidentialité</Link>
        </p>
      </div>
    </div>
  )
}
