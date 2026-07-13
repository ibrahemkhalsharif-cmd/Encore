import type { ReactNode } from 'react';
import { categoryLabel } from '../types';

const palettes: Record<string, [string, string]> = {
  music: ['#4f39c6', '#8f6fe8'],
  comedy: ['#d64f21', '#f2a65a'],
  arts: ['#b12f6e', '#ef7fae'],
  food: ['#3e7c4f', '#8fbf6f'],
  tech: ['#14676f', '#4fb3a9'],
  sports: ['#2456b8', '#6f9fe8'],
};

// Cheap string hash so each event gets a slightly different gradient angle.
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

type Props = {
  slug: string;
  category: string;
  tall?: boolean;
  children?: ReactNode;
};

export function Cover({ slug, category, tall, children }: Props) {
  const [from, to] = palettes[category] ?? palettes.music;
  const angle = 15 + (hash(slug) % 60);

  return (
    <div
      className={tall ? 'cover tall' : 'cover'}
      style={{
        background: [
          `radial-gradient(circle at 85% 20%, rgba(255,255,255,0.18) 0 60px, transparent 61px)`,
          `radial-gradient(circle at 15% 85%, rgba(255,255,255,0.12) 0 90px, transparent 91px)`,
          `linear-gradient(${angle}deg, ${from}, ${to})`,
        ].join(', '),
      }}
    >
      <span className="cover-category">{categoryLabel(category)}</span>
      {children}
    </div>
  );
}
