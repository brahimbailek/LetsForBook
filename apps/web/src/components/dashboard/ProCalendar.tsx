'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button, Card, Spinner } from '@/components/ui';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h → 20h
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(date: Date, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('fr-FR', opts).format(date);
}

function fmtTime(date: Date) {
  return fmt(date, { hour: '2-digit', minute: '2-digit' });
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-sage-500 text-white',
  PENDING: 'bg-yellow-400 text-yellow-900',
  COMPLETED: 'bg-coffee-400 text-white',
  CANCELLED_CLIENT: 'bg-red-300 text-red-900',
  CANCELLED_SALON: 'bg-red-300 text-red-900',
  NO_SHOW: 'bg-orange-300 text-orange-900',
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmé',
  PENDING: 'En attente',
  COMPLETED: 'Terminé',
  CANCELLED_CLIENT: 'Annulé',
  CANCELLED_SALON: 'Annulé',
  NO_SHOW: 'Absent',
};

interface ManualBookingForm {
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  serviceIds: string[];
  date: string;
  time: string;
  clientNotes: string;
}

const EMPTY_FORM: ManualBookingForm = {
  clientFirstName: '',
  clientLastName: '',
  clientEmail: '',
  clientPhone: '',
  serviceIds: [],
  date: '',
  time: '',
  clientNotes: '',
};

