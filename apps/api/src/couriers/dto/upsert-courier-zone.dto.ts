import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString, ValidateIf } from 'class-validator'

export class UpsertCourierZoneDto {
  @IsString()
  city_id!: string

  @IsBoolean()
  all_communes!: boolean

  @ValidateIf(o => !o.all_communes)
  @IsArray()
  @ArrayMinSize(1, { message: 'Sélectionnez au moins une commune' })
  @IsString({ each: true })
  commune_ids?: string[]
}
