import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator'
import { DeliveryJobStatus } from '../../../generated/prisma/client'

const COURIER_ADVANCE_STATUSES: DeliveryJobStatus[] = [
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
]

export class UpdateCourierJobStatusDto {
  @IsEnum(DeliveryJobStatus)
  status!: DeliveryJobStatus

  /** Code 4 chiffres communiqué par le client (requis pour DELIVERED si OTP actif). */
  @IsOptional()
  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/)
  proof_otp?: string
}

export { COURIER_ADVANCE_STATUSES }
