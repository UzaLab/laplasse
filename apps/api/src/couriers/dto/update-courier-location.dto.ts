import { IsNumber } from 'class-validator'

export class UpdateCourierLocationDto {
  @IsNumber()
  latitude!: number

  @IsNumber()
  longitude!: number
}
