'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Button, Card, Badge, Spinner } from '@/components/ui';
import { SalonForm, ServiceForm, PrestationsManager, TeamManager, ProCalendar } from '@/components/dashboard';
import { NotificationBell } from '@/components/NotificationBell';

type TabId = 'overview' | 'appointments' | 'salons' | 'services' | 'team' | 'payments' | 'my-agenda' | 'my-services' | 'my-availability' | 'my-profile';

function InvitationCodeBlock({ salonId }: { salonId: string }) {
  const [copied, setCopied] = useState(false);
  const { data, isLoading } = trpc.salon.getInvitationCode.useQuery({ salonId });
  const regenerateMutation = trpc.salon.regenerateInvitationCode.useMutation({
    onSuccess: () => {
      // Force refetch
      window.location.reload();
    },
  });

  const handleCopy = () => {
    if (data?.invitationCode) {
      navigator.clipboard.writeText(data.invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) return null;

  return (
    <div className="mt-3 p-2.5 bg-cream-50 rounded-lg border border-cream-200">
      <p className="text-xs text-coffee-500 mb-1">Code d&apos;invitation (pour vos pros)</p>
      <div className="flex items-center gap-2">
        <code className="text-sm font-mono font-bold text-coffee-700 tracking-widest">
          {data?.invitationCode}
        </code>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-0.5 rounded bg-cream-200 hover:bg-cream-300 text-coffee-600 transition-colors"
          title="Copier le code"
        >
          {copied ? 'Copié !' : 'Copier'}
        </button>
        <button
          onClick={() => {
            if (confirm('Régénérer le code ? L\'ancien ne fonctionnera plus.')) {
              regenerateMutation.mutate({ salonId });
            }
          }}
          className="text-xs px-2 py-0.5 rounded bg-cream-200 hover:bg-cream-300 text-coffee-600 transition-colors"
          title="Régénérer le code"
        >
          {regenerateMutation.isPending ? '...' : 'Régénérer'}
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showSalonForm, setShowSalonForm] = useState(false);
  const [editingSalon, setEditingSalon] = useState<any>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedSalonForService, setSelectedSalonForService] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close profile menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: user, isLoading: isLoadingUser } = trpc.auth.me.useQuery();

  // Derived role flags
  const isSalonOwner = user?.role === 'SALON_OWNER' || user?.role === 'ADMIN';
  const isProfessional = user?.role === 'PROFESSIONAL';

  // SALON_OWNER data
  const { data: mySalons, isLoading: isLoadingSalons, refetch: refetchSalons } = trpc.salon.getMySalons.useQuery(
    undefined,
    { enabled: !!user && isSalonOwner }
  );

  // PROFESSIONAL data - all services of their salon (read-only)
  const { data: myServices, isLoading: isLoadingMyServices } = trpc.service.getBySalonId.useQuery(
    { salonId: user?.professionalProfile?.salon?.id ?? '' },
    { enabled: !!user && !!user.professionalProfile?.salon?.id }
  );

  // Availability data (both roles)
  const { data: myAvailability, isLoading: isLoadingAvailability, refetch: refetchAvailability } = trpc.availability.getMyAvailability.useQuery(
    undefined,
    { enabled: !!user && !!user.professionalProfile }
  );

  const { data: myExceptions, refetch: refetchExceptions } = trpc.availability.getMyExceptions.useQuery(
    { startDate: new Date(), endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    { enabled: !!user && !!user.professionalProfile }
  );

  const primarySalonId = mySalons?.[0]?.id ?? '';

  const { data: salonStats } = trpc.booking.getSalonStats.useQuery(
    { salonId: primarySalonId || 'none' },
    { enabled: !!primarySalonId && primarySalonId.length > 0 }
  );

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || (user.role !== 'PROFESSIONAL' && user.role !== 'ADMIN' && user.role !== 'SALON_OWNER')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-coffee-800 mb-4">Acces refuse</h1>
          <p className="text-coffee-600 mb-8">
            Cette page est reservee aux professionnels et administrateurs.
          </p>
          <Link href="/">
            <Button>Retour a l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleEditSalon = (salon: any) => {
    setEditingSalon(salon);
    setShowSalonForm(true);
  };

  const handleCloseSalonForm = () => {
    setShowSalonForm(false);
    setEditingSalon(null);
  };

  const handleAddService = (salonId: string) => {
    setSelectedSalonForService(salonId);
    setShowServiceForm(true);
  };

  // Sidebar tabs based on role
  const sidebarTabs: { id: TabId; label: string; icon: string; separator?: boolean }[] = isProfessional
    ? [
        { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
        { id: 'my-agenda', label: 'Mon agenda', icon: '📅' },
        { id: 'my-services', label: 'Mes prestations', icon: '✂️' },
        { id: 'my-availability', label: 'Mes disponibilités', icon: '🕐' },
        { id: 'my-profile', label: 'Mon profil', icon: '👤', separator: true },
      ]
    : [
        { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
        { id: 'appointments', label: 'Rendez-vous', icon: '📅' },
        { id: 'salons', label: 'Mes établissements', icon: '🏪' },
        { id: 'services', label: 'Prestations', icon: '✂️' },
        { id: 'team', label: 'Équipe', icon: '👥' },
        { id: 'payments', label: 'Revenus', icon: '💰' },
        { id: 'my-agenda', label: 'Mon agenda', icon: '📅', separator: true },
        { id: 'my-availability', label: 'Mes disponibilités', icon: '🕐' },
        { id: 'my-profile', label: 'Mon profil', icon: '👤' },
      ];

  const roleLabel = isSalonOwner ? 'Propriétaire' : 'Professionnel';

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-coffee-800 min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cream-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">LetsForBook Pro</span>
            </Link>
          </div>

          <nav className="mt-6">
            {sidebarTabs.map((item) => (
              <React.Fragment key={item.id}>
                {item.separator && (
                  <div className="px-6 py-2">
                    <div className="border-t border-coffee-700" />
                    <p className="text-xs text-coffee-500 mt-2 mb-1">Espace personnel</p>
                  </div>
                )}
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-left transition ${
                    activeTab === item.id
                      ? 'bg-coffee-700 text-white border-l-4 border-cream-500'
                      : 'text-coffee-300 hover:bg-coffee-700 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </React.Fragment>
            ))}
          </nav>

          <div className="px-4 py-2 flex justify-end">
            <NotificationBell />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4" ref={profileMenuRef}>
            {/* Dropdown menu (opens upward) */}
            {showProfileMenu && (
              <div className="mb-2 bg-coffee-700 rounded-xl border border-coffee-600 shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-coffee-600">
                  <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-coffee-400">{user.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      router.push('/');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-coffee-200 hover:bg-coffee-600 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Accueil particulier
                  </button>
                </div>

                <div className="border-t border-coffee-600 py-1">
                  <button
                    onClick={async () => {
                      setShowProfileMenu(false);
                      await signOut({ callbackUrl: '/' });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-coffee-600 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}

            {/* Profile button */}
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 text-coffee-300 hover:bg-coffee-700 rounded-xl p-2 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-coffee-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-white font-medium text-sm truncate">{user.firstName}</p>
                <p className="text-xs truncate">{roleLabel}</p>
              </div>
              <svg className={`w-4 h-4 text-coffee-400 transition-transform flex-shrink-0 ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">

          {/* ===================== */}
          {/* OVERVIEW - SALON_OWNER */}
          {/* ===================== */}
          {activeTab === 'overview' && isSalonOwner && (
            <div>
              <h1 className="text-3xl font-bold text-coffee-800 mb-8">
                Bonjour, {user.firstName} 👋
              </h1>

              {/* Pending approval banners */}
              {mySalons?.filter((s: any) => !s.published).map((salon: any) => (
                <div key={salon.id} className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <span className="text-amber-500 text-lg">⏳</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">
                      "{salon.name}" est en attente d'approbation
                    </p>
                    <p className="text-xs text-amber-600">
                      Votre établissement sera visible publiquement une fois approuvé par notre équipe.
                    </p>
                  </div>
                </div>
              ))}

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-sage-500 to-sage-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sage-100 text-sm">Aujourd&apos;hui</p>
                      <p className="text-3xl font-bold">{salonStats?.today ?? '-'}</p>
                      <p className="text-sage-200 text-xs mt-1">{salonStats?.thisWeek ?? '-'} cette semaine</p>
                    </div>
                    <div className="text-4xl opacity-50">📅</div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">En attente</p>
                      <p className="text-3xl font-bold">{salonStats?.pending ?? '-'}</p>
                      <p className="text-yellow-200 text-xs mt-1">à confirmer</p>
                    </div>
                    <div className="text-4xl opacity-50">⏳</div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-cream-500 to-cream-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cream-100 text-sm">Taux confirmation</p>
                      <p className="text-3xl font-bold">{salonStats?.confirmationRate ?? '-'}%</p>
                      <p className="text-cream-200 text-xs mt-1">ce mois</p>
                    </div>
                    <div className="text-4xl opacity-50">✅</div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-coffee-500 to-coffee-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-coffee-200 text-sm">RDV ce mois</p>
                      <p className="text-3xl font-bold">{salonStats?.thisMonth.total ?? '-'}</p>
                      {salonStats?.completionVsLastMonth !== null && salonStats?.completionVsLastMonth !== undefined && (
                        <p className={`text-xs mt-1 ${salonStats.completionVsLastMonth >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {salonStats.completionVsLastMonth >= 0 ? '+' : ''}{salonStats.completionVsLastMonth}% vs mois dernier
                        </p>
                      )}
                    </div>
                    <div className="text-4xl opacity-50">📊</div>
                  </div>
                </Card>
              </div>

              {/* Stats détaillées + actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Répartition ce mois */}
                <Card>
                  <h2 className="text-lg font-semibold text-coffee-800 mb-4">Ce mois</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Terminés', value: salonStats?.thisMonth.completed ?? 0, color: 'bg-green-500' },
                      { label: 'Confirmés', value: salonStats?.thisMonth.confirmed ?? 0, color: 'bg-blue-500' },
                      { label: 'Annulés', value: salonStats?.thisMonth.cancelled ?? 0, color: 'bg-red-400' },
                      { label: 'No-shows', value: salonStats?.thisMonth.noShow ?? 0, color: 'bg-orange-400' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
                        <span className="text-sm text-coffee-600 flex-1">{item.label}</span>
                        <span className="text-sm font-semibold text-coffee-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Top services */}
                <Card>
                  <h2 className="text-lg font-semibold text-coffee-800 mb-4">Top prestations</h2>
                  {salonStats?.topServices.length ? (
                    <div className="space-y-3">
                      {salonStats.topServices.map((s, i) => (
                        <div key={s.name} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-coffee-400 w-4">#{i + 1}</span>
                          <span className="text-sm text-coffee-700 flex-1 truncate">{s.name}</span>
                          <span className="text-xs font-semibold text-cream-700 bg-cream-100 px-2 py-0.5 rounded-full">{s.count}x</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-coffee-400 text-sm text-center py-4">Aucune donnée ce mois</p>
                  )}
                </Card>

                {/* Actions rapides */}
                <Card>
                  <h2 className="text-lg font-semibold text-coffee-800 mb-4">Actions rapides</h2>
                  <div className="space-y-2">
                    <Button variant="outline" fullWidth onClick={() => setActiveTab('appointments')}>
                      📅 Voir l&apos;agenda
                    </Button>
                    <Button variant="outline" fullWidth onClick={() => setActiveTab('services')}>
                      ✂️ Gérer les prestations
                    </Button>
                    <Button variant="outline" fullWidth onClick={() => setActiveTab('team')}>
                      👥 Gérer l&apos;équipe
                    </Button>
                    <Button variant="outline" fullWidth onClick={() => setActiveTab('payments')}>
                      💰 Voir les revenus
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Établissements */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-coffee-800">Mes établissements</h2>
                  <Button size="sm" onClick={() => setShowSalonForm(true)}>+ Ajouter</Button>
                </div>
                <div className="space-y-3">
                  {mySalons?.map((salon) => (
                    <div key={salon.id} className="flex items-center justify-between p-3 bg-sand-50 rounded-lg">
                      <div>
                        <p className="font-medium text-coffee-800">{salon.name}</p>
                        <p className="text-sm text-coffee-500">
                          {salon._count?.services || 0} prestations · {salon._count?.reviews || 0} avis
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={salon.active ? 'success' : 'error'}>
                          {salon.active ? 'Actif' : 'Inactif'}
                        </Badge>
                        {!(salon as any).published && (
                          <Badge variant="warning">Non publié</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!mySalons || mySalons.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-coffee-500 mb-4">Aucun établissement</p>
                      <Button size="sm" onClick={() => setShowSalonForm(true)}>
                        Créer mon premier établissement
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ======================= */}
          {/* OVERVIEW - PROFESSIONAL */}
          {/* ======================= */}
          {activeTab === 'overview' && isProfessional && (
            <div>
              <h1 className="text-3xl font-bold text-coffee-800 mb-8">
                Bonjour, {user.firstName} 👋
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-sage-500 to-sage-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sage-100">Mes rendez-vous</p>
                      <p className="text-3xl font-bold">-</p>
                    </div>
                    <div className="text-4xl opacity-50">📅</div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-sand-500 to-sand-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sand-100">Mes prestations</p>
                      <p className="text-3xl font-bold">{myServices?.length || 0}</p>
                    </div>
                    <div className="text-4xl opacity-50">✂️</div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-cream-500 to-cream-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cream-100">Mon établissement</p>
                      <p className="text-xl font-bold truncate">
                        {user.professionalProfile?.salon?.name || '-'}
                      </p>
                    </div>
                    <div className="text-4xl opacity-50">🏪</div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h2 className="text-xl font-semibold text-coffee-800 mb-4">Actions rapides</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" fullWidth onClick={() => setActiveTab('my-agenda')}>
                      Voir mon agenda
                    </Button>
                    <Button variant="outline" fullWidth onClick={() => setActiveTab('my-availability')}>
                      Mes disponibilités
                    </Button>
                    <Button variant="outline" fullWidth onClick={() => setActiveTab('my-services')}>
                      Voir mes prestations
                    </Button>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-xl font-semibold text-coffee-800 mb-4">Mon établissement</h2>
                  {user.professionalProfile?.salon ? (
                    <div className="p-3 bg-sand-50 rounded-lg">
                      <p className="font-medium text-coffee-800">{user.professionalProfile.salon.name}</p>
                      <p className="text-sm text-coffee-500">
                        {(user.professionalProfile.salon as any).city || ''}
                      </p>
                    </div>
                  ) : (
                    <p className="text-coffee-500 text-center py-4">
                      Vous n'êtes rattaché à aucun établissement.
                    </p>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* ========================== */}
          {/* APPOINTMENTS - SALON_OWNER */}
          {/* ========================== */}
          {activeTab === 'appointments' && isSalonOwner && (
            <div>
              <h1 className="text-3xl font-bold text-coffee-800 mb-6">Rendez-vous</h1>
              <ProCalendar salonId={primarySalonId || undefined} />
            </div>
          )}

          {/* ======================== */}
          {/* MON AGENDA - Both roles */}
          {/* ======================== */}
          {activeTab === 'my-agenda' && (
            <div>
              <h1 className="text-3xl font-bold text-coffee-800 mb-6">Mon agenda</h1>
              <ProCalendar salonId={primarySalonId || undefined} />
            </div>
          )}

          {/* ====================== */}
          {/* SALONS - SALON_OWNER */}
          {/* ====================== */}
          {activeTab === 'salons' && isSalonOwner && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-coffee-800">Mes établissements</h1>
                <Button onClick={() => setShowSalonForm(true)}>+ Nouvel établissement</Button>
              </div>

              {isLoadingSalons ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : mySalons && mySalons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mySalons.map((salon) => (
                    <Card key={salon.id}>
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden">
                          {(salon as any).logo ? (
                            <img src={(salon as any).logo} alt={salon.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-cream-200 flex items-center justify-center">
                              <span className="text-2xl font-bold text-cream-700">{salon.name.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-coffee-800">{salon.name}</h3>
                              <p className="text-sm text-coffee-500">{salon.city}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={salon.active ? 'success' : 'error'}>
                                {salon.active ? 'Actif' : 'Inactif'}
                              </Badge>
                              {!(salon as any).published && (
                                <Badge variant="warning" size="sm">
                                  Non publié
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="mt-2">
                            {salon.depositRequired ? (
                              <Badge variant="info" size="sm">
                                Acompte {salon.depositPercentage}%
                              </Badge>
                            ) : (
                              <Badge variant="default" size="sm">
                                Pas d'acompte
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-4 mt-4 text-sm text-coffee-600">
                            <span>{salon._count?.services || 0} services</span>
                            <span>{salon._count?.professionals || 0} pros</span>
                            <span>{salon._count?.reviews || 0} avis</span>
                          </div>

                          <InvitationCodeBlock salonId={salon.id} />

                          <div className="flex gap-2 mt-4">
                            <Link href={`/salon/${salon.slug}`}>
                              <Button variant="outline" size="sm">Voir</Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={() => handleEditSalon(salon)}>
                              Modifier
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleAddService(salon.id)}>
                              + Service
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <div className="text-6xl mb-4">🏪</div>
                  <h3 className="text-xl font-semibold text-coffee-800 mb-2">
                    Aucun établissement
                  </h3>
                  <p className="text-coffee-600 mb-6">
                    Créez votre premier établissement pour commencer à recevoir des réservations.
                  </p>
                  <Button onClick={() => setShowSalonForm(true)}>+ Créer mon établissement</Button>
                </Card>
              )}
            </div>
          )}

          {/* ========================= */}
          {/* SERVICES - SALON_OWNER */}
          {/* ========================= */}
          {activeTab === 'services' && isSalonOwner && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-coffee-800">Prestations</h1>
              </div>

              {mySalons && mySalons.length > 0 ? (
                <div className="space-y-8">
                  {mySalons.map((salon) => (
                    <div key={salon.id}>
                      {mySalons.length > 1 && (
                        <h2 className="text-xl font-semibold text-coffee-800 mb-4">{salon.name}</h2>
                      )}
                      <PrestationsManager salonId={salon.id} />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <div className="text-6xl mb-4">✂️</div>
                  <h3 className="text-xl font-semibold text-coffee-800 mb-2">
                    Aucune prestation
                  </h3>
                  <p className="text-coffee-600 mb-6">
                    Créez d'abord un établissement pour ajouter des prestations.
                  </p>
                  <Button onClick={() => setShowSalonForm(true)}>Créer un établissement</Button>
                </Card>
              )}
            </div>
          )}

          {/* =========================================== */}
          {/* MES PRESTATIONS - PROFESSIONAL (read-only) */}
          {/* =========================================== */}
          {activeTab === 'my-services' && isProfessional && (
            <div>
              <h1 className="text-3xl font-bold text-coffee-800 mb-8">Prestations du salon</h1>

              {isLoadingMyServices ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : myServices && myServices.length > 0 ? (
                (() => {
                  // Group services by category
                  const grouped: Record<string, typeof myServices> = {};
                  myServices.forEach((service) => {
                    const catName = service.category?.name || 'Autres';
                    if (!grouped[catName]) grouped[catName] = [];
                    grouped[catName]!.push(service);
                  });

                  return (
                    <div className="space-y-8">
                      {Object.entries(grouped).map(([categoryName, services]) => (
                        <div key={categoryName}>
                          <h3 className="text-sm font-semibold text-cream-700 uppercase tracking-wider mb-3 px-1">
                            {categoryName}
                          </h3>
                          <div className="space-y-3">
                            {services!.map((service) => (
                              <Card key={service.id}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-coffee-800">{service.name}</p>
                                    <p className="text-sm text-coffee-500">
                                      {service.durationMinutes} min
                                    </p>
                                  </div>
                                  <span className="font-semibold text-coffee-800">
                                    {(service.price / 100).toFixed(2)} €
                                  </span>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <Card className="text-center py-12">
                  <div className="text-6xl mb-4">✂️</div>
                  <h3 className="text-xl font-semibold text-coffee-800 mb-2">
                    Aucune prestation
                  </h3>
                  <p className="text-coffee-600">
                    Le salon n'a pas encore ajouté de prestations.
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* ===================== */}
          {/* TEAM - SALON_OWNER */}
          {/* ===================== */}
          {activeTab === 'team' && isSalonOwner && (
            <div>
              <h1 className="text-3xl font-bold text-coffee-800 mb-8">Équipe</h1>

              {mySalons && mySalons.length > 0 ? (
                <div className="space-y-8">
                  {mySalons.map((salon) => (
                    <TeamManager key={salon.id} salonId={salon.id} salonName={salon.name} />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-semibold text-coffee-800 mb-2">
                    Aucune équipe
                  </h3>
                  <p className="text-coffee-600">
                    Créez d'abord un établissement pour ajouter des collaborateurs.
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* ================================ */}
          {/* MES DISPONIBILITÉS - Both roles */}
          {/* ================================ */}
          {activeTab === 'my-availability' && (
            <div>
              <h1 className="text-3xl font-bold text-coffee-800 mb-8">Mes disponibilités</h1>
              <AvailabilityManager
                availability={myAvailability}
                exceptions={myExceptions}
                isLoading={isLoadingAvailability}
                onRefreshAvailability={refetchAvailability}
                onRefreshExceptions={refetchExceptions}
                readOnly={isProfessional}
              />
            </div>
          )}

          {/* =================== */}
          {/* MON PROFIL - Both   */}
          {/* =================== */}
          {activeTab === 'my-profile' && (
            <ProfileSection user={user} />
          )}

          {/* ========================== */}
          {/* REVENUS - SALON_OWNER      */}
          {/* ========================== */}
          {activeTab === 'payments' && isSalonOwner && mySalons && (
            <PaymentsSection salons={mySalons} />
          )}

        </main>
      </div>

      {/* Modals - SALON_OWNER only */}
      {isSalonOwner && (
        <>
          <SalonForm
            isOpen={showSalonForm}
            onClose={handleCloseSalonForm}
            salon={editingSalon}
            onSuccess={() => refetchSalons()}
          />

          {selectedSalonForService && (
            <ServiceForm
              isOpen={showServiceForm}
              onClose={() => {
                setShowServiceForm(false);
                setSelectedSalonForService(null);
              }}
              salonId={selectedSalonForService}
              onSuccess={() => refetchSalons()}
            />
          )}
        </>
      )}
    </div>
  );
}

// Sous-composant pour gérer les disponibilités
function AvailabilityManager({
  availability,
  exceptions,
  isLoading,
  onRefreshAvailability,
  onRefreshExceptions,
  readOnly = false,
}: {
  availability: any[] | undefined;
  exceptions: any[] | undefined;
  isLoading: boolean;
  onRefreshAvailability: () => void;
  onRefreshExceptions: () => void;
  readOnly?: boolean;
}) {
  type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [editForm, setEditForm] = useState({ startTime: '', endTime: '', breakStartTime: '', breakEndTime: '', isAvailable: true });
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({ date: '', type: 'UNAVAILABLE' as 'UNAVAILABLE' | 'CUSTOM', reason: '', startTime: '', endTime: '' });

  const updateMutation = trpc.availability.updateAvailability.useMutation({
    onSuccess: () => {
      onRefreshAvailability();
      setEditingDay(null);
    },
  });

  const createExceptionMutation = trpc.availability.createException.useMutation({
    onSuccess: () => {
      onRefreshExceptions();
      setShowExceptionForm(false);
      setExceptionForm({ date: '', type: 'UNAVAILABLE', reason: '', startTime: '', endTime: '' });
    },
  });

  const deleteExceptionMutation = trpc.availability.deleteException.useMutation({
    onSuccess: () => onRefreshExceptions(),
  });

  const DAYS_FR: Record<string, string> = {
    MONDAY: 'Lundi',
    TUESDAY: 'Mardi',
    WEDNESDAY: 'Mercredi',
    THURSDAY: 'Jeudi',
    FRIDAY: 'Vendredi',
    SATURDAY: 'Samedi',
    SUNDAY: 'Dimanche',
  };

  const ALL_DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  const handleEditDay = (day: DayOfWeek) => {
    const dayAvail = availability?.find((a) => a.dayOfWeek === day);
    setEditForm({
      startTime: dayAvail?.startTime || '09:00',
      endTime: dayAvail?.endTime || '18:00',
      breakStartTime: dayAvail?.breakStartTime || '',
      breakEndTime: dayAvail?.breakEndTime || '',
      isAvailable: dayAvail?.isAvailable ?? true,
    });
    setEditingDay(day);
  };

  const handleSaveDay = () => {
    if (!editingDay) return;
    updateMutation.mutate({
      dayOfWeek: editingDay,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      breakStartTime: editForm.breakStartTime || undefined,
      breakEndTime: editForm.breakEndTime || undefined,
      isAvailable: editForm.isAvailable,
    });
  };

  const handleCreateException = () => {
    if (!exceptionForm.date) return;
    createExceptionMutation.mutate({
      date: new Date(exceptionForm.date),
      type: exceptionForm.type,
      reason: exceptionForm.reason || undefined,
      startTime: exceptionForm.type === 'CUSTOM' ? exceptionForm.startTime : undefined,
      endTime: exceptionForm.type === 'CUSTOM' ? exceptionForm.endTime : undefined,
    });
  };

  const formatExceptionDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Weekly Schedule */}
      <Card>
        <h2 className="text-xl font-semibold text-coffee-800 mb-4">Horaires hebdomadaires</h2>
        <div className="space-y-3">
          {ALL_DAYS.map((day) => {
            const dayAvail = availability?.find((a) => a.dayOfWeek === day);
            const isEditing = editingDay === day;

            return (
              <div key={day}>
                <div className="flex items-center justify-between p-3 bg-sand-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-coffee-800 w-24">{DAYS_FR[day]}</span>
                    {dayAvail?.isAvailable ? (
                      <span className="text-coffee-600">
                        {dayAvail.startTime} - {dayAvail.endTime}
                        {dayAvail.breakStartTime && (
                          <span className="text-coffee-400 ml-2">
                            (pause : {dayAvail.breakStartTime} - {dayAvail.breakEndTime})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-coffee-400 italic">
                        {dayAvail ? 'Repos' : 'Non configuré'}
                      </span>
                    )}
                  </div>
                  {!readOnly && (
                    <Button variant="ghost" size="sm" onClick={() => handleEditDay(day)}>
                      Modifier
                    </Button>
                  )}
                </div>

                {isEditing && !readOnly && (
                  <div className="mt-2 p-4 bg-white border border-sand-200 rounded-lg space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.isAvailable}
                          onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })}
                          className="rounded border-coffee-300"
                        />
                        <span className="text-sm text-coffee-700">Disponible</span>
                      </label>
                    </div>

                    {editForm.isAvailable && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-coffee-600 mb-1">Début</label>
                            <input
                              type="time"
                              value={editForm.startTime}
                              onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                              className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-coffee-600 mb-1">Fin</label>
                            <input
                              type="time"
                              value={editForm.endTime}
                              onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                              className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-coffee-600 mb-1">Début pause</label>
                            <input
                              type="time"
                              value={editForm.breakStartTime}
                              onChange={(e) => setEditForm({ ...editForm, breakStartTime: e.target.value })}
                              className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-coffee-600 mb-1">Fin pause</label>
                            <input
                              type="time"
                              value={editForm.breakEndTime}
                              onChange={(e) => setEditForm({ ...editForm, breakEndTime: e.target.value })}
                              className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDay} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingDay(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Exceptions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-coffee-800">Exceptions & congés</h2>
          {!readOnly && (
            <Button size="sm" onClick={() => setShowExceptionForm(true)}>+ Ajouter</Button>
          )}
        </div>

        {showExceptionForm && !readOnly && (
          <div className="mb-6 p-4 bg-sand-50 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-coffee-600 mb-1">Date</label>
                <input
                  type="date"
                  value={exceptionForm.date}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-coffee-600 mb-1">Type</label>
                <select
                  value={exceptionForm.type}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, type: e.target.value as 'UNAVAILABLE' | 'CUSTOM' })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm"
                >
                  <option value="UNAVAILABLE">Indisponible (journée entière)</option>
                  <option value="CUSTOM">Horaires personnalisés</option>
                </select>
              </div>
            </div>

            {exceptionForm.type === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-coffee-600 mb-1">Début</label>
                  <input
                    type="time"
                    value={exceptionForm.startTime}
                    onChange={(e) => setExceptionForm({ ...exceptionForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-coffee-600 mb-1">Fin</label>
                  <input
                    type="time"
                    value={exceptionForm.endTime}
                    onChange={(e) => setExceptionForm({ ...exceptionForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-coffee-600 mb-1">Motif (optionnel)</label>
              <input
                type="text"
                value={exceptionForm.reason}
                onChange={(e) => setExceptionForm({ ...exceptionForm, reason: e.target.value })}
                placeholder="Ex: Congé, Formation, RDV médical..."
                className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateException} disabled={createExceptionMutation.isPending}>
                {createExceptionMutation.isPending ? 'Ajout...' : 'Ajouter'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowExceptionForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}

        {exceptions && exceptions.length > 0 ? (
          <div className="space-y-3">
            {exceptions.map((exception) => (
              <div key={exception.id} className="flex items-center justify-between p-3 bg-sand-50 rounded-lg">
                <div>
                  <p className="font-medium text-coffee-800">
                    {formatExceptionDate(exception.date)}
                  </p>
                  <p className="text-sm text-coffee-500">
                    {exception.type === 'UNAVAILABLE' ? 'Indisponible' : `${exception.startTime} - ${exception.endTime}`}
                    {exception.reason && ` · ${exception.reason}`}
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteExceptionMutation.mutate({ id: exception.id })}
                    disabled={deleteExceptionMutation.isPending}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-coffee-500 text-center py-4">
            Aucune exception programmée
          </p>
        )}
      </Card>
    </div>
  );
}

// ==========================================
// ProfileSection — Mon profil (both roles)
// ==========================================
function ProfileSection({ user }: { user: any }) {
  const utils = trpc.useUtils();
  const [profileForm, setProfileForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
  });
  const [salonCode, setSalonCode] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [joinError, setJoinError] = useState('');

  const joinMutation = trpc.team.joinWithCode.useMutation({
    onSuccess: (data) => {
      setJoinSuccess(`Vous avez rejoint "${data.salonName}" avec succès !`);
      setJoinError('');
      setSalonCode('');
      utils.auth.me.invalidate();
    },
    onError: (err) => {
      setJoinError(err.message);
      setJoinSuccess('');
    },
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
  });

  const updatePasswordMutation = trpc.auth.updatePassword.useMutation({
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess(true);
      setPasswordError(null);
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: (err) => {
      setPasswordError(err.message);
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      phone: profileForm.phone || undefined,
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-coffee-800 mb-8">Mon profil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Info */}
        <Card>
          <h2 className="text-xl font-semibold text-coffee-800 mb-6">Informations personnelles</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm bg-sand-50 text-coffee-500"
              />
              <p className="text-xs text-coffee-400 mt-1">L'email ne peut pas être modifié.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              {profileSuccess && (
                <span className="text-sm text-green-600 font-medium">Profil mis à jour !</span>
              )}
            </div>
          </form>
        </Card>

        {/* Password */}
        <Card>
          <h2 className="text-xl font-semibold text-coffee-800 mb-6">Changer le mot de passe</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-1">Mot de passe actuel</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500"
                required
                minLength={8}
              />
            </div>

            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={updatePasswordMutation.isPending}>
                {updatePasswordMutation.isPending ? 'Modification...' : 'Modifier le mot de passe'}
              </Button>
              {passwordSuccess && (
                <span className="text-sm text-green-600 font-medium">Mot de passe modifié !</span>
              )}
            </div>
          </form>
        </Card>
      </div>

      {/* Join salon with code — PROFESSIONAL only */}
      {user.role === 'PROFESSIONAL' && (
        <Card className="mt-8">
          <h2 className="text-xl font-semibold text-coffee-800 mb-2">Rejoindre un établissement</h2>
          <p className="text-sm text-coffee-500 mb-4">
            Entrez le code d&apos;invitation fourni par le propriétaire du salon.
            {user.professionalProfile?.salon && (
              <span className="ml-1">Établissement actuel : <strong>{user.professionalProfile.salon.name}</strong></span>
            )}
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={salonCode}
              onChange={(e) => setSalonCode(e.target.value.toUpperCase())}
              placeholder="ex: ABC123"
              className="flex-1 px-3 py-2 border border-sand-300 rounded-lg text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-cream-500"
              maxLength={10}
            />
            <Button
              onClick={() => joinMutation.mutate({ code: salonCode })}
              disabled={!salonCode.trim() || joinMutation.isPending}
            >
              {joinMutation.isPending ? 'Vérification...' : 'Rejoindre'}
            </Button>
          </div>
          {joinSuccess && <p className="mt-3 text-sm text-green-600 font-medium">{joinSuccess}</p>}
          {joinError && <p className="mt-3 text-sm text-red-500">{joinError}</p>}
        </Card>
      )}

      {/* Account Info */}
      <Card className="mt-8">
        <h2 className="text-xl font-semibold text-coffee-800 mb-4">Informations du compte</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-coffee-500">Rôle</p>
            <p className="font-medium text-coffee-800">
              {user.role === 'SALON_OWNER' ? 'Propriétaire' : user.role === 'PROFESSIONAL' ? 'Professionnel' : user.role}
            </p>
          </div>
          <div>
            <p className="text-coffee-500">Inscrit le</p>
            <p className="font-medium text-coffee-800">
              {new Date(user.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div>
            <p className="text-coffee-500">Email vérifié</p>
            <p className="font-medium text-coffee-800">
              {user.emailVerified ? 'Oui' : 'Non'}
            </p>
          </div>
          <div>
            <p className="text-coffee-500">ID</p>
            <p className="font-medium text-coffee-800 font-mono text-xs">
              {user.id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==============================================
// PaymentsSection — Revenus (SALON_OWNER only)
// ==============================================
function PaymentsSection({ salons }: { salons: any[] }) {
  const [selectedSalonId, setSelectedSalonId] = useState(salons[0]?.id || '');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  });

  const { data: stats, isLoading: statsLoading } = trpc.payment.getSalonPaymentStats.useQuery(
    { salonId: selectedSalonId, startDate: dateRange.start, endDate: dateRange.end },
    { enabled: !!selectedSalonId }
  );

  const { data: payments, isLoading: paymentsLoading } = trpc.payment.getSalonPayments.useQuery(
    { salonId: selectedSalonId, limit: 20 },
    { enabled: !!selectedSalonId }
  );

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    PAID: { label: 'Payé', color: 'bg-green-100 text-green-700' },
    REFUNDED: { label: 'Remboursé', color: 'bg-blue-100 text-blue-700' },
    FAILED: { label: 'Échoué', color: 'bg-red-100 text-red-700' },
    CANCELLED: { label: 'Annulé', color: 'bg-gray-100 text-gray-700' },
  };

  const setMonth = (offset: number) => {
    const now = new Date();
    const month = now.getMonth() + offset;
    const start = new Date(now.getFullYear(), month, 1);
    const end = new Date(now.getFullYear(), month + 1, 0, 23, 59, 59);
    setDateRange({ start, end });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-coffee-800 mb-8">Revenus</h1>

      {/* Salon Selector */}
      {salons.length > 1 && (
        <div className="mb-6">
          <div className="flex gap-2">
            {salons.map((salon) => (
              <Button
                key={salon.id}
                variant={selectedSalonId === salon.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedSalonId(salon.id)}
              >
                {salon.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={() => setMonth(-1)}>Mois dernier</Button>
        <Button variant="primary" size="sm" onClick={() => setMonth(0)}>Ce mois</Button>
        <span className="flex items-center text-sm text-coffee-600 ml-2">
          {dateRange.start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-green-100">Total encaissé</p>
          <p className="text-3xl font-bold">
            {statsLoading ? '...' : `${((stats as any)?.totalPaid / 100 || 0).toFixed(2)} €`}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <p className="text-yellow-100">En attente</p>
          <p className="text-3xl font-bold">
            {statsLoading ? '...' : `${((stats as any)?.totalPending / 100 || 0).toFixed(2)} €`}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-blue-100">Remboursé</p>
          <p className="text-3xl font-bold">
            {statsLoading ? '...' : `${((stats as any)?.totalRefunded / 100 || 0).toFixed(2)} €`}
          </p>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <h2 className="text-xl font-semibold text-coffee-800 mb-4">Derniers paiements</h2>

        {paymentsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (payments as any)?.payments?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200">
                  <th className="text-left py-3 px-2 text-coffee-500 font-medium">Date</th>
                  <th className="text-left py-3 px-2 text-coffee-500 font-medium">Client</th>
                  <th className="text-left py-3 px-2 text-coffee-500 font-medium">Type</th>
                  <th className="text-left py-3 px-2 text-coffee-500 font-medium">Statut</th>
                  <th className="text-right py-3 px-2 text-coffee-500 font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {(payments as any).payments.map((payment: any) => {
                  const statusInfo = STATUS_LABELS[payment.status] || { label: payment.status, color: 'bg-gray-100 text-gray-700' };
                  return (
                    <tr key={payment.id} className="border-b border-sand-100 hover:bg-sand-50">
                      <td className="py-3 px-2 text-coffee-800">
                        {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-2 text-coffee-800">
                        {payment.appointment?.client?.user?.firstName || '-'}{' '}
                        {payment.appointment?.client?.user?.lastName || ''}
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs bg-cream-100 text-cream-700 px-2 py-0.5 rounded-full">
                          {payment.type === 'DEPOSIT' ? 'Acompte' : 'Complet'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-coffee-800">
                        {(payment.amount / 100).toFixed(2)} €
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-coffee-500 text-center py-8">Aucun paiement pour cette période.</p>
        )}
      </Card>
    </div>
  );
}
