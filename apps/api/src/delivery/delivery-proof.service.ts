import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationQueueService } from '../queue/notification-queue.service'

const OTP_TTL_MS = 3 * 60 * 60 * 1000

@Injectable()
export class DeliveryProofService {
  private readonly logger = new Logger(DeliveryProofService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  generateCode(): string {
    return String(Math.floor(1000 + Math.random() * 9000))
  }

  isOtpActive(job: { proof_otp: string | null; proof_otp_expires_at: Date | null }) {
    if (!job.proof_otp || !job.proof_otp_expires_at) return false
    return job.proof_otp_expires_at.getTime() > Date.now()
  }

  /** Code visible côté client (track / commande). */
  clientDeliveryCode(job: {
    status: string
    proof_otp: string | null
    proof_otp_expires_at: Date | null
    proof_confirmed_at: Date | null
  }): string | null {
    if (job.status !== 'IN_TRANSIT') return null
    if (job.proof_confirmed_at) return null
    if (!this.isOtpActive(job)) return null
    return job.proof_otp
  }

  async issueForJob(jobId: string) {
    const job = await this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: { order: { select: { id: true, user_id: true } } },
    })
    if (!job) return null

    const code = this.generateCode()
    const expires = new Date(Date.now() + OTP_TTL_MS)

    await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        proof_otp: code,
        proof_otp_expires_at: expires,
        proof_confirmed_at: null,
      },
    })

    await this.notificationQueue.enqueuePush({
      userId: job.order.user_id,
      type: 'delivery_proof_otp',
      title: 'Code de livraison',
      body: `Communiquez ce code au livreur à l'arrivée : ${code}`,
      data: {
        order_id: job.order.id,
        job_id: jobId,
        delivery_code: code,
      },
    })

    this.logger.log(`Delivery OTP issued for job ${jobId}`)
    return { code, expires_at: expires }
  }

  async verifyAndConfirm(jobId: string, submittedOtp?: string) {
    const job = await this.prisma.deliveryJob.findUnique({ where: { id: jobId } })
    if (!job) throw new BadRequestException('Course introuvable')

    if (!job.proof_otp) return

    if (!submittedOtp?.trim()) {
      throw new BadRequestException('Code de livraison requis')
    }

    if (!this.isOtpActive(job)) {
      throw new BadRequestException('Code de livraison expiré — demandez un nouveau code au support')
    }

    if (submittedOtp.trim() !== job.proof_otp) {
      throw new BadRequestException('Code de livraison incorrect')
    }

    await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: { proof_confirmed_at: new Date() },
    })
  }
}
