import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  onRate: (rating: number) => void;
}

export const Rating = ({ onRate }: RatingProps) => {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  const handleRate = (val: number) => {
    setSelected(val);
    setTimeout(() => onRate(val), 500);
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRate(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{ transition: 'transform 0.2s', transform: (hovered || selected) >= star ? 'scale(1.2)' : 'scale(1)' }}
        >
          <Star
            size={48}
            fill={(hovered || selected) >= star ? 'var(--warning)' : 'transparent'}
            color={(hovered || selected) >= star ? 'var(--warning)' : 'var(--text-secondary)'}
          />
        </button>
      ))}
    </div>
  );
};
