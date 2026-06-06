import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SubscriptionPlan } from '../../../generated/prisma/client'
import { getPlanLimits, PlanLimits } from '../plan-limits'

export const PLAN_FEATURE_KEY = 'plan_feature'

export type PlanFeature = keyof Pick<
  PlanLimits,
  'crm' | 'promotions' | 'orgAllowed'
>

export const RequirePlanFeature = (feature: PlanFeature) =>
  SetMetadata(PLAN_FEATURE_KEY, feature)

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const feature = this.reflector.getAllAndOverride<PlanFeature | undefined>(
      PLAN_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (!feature) return true

    const request = context.switchToHttp().getRequest<{ merchantPlan?: SubscriptionPlan }>()
    const plan = request.merchantPlan ?? 'FREE'
    const limits = getPlanLimits(plan)

    if (!limits[feature]) {
      throw new ForbiddenException(`Cette fonctionnalité n'est pas incluse dans votre plan actuel.`)
    }

    return true
  }
}
