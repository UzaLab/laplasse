import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { FraudService } from './fraud.service'

@Controller('admin/fraud')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class FraudController {
  constructor(private readonly fraud: FraudService) {}

  @Get()
  list() {
    return this.fraud.listUnresolved()
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.fraud.resolve(id)
  }
}
