'use client';

import { trpc } from '@/lib/trpc/client';
import { useState } from 'react';
import { Button, Card, Badge, Avatar, Spinner } from '@/components/ui';

interface AppointmentsListProps {
  salonId?: string;
}

export function AppointmentsList({ salonId }: AppointmentsListProps) {
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Calculate date range based on filter (stable values to avoid infinite re-fetching)
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  let endDate: Date;
  if (filter === 'today') {
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (filter === 'week') {
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);
  } else {
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 23, 59, 59, 999);
  }

  const { data: appointments, isLoading, refetch } = trpc.booking.getProfessionalBookings.useQuery({
    startDate,
    endDate,
  });

  const cancelMutation = trpc.booking.reject.useMutation({
    onSuccess: () => {
      refetch();
      setCancellingId(null);
      setCancelReason('');
    },
  });

  const completeMutation = trpc.booking.markCompleted.useMutation({
    onSuccess: () => refetch(),
  });

  const noShowMutation = trpc.booking.markNoShow.useMutation({
    onSuccess: () => refetch(),
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }> = {
      PENDING: { variant: 'warning', label: 'En attente' },
      CONFIRMED: { variant: 'success', label: 'Confirmé' },
      CANCELLED_CLIENT: { variant: 'error', label: 'Annulé (client)' },
      CANCELLED_SALON: { variant: 'error', label: 'Annulé (pro)' },
      COMPLETED: { variant: 'info', label: 'Terminé' },
      NO_SHOW: { variant: 'error', label: 'Absent' },
    };
    const config = statusMap[status] || { variant: 'default' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Filter by salonId if provided
  const filteredAppointments = salonId
    ? appointments?.filter((apt) => apt.salonId === salonId)
    : appointments;

  return (
    <div>
      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'today', label: "Aujourd'hui" },
          { id: 'week', label: 'Cette semaine' },
          { id: 'month', label: 'Ce mois' },
        ].map((item) => (
          <Button
            key={item.id}
            variant={filter === item.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(item.id as typeof filter)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments && filteredAppointments.length > 0 ? (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-soft-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar
                    name={`${appointment.client.user.firstName} ${appointment.client.user.lastName}`}
                    src={appointment.client.user.avatar}
                    size="lg"
                  />
                  <div>
                    <h3 className="font-semibold text-coffee-800">
                      {appointment.client.user.firstName} {appointment.client.user.lastName}
                    </h3>
                    <p className="text-sm text-coffee-500">
                      {formatDate(appointment.startTime)} à {formatTime(appointment.startTime)}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {appointment.services.map((svc) => (
                        <span
                          key={svc.id}
                          className="text-xs bg-sand-100 text-coffee-600 px-2 py-1 rounded-full"
                        >
                          {svc.service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(appointment.status)}
                  <p className="text-lg font-semibold text-coffee-800">
                    {(appointment.services.reduce((sum, svc) => sum + svc.price, 0) / 100).toFixed(2)} €
                  </p>
                </div>
              </div>

              {/* Actions based on status */}
              {appointment.status === 'CONFIRMED' && (
                <div className="mt-4 pt-4 border-t border-sand-200">
                  {cancellingId === appointment.id ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-coffee-700">Raison de l'annulation (optionnel) :</p>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Ex: Problème d'agenda, fermeture exceptionnelle..."
                        className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500 resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelMutation.mutate({ id: appointment.id, reason: cancelReason || undefined })}
                          disabled={cancelMutation.isPending}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          {cancelMutation.isPending ? 'Annulation...' : 'Confirmer l\'annulation'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setCancellingId(null); setCancelReason(''); }}
                        >
                          Retour
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => completeMutation.mutate({ id: appointment.id })}
                        disabled={completeMutation.isPending}
                      >
                        Marquer terminé
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => noShowMutation.mutate({ id: appointment.id })}
                        disabled={noShowMutation.isPending}
                      >
                        Client absent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancellingId(appointment.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Annuler le RDV
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {(appointment.status === 'COMPLETED' || appointment.status === 'NO_SHOW' ||
                appointment.status === 'CANCELLED_CLIENT' || appointment.status === 'CANCELLED_SALON') && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-sand-200">
                  <span className="text-sm text-coffee-500">Aucune action disponible</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-coffee-800 mb-2">Aucun rendez-vous</h3>
          <p className="text-coffee-600">
            Vous n'avez pas de rendez-vous pour cette période.
          </p>
        </Card>
      )}
    </div>
  );
}
