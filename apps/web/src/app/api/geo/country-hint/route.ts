import { NextRequest, NextResponse } from 'next/server'
import { isSupportedCountryCode } from '@/lib/country'

/** Détection pays visiteur via headers edge (Cloudflare, Vercel) — sans appel externe. */
export async function GET(request: NextRequest) {
  const raw =
    request.headers.get('cf-ipcountry') ??
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('x-country-code') ??
    ''

  const code = raw.trim().toUpperCase()

  if (!code || code === 'XX' || code === 'T1' || !isSupportedCountryCode(code)) {
    return NextResponse.json({ country: null })
  }

  return NextResponse.json({ country: code })
}
