import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedScoreProps {
  value: number;
  previousValue?: number;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  animated?: boolean;
  duration?: number;
}

export function AnimatedScore({
  value,
  previousValue = 0,
  label,
  className,
  size = 'md',
  color = 'text-blue-600',
  animated = true,
  duration = 0.6
}: AnimatedScoreProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  return (
    <div className={cn("text-center", className)}>
      <motion.div
        className={cn("font-bold", sizeClasses[size], color)}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: animated ? duration : 0 }}
      >
        <motion.span
          key={value}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: animated ? duration * 0.8 : 0 }}
        >
          {value}
        </motion.span>
      </motion.div>
      {label && (
        <motion.div
          className="text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: duration * 0.5 }}
        >
          {label}
        </motion.div>
      )}
    </div>
  );
}

interface ScoreChangeProps {
  change: number;
  visible: boolean;
  onComplete?: () => void;
}

export function ScoreChange({ change, visible, onComplete }: ScoreChangeProps) {
  if (!visible || change === 0) return null;

  return (
    <motion.div
      className={cn(
        "absolute top-0 right-0 px-2 py-1 rounded-full text-sm font-bold",
        change > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
      )}
      initial={{ opacity: 0, scale: 0.8, y: 0 }}
      animate={{ opacity: 1, scale: 1, y: -20 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={onComplete}
    >
      {change > 0 ? '+' : ''}{change}
    </motion.div>
  );
}

interface LevelProgressProps {
  currentLevel: number;
  maxLevel: number;
  className?: string;
  showNumbers?: boolean;
  animated?: boolean;
}

export function LevelProgress({
  currentLevel,
  maxLevel,
  className,
  showNumbers = true,
  animated = true
}: LevelProgressProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showNumbers && (
        <span className="text-sm font-medium text-gray-600">
          Level {currentLevel} / {maxLevel}
        </span>
      )}
      <div className="flex-1 flex gap-1">
        {Array.from({ length: maxLevel }, (_, i) => (
          <motion.div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full",
              i < currentLevel ? "bg-blue-500" : "bg-gray-200"
            )}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: animated ? i * 0.1 : 0,
              duration: animated ? 0.3 : 0
            }}
          />
        ))}
      </div>
    </div>
  );
}