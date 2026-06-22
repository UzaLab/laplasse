import Link from 'next/link'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'
import { PUBLIC_CONTENT } from '@/lib/pageLayout'
import type { LegalDocument } from '@/lib/legalContent'
import { getCountryLabel } from '@/lib/country'

export function LegalDocumentView({
  doc,
  country,
  headerTitle,
}: {
  doc: LegalDocument
  country: string
  headerTitle: string
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PublicPageHeader title={headerTitle} backHref="/" />

      <article className={`${PUBLIC_CONTENT} py-12 prose prose-slate max-w-none`}>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2 not-prose">
          {getCountryLabel(country)}
        </p>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{doc.title}</h1>
        <p className="text-slate-500 text-sm mb-8 not-prose">
          Dernière mise à jour : {doc.updated} · Juridiction : {doc.jurisdiction}
        </p>

        <section className="space-y-6 text-slate-700 leading-relaxed not-prose">
          {doc.sections.map(section => (
            <div key={section.title}>
              <h2 className="text-xl font-bold text-slate-900 mb-2">{section.title}</h2>
              {section.paragraphs.map(p => (
                <p key={p.slice(0, 40)} className="mb-2">{p}</p>
              ))}
              {section.bullets && (
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  {section.bullets.map(b => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <p className="text-sm text-slate-500 pt-4">
            <Link href="/contact" className="text-brand-600 font-semibold">Page contact</Link>
          </p>
        </section>
      </article>
    </div>
  )
}
