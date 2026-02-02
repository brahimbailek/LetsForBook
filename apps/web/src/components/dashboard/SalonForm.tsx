'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button, Input, Textarea, Modal, Select, Alert } from '@/components/ui';

interface SalonFormProps {
  isOpen: boolean;
  onClose: () => void;
  salon?: {
    id: string;
    name: string;
    description: string | null;
    address: string;
    city: string;
    postalCode: string;
    phone: string | null;
    email: string | null;
    depositRequired: boolean;
    depositPercentage: number | null;
  };
  onSuccess: () => void;
}

export function SalonForm({ isOpen, onClose, salon, onSuccess }: SalonFormProps) {
  const isEditing = !!salon;

  const [formData, setFormData] = useState({
    name: salon?.name || '',
    description: salon?.description || '',
    address: salon?.address || '',
    city: salon?.city || '',
    postalCode: salon?.postalCode || '',
    phone: salon?.phone || '',
    email: salon?.email || '',
    depositRequired: salon?.depositRequired || false,
    depositPercentage: salon?.depositPercentage || 25,
  });

  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.salon.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
      resetForm();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const updateMutation = trpc.salon.update.useMutation({
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
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      email: '',
      depositRequired: false,
      depositPercentage: 25,
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.phone || !formData.email) {
      setError('Téléphone et email sont requis');
      return;
    }

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      phone: formData.phone,
      email: formData.email,
      depositRequired: formData.depositRequired,
      depositPercentage: formData.depositRequired ? formData.depositPercentage : undefined,
    };

    if (isEditing && salon) {
      updateMutation.mutate({ id: salon.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier l\'établissement' : 'Nouvel établissement'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Input
          label="Nom de l'établissement *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Mon Salon de Coiffure"
          required
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Décrivez votre établissement..."
          rows={3}
        />

        <Input
          label="Adresse *"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="123 Rue de la Paix"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ville *"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Paris"
            required
          />
          <Input
            label="Code postal *"
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            placeholder="75001"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Téléphone *"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="01 23 45 67 89"
            type="tel"
            required
          />
          <Input
            label="Email *"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contact@salon.fr"
            type="email"
            required
          />
        </div>

        {/* Deposit Settings */}
        <div className="p-4 bg-sand-50 rounded-xl space-y-4">
          <h3 className="font-semibold text-coffee-800">Paramètres de paiement</h3>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.depositRequired}
              onChange={(e) => setFormData({ ...formData, depositRequired: e.target.checked })}
              className="w-5 h-5 rounded border-sand-300 text-cream-600 focus:ring-cream-500"
            />
            <span className="text-coffee-700">Demander un acompte à la réservation</span>
          </label>

          {formData.depositRequired && (
            <Select
              label="Pourcentage de l'acompte"
              value={formData.depositPercentage.toString()}
              onChange={(value) => setFormData({ ...formData, depositPercentage: parseInt(value) })}
              options={[
                { value: '10', label: '10%' },
                { value: '25', label: '25% (recommandé)' },
                { value: '50', label: '50%' },
                { value: '100', label: '100% (paiement complet)' },
              ]}
            />
          )}

          <p className="text-sm text-coffee-500">
            {formData.depositRequired
              ? `Les clients paieront ${formData.depositPercentage}% du montant total lors de la réservation.`
              : 'Les clients ne paieront rien à la réservation (paiement sur place).'}
          </p>
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
