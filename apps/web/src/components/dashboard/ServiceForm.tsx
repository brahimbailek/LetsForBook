'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button, Input, Textarea, Modal, Select, Alert } from '@/components/ui';

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  salonId: string;
  service?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    durationMinutes: number;
    category: string;
  };
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'Coiffure', label: 'Coiffure' },
  { value: 'Coloration', label: 'Coloration' },
  { value: 'Soins', label: 'Soins' },
  { value: 'Barbe', label: 'Barbe' },
  { value: 'Manucure', label: 'Manucure' },
  { value: 'Pédicure', label: 'Pédicure' },
  { value: 'Épilation', label: 'Épilation' },
  { value: 'Massage', label: 'Massage' },
  { value: 'Maquillage', label: 'Maquillage' },
  { value: 'Autre', label: 'Autre' },
];

const DURATIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1h' },
  { value: '90', label: '1h30' },
  { value: '120', label: '2h' },
  { value: '180', label: '3h' },
];

export function ServiceForm({ isOpen, onClose, salonId, service, onSuccess }: ServiceFormProps) {
  const isEditing = !!service;

  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service ? (service.price / 100).toString() : '',
    durationMinutes: service?.durationMinutes.toString() || '60',
    category: service?.category || 'Coiffure',
  });

  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.service.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
      resetForm();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const updateMutation = trpc.service.update.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      durationMinutes: '60',
      category: 'Coiffure',
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceInCents = Math.round(parseFloat(formData.price) * 100);

    if (isNaN(priceInCents) || priceInCents < 0) {
      setError('Veuillez entrer un prix valide');
      return;
    }

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      price: priceInCents,
      durationMinutes: parseInt(formData.durationMinutes),
      category: formData.category,
    };

    if (isEditing && service) {
      updateMutation.mutate({ id: service.id, ...data });
    } else {
      createMutation.mutate({ salonId, ...data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier la prestation' : 'Nouvelle prestation'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Input
          label="Nom de la prestation *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Coupe homme"
          required
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Décrivez cette prestation..."
          rows={2}
        />

        <Select
          label="Catégorie *"
          value={formData.category}
          onChange={(value) => setFormData({ ...formData, category: value })}
          options={CATEGORIES}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prix (€) *"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="25.00"
            type="number"
            step="0.01"
            min="0"
            required
          />

          <Select
            label="Durée *"
            value={formData.durationMinutes}
            onChange={(value) => setFormData({ ...formData, durationMinutes: value })}
            options={DURATIONS}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} fullWidth>
            Annuler
          </Button>
          <Button type="submit" fullWidth disabled={isPending}>
            {isPending ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
