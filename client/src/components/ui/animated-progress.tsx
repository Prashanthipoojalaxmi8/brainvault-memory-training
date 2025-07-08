import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
  color?: string;
  height?: string;
  animated?: boolean;
  duration?: number;
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  showValue = false,
  color = 'bg-blue-500',
  height = 'h-2',
  animated = true,
  duration = 0.5
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("relative", className)}>
      <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden", height)}>
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: animated ? duration : 0,
            ease: "easeOut"
          }}
        />
      </div>
      {showValue && (
        <motion.div
          className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-medium text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: duration * 0.5 }}
        >
          {Math.round(percentage)}%
        </motion.div>
      )}
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  backgroundColor?: string;
  showValue?: boolean;
  animated?: boolean;
  duration?: number;
}

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  className,
  color = "#3b82f6",
  backgroundColor = "#e5e7eb",
  showValue = false,
  animated = true,
  duration = 0.8
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: animated ? strokeDashoffset : strokeDashoffset }}
          transition={{ 
            duration: animated ? duration : 0,
            ease: "easeOut"
          }}
        />
      </svg>
      {showValue && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-sm font-bold"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: duration * 0.3 }}
        >
          {Math.round(percentage)}%
        </motion.div>
      )}
    </div>
  );
}