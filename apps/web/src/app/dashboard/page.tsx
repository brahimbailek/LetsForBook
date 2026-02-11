'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, Badge, Spinner } from '@/components/ui';
import { AppointmentsList, SalonForm, ServiceForm } from '@/components/dashboard';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'salons' | 'services' | 'team'>('overview');
  const [showSalonForm, setShowSalonForm] = useState(false);
  const [editingSalon, setEditingSalon] = useState<any>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedSalonForService, setSelectedSalonForService] = useState<string | null>(null);

  const { data: user, isLoading: isLoadingUser } = trpc.auth.me.useQuery();
  const { data: mySalons, isLoading: isLoadingSalons, refetch: refetchSalons } = trpc.salon.getMySalons.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || (user.role !== 'PROFESSIONAL' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-coffee-800 mb-4">Accès refusé</h1>
          <p className="text-coffee-600 mb-8">
            Cette page est réservée aux professionnels et administrateurs.
          </p>
          <Link href="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Sidebar + Main Layout */}
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
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
              { id: 'appointments', label: 'Rendez-vous', icon: '📅' },
              { id: 'salons', label: 'Mes établissements', icon: '🏪' },
              { id: 'services', label: 'Prestations', icon: '✂️' },
              { id: 'team', label: 'Équipe', icon: '👥' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition ${
                  activeTab === item.id
                    ? 'bg-coffee-700 text-white border-l-4 border-cream-500'
                    : 'text-coffee-300 hover:bg-coffee-700 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
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
                <p className="text-xs">{user.role}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h1 className="text-3xl font-bold text-coffee-800 mb-8">
                Bonjour, {user.firstName} 👋
              </h1>

              {/* Stats Cards */}
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

              {/* Quick Actions */}
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

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div>
              <h1 className="text-3xl font-bold text-coffee-800 mb-8">Rendez-vous</h1>
              <AppointmentsList />
            </div>
          )}

          {/* Salons Tab */}
          {activeTab === 'salons' && (
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

                          {/* Deposit info */}
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

          {/* Services Tab */}
          {activeTab === 'services' && (
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

          {/* Team Tab */}
          {activeTab === 'team' && (
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
        </main>
      </div>

      {/* Modals */}
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
