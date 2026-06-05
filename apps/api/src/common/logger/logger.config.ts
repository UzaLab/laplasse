import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston'
import * as winston from 'winston'
import 'winston-daily-rotate-file'

const isDev = process.env.NODE_ENV !== 'production'

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

const prettyFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  nestWinstonModuleUtilities.format.nestLike('LaPlasse', {
    prettyPrint: true,
    colors: true,
  }),
)

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isDev ? prettyFormat : jsonFormat,
  }),
]

if (!isDev && process.env.LOG_TO_FILE === 'true') {
  transports.push(
    new (winston.transports as unknown as {
      DailyRotateFile: new (opts: object) => winston.transport
    }).DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: jsonFormat,
      level: 'info',
    }),
    new (winston.transports as unknown as {
      DailyRotateFile: new (opts: object) => winston.transport
    }).DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: jsonFormat,
      level: 'error',
    }),
  )
}

export const winstonLogger = WinstonModule.createLogger({
  level: isDev ? 'debug' : 'info',
  transports,
})
