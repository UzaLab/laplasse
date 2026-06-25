import { IsEmail, IsString, MinLength, MaxLength, ValidateIf } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  password!: string

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  full_name!: string

  @IsString()
  @MinLength(8)
  @MaxLength(30)
  phone!: string
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

export class RefreshTokenDto {
  @ValidateIf((o: RefreshTokenDto) => o.refresh_token !== undefined && o.refresh_token !== '')
  @IsString()
  refresh_token?: string
}

export class SendOtpDto {
  @IsString()
  phone: string
}

export class VerifyOtpDto {
  @IsString()
  phone: string

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string
}
