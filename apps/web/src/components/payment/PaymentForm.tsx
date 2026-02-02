'use client';

import { useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { Button, Alert, Spinner } from '@/components/ui';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  currency?: string;
  onSuccess: () => void;
  onError?: (error: string) => void;
  returnUrl?: string;
}

function CheckoutForm({
  amount,
  currency = 'EUR',
  onSuccess,
  onError,
  returnUrl,
}: Omit<PaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Une erreur est survenue');
      setIsProcessing(false);
      return;
    }

    const { error: paymentError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl || `${window.location.origin}/booking/confirmation`,
      },
      redirect: 'if_required',
    });

    if (paymentError) {
      setError(paymentError.message || 'Le paiement a échoué');
      onError?.(paymentError.message || 'Le paiement a échoué');
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  const formatAmount = (cents: number, curr: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: curr,
    }).format(cents / 100);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-sand-50 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-coffee-600">Montant à payer</span>
          <span className="text-xl font-bold text-coffee-800">
            {formatAmount(amount, currency)}
          </span>
        </div>
      </div>

      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        size="lg"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            Traitement en cours...
          </span>
        ) : (
          `Payer ${formatAmount(amount, currency)}`
        )}
      </Button>

      <p className="text-xs text-center text-coffee-500">
        Paiement sécurisé par Stripe. Vos informations bancaires sont protégées.
      </p>
    </form>
  );
}

export function PaymentForm({
  clientSecret,
  amount,
  currency = 'EUR',
  onSuccess,
  onError,
  returnUrl,
}: PaymentFormProps) {
  if (!stripePromise) {
    return (
      <Alert variant="warning">
        Le système de paiement n&apos;est pas configuré. Veuillez contacter le support.
      </Alert>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#6b8e6b',
      colorBackground: '#ffffff',
      colorText: '#4a3728',
      colorDanger: '#dc2626',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '12px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        border: '2px solid #e8e0d5',
        boxShadow: 'none',
        padding: '12px 16px',
      },
      '.Input:focus': {
        border: '2px solid #6b8e6b',
        boxShadow: '0 0 0 3px rgba(107, 142, 107, 0.1)',
      },
      '.Label': {
        fontWeight: '500',
        color: '#4a3728',
        marginBottom: '8px',
      },
      '.Tab': {
        border: '2px solid #e8e0d5',
        borderRadius: '12px',
      },
      '.Tab--selected': {
        border: '2px solid #6b8e6b',
        backgroundColor: '#f0faf0',
      },
    },
  };

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
        locale: 'fr',
      }}
    >
      <CheckoutForm
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
        returnUrl={returnUrl}
      />
    </Elements>
  );
}

export default PaymentForm;
