'use client';

import { trpc } from '@/lib/trpc/client';
import { useState } from 'react';
import { Button, Card, Badge, Avatar, Spinner, Modal, Input, Alert } from '@/components/ui';

interface TeamManagerProps {
  salonId: string;
  salonName: string;
}

export function TeamManager({ salonId, salonName }: TeamManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProId, setEditingProId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: team, isLoading, refetch } = trpc.team.getBySalonId.useQuery(
    { salonId },
    { enabled: !!salonId }
  );

  const [addForm, setAddForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    title: '',
    specialties: '',
  });

  const [editForm, setEditForm] = useState({
    title: '',
    specialties: '',
    bio: '',
  });

  const addMutation = trpc.team.add.useMutation({
    onSuccess: () => {
      refetch();
      setShowAddForm(false);
      setAddForm({ email: '', firstName: '', lastName: '', title: '', specialties: '' });
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  const updateMutation = trpc.team.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingProId(null);
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  const removeMutation = trpc.team.remove.useMutation({
    onSuccess: () => {
      refetch();
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    addMutation.mutate({
      salonId,
      email: addForm.email,
      firstName: addForm.firstName,
      lastName: addForm.lastName,
      title: addForm.title || undefined,
      specialties: addForm.specialties ? addForm.specialties.split(',').map(s => s.trim()).filter(Boolean) : [],
    });
  };

  const handleUpdate = (professionalId: string) => {
    setError(null);
    updateMutation.mutate({
      professionalId,
      title: editForm.title || undefined,
      specialties: editForm.specialties ? editForm.specialties.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      bio: editForm.bio || undefined,
    });
  };

  const startEditing = (pro: any) => {
    setEditingProId(pro.id);
    setEditForm({
      title: pro.title || '',
      specialties: pro.specialties?.join(', ') || '',
      bio: pro.bio || '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeTeam = team?.filter(p => p.active) || [];
  const inactiveTeam = team?.filter(p => !p.active) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-coffee-800">{salonName}</h2>
          <p className="text-sm text-coffee-500">{activeTeam.length} professionnel(s) actif(s)</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>+ Ajouter un collaborateur</Button>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Active Team */}
      {activeTeam.length > 0 ? (
        <div className="space-y-4">
          {activeTeam.map((pro) => (
            <Card key={pro.id}>
              {editingProId === pro.id ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar
                      name={`${pro.user.firstName} ${pro.user.lastName}`}
                      src={pro.user.avatar}
                      size="lg"
                    />
                    <div>
                      <p className="font-semibold text-coffee-800">{pro.user.firstName} {pro.user.lastName}</p>
                      <p className="text-sm text-coffee-500">{pro.user.email}</p>
                    </div>
                  </div>

                  <Input
                    label="Titre / Poste"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Ex: Coiffeur senior"
                  />
                  <Input
                    label="Spécialités (séparées par des virgules)"
                    value={editForm.specialties}
                    onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })}
                    placeholder="Coloration, Balayage, Mèches"
                  />
                  <div>
                    <label className="block text-sm font-medium text-coffee-700 mb-1">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Quelques mots sur ce professionnel..."
                      className="w-full px-3 py-2 border border-sand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cream-500 resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(pro.id)}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingProId(null)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar
                      name={`${pro.user.firstName} ${pro.user.lastName}`}
                      src={pro.user.avatar}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-semibold text-coffee-800">
                        {pro.user.firstName} {pro.user.lastName}
                      </h3>
                      <p className="text-sm text-coffee-500">{pro.user.email}</p>
                      {pro.title && (
                        <p className="text-sm text-cream-700 font-medium mt-1">{pro.title}</p>
                      )}
                      {pro.specialties && pro.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pro.specialties.map((spec: string, i: number) => (
                            <span key={i} className="text-xs bg-cream-100 text-cream-700 px-2 py-0.5 rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-coffee-500">
                        <span>{pro.services?.length || 0} prestations</span>
                        <span>{pro._count?.appointments || 0} RDV réalisés</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => startEditing(pro)}>
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Retirer ${pro.user.firstName} ${pro.user.lastName} de l'équipe ?`)) {
                          removeMutation.mutate({ professionalId: pro.id });
                        }
                      }}
                      disabled={removeMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      Retirer
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <p className="text-coffee-500 mb-4">Aucun collaborateur pour le moment.</p>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            Ajouter votre premier collaborateur
          </Button>
        </Card>
      )}

      {/* Inactive Team */}
      {inactiveTeam.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-coffee-500 uppercase tracking-wider mb-3">
            Anciens collaborateurs ({inactiveTeam.length})
          </h3>
          <div className="space-y-2">
            {inactiveTeam.map((pro) => (
              <Card key={pro.id} className="opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={`${pro.user.firstName} ${pro.user.lastName}`}
                      src={pro.user.avatar}
                      size="md"
                    />
                    <div>
                      <p className="font-medium text-coffee-800">{pro.user.firstName} {pro.user.lastName}</p>
                      <Badge variant="error" size="sm">Inactif</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Professional Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => { setShowAddForm(false); setError(null); }}
        title="Ajouter un collaborateur"
        size="md"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          {error && (
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Input
            label="Email *"
            type="email"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            placeholder="prenom@example.com"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom *"
              value={addForm.firstName}
              onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
              placeholder="Camille"
              required
            />
            <Input
              label="Nom *"
              value={addForm.lastName}
              onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
              placeholder="Rousseau"
              required
            />
          </div>

          <Input
            label="Titre / Poste"
            value={addForm.title}
            onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
            placeholder="Coiffeur(se), Esthéticien(ne)..."
          />

          <Input
            label="Spécialités (séparées par des virgules)"
            value={addForm.specialties}
            onChange={(e) => setAddForm({ ...addForm, specialties: e.target.value })}
            placeholder="Coloration, Balayage, Mèches"
          />

          <p className="text-xs text-coffee-500">
            Un compte sera créé pour ce collaborateur s'il n'en a pas déjà un.
          </p>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} fullWidth>
              Annuler
            </Button>
            <Button type="submit" fullWidth disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Ajout en cours...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
