import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator'

export class RespondPartnerContractDto {
  @IsOptional()
  @IsBoolean()
  accept?: boolean
}

export class UpdatePartnerContractDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  sla_eta_max_minutes?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  fee_override?: number | null

  @IsOptional()
  @IsBoolean()
  auto_dispatch?: boolean

  /** Met en pause (true) ou réactive (false) un contrat actif / en pause */
  @IsOptional()
  @IsBoolean()
  pause?: boolean
}
