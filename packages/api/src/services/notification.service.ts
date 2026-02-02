import type { PrismaClient, NotificationType, NotificationChannel } from '@letsforbook/database';
import { TRPCError } from '@trpc/server';
import { getTwilioClient, getTwilioPhoneNumber } from '../lib/twilio';
import { getResend } from '../lib/resend';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  html?: string;
  appointmentId?: string;
}

const APP_NAME = 'LetsForBook';
const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] || 'https://letsforbook.com';
const FROM_EMAIL = process.env['RESEND_FROM_EMAIL'] || 'notifications@letsforbook.com';

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
        await this.sendEmail(user.email, subject || 'Notification', body, input.html);
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

    const formattedDate = this.formatDateFr(appointment.startTime);
    const serviceNames = appointment.services.map((s) => s.serviceName).join(', ');
    const totalAmount = appointment.services.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = appointment.services.reduce((sum, s) => sum + s.duration, 0);
    const clientName = `${appointment.client.user.firstName} ${appointment.client.user.lastName}`;
    const proName = `${appointment.professional.user.firstName} ${appointment.professional.user.lastName}`;

    const subject = `Confirmation de votre rendez-vous chez ${appointment.salon.name}`;
    const textBody = `Votre rendez-vous chez ${appointment.salon.name} le ${formattedDate} pour ${serviceNames} a été confirmé. Adresse: ${appointment.salon.address}, ${appointment.salon.postalCode} ${appointment.salon.city}. Rappel: Toute annulation doit être faite au moins 48h à l'avance.`;

    const htmlBody = this.getConfirmationEmailTemplate({
      clientName,
      salonName: appointment.salon.name,
      salonAddress: `${appointment.salon.address}, ${appointment.salon.postalCode} ${appointment.salon.city}`,
      salonPhone: appointment.salon.phone,
      professionalName: proName,
      date: formattedDate,
      services: serviceNames,
      duration: totalDuration,
      totalAmount: (totalAmount / 100).toFixed(2).replace('.', ',') + ' €',
      appointmentId: appointment.id,
    });

    // Send to client via email
    await this.sendNotification(prisma, {
      userId: appointment.client.userId,
      type: 'BOOKING_CONFIRMATION',
      channel: 'EMAIL',
      subject,
      body: textBody,
      html: htmlBody,
      appointmentId: appointment.id,
    });

    // Also send SMS if phone exists
    if (appointment.client.user.phone) {
      const smsBody = `${APP_NAME}: RDV confirmé chez ${appointment.salon.name} le ${formattedDate}. ${serviceNames}. Adresse: ${appointment.salon.address}, ${appointment.salon.city}. Annulation: 48h à l'avance.`;
      await this.sendNotification(prisma, {
        userId: appointment.client.userId,
        type: 'BOOKING_CONFIRMATION',
        channel: 'SMS',
        body: smsBody,
        appointmentId: appointment.id,
      });
    }

    // Notify professional
    await this.sendNotification(prisma, {
      userId: appointment.professional.userId,
      type: 'NEW_BOOKING_REQUEST',
      channel: 'IN_APP',
      subject: 'Nouveau rendez-vous',
      body: `Nouvelle réservation: ${clientName} - ${formattedDate} - ${serviceNames}`,
      appointmentId: appointment.id,
    });
  }

  /**
   * Send booking reminder (7 days or 1 day before)
   */
  async sendBookingReminder(
    prisma: PrismaClient,
    appointmentId: string,
    reminderType: '7_DAYS' | '1_DAY' = '1_DAY'
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

    if (!appointment || appointment.status !== 'CONFIRMED') {
      return;
    }

    const formattedDate = this.formatDateFr(appointment.startTime);
    const serviceNames = appointment.services.map((s) => s.serviceName).join(', ');
    const totalAmount = appointment.services.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = appointment.services.reduce((sum, s) => sum + s.duration, 0);
    const clientName = `${appointment.client.user.firstName} ${appointment.client.user.lastName}`;
    const proName = `${appointment.professional.user.firstName} ${appointment.professional.user.lastName}`;

    const reminderText = reminderType === '7_DAYS' ? 'dans 7 jours' : 'demain';
    const subject = reminderType === '7_DAYS'
      ? `Rappel: Votre RDV chez ${appointment.salon.name} dans 7 jours`
      : `Rappel: Votre RDV chez ${appointment.salon.name} est demain !`;

    const cancellationWarning = reminderType === '1_DAY'
      ? 'ATTENTION: Le délai d\'annulation de 48h est dépassé. L\'acompte ne sera pas remboursé en cas d\'absence.'
      : 'Rappel: Vous pouvez annuler jusqu\'à 48h avant le RDV. Passé ce délai, l\'acompte ne sera pas remboursé.';

    const textBody = `Rappel: Votre RDV ${reminderText} chez ${appointment.salon.name}, le ${formattedDate}. ${serviceNames}. ${cancellationWarning}`;

    const htmlBody = this.getReminderEmailTemplate({
      clientName,
      salonName: appointment.salon.name,
      salonAddress: `${appointment.salon.address}, ${appointment.salon.postalCode} ${appointment.salon.city}`,
      salonPhone: appointment.salon.phone,
      professionalName: proName,
      date: formattedDate,
      services: serviceNames,
      duration: totalDuration,
      totalAmount: (totalAmount / 100).toFixed(2).replace('.', ',') + ' €',
      appointmentId: appointment.id,
      reminderType,
    });

    // Send email
    await this.sendNotification(prisma, {
      userId: appointment.client.userId,
      type: 'BOOKING_REMINDER',
      channel: 'EMAIL',
      subject,
      body: textBody,
      html: htmlBody,
      appointmentId: appointment.id,
    });

    // Send SMS
    if (appointment.client.user.phone) {
      const smsBody = `${APP_NAME}: Rappel - RDV ${reminderText} chez ${appointment.salon.name}, le ${formattedDate}. ${serviceNames}. ${cancellationWarning}`;
      await this.sendNotification(prisma, {
        userId: appointment.client.userId,
        type: 'BOOKING_REMINDER',
        channel: 'SMS',
        body: smsBody,
        appointmentId: appointment.id,
      });
    }
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

      // Send confirmation to client (email + SMS)
      const clientName = `${appointment.client.user.firstName} ${appointment.client.user.lastName}`;
      const clientEmailBody = `Votre rendez-vous chez ${appointment.salon.name} du ${formattedDate} à ${formattedTime} a bien été annulé.`;
      const clientHtmlBody = this.getCancellationConfirmationEmailTemplate({
        clientName,
        salonName: appointment.salon.name,
        date: formattedDate,
        time: formattedTime,
      });

      // Email confirmation to client
      await this.sendNotification(prisma, {
        userId: appointment.client.userId,
        type: 'BOOKING_CANCELLED',
        channel: 'EMAIL',
        subject: 'Confirmation d\'annulation de votre rendez-vous',
        body: clientEmailBody,
        html: clientHtmlBody,
        appointmentId: appointment.id,
      });

      // SMS confirmation to client
      if (appointment.client.user.phone) {
        await this.sendNotification(prisma, {
          userId: appointment.client.userId,
          type: 'BOOKING_CANCELLED',
          channel: 'SMS',
          body: `${APP_NAME}: Votre RDV chez ${appointment.salon.name} du ${formattedDate} à ${formattedTime} a bien été annulé.`,
          appointmentId: appointment.id,
        });
      }
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
    text: string,
    html?: string
  ): Promise<void> {
    try {
      const resend = getResend();
      await resend.emails.send({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to,
        subject,
        text,
        html: html || this.wrapInEmailTemplate(text),
      });
      console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendSMS(to: string, body: string): Promise<void> {
    try {
      // Format phone number for France
      let formattedPhone = to.replace(/\s/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+33' + formattedPhone.substring(1);
      }
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+33' + formattedPhone;
      }

      const client = getTwilioClient();
      await client.messages.create({
        from: getTwilioPhoneNumber(),
        to: formattedPhone,
        body,
      });
      console.log(`SMS sent to ${formattedPhone}`);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  /**
   * Wrap text in a basic HTML email template
   */
  private wrapInEmailTemplate(text: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f3ef; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #6b8e6b 0%, #4a6b4a 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
          .content { padding: 30px; color: #4a3728; line-height: 1.6; }
          .footer { background-color: #f5f3ef; padding: 20px; text-align: center; color: #6b5b4d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>
          <div class="content">
            <p>${text}</p>
          </div>
          <div class="footer">
            <p>${APP_NAME} - Votre plateforme de réservation beauté</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Format date in French
   */
  private formatDateFr(date: Date): string {
    return format(date, "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr });
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

  // ==================== EMAIL TEMPLATES ====================

  private getBaseEmailStyles(): string {
    return `
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f3ef; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
      .header { background: linear-gradient(135deg, #6b8e6b 0%, #4a6b4a 100%); padding: 30px; text-align: center; }
      .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
      .content { padding: 30px; }
      .info-box { background-color: #faf8f5; border-radius: 12px; padding: 20px; margin: 20px 0; }
      .info-row { padding: 10px 0; border-bottom: 1px solid #e8e0d5; }
      .info-row:last-child { border-bottom: none; }
      .label { color: #6b5b4d; font-size: 14px; display: block; margin-bottom: 4px; }
      .value { color: #4a3728; font-weight: 600; font-size: 16px; }
      .button { display: inline-block; background-color: #6b8e6b; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
      .warning-box { background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 15px; margin: 20px 0; }
      .warning-text { color: #9a3412; margin: 0; font-size: 14px; }
      .footer { background-color: #f5f3ef; padding: 20px; text-align: center; color: #6b5b4d; font-size: 12px; }
      .highlight { color: #6b8e6b; font-weight: 600; }
    `;
  }

  private getConfirmationEmailTemplate(data: {
    clientName: string;
    salonName: string;
    salonAddress: string;
    salonPhone: string;
    professionalName: string;
    date: string;
    services: string;
    duration: number;
    totalAmount: string;
    appointmentId: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>${this.getBaseEmailStyles()}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Réservation confirmée</h1>
          </div>
          <div class="content">
            <p style="color: #4a3728; font-size: 16px;">Bonjour <strong>${data.clientName}</strong>,</p>
            <p style="color: #4a3728; font-size: 16px;">Votre rendez-vous chez <span class="highlight">${data.salonName}</span> est confirmé !</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">📅 Date et heure</span>
                <span class="value">${data.date}</span>
              </div>
              <div class="info-row">
                <span class="label">💇 Prestation(s)</span>
                <span class="value">${data.services}</span>
              </div>
              <div class="info-row">
                <span class="label">⏱️ Durée</span>
                <span class="value">${data.duration} minutes</span>
              </div>
              <div class="info-row">
                <span class="label">👤 Professionnel</span>
                <span class="value">${data.professionalName}</span>
              </div>
              <div class="info-row">
                <span class="label">💰 Total</span>
                <span class="value">${data.totalAmount}</span>
              </div>
            </div>

            <div class="info-box">
              <p style="margin: 0 0 10px 0; color: #4a3728; font-weight: 600;">📍 Adresse</p>
              <p style="margin: 5px 0; color: #4a3728;">${data.salonName}</p>
              <p style="margin: 5px 0; color: #6b5b4d;">${data.salonAddress}</p>
              <p style="margin: 5px 0; color: #6b5b4d;">📞 ${data.salonPhone}</p>
            </div>

            <div class="warning-box">
              <p class="warning-text">⚠️ <strong>Politique d'annulation:</strong> Toute annulation doit être effectuée au moins <strong>48 heures</strong> avant le rendez-vous. Passé ce délai, l'acompte ne sera pas remboursé.</p>
            </div>

            <div style="text-align: center;">
              <a href="${APP_URL}/profile" class="button">Voir mes rendez-vous</a>
            </div>
          </div>
          <div class="footer">
            <p>Merci de votre confiance !</p>
            <p>${APP_NAME} - Votre plateforme de réservation beauté</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getReminderEmailTemplate(data: {
    clientName: string;
    salonName: string;
    salonAddress: string;
    salonPhone: string;
    professionalName: string;
    date: string;
    services: string;
    duration: number;
    totalAmount: string;
    appointmentId: string;
    reminderType: '7_DAYS' | '1_DAY';
  }): string {
    const title = data.reminderType === '7_DAYS'
      ? '📅 Rappel: Votre RDV dans 7 jours'
      : '⏰ Rappel: Votre RDV est demain !';

    const headerColor = data.reminderType === '1_DAY'
      ? 'background: linear-gradient(135deg, #d97706 0%, #b45309 100%);'
      : 'background: linear-gradient(135deg, #6b8e6b 0%, #4a6b4a 100%);';

    const urgencyMessage = data.reminderType === '1_DAY'
      ? `<div class="warning-box" style="background-color: #fef2f2; border-color: #fecaca;">
          <p class="warning-text" style="color: #991b1b;">⚠️ <strong>Attention:</strong> Le délai d'annulation de 48h est dépassé. En cas d'absence, votre acompte ne sera pas remboursé.</p>
        </div>`
      : `<div class="warning-box">
          <p class="warning-text">💡 <strong>Rappel:</strong> Vous pouvez encore annuler ou modifier votre rendez-vous jusqu'à 48h avant. Passé ce délai, l'acompte ne sera pas remboursé.</p>
        </div>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>${this.getBaseEmailStyles()}</style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="${headerColor}">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <p style="color: #4a3728; font-size: 16px;">Bonjour <strong>${data.clientName}</strong>,</p>
            <p style="color: #4a3728; font-size: 16px;">Nous vous rappelons votre rendez-vous chez <span class="highlight">${data.salonName}</span>.</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">📅 Date et heure</span>
                <span class="value">${data.date}</span>
              </div>
              <div class="info-row">
                <span class="label">💇 Prestation(s)</span>
                <span class="value">${data.services}</span>
              </div>
              <div class="info-row">
                <span class="label">⏱️ Durée</span>
                <span class="value">${data.duration} minutes</span>
              </div>
              <div class="info-row">
                <span class="label">👤 Professionnel</span>
                <span class="value">${data.professionalName}</span>
              </div>
              <div class="info-row">
                <span class="label">💰 Total</span>
                <span class="value">${data.totalAmount}</span>
              </div>
            </div>

            <div class="info-box">
              <p style="margin: 0 0 10px 0; color: #4a3728; font-weight: 600;">📍 Adresse</p>
              <p style="margin: 5px 0; color: #4a3728;">${data.salonName}</p>
              <p style="margin: 5px 0; color: #6b5b4d;">${data.salonAddress}</p>
              <p style="margin: 5px 0; color: #6b5b4d;">📞 ${data.salonPhone}</p>
            </div>

            ${urgencyMessage}

            <div style="text-align: center;">
              <a href="${APP_URL}/profile" class="button">Gérer mes rendez-vous</a>
            </div>
          </div>
          <div class="footer">
            <p>À bientôt !</p>
            <p>${APP_NAME} - Votre plateforme de réservation beauté</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getCancellationConfirmationEmailTemplate(data: {
    clientName: string;
    salonName: string;
    date: string;
    time: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>${this.getBaseEmailStyles()}</style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">
            <h1>Rendez-vous annulé</h1>
          </div>
          <div class="content">
            <p style="color: #4a3728; font-size: 16px;">Bonjour <strong>${data.clientName}</strong>,</p>
            <p style="color: #4a3728; font-size: 16px;">Nous confirmons l'annulation de votre rendez-vous.</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">🏪 Salon</span>
                <span class="value">${data.salonName}</span>
              </div>
              <div class="info-row">
                <span class="label">📅 Date</span>
                <span class="value">${data.date}</span>
              </div>
              <div class="info-row">
                <span class="label">🕐 Heure</span>
                <span class="value">${data.time}</span>
              </div>
            </div>

            <p style="color: #4a3728; font-size: 14px;">Si l'annulation a été effectuée au moins 48h avant le rendez-vous, votre acompte sera remboursé sous quelques jours.</p>

            <div style="text-align: center;">
              <a href="${APP_URL}" class="button">Réserver un nouveau rendez-vous</a>
            </div>
          </div>
          <div class="footer">
            <p>À bientôt !</p>
            <p>${APP_NAME} - Votre plateforme de réservation beauté</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const notificationService = new NotificationService();
