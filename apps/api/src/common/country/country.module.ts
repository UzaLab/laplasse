import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { CountryInterceptor } from './country.interceptor'

@Module({
  providers: [
    { provide: APP_INTERCEPTOR, useClass: CountryInterceptor },
  ],
})
export class CountryModule {}
