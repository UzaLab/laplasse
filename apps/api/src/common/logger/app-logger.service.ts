import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class AppLoggerService {
  private readonly logger = new Logger('App')

  authSuccess(email: string, role: string) {
    this.logger.log({ event: 'auth.login', email, role })
  }

  authFailure(email: string, reason: string) {
    this.logger.warn({ event: 'auth.failure', email, reason })
  }

  moderationAction(adminId: string, action: string, targetId: string, targetType: string) {
    this.logger.log({ event: 'moderation', adminId, action, targetType, targetId })
  }

  slowQuery(endpoint: string, durationMs: number) {
    this.logger.warn({ event: 'slow_query', endpoint, durationMs })
  }

  suspiciousActivity(ip: string, endpoint: string, detail: string) {
    this.logger.warn({ event: 'suspicious', ip, endpoint, detail })
  }

  apiError(endpoint: string, statusCode: number, message: string) {
    this.logger.error({ event: 'api_error', endpoint, statusCode, message })
  }
}
