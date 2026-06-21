import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { Request } from 'express'

export const COUNTRY_HEADER = 'x-laplasse-country'
export const DEFAULT_COUNTRY = 'CI'

export type RequestWithCountry = Request & { countryCode: string }

@Injectable()
export class CountryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithCountry>()
    const raw = req.headers[COUNTRY_HEADER]
    const header = Array.isArray(raw) ? raw[0] : raw
    const code = header?.trim().toUpperCase()
    req.countryCode = code && /^[A-Z]{2}$/.test(code) ? code : DEFAULT_COUNTRY
    return next.handle()
  }
}
