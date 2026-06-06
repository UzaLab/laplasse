import {
  IsDateString, IsEmail, IsIn, IsInt, IsOptional, IsString, Min, MinLength,
} from 'class-validator'
import { BookingType } from '../../../generated/prisma/client'

export class CreateBookingDto {
  @IsString()
  @MinLength(2)
  guest_name!: string

  @IsString()
  @MinLength(8)
  guest_phone!: string

  @IsOptional()
  @IsEmail()
  guest_email?: string

  @IsDateString()
  booked_at!: string

  @IsOptional()
  @IsDateString()
  check_out_at?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  party_size?: number

  @IsOptional()
  @IsString()
  service_id?: string

  @IsOptional()
  @IsString()
  staff_id?: string

  @IsOptional()
  @IsString()
  room_type?: string

  @IsOptional()
  @IsString()
  @IsIn(['TABLE', 'APPOINTMENT', 'ROOM', 'CONSULTATION', 'VENUE'])
  booking_type?: BookingType

  @IsOptional()
  @IsString()
  notes?: string
}

export class UpdateBookingStatusDto {
  @IsString()
  status!: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
}

export class CancelBookingDto {
  @IsOptional()
  @IsString()
  reason?: string
}
