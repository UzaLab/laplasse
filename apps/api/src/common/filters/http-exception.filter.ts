import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException')

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const raw =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error'

    const message =
      typeof raw === 'string'
        ? raw
        : (raw as Record<string, unknown>).message ?? raw

    if (status >= 500) {
      this.logger.error({
        event: 'api_error',
        method: req.method,
        path: req.url,
        statusCode: status,
        message,
        stack: exception instanceof Error ? exception.stack : undefined,
      })
    } else if (status === 401 || status === 403) {
      this.logger.warn({
        event: status === 401 ? 'auth.unauthorized' : 'auth.forbidden',
        method: req.method,
        path: req.url,
        ip: req.ip,
      })
    }

    res.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      message,
    })
  }
}
