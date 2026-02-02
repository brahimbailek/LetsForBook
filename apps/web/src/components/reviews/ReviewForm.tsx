'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button, Card, Textarea } from '@/components/ui';

interface ReviewFormProps {
  appointmentId: string;
  salonName: string;
  salonLogo?: string | null;
  serviceName: string;
  appointmentDate: Date;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  appointmentId,
  salonName,
  salonLogo,
  serviceName,
  appointmentDate,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const utils = trpc.useUtils();

  const createReviewMutation = trpc.review.create.useMutation({
    onSuccess: () => {
      utils.review.getReviewableAppointments.invalidate();
      utils.review.getMyReviews.invalidate();
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    createReviewMutation.mutate({
      appointmentId,
      rating,
      comment: comment || undefined,
    });
  };

  const displayRating = hoveredRating || rating;

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-6">
        {salonLogo ? (
          <img
            src={salonLogo}
            alt={salonName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center">
            <span className="text-sage-600 font-semibold text-lg">
              {salonName.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <h3 className="font-semibold text-coffee-800">{salonName}</h3>
          <p className="text-sm text-coffee-600">{serviceName}</p>
          <p className="text-xs text-coffee-500">
            {new Date(appointmentDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-coffee-700 mb-2">
            Votre note
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 focus:outline-none focus:ring-2 focus:ring-sage-500 rounded"
              >
                <svg
                  className={`w-8 h-8 transition-colors ${
                    star <= displayRating
                      ? 'text-yellow-400 fill-current'
                      : 'text-sand-300'
                  }`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              </button>
            ))}
          </div>
          <p className="text-xs text-coffee-500 mt-1">
            {rating === 1 && 'Très insatisfait'}
            {rating === 2 && 'Insatisfait'}
            {rating === 3 && 'Correct'}
            {rating === 4 && 'Satisfait'}
            {rating === 5 && 'Très satisfait'}
          </p>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-coffee-700 mb-2">
            Votre commentaire (optionnel)
          </label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience..."
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-coffee-500 mt-1 text-right">
            {comment.length}/1000
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Annuler
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={createReviewMutation.isPending || rating === 0}
          >
            {createReviewMutation.isPending ? 'Envoi...' : 'Publier mon avis'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
