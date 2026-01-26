import type { PrismaClient, NotificationType, NotificationChannel } from '@letsforbook/database';
import { TRPCError } from '@trpc/server';
import { twilioClient, TWILIO_PHONE_NUMBER } from '../lib/twilio';
import { resend } from '../lib/resend';
import { format } from 'date-fns';

interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  appointmentId?: string;
}

export class NotificationService {
  /**
   * Send notification via specified channel
   */
  async sendNotification(
    prisma: PrismaClient,
    input: SendNotificationInput
  ): Promise<void> {
    const { userId, type, channel, subject, body, appointmentId } = input;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Determine recipient based on channel
    let recipient = '';
    if (channel === 'EMAIL' && user.email) {
      recipient = user.email;
    } else if (channel === 'SMS' && user.phone) {
      recipient = user.phone;
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        channel,
        recipient,
        subject,
        body,
        appointmentId,
        sent: false,
      },
    });

    // Send via specified channel
    try {
      if (channel === 'EMAIL' && user.email) {
        await this.sendEmail(user.email, subject || 'Notification', body);
      } else if (channel === 'SMS' && user.phone) {
        await this.sendSMS(user.phone, body);
      }

      // Mark as sent
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          sent: true,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmation(
    prisma: PrismaClient,
    appointmentId: string
  ): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: {
          include: {
            user: true,
          },
        },
        professional: {
          include: {
            user: true,
          },
        },
        salon: true,
        services: true,
      },
    });

    if (!appointment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Appointment not found',
      });
    }

    const formattedDate = format(appointment.startTime, 'EEEE d MMMM yyyy');
    const formattedTime = format(appointment.startTime, 'HH:mm');
    const serviceNames = appointment.services
      .map((s) => s.serviceName)
      .join(', ');

    const subject = 'Réservation confirmée';
    const body = `Votre rendez-vous chez ${appointment.salon.name} le ${formattedDate} à ${formattedTime} pour ${serviceNames} a été confirmé.`;

    // Send to client via email
    await this.sendNotification(prisma, {
      userId: appointment.client.userId,
      type: 'BOOKING_CONFIRMATION',
      channel: 'EMAIL',
      subject,
      body,
      appointmentId: appointment.id,
    });

    // Also send SMS if phone exists
    if (appointment.client.user.phone) {
      await this.sendNotification(prisma, {
        userId: appointment.client.userId,
        type: 'BOOKING_CONFIRMATION',
        channel: 'SMS',
        body,
        appointmentId: appointment.id,
      });
    }

    // Notify professional
    await this.sendNotification(prisma, {
      userId: appointment.professional.userId,
      type: 'NEW_BOOKING_REQUEST',
      channel: 'IN_APP',
      subject: 'Nouveau rendez-vous',
      body: `Nouvelle réservation: ${appointment.client.user.firstName} ${appointment.client.user.lastName} - ${formattedDate} à ${formattedTime}`,
      appointmentId: appointment.id,
    });
  }

  /**
   * Send booking reminder (24h before)
   */
  async sendBookingReminder(
    prisma: PrismaClient,
    appointmentId: string
  ): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: {
          include: {
            user: true,
          },
        },
        salon: true,
        services: true,
      },
    });

    if (!appointment || appointment.status !== 'CONFIRMED') {
      return;
    }

    const formattedTime = format(appointment.startTime, 'HH:mm');
    const serviceNames = appointment.services
      .map((s) => s.serviceName)
      .join(', ');

    const subject = 'Rappel de rendez-vous';
    const body = `Rappel: Votre rendez-vous chez ${appointment.salon.name} est demain à ${formattedTime} pour ${serviceNames}.`;

    // Send SMS
    if (appointment.client.user.phone) {
      await this.sendNotification(prisma, {
        userId: appointment.client.userId,
        type: 'BOOKING_REMINDER',
        channel: 'SMS',
        body,
        appointmentId: appointment.id,
      });
    }

    // Also send email
    await this.sendNotification(prisma, {
      userId: appointment.client.userId,
      type: 'BOOKING_REMINDER',
      channel: 'EMAIL',
      subject,
      body,
      appointmentId: appointment.id,
    });
  }

  /**
   * Send payment confirmation notification
   */
  async sendPaymentConfirmation(
    prisma: PrismaClient,
    paymentId: string
  ): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Payment not found',
      });
    }

    const subject = 'Paiement confirmé';
    const body = `Votre paiement de ${payment.amount / 100}${payment.currency} pour votre rendez-vous chez ${payment.appointment.salon.name} a été confirmé.`;

    await this.sendNotification(prisma, {
      userId: payment.appointment.client.userId,
      type: 'PAYMENT_SUCCESS',
      channel: 'EMAIL',
      subject,
      body,
      appointmentId: payment.appointmentId,
    });
  }

  /**
   * Send cancellation notification
   */
  async sendCancellationNotification(
    prisma: PrismaClient,
    appointmentId: string,
    cancelledBy: 'CLIENT' | 'SALON'
  ): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: {
          include: {
            user: true,
          },
        },
        professional: {
          include: {
            user: true,
          },
        },
        salon: true,
      },
    });

    if (!appointment) {
      return;
    }

    const formattedDate = format(appointment.startTime, 'EEEE d MMMM yyyy');
    const formattedTime = format(appointment.startTime, 'HH:mm');

    if (cancelledBy === 'CLIENT') {
      // Notify professional
      await this.sendNotification(prisma, {
        userId: appointment.professional.userId,
        type: 'BOOKING_CANCELLED',
        channel: 'IN_APP',
        subject: 'Rendez-vous annulé',
        body: `${appointment.client.user.firstName} ${appointment.client.user.lastName} a annulé son rendez-vous du ${formattedDate} à ${formattedTime}.`,
        appointmentId: appointment.id,
      });
    } else {
      // Notify client
      const body = `Votre rendez-vous chez ${appointment.salon.name} du ${formattedDate} à ${formattedTime} a été annulé par le salon.${appointment.cancelReason ? ` Raison: ${appointment.cancelReason}` : ''}`;

      await this.sendNotification(prisma, {
        userId: appointment.client.userId,
        type: 'BOOKING_CANCELLED',
        channel: 'EMAIL',
        subject: 'Rendez-vous annulé',
        body,
        appointmentId: appointment.id,
      });

      if (appointment.client.user.phone) {
        await this.sendNotification(prisma, {
          userId: appointment.client.userId,
          type: 'BOOKING_CANCELLED',
          channel: 'SMS',
          body: `Votre RDV chez ${appointment.salon.name} du ${formattedDate} à ${formattedTime} a été annulé.`,
          appointmentId: appointment.id,
        });
      }
    }
  }

  /**
   * Send email via Resend
   */
  private async sendEmail(
    to: string,
    subject: string,
    text: string
  ): Promise<void> {
    await resend.emails.send({
      from: 'LetsForBook <notifications@letsforbook.com>',
      to,
      subject,
      text,
      html: `<p>${text}</p>`,
    });
  }

  /**
   * Send SMS via Twilio
   */
  private async sendSMS(to: string, body: string): Promise<void> {
    await twilioClient.messages.create({
      from: TWILIO_PHONE_NUMBER,
      to,
      body,
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    prisma: PrismaClient,
    userId: string,
    limit: number = 20,
    cursor?: string
  ) {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      items: notifications,
      nextCursor:
        notifications.length === limit
          ? notifications[notifications.length - 1]?.id
          : null,
      hasMore: notifications.length === limit,
    };
  }

  /**
   * Mark notification as read (not used since schema doesn't have 'read' field)
   */
  async markAsRead(
    prisma: PrismaClient,
    notificationId: string,
    userId: string
  ): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Notification not found',
      });
    }

    if (notification.userId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only mark your own notifications as read',
      });
    }

    // Note: The Notification model doesn't have a 'read' field
    // This would need to be added to the schema if needed
  }

  /**
   * Mark all notifications as read (not used since schema doesn't have 'read' field)
   */
  async markAllAsRead(_prisma: PrismaClient, _userId: string): Promise<void> {
    // Note: The Notification model doesn't have a 'read' field
    // This would need to be added to the schema if needed
  }
}

export const notificationService = new NotificationService();
