'use client';

import { useState, useEffect } from 'react';
import { Modal, Alert, Spinner, Badge } from '@/components/ui';
import { PaymentForm } from './PaymentForm';
import { trpc } from '@/lib/trpc/client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  salonName: string;
  services: Array<{
    name: string;
    price: number;
    duration: number;
  }>;
  depositPercentage: number;
  onPaymentSuccess: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  appointmentId,
  salonName,
  services,
  depositPercentage,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const totalAmount = services.reduce((sum, s) => sum + s.price, 0);
  const depositAmount = Math.round((totalAmount * depositPercentage) / 100);
  const isDeposit = depositPercentage < 100;

  const createPaymentIntent = trpc.payment.createPaymentIntent.useMutation({
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
  });

  useEffect(() => {
    if (isOpen && appointmentId && !clientSecret) {
      createPaymentIntent.mutate({ appointmentId });
    }
  }, [isOpen, appointmentId]);

  const handleSuccess = () => {
    onPaymentSuccess();
    onClose();
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Paiement de votre réservation"
    >
      <div className="space-y-6">
        {/* Récapitulatif */}
        <div className="bg-cream-50 rounded-xl p-4">
          <h3 className="font-semibold text-coffee-800 mb-3">{salonName}</h3>

          <div className="space-y-2 mb-4">
            {services.map((service, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-coffee-600">
                  {service.name} ({service.duration} min)
                </span>
                <span className="text-coffee-800">{formatPrice(service.price)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-sand-200 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-coffee-600">Total des services</span>
              <span className="text-coffee-800">{formatPrice(totalAmount)}</span>
            </div>

            {isDeposit && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-coffee-600 flex items-center gap-2">
                    Acompte ({depositPercentage}%)
                    <Badge variant="info">À payer maintenant</Badge>
                  </span>
                  <span className="font-bold text-sage-700">{formatPrice(depositAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-coffee-500">Reste à payer sur place</span>
                  <span className="text-coffee-500">{formatPrice(totalAmount - depositAmount)}</span>
                </div>
              </>
            )}

            {!isDeposit && (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-coffee-800">Total à payer</span>
                <span className="font-bold text-lg text-sage-700">{formatPrice(totalAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Formulaire de paiement */}
        {createPaymentIntent.isPending && (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
            <span className="ml-3 text-coffee-600">Préparation du paiement...</span>
          </div>
        )}

        {createPaymentIntent.isError && (
          <Alert variant="error">
            Impossible de préparer le paiement. Veuillez réessayer.
          </Alert>
        )}

        {clientSecret && (
          <PaymentForm
            clientSecret={clientSecret}
            amount={depositAmount}
            onSuccess={handleSuccess}
            onError={(error) => console.error('Payment error:', error)}
          />
        )}
      </div>
    </Modal>
  );
}

export default PaymentModal;