export function ProCalendar() {
  const utils = trpc.useUtils();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ManualBookingForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [selectedApt, setSelectedApt] = useState<any>(null);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  weekEnd.setHours(23, 59, 59, 999);

  const { data: appointments, isLoading, refetch } = trpc.booking.getProfessionalBookings.useQuery({
    startDate: weekStart,
    endDate: weekEnd,
  });

  // Services of the pro's salon
  const { data: userData } = trpc.auth.me.useQuery();
  const salonId = userData?.professionalProfile?.salon?.id ?? '';
  const { data: services } = trpc.service.getBySalonId.useQuery(
    { salonId },
    { enabled: !!salonId }
  );

  const createManual = trpc.booking.createManual.useMutation({
    onSuccess: () => {
      refetch();
      utils.booking.getSalonStats.invalidate();
      setShowForm(false);
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (err) => setFormError(err.message),
  });

  const completeMutation = trpc.booking.markCompleted.useMutation({ onSuccess: () => { refetch(); setSelectedApt(null); } });
  const noShowMutation = trpc.booking.markNoShow.useMutation({ onSuccess: () => { refetch(); setSelectedApt(null); } });
  const cancelMutation = trpc.booking.reject.useMutation({ onSuccess: () => { refetch(); setSelectedApt(null); } });

  // Build week days array
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Index appointments by day+hour for the grid
  const aptsByDayHour = useMemo(() => {
    const map: Record<string, any[]> = {};
    (appointments ?? []).forEach((apt) => {
      const d = new Date(apt.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
      if (!map[key]) map[key] = [];
      map[key]!.push(apt);
    });
    return map;
  }, [appointments]);

  const openFormForSlot = (day: Date, hour: number) => {
    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    setForm({ ...EMPTY_FORM, date: dateStr, time: timeStr });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.date || !form.time) return setFormError('Choisissez une date et une heure.');
    if (form.serviceIds.length === 0) return setFormError('Sélectionnez au moins un service.');

    const startTime = new Date(`${form.date}T${form.time}:00`);
    createManual.mutate({
      clientFirstName: form.clientFirstName,
      clientLastName: form.clientLastName,
      clientEmail: form.clientEmail || undefined,
      clientPhone: form.clientPhone || undefined,
      serviceIds: form.serviceIds,
      startTime,
      clientNotes: form.clientNotes || undefined,
    });
  };

  const toggleService = (id: string) => {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id)
        ? f.serviceIds.filter((s) => s !== id)
        : [...f.serviceIds, id],
    }));
  };

  const today = new Date();

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="p-2 rounded-lg hover:bg-sand-100 transition-colors text-coffee-600"
          >
            ‹
          </button>
          <span className="font-semibold text-coffee-800 text-sm">
            {fmt(weekStart, { day: 'numeric', month: 'long' })} – {fmt(weekEnd, { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="p-2 rounded-lg hover:bg-sand-100 transition-colors text-coffee-600"
          >
            ›
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="text-xs px-3 py-1.5 rounded-lg bg-sand-100 hover:bg-sand-200 text-coffee-600 transition-colors"
          >
            Aujourd'hui
          </button>
        </div>
        <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowForm(true); }}>
          + Nouveau RDV
        </Button>
      </div>

      {/* Calendar grid */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="overflow-auto">
            <div className="min-w-[700px]">
              {/* Header row */}
              <div className="grid grid-cols-8 border-b border-sand-200">
                <div className="py-2 px-2 text-xs text-coffee-400" />
                {weekDays.map((day, i) => {
                  const isToday =
                    day.getDate() === today.getDate() &&
                    day.getMonth() === today.getMonth() &&
                    day.getFullYear() === today.getFullYear();
                  return (
                    <div key={i} className={`py-2 text-center border-l border-sand-200 ${isToday ? 'bg-cream-50' : ''}`}>
                      <p className="text-xs text-coffee-400">{DAYS_FR[i]}</p>
                      <p className={`text-sm font-semibold ${isToday ? 'text-cream-700' : 'text-coffee-800'}`}>
                        {day.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Hour rows */}
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-sand-100 min-h-[52px]">
                  <div className="px-2 py-1 text-xs text-coffee-400 text-right leading-none pt-1.5">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {weekDays.map((day, di) => {
                    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${hour}`;
                    const apts = aptsByDayHour[key] ?? [];
                    const isToday =
                      day.getDate() === today.getDate() &&
                      day.getMonth() === today.getMonth() &&
                      day.getFullYear() === today.getFullYear();

                    return (
                      <div
                        key={di}
                        className={`border-l border-sand-100 px-1 py-0.5 cursor-pointer hover:bg-cream-50 transition-colors relative ${isToday ? 'bg-cream-50/40' : ''}`}
                        onClick={() => openFormForSlot(day, hour)}
                      >
                        {apts.map((apt) => (
                          <button
                            key={apt.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedApt(apt); }}
                            className={`w-full text-left text-xs rounded px-1.5 py-1 mb-0.5 truncate leading-tight ${STATUS_COLORS[apt.status] ?? 'bg-sand-200 text-coffee-700'}`}
                            title={`${apt.client.user.firstName} ${apt.client.user.lastName} — ${fmtTime(new Date(apt.startTime))}`}
                          >
                            <span className="font-semibold">{fmtTime(new Date(apt.startTime))}</span>
                            {' '}{apt.client.user.firstName} {apt.client.user.lastName}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Appointment detail modal */}
      {selectedApt && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedApt(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-coffee-800 text-lg">
                  {selectedApt.client.user.firstName} {selectedApt.client.user.lastName}
                </p>
                <p className="text-sm text-coffee-500">
                  {fmt(new Date(selectedApt.startTime), { weekday: 'long', day: 'numeric', month: 'long' })} · {fmtTime(new Date(selectedApt.startTime))} – {fmtTime(new Date(selectedApt.endTime))}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedApt.status]}`}>
                {STATUS_LABELS[selectedApt.status]}
              </span>
            </div>

            <div className="space-y-1 mb-4">
              {selectedApt.services.map((s: any) => (
                <div key={s.id} className="flex justify-between text-sm text-coffee-700">
                  <span>{s.serviceName}</span>
                  <span>{(s.price / 100).toFixed(2)} €</span>
                </div>
              ))}
            </div>

            {selectedApt.clientNotes && (
              <p className="text-xs text-coffee-500 bg-sand-50 rounded-lg px-3 py-2 mb-4 italic">
                "{selectedApt.clientNotes}"
              </p>
            )}

            {selectedApt.status === 'CONFIRMED' && (
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => completeMutation.mutate({ id: selectedApt.id })} disabled={completeMutation.isPending}>
                  Terminé
                </Button>
                <Button variant="outline" size="sm" onClick={() => noShowMutation.mutate({ id: selectedApt.id })} disabled={noShowMutation.isPending}>
                  Absent
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => cancelMutation.mutate({ id: selectedApt.id })} disabled={cancelMutation.isPending}>
                  Annuler
                </Button>
              </div>
            )}

            <button onClick={() => setSelectedApt(null)} className="mt-4 text-xs text-coffee-400 hover:text-coffee-600 w-full text-center">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Manual booking modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-coffee-800 mb-5">Nouveau rendez-vous</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Client info */}
                <div>
                  <p className="text-xs font-semibold text-coffee-500 uppercase tracking-wider mb-2">Client</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-coffee-600 mb-1">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={form.clientFirstName}
                        onChange={(e) => setForm({ ...form, clientFirstName: e.target.value })}
                        className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
                        placeholder="Marie"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-coffee-600 mb-1">Nom *</label>
                      <input
                        type="text"
                        required
                        value={form.clientLastName}
                        onChange={(e) => setForm({ ...form, clientLastName: e.target.value })}
                        className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
                        placeholder="Dupont"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-sm text-coffee-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={form.clientEmail}
                        onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
                        placeholder="marie@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-coffee-600 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={form.clientPhone}
                        onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                  </div>
                </div>

                {/* Date & time */}
                <div>
                  <p className="text-xs font-semibold text-coffee-500 uppercase tracking-wider mb-2">Date & heure</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-coffee-600 mb-1">Date *</label>
                      <input
                        type="date"
                        required
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-coffee-600 mb-1">Heure *</label>
                      <input
                        type="time"
                        required
                        value={form.time}
                        onChange={(e) => setForm({ ...form, time: e.target.value })}
                        className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <p className="text-xs font-semibold text-coffee-500 uppercase tracking-wider mb-2">Prestation(s) *</p>
                  {services && services.length > 0 ? (
                    <div className="space-y-1 max-h-40 overflow-y-auto border border-sand-200 rounded-lg p-2">
                      {services.map((svc) => (
                        <label key={svc.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sand-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.serviceIds.includes(svc.id)}
                            onChange={() => toggleService(svc.id)}
                            className="rounded border-coffee-300 text-cream-600"
                          />
                          <span className="text-sm text-coffee-700 flex-1">{svc.name}</span>
                          <span className="text-xs text-coffee-400">{svc.durationMinutes} min · {(svc.price / 100).toFixed(2)} €</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-coffee-400 text-center py-3">Aucune prestation disponible</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm text-coffee-600 mb-1">Notes (optionnel)</label>
                  <textarea
                    value={form.clientNotes}
                    onChange={(e) => setForm({ ...form, clientNotes: e.target.value })}
                    rows={2}
                    placeholder="Demande particulière, allergie..."
                    className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500 resize-none"
                  />
                </div>

                {formError && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={createManual.isPending} className="flex-1">
                    {createManual.isPending ? 'Création...' : 'Créer le rendez-vous'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
