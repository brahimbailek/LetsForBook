'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import React, { useState } from 'react';
import { Button, Card, Badge, Spinner } from '@/components/ui';
import { AppointmentsList, SalonForm, ServiceForm } from '@/components/dashboard';

type TabId = 'overview' | 'appointments' | 'salons' | 'services' | 'team' | 'my-agenda' | 'my-services' | 'my-availability';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showSalonForm, setShowSalonForm] = useState(false);
  const [editingSalon, setEditingSalon] = useState<any>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedSalonForService, setSelectedSalonForService] = useState<string | null>(null);

  const { data: user, isLoading: isLoadingUser } = trpc.auth.me.useQuery();

  // Derived role flags
  const isSalonOwner = user?.role === 'SALON_OWNER' || user?.role === 'ADMIN';
  const isProfessional = user?.role === 'PROFESSIONAL';

  // SALON_OWNER data
  const { data: mySalons, isLoading: isLoadingSalons, refetch: refetchSalons } = trpc.salon.getMySalons.useQuery(
    undefined,
    { enabled: !!user && isSalonOwner }
  );

  // PROFESSIONAL data - services assigned to them (read-only)
  const { data: myServices, isLoading: isLoadingMyServices } = trpc.service.getByProfessionalId.useQuery(
    { professionalId: user?.professionalProfile?.id ?? '' },
    { enabled: !!user && !!user.professionalProfile?.id }
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

  // SALON_OWNER stats
  const totalAppointments = mySalons?.reduce((sum, s) => sum + (s._count?.appointments || 0), 0) || 0;
  const totalServices = mySalons?.reduce((sum, s) => sum + (s._count?.services || 0), 0) || 0;
  const totalReviews = mySalons?.reduce((sum, s) => sum + (s._count?.reviews || 0), 0) || 0;

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
      ]
    : [
        { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
        { id: 'appointments', label: 'Rendez-vous', icon: '📅' },
        { id: 'salons', label: 'Mes établissements', icon: '🏪' },
        { id: 'services', label: 'Prestations', icon: '✂️' },
        { id: 'team', label: 'Équipe', icon: '👥' },
        { id: 'my-agenda', label: 'Mon agenda', icon: '📅', separator: true },
        { id: 'my-availability', label: 'Mes disponibilités', icon: '🕐' },
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

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-3 text-coffee-300">
              <div className="w-10 h-10 rounded-full bg-coffee-600 flex items-center justify-center">
                <span className="text-white font-medium">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-white font-medium">{user.firstName}</p>
                <p className="text-xs">{roleLabel}</p>
              </div>
            </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-cream-500 to-cream-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cream-100">Établissements</p>
                      <p className="text-3xl font-bold">{mySalons?.length || 0}</p>
                    </div>
                    <div className="text-4xl opacity-50">🏪</div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-sage-500 to-sage-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sage-100">Rendez-vous</p>
                      <p className="text-3xl font-bold">{totalAppointments}</p>
                    </div>
                    <div className="text-4xl opacity-50">📅</div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-sand-500 to-sand-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sand-100">Prestations</p>
                      <p className="text-3xl font-bold">{totalServices}</p>
                    </div>
                    <div className="text-4xl opacity-50">✂️</div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-coffee-500 to-coffee-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-coffee-200">Avis clients</p>
                      <p className="text-3xl font-bold">{totalReviews}</p>
                    </div>
                    <div className="text-4xl opacity-50">⭐</div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h2 className="text-xl font-semibold text-coffee-800 mb-4">Actions rapides</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" fullWidth onClick={() => setShowSalonForm(true)}>
                      + Nouvel établissement
                    </Button>
                    <Button variant="outline" fullWidth onClick={() => setActiveTab('services')}>
                      + Nouvelle prestation
                    </Button>
                    <Button variant="outline" fullWidth onClick={() => setActiveTab('team')}>
                      + Nouveau collaborateur
                    </Button>
                    <Button variant="outline" fullWidth onClick={() => setActiveTab('appointments')}>
                      Voir l'agenda
                    </Button>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-xl font-semibold text-coffee-800 mb-4">Mes établissements</h2>
                  <div className="space-y-3">
                    {mySalons?.slice(0, 3).map((salon) => (
                      <div key={salon.id} className="flex items-center justify-between p-3 bg-sand-50 rounded-lg">
                        <div>
                          <p className="font-medium text-coffee-800">{salon.name}</p>
                          <p className="text-sm text-coffee-500">
                            {salon._count?.appointments || 0} RDV · {salon._count?.reviews || 0} avis
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={salon.active ? 'success' : 'error'}>
                            {salon.active ? 'Actif' : 'Inactif'}
                          </Badge>
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
                      Gérer mes disponibilités
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
              <h1 className="text-3xl font-bold text-coffee-800 mb-8">Rendez-vous</h1>
              <AppointmentsList />
            </div>
          )}

          {/* ======================== */}
          {/* MON AGENDA - Both roles */}
          {/* ======================== */}
          {activeTab === 'my-agenda' && (
            <div>
              <h1 className="text-3xl font-bold text-coffee-800 mb-8">Mon agenda</h1>
              <AppointmentsList />
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
                        <div className="w-16 h-16 bg-cream-200 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl font-bold text-cream-700">{salon.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-coffee-800">{salon.name}</h3>
                              <p className="text-sm text-coffee-500">{salon.city}</p>
                            </div>
                            <Badge variant={salon.active ? 'success' : 'error'}>
                              {salon.active ? 'Actif' : 'Inactif'}
                            </Badge>
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
                <div className="space-y-6">
                  {mySalons.map((salon) => (
                    <SalonServicesCard
                      key={salon.id}
                      salon={salon}
                      onAddService={() => handleAddService(salon.id)}
                    />
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
              <h1 className="text-3xl font-bold text-coffee-800 mb-8">Mes prestations</h1>

              {isLoadingMyServices ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : myServices && myServices.length > 0 ? (
                <div className="space-y-3">
                  {myServices.map((service) => (
                    <Card key={service.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-coffee-800">{service.name}</p>
                          <p className="text-sm text-coffee-500">
                            {service.customDurationMinutes || service.durationMinutes} min
                          </p>
                        </div>
                        <span className="font-semibold text-coffee-800">
                          {((service.customPrice ?? service.price) / 100).toFixed(2)} €
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <div className="text-6xl mb-4">✂️</div>
                  <h3 className="text-xl font-semibold text-coffee-800 mb-2">
                    Aucune prestation assignée
                  </h3>
                  <p className="text-coffee-600">
                    Votre responsable n'a pas encore assigné de prestations à votre profil.
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
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-coffee-800">Équipe</h1>
                <Button>+ Inviter un collaborateur</Button>
              </div>

              {mySalons && mySalons.length > 0 ? (
                <div className="space-y-6">
                  {mySalons.map((salon) => (
                    <Card key={salon.id}>
                      <h2 className="text-lg font-semibold text-coffee-800 mb-4">{salon.name}</h2>
                      <p className="text-coffee-500">
                        {salon._count?.professionals || 0} professionnel(s)
                      </p>
                      <div className="mt-4">
                        <Button variant="outline" size="sm">Gérer l'équipe</Button>
                      </div>
                    </Card>
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
              />
            </div>
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

// Sous-composant pour afficher les services d'un salon
function SalonServicesCard({ salon, onAddService }: { salon: any; onAddService: () => void }) {
  const { data: services, isLoading } = trpc.service.getBySalonId.useQuery({ salonId: salon.id });

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-coffee-800">{salon.name}</h2>
        <Button size="sm" onClick={onAddService}>+ Ajouter</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : services && services.length > 0 ? (
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-3 bg-sand-50 rounded-lg">
              <div>
                <p className="font-medium text-coffee-800">{service.name}</p>
                <p className="text-sm text-coffee-500">
                  {service.category?.name} · {service.durationMinutes} min
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-coffee-800">
                  {(service.price / 100).toFixed(2)} €
                </span>
                <Button variant="ghost" size="sm">Modifier</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-coffee-500 text-center py-4">
          Aucune prestation pour cet établissement
        </p>
      )}
    </Card>
  );
}

// Sous-composant pour gérer les disponibilités
function AvailabilityManager({
  availability,
  exceptions,
  isLoading,
  onRefreshAvailability,
  onRefreshExceptions,
}: {
  availability: any[] | undefined;
  exceptions: any[] | undefined;
  isLoading: boolean;
  onRefreshAvailability: () => void;
  onRefreshExceptions: () => void;
}) {
  const [editingDay, setEditingDay] = useState<string | null>(null);
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

  const ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  const handleEditDay = (day: string) => {
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
                  <Button variant="ghost" size="sm" onClick={() => handleEditDay(day)}>
                    Modifier
                  </Button>
                </div>

                {isEditing && (
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
          <Button size="sm" onClick={() => setShowExceptionForm(true)}>+ Ajouter</Button>
        </div>

        {showExceptionForm && (
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteExceptionMutation.mutate({ id: exception.id })}
                  disabled={deleteExceptionMutation.isPending}
                >
                  Supprimer
                </Button>
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
