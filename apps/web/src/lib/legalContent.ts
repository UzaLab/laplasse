import { getCountryLabel } from '@/lib/country'

export type LegalCountry = 'CI' | 'BF' | 'SN'

export interface LegalSection {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export interface LegalDocument {
  title: string
  updated: string
  jurisdiction: string
  sections: LegalSection[]
}

const COMMON_UPDATED = 'juin 2026'

function jurisdictionLabel(code: LegalCountry): string {
  return getCountryLabel(code)
}

function termsBase(country: LegalCountry): LegalDocument {
  const jurisdiction = jurisdictionLabel(country)
  return {
    title: "Conditions Générales d'Utilisation",
    updated: COMMON_UPDATED,
    jurisdiction,
    sections: [
      {
        title: '1. Objet',
        paragraphs: [
          `LaPlasse est une plateforme de découverte, de réservation et d'achat auprès de commerces locaux premium, disponible en ${jurisdiction}. Les présentes CGU régissent l'accès et l'utilisation du site et des services associés.`,
        ],
      },
      {
        title: '2. Inscription et compte',
        paragraphs: [
          "L'utilisateur s'engage à fournir des informations exactes lors de la création de son compte et à maintenir la confidentialité de ses identifiants.",
        ],
      },
      {
        title: '3. Contenus et avis',
        paragraphs: [
          'Les avis publiés sont soumis à modération. Tout contenu illicite, diffamatoire ou trompeur peut être supprimé sans préavis.',
        ],
      },
      {
        title: '4. Marchands',
        paragraphs: [
          `Les établissements inscrits garantissent l'exactitude des informations publiées. La vérification LaPlasse ne constitue pas une garantie commerciale au sens du droit ${country === 'CI' ? 'ivoirien' : country === 'BF' ? 'burkinabè' : 'sénégalais'}.`,
        ],
      },
      {
        title: '5. Paiements',
        paragraphs: [
          'Les transactions effectuées via LaPlasse peuvent être traitées en mode simulateur en phase de préproduction. Les montants sont exprimés en FCFA (XOF) sauf indication contraire.',
        ],
      },
      {
        title: '6. Limitation de responsabilité',
        paragraphs: [
          'LaPlasse met en relation utilisateurs et commerces. Les prestations réalisées hors plateforme relèvent de la responsabilité des parties concernées.',
        ],
      },
      {
        title: '7. Droit applicable',
        paragraphs: [
          `Les présentes CGU sont régies par le droit en vigueur en ${jurisdiction}. En cas de litige, les tribunaux compétents de la principale ville du pays concerné seront saisis, sauf disposition impérative contraire.`,
        ],
      },
      {
        title: '8. Contact',
        paragraphs: ['Pour toute question relative aux CGU, utilisez la page contact du site.'],
      },
    ],
  }
}

function privacyBase(country: LegalCountry): LegalDocument {
  const jurisdiction = jurisdictionLabel(country)
  const regulator =
    country === 'CI'
      ? "l'Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire (ARTCI)"
      : country === 'BF'
        ? 'la Commission de l\'Informatique et des Libertés (CIL) du Burkina Faso'
        : 'la Commission de Protection des Données Personnelles (CDP) du Sénégal'

  return {
    title: 'Politique de Confidentialité',
    updated: COMMON_UPDATED,
    jurisdiction,
    sections: [
      {
        title: '1. Données collectées',
        paragraphs: [
          'Nous collectons les données nécessaires au service : identité (nom, email), téléphone (OTP marchands), favoris, avis, historique de recherche et commandes.',
        ],
      },
      {
        title: '2. Finalités',
        paragraphs: ['Vos données sont utilisées pour :'],
        bullets: [
          'Authentification et gestion de compte',
          'Traitement des commandes et réservations',
          'Modération des contenus',
          'Amélioration de la recherche et de l\'expérience',
          'Sécurité et prévention des abus',
        ],
      },
      {
        title: '3. Territorialité',
        paragraphs: [
          `Cette politique s'applique aux utilisateurs situés en ${jurisdiction}. Les données sont hébergées conformément aux exigences applicables dans la zone UEMOA.`,
        ],
      },
      {
        title: '4. Conservation',
        paragraphs: [
          'Les données sont conservées tant que le compte est actif, puis supprimées ou anonymisées selon les obligations légales locales.',
        ],
      },
      {
        title: '5. Vos droits',
        paragraphs: [
          `Vous pouvez demander l'accès, la rectification ou la suppression de vos données via la page contact. Vous pouvez également saisir ${regulator} pour les réclamations relevant de sa compétence.`,
        ],
      },
      {
        title: '6. Sécurité',
        paragraphs: [
          'Mots de passe hashés (bcrypt), HTTPS en production, accès limité par rôle (RBAC).',
        ],
      },
    ],
  }
}

export function getTermsContent(country: string): LegalDocument {
  const code = (country.toUpperCase() as LegalCountry)
  if (code === 'BF' || code === 'SN') return termsBase(code)
  return termsBase('CI')
}

export function getPrivacyContent(country: string): LegalDocument {
  const code = (country.toUpperCase() as LegalCountry)
  if (code === 'BF' || code === 'SN') return privacyBase(code)
  return privacyBase('CI')
}
