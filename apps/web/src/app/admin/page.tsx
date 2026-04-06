'use client';

import { trpc } from '@/lib/trpc/client';
import Link from 'next/link';
import React, { useState } from 'react';
import { Button, Card, Badge, Spinner, Input, Select, Modal, Avatar, Alert } from '@/components/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = 'overview' | 'users' | 'salons' | 'moderation';
type Period = '7d' | '30d' | '90d' | 'all';
type RoleFilter = '' | 'CLIENT' | 'PROFESSIONAL' | 'SALON_OWNER' | 'ADMIN';
type PublishedFilter = '' | 'true' | 'false';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roleBadge(role: string) {
  const map: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
    ADMIN: { label: 'Admin', variant: 'error' },
    SALON_OWNER: { label: 'Proprietaire', variant: 'info' },
    PROFESSIONAL: { label: 'Professionnel', variant: 'success' },
    CLIENT: { label: 'Client', variant: 'default' },
  };
  const entry = map[role] || { label: role, variant: 'default' as const };
  return <Badge variant={entry.variant} size="sm">{entry.label}</Badge>;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
    PENDING: { label: 'En attente', variant: 'warning' },
    CONFIRMED: { label: 'Confirme', variant: 'info' },
    COMPLETED: { label: 'Termine', variant: 'success' },
    CANCELLED: { label: 'Annule', variant: 'error' },
    NO_SHOW: { label: 'No-show', variant: 'error' },
  };
  const entry = map[status] || { label: status, variant: 'default' as const };
  return <Badge variant={entry.variant} size="sm">{entry.label}</Badge>;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-amber-400' : 'text-sand-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Auth
  const { data: user, isLoading: isLoadingUser } = trpc.auth.me.useQuery();

  // Overview state
  const [period, setPeriod] = useState<Period>('30d');

  // Users state
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersSearchInput, setUsersSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Salons state
  const [salonsPage, setSalonsPage] = useState(1);
  const [salonsSearch, setSalonsSearch] = useState('');
  const [salonsSearchInput, setSalonsSearchInput] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>('');

  // Moderation state
  const [reviewsPage, setReviewsPage] = useState(1);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // -------------------------------------------------------------------------
  // tRPC queries
  // -------------------------------------------------------------------------

  // Overview
  const { data: stats, isLoading: isLoadingStats } = trpc.admin.getStats.useQuery(
    { period },
    { enabled: !!user && user.role === 'ADMIN' && activeTab === 'overview' }
  );

  // Users
  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = trpc.admin.getUsers.useQuery(
    {
      page: usersPage,
      limit: 10,
      ...(usersSearch ? { search: usersSearch } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
    },
    { enabled: !!user && user.role === 'ADMIN' && activeTab === 'users' }
  );

  const { data: userDetail, isLoading: isLoadingUserDetail } = trpc.admin.getUserById.useQuery(
    { userId: selectedUser?.id ?? '' },
    { enabled: !!selectedUser?.id && showUserModal }
  );

  // Salons
  const { data: salonsData, isLoading: isLoadingSalons, refetch: refetchSalons } = trpc.admin.getSalons.useQuery(
    {
      page: salonsPage,
      limit: 10,
      ...(salonsSearch ? { search: salonsSearch } : {}),
      ...(publishedFilter ? { published: publishedFilter === 'true' } : {}),
    },
    { enabled: !!user && user.role === 'ADMIN' && activeTab === 'salons' }
  );

  // Moderation
  const { data: reviewsData, isLoading: isLoadingReviews, refetch: refetchReviews } = trpc.admin.getReviews.useQuery(
    { page: reviewsPage, limit: 10 },
    { enabled: !!user && user.role === 'ADMIN' && activeTab === 'moderation' }
  );

  // -------------------------------------------------------------------------
  // tRPC mutations
  // -------------------------------------------------------------------------

  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      refetchUsers();
    },
  });

  const updateSalonMutation = trpc.admin.updateSalon.useMutation({
    onSuccess: () => {
      refetchSalons();
    },
  });

  const deleteReviewMutation = trpc.admin.deleteReview.useMutation({
    onSuccess: () => {
      refetchReviews();
      setShowDeleteConfirm(false);
      setDeleteReviewId(null);
    },
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleUsersSearch = () => {
    setUsersSearch(usersSearchInput);
    setUsersPage(1);
  };

  const handleSalonsSearch = () => {
    setSalonsSearch(salonsSearchInput);
    setSalonsPage(1);
  };

  const handleChangeRole = (userId: string, newRole: string) => {
    updateUserMutation.mutate({ userId, role: newRole as 'CLIENT' | 'PROFESSIONAL' | 'SALON_OWNER' | 'ADMIN' });
  };

  const handleToggleUserActive = (userId: string, active: boolean) => {
    updateUserMutation.mutate({ userId, active });
  };

  const handleToggleSalonPublished = (salonId: string, published: boolean) => {
    updateSalonMutation.mutate({ salonId, published });
  };

  const handleToggleSalonVerified = (salonId: string, verified: boolean) => {
    updateSalonMutation.mutate({ salonId, verified });
  };

  const handleDeleteReview = () => {
    if (deleteReviewId) {
      deleteReviewMutation.mutate({ reviewId: deleteReviewId });
    }
  };

  // -------------------------------------------------------------------------
  // Computed
  // -------------------------------------------------------------------------

  const usersTotalPages = usersData ? Math.ceil(usersData.total / 10) : 0;
  const salonsTotalPages = salonsData ? Math.ceil(salonsData.total / 10) : 0;
  const reviewsTotalPages = reviewsData ? Math.ceil(reviewsData.total / 10) : 0;

  // -------------------------------------------------------------------------
  // Loading / Access
  // -------------------------------------------------------------------------

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-cream-50 to-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-coffee-800 mb-4">Acces refuse</h1>
          <p className="text-coffee-600 mb-8">
            Cette page est reservee aux administrateurs.
          </p>
          <Link href="/">
            <Button>Retour a l&apos;accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Tabs config
  // -------------------------------------------------------------------------

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    {
      id: 'salons',
      label: 'Salons',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: 'moderation',
      label: 'Moderation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  // =========================================================================
  // RENDER — Overview Tab
  // =========================================================================

  const renderOverview = () => {
    if (isLoadingStats) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Period selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-coffee-600">Periode :</span>
          {([
            { value: '7d', label: '7 jours' },
            { value: '30d', label: '30 jours' },
            { value: '90d', label: '90 jours' },
            { value: 'all', label: 'Tout' },
          ] as { value: Period; label: string }[]).map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-cream-600 text-white'
                  : 'bg-white text-coffee-600 hover:bg-sand-100 border border-sand-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Main stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cream-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-cream-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-coffee-500">Utilisateurs</p>
                <p className="text-2xl font-bold text-coffee-800">{stats?.users?.total ?? '-'}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sage-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-coffee-500">Salons</p>
                <p className="text-2xl font-bold text-coffee-800">{stats?.salons?.total ?? '-'}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-coffee-500">Rendez-vous</p>
                <p className="text-2xl font-bold text-coffee-800">{stats?.appointments?.total ?? '-'}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-coffee-500">Revenus</p>
                <p className="text-2xl font-bold text-coffee-800">
                  {stats?.revenue?.totalCents != null ? `${(stats.revenue.totalCents / 100).toFixed(2)} EUR` : '-'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats by role & status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by role */}
          <Card>
            <h3 className="text-lg font-semibold text-coffee-800 mb-4">Utilisateurs par role</h3>
            <div className="space-y-3">
              {stats?.users?.byRole ? (
                Object.entries(stats.users.byRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {roleBadge(role)}
                    </div>
                    <span className="text-lg font-semibold text-coffee-800">{count as number}</span>
                  </div>
                ))
              ) : (
                <p className="text-coffee-400 text-sm">Aucune donnee</p>
              )}
            </div>
          </Card>

          {/* Appointments by status */}
          <Card>
            <h3 className="text-lg font-semibold text-coffee-800 mb-4">Rendez-vous par statut</h3>
            <div className="space-y-3">
              {stats?.appointments?.byStatus ? (
                Object.entries(stats.appointments.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {statusBadge(status)}
                    </div>
                    <span className="text-lg font-semibold text-coffee-800">{count as number}</span>
                  </div>
                ))
              ) : (
                <p className="text-coffee-400 text-sm">Aucune donnee</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // =========================================================================
  // RENDER — Users Tab
  // =========================================================================

  const renderUsers = () => {
    return (
      <div className="space-y-6">
        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par nom ou email..."
              value={usersSearchInput}
              onChange={(e) => setUsersSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUsersSearch()}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={roleFilter}
              onChange={(value) => {
                setRoleFilter(value as RoleFilter);
                setUsersPage(1);
              }}
              options={[
                { value: '', label: 'Tous les roles' },
                { value: 'CLIENT', label: 'Client' },
                { value: 'PROFESSIONAL', label: 'Professionnel' },
                { value: 'SALON_OWNER', label: 'Proprietaire' },
                { value: 'ADMIN', label: 'Admin' },
              ]}
            />
          </div>
          <Button onClick={handleUsersSearch} variant="secondary" size="sm">
            Rechercher
          </Button>
        </div>

        {/* Table */}
        {isLoadingUsers ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : !usersData?.items?.length ? (
          <Card>
            <p className="text-center text-coffee-500 py-8">Aucun utilisateur trouve.</p>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sand-200 bg-sand-50">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">Inscrit le</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">RDV</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {usersData.items.map((u: any) => (
                    <tr key={u.id} className="hover:bg-sand-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={`${u.firstName ?? ''} ${u.lastName ?? ''}`}
                            src={u.avatar}
                            size="sm"
                          />
                          <span className="font-medium text-coffee-800">
                            {u.firstName} {u.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-coffee-600">{u.email}</td>
                      <td className="px-6 py-4">{roleBadge(u.role)}</td>
                      <td className="px-6 py-4 text-sm text-coffee-500">{formatDate(u.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-coffee-600">{u.clientProfile?._count?.appointments ?? 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowUserModal(true);
                            }}
                            className="p-2 text-coffee-400 hover:text-cream-600 hover:bg-cream-50 rounded-lg transition-colors"
                            title="Voir details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggleUserActive(u.id, !!u.deletedAt)}
                            className={`p-2 rounded-lg transition-colors ${
                              !u.deletedAt
                                ? 'text-sage-600 hover:bg-sage-50'
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                            title={!u.deletedAt ? 'Desactiver' : 'Reactiver'}
                          >
                            {!u.deletedAt ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {usersTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-sand-200">
                <p className="text-sm text-coffee-500">
                  Page {usersPage} sur {usersTotalPages} ({usersData?.total} resultats)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={usersPage <= 1}
                    onClick={() => setUsersPage((p) => p - 1)}
                  >
                    Precedent
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={usersPage >= usersTotalPages}
                    onClick={() => setUsersPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* User detail modal */}
        <Modal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          title="Details utilisateur"
          size="lg"
        >
          {isLoadingUserDetail ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : userDetail ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Avatar
                  name={`${userDetail.firstName ?? ''} ${userDetail.lastName ?? ''}`}
                  src={userDetail.avatar}
                  size="xl"
                />
                <div>
                  <h3 className="text-xl font-semibold text-coffee-800">
                    {userDetail.firstName} {userDetail.lastName}
                  </h3>
                  <p className="text-coffee-500">{userDetail.email}</p>
                  <div className="mt-1">{roleBadge(userDetail.role)}</div>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-sand-50 rounded-xl p-4">
                  <p className="text-xs text-coffee-500 mb-1">Inscrit le</p>
                  <p className="font-medium text-coffee-800">{formatDate(userDetail.createdAt)}</p>
                </div>
                <div className="bg-sand-50 rounded-xl p-4">
                  <p className="text-xs text-coffee-500 mb-1">Rendez-vous</p>
                  <p className="font-medium text-coffee-800">{userDetail.clientProfile?.appointments?.length ?? 0}</p>
                </div>
                {userDetail.phone && (
                  <div className="bg-sand-50 rounded-xl p-4">
                    <p className="text-xs text-coffee-500 mb-1">Telephone</p>
                    <p className="font-medium text-coffee-800">{userDetail.phone}</p>
                  </div>
                )}
                <div className="bg-sand-50 rounded-xl p-4">
                  <p className="text-xs text-coffee-500 mb-1">Statut</p>
                  <p className="font-medium text-coffee-800">
                    {!userDetail.deletedAt ? (
                      <Badge variant="success" size="sm">Actif</Badge>
                    ) : (
                      <Badge variant="error" size="sm">Desactive</Badge>
                    )}
                  </p>
                </div>
              </div>

              {/* Role change */}
              <div>
                <p className="text-sm font-medium text-coffee-700 mb-2">Changer le role</p>
                <div className="flex items-center gap-3">
                  <Select
                    value={userDetail.role}
                    onChange={(value) => handleChangeRole(userDetail.id, value)}
                    options={[
                      { value: 'CLIENT', label: 'Client' },
                      { value: 'PROFESSIONAL', label: 'Professionnel' },
                      { value: 'SALON_OWNER', label: 'Proprietaire' },
                      { value: 'ADMIN', label: 'Admin' },
                    ]}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-coffee-500 text-center py-4">Utilisateur introuvable.</p>
          )}
        </Modal>
      </div>
    );
  };

  // =========================================================================
  // RENDER — Salons Tab
  // =========================================================================

  const renderSalons = () => {
    return (
      <div className="space-y-6">
        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par nom ou ville..."
              value={salonsSearchInput}
              onChange={(e) => setSalonsSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSalonsSearch()}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={publishedFilter}
              onChange={(value) => {
                setPublishedFilter(value as PublishedFilter);
                setSalonsPage(1);
              }}
              options={[
                { value: '', label: 'Tous les statuts' },
                { value: 'true', label: 'Publie' },
                { value: 'false', label: 'Non publie' },
              ]}
            />
          </div>
          <Button onClick={handleSalonsSearch} variant="secondary" size="sm">
            Rechercher
          </Button>
        </div>

        {/* Table */}
        {isLoadingSalons ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : !salonsData?.items?.length ? (
          <Card>
            <p className="text-center text-coffee-500 py-8">Aucun salon trouve.</p>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sand-200 bg-sand-50">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">Salon</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">Ville</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">Proprietaire</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">Pros</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">RDV</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">Publie</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">Verifie</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-coffee-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {salonsData.items.map((salon: any) => (
                    <tr key={salon.id} className="hover:bg-sand-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-coffee-800">{salon.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-coffee-600">{salon.city ?? '-'}</td>
                      <td className="px-6 py-4 text-sm text-coffee-600">
                        {salon.owner ? `${salon.owner.firstName} ${salon.owner.lastName}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-coffee-600">{salon._count?.professionals ?? 0}</td>
                      <td className="px-6 py-4 text-sm text-coffee-600">{salon._count?.appointments ?? 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleSalonPublished(salon.id, !salon.published)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              salon.published ? 'bg-sage-500' : 'bg-sand-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                salon.published ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleSalonVerified(salon.id, !salon.verified)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              salon.verified ? 'bg-sage-500' : 'bg-sand-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                salon.verified ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          {salon.slug && (
                            <Link
                              href={`/salon/${salon.slug}`}
                              target="_blank"
                              className="p-2 text-coffee-400 hover:text-cream-600 hover:bg-cream-50 rounded-lg transition-colors"
                              title="Voir la page salon"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {salonsTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-sand-200">
                <p className="text-sm text-coffee-500">
                  Page {salonsPage} sur {salonsTotalPages} ({salonsData?.total} resultats)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={salonsPage <= 1}
                    onClick={() => setSalonsPage((p) => p - 1)}
                  >
                    Precedent
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={salonsPage >= salonsTotalPages}
                    onClick={() => setSalonsPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    );
  };

  // =========================================================================
  // RENDER — Moderation Tab
  // =========================================================================

  const renderModeration = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-coffee-800">Avis recents</h3>
          {reviewsData && (
            <span className="text-sm text-coffee-500">{reviewsData.total} avis au total</span>
          )}
        </div>

        {isLoadingReviews ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : !reviewsData?.items?.length ? (
          <Card>
            <p className="text-center text-coffee-500 py-8">Aucun avis a moderer.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviewsData.items.map((review: any) => (
              <Card key={review.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <StarRating rating={review.rating} />
                      <span className="text-sm text-coffee-500">{formatDate(review.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="info" size="sm">
                        {review.salon?.name ?? 'Salon inconnu'}
                      </Badge>
                      <span className="text-sm text-coffee-600">
                        par {review.client?.user?.firstName} {review.client?.user?.lastName}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-coffee-700 text-sm leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteReviewId(review.id);
                      setShowDeleteConfirm(true);
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="ml-1">Supprimer</span>
                  </Button>
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {reviewsTotalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-coffee-500">
                  Page {reviewsPage} sur {reviewsTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={reviewsPage <= 1}
                    onClick={() => setReviewsPage((p) => p - 1)}
                  >
                    Precedent
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={reviewsPage >= reviewsTotalPages}
                    onClick={() => setReviewsPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete confirm modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeleteReviewId(null);
          }}
          title="Confirmer la suppression"
          size="sm"
        >
          <div className="space-y-4">
            <Alert variant="warning">
              Cette action est irreversible. L&apos;avis sera definitivement supprime.
            </Alert>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteReviewId(null);
                }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteReview}
                disabled={deleteReviewMutation.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                {deleteReviewMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  // =========================================================================
  // MAIN RENDER
  // =========================================================================

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Header */}
      <header className="bg-white border-b border-sand-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-cream-600 to-cream-700 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-coffee-800">LetsForBook</span>
              </Link>
              <div className="hidden sm:flex items-center">
                <Badge variant="error" size="sm">Admin</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <div className="flex items-center gap-2">
                <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
                <span className="text-sm font-medium text-coffee-700 hidden sm:block">
                  {user.firstName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs navigation */}
      <div className="bg-white border-b border-sand-200">
        <div className="container mx-auto px-4 max-w-7xl">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-cream-600 text-cream-700'
                    : 'border-transparent text-coffee-500 hover:text-coffee-700 hover:border-sand-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 max-w-7xl py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'salons' && renderSalons()}
        {activeTab === 'moderation' && renderModeration()}
      </main>
    </div>
  );
}
