'use client';

import { motion } from 'framer-motion';

interface ScoreDialProps {
  score: number;
  grade: string;
  size?: 'sm' | 'lg';
}

export function ScoreDial({ score, grade, size = 'lg' }: ScoreDialProps) {
  const isLarge = size === 'lg';
  const dimension = isLarge ? 200 : 120;
  const strokeWidth = isLarge ? 12 : 8;
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillPercentage = score / 100;
  const strokeDashoffset = circumference * (1 - fillPercentage);

  // Color based on score
  const getColor = (s: number) => {
    if (s >= 80) return '#10b981'; // emerald-500
    if (s >= 60) return '#84cc16'; // lime-500
    if (s >= 40) return '#eab308'; // yellow-500
    if (s >= 20) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  const color = getColor(score);

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Score fill */}
        <motion.circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      {/* Score text in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`font-bold leading-none ${isLarge ? 'text-4xl' : 'text-2xl'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <motion.span
          className={`font-semibold ${isLarge ? 'text-lg' : 'text-sm'}`}
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {grade}
        </motion.span>
      </div>
    </div>
  );
}
