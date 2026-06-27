'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui';

type Period = '7d' | '30d' | '90d' | '12m';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  '90d': '3 derniers mois',
  '12m': '12 derniers mois',
};

function Delta({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return null;
  const positive = value >= 0;
  return (
    <span className={`text-xs font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
      {positive ? '+' : ''}{value}% vs période préc.
    </span>
  );
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-sand-100 rounded-full h-1.5 mt-1">
      <div className="bg-cream-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function RevenueChart({ data }: { data: { date: string; amount: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.amount), 1);
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      <div className="flex items-end gap-0.5 h-24">
        {data.map((d, i) => {
          const pct = (d.amount / max) * 100;
          const isLast = i === data.length - 1;
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col justify-end group relative"
              title={`${d.date} : ${d.amount.toFixed(2)} €`}
            >
              <div
                className={`rounded-t transition-all ${isLast ? 'bg-cream-600' : 'bg-cream-300 group-hover:bg-cream-500'}`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-coffee-800 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                {d.amount.toFixed(0)} €
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-xs text-coffee-400">
        <span>{data[0]?.date}</span>
        <span className="font-semibold text-coffee-700">Total : {total.toFixed(2)} €</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export function StatsPanel({ salonId }: { salonId: string }) {
  const [period, setPeriod] = useState<Period>('30d');

  const { data: stats, isLoading } = trpc.booking.getAdvancedStats.useQuery(
    { salonId, period },
    { enabled: !!salonId }
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-coffee-800">Statistiques avancées</h1>
        <div className="flex gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? 'bg-cream-600 text-white shadow'
                  : 'bg-white text-coffee-600 border border-sand-200 hover:border-cream-400'
              }`}
            >
              {p === '7d' ? '7j' : p === '30d' ? '30j' : p === '90d' ? '3m' : '12m'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 bg-sand-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !stats ? (
        <p className="text-coffee-400 text-center py-16">Aucune donnée disponible</p>
      ) : (
        <>
          {/* KPI principale ligne */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-cream-500 to-cream-700 text-white">
              <p className="text-cream-100 text-xs mb-1">Chiffre d'affaires</p>
              <p className="text-3xl font-bold">{stats.summary.totalRevenue.toFixed(0)} €</p>
              <Delta value={stats.summary.vsLastPeriod.revenue} />
            </Card>
            <Card className="bg-gradient-to-br from-sage-500 to-sage-700 text-white">
              <p className="text-sage-100 text-xs mb-1">RDV terminés</p>
              <p className="text-3xl font-bold">{stats.summary.completedAppointments}</p>
              <Delta value={stats.summary.vsLastPeriod.completed} />
            </Card>
            <Card className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
              <p className="text-orange-100 text-xs mb-1">Taux de no-show</p>
              <p className="text-3xl font-bold">{stats.summary.noShowRate}%</p>
              <span className="text-xs text-orange-200">{stats.summary.noShowCount} no-shows</span>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
              <p className="text-purple-100 text-xs mb-1">Taux d'annulation</p>
              <p className="text-3xl font-bold">{stats.summary.cancellationRate}%</p>
              <span className="text-xs text-purple-200">{stats.summary.cancelledAppointments} annulations</span>
            </Card>
          </div>

          {/* Ligne 2 : Clients */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="text-center">
              <p className="text-xs text-coffee-500 mb-1">Clients uniques</p>
              <p className="text-2xl font-bold text-coffee-800">{stats.summary.uniqueClients}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-coffee-500 mb-1">Clients fidèles</p>
              <p className="text-2xl font-bold text-cream-700">{stats.summary.returningClients}</p>
              <p className="text-xs text-coffee-400">reviennent</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-coffee-500 mb-1">Note moyenne</p>
              <p className="text-2xl font-bold text-yellow-500">
                {stats.reviewStats.average > 0 ? stats.reviewStats.average.toFixed(1) : '—'}
                <span className="text-base ml-0.5">★</span>
              </p>
              <p className="text-xs text-coffee-400">{stats.reviewStats.total} avis</p>
            </Card>
          </div>

          {/* Courbe revenus */}
          <Card className="mb-6">
            <h2 className="text-base font-semibold text-coffee-800 mb-4">
              Évolution du chiffre d'affaires — {PERIOD_LABELS[period]}
            </h2>
            <RevenueChart data={stats.revenueTimeline} />
          </Card>

          {/* Services + Pros */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <h2 className="text-base font-semibold text-coffee-800 mb-4">Top prestations</h2>
              {stats.topServices.length === 0 ? (
                <p className="text-coffee-400 text-sm text-center py-4">Aucune donnée</p>
              ) : (
                <div className="space-y-3">
                  {stats.topServices.map((s: { name: string; count: number; revenue: number }, i: number) => (
                    <div key={s.name}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-coffee-400 w-4">#{i + 1}</span>
                        <span className="text-sm text-coffee-700 flex-1 truncate">{s.name}</span>
                        <span className="text-xs font-semibold text-cream-700">{s.revenue.toFixed(0)} €</span>
                        <span className="text-xs text-coffee-400">{s.count}x</span>
                      </div>
                      <MiniBar value={s.revenue} max={stats.topServices[0]?.revenue ?? 1} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-base font-semibold text-coffee-800 mb-4">Performance équipe</h2>
              {stats.proPerformance.length === 0 ? (
                <p className="text-coffee-400 text-sm text-center py-4">Aucune donnée</p>
              ) : (
                <div className="space-y-3">
                  {stats.proPerformance.map((p: { name: string; appointments: number }, i: number) => (
                    <div key={p.name}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-coffee-400 w-4">#{i + 1}</span>
                        <span className="text-sm text-coffee-700 flex-1">{p.name}</span>
                        <span className="text-xs font-semibold text-cream-700">{p.appointments} RDV</span>
                      </div>
                      <MiniBar value={p.appointments} max={stats.proPerformance[0]?.appointments ?? 1} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Créneaux populaires + Jours de la semaine */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-base font-semibold text-coffee-800 mb-4">Heures de pointe</h2>
              {stats.peakHours.length === 0 ? (
                <p className="text-coffee-400 text-sm text-center py-4">Aucune donnée</p>
              ) : (
                <div className="space-y-2">
                  {stats.peakHours.map((h) => (
                    <div key={h.hour} className="flex items-center gap-3">
                      <span className="text-sm font-mono text-coffee-600 w-14">
                        {String(h.hour).padStart(2, '0')}h00
                      </span>
                      <div className="flex-1 bg-sand-100 rounded-full h-2">
                        <div
                          className="bg-cream-500 h-2 rounded-full"
                          style={{ width: `${(h.count / (stats.peakHours[0]?.count ?? 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-coffee-500 w-8 text-right">{h.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-base font-semibold text-coffee-800 mb-4">Jours les plus actifs</h2>
              <div className="grid grid-cols-7 gap-1 mt-2">
                {stats.weekdayData.map((d) => {
                  const max = Math.max(...stats.weekdayData.map(x => x.count), 1);
                  const pct = Math.round((d.count / max) * 100);
                  return (
                    <div key={d.day} className="flex flex-col items-center gap-1">
                      <div className="w-full bg-sand-100 rounded-lg h-16 flex items-end overflow-hidden">
                        <div
                          className="w-full bg-cream-400 rounded-lg transition-all"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <span className="text-xs text-coffee-500">{d.day}</span>
                      <span className="text-xs font-medium text-coffee-700">{d.count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
