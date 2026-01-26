import type { PrismaClient } from '@letsforbook/database';
import { TRPCError } from '@trpc/server';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe';

export class PaymentService {
  /**
   * Create payment intent for appointment booking
   */
  async createPaymentIntent(
    prisma: PrismaClient,
    appointmentId: string,
    userId: string
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    // Get appointment with services
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        salon: true,
        client: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Appointment not found',
      });
    }

    if (appointment.client.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Unauthorized to create payment for this appointment',
      });
    }

    // Calculate total amount
    const totalAmount = appointment.services.reduce(
      (sum, svc) => sum + svc.price,
      0
    );

    // Determine payment type (deposit or full payment)
    const isDepositRequired = appointment.salon.depositRequired;
    const depositPercentage = appointment.salon.depositPercentage || 100;
    const paymentType =
      isDepositRequired && depositPercentage < 100 ? 'DEPOSIT' : 'FULL_PAYMENT';

    const chargeAmount = Math.round((totalAmount * depositPercentage) / 100);

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: appointment.salon.currency.toLowerCase(),
      metadata: {
        appointmentId: appointment.id,
        salonId: appointment.salonId,
        userId: userId,
        paymentType,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        amount: chargeAmount,
        currency: appointment.salon.currency,
        type: paymentType,
        status: 'PENDING',
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create payment intent',
      });
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(prisma: PrismaClient, event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentSuccess(prisma, paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentFailure(prisma, paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await this.handleRefund(prisma, charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(
    prisma: PrismaClient,
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: {
        appointment: {
          include: {
            client: {
              include: {
                user: true,
              },
            },
            salon: true,
          },
        },
      },
    });

    if (!payment) {
      console.error(`Payment not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Update appointment status if it was pending
    if (payment.appointment.status === 'PENDING') {
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: {
          status: 'CONFIRMED',
        },
      });
    }

    // TODO: Send confirmation notification
    // await notificationService.sendPaymentConfirmation(payment.appointment);
  }

  private async handlePaymentFailure(
    prisma: PrismaClient,
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      console.error(`Payment not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
      },
    });

    // Optionally cancel the appointment
    await prisma.appointment.update({
      where: { id: payment.appointmentId },
      data: {
        status: 'CANCELLED_CLIENT',
        cancelReason: 'Payment failed',
        cancelledAt: new Date(),
      },
    });

    // TODO: Send failure notification
    // await notificationService.sendPaymentFailure(payment.appointment);
  }

  private async handleRefund(prisma: PrismaClient, charge: Stripe.Charge): Promise<void> {
    const payment = await prisma.payment.findFirst({
      where: { stripeChargeId: charge.id },
    });

    if (!payment) {
      console.error(`Payment not found for charge: ${charge.id}`);
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });

    // TODO: Send refund notification
    // await notificationService.sendRefundConfirmation(payment.appointment);
  }

  /**
   * Refund payment
   */
  async refundPayment(
    prisma: PrismaClient,
    appointmentId: string,
    reason?: string
  ): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { appointmentId },
    });

    if (!payment || !payment.stripePaymentIntentId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Payment not found',
      });
    }

    if (payment.status !== 'PAID') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Payment cannot be refunded',
      });
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      reason: reason ? 'requested_by_customer' : 'duplicate',
    });

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        stripeRefundId: refund.id,
        refundedAt: new Date(),
      },
    });
  }
}

export const paymentService = new PaymentService();
