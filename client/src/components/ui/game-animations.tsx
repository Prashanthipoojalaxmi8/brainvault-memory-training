import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, Target } from 'lucide-react';

interface GameTransitionProps {
  isVisible: boolean;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  type?: 'success' | 'error' | 'info' | 'warning';
  onComplete?: () => void;
}

export function GameTransition({
  isVisible,
  title,
  description,
  icon,
  type = 'info',
  onComplete
}: GameTransitionProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={48} />;
      case 'error':
        return <XCircle size={48} />;
      case 'warning':
        return <Clock size={48} />;
      default:
        return <Target size={48} />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={cn(
              "p-8 rounded-2xl shadow-2xl max-w-md mx-4 text-center",
              getTypeStyles()
            )}
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -50 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
            onAnimationComplete={onComplete}
          >
            <motion.div
              className="mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            >
              {icon || getDefaultIcon()}
            </motion.div>
            <motion.h2
              className="text-2xl font-bold mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.h2>
            {description && (
              <motion.p
                className="text-lg opacity-90"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {description}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SequenceDisplayProps {
  sequence: (string | number)[];
  currentIndex: number;
  isVisible: boolean;
  onComplete?: () => void;
}

export function SequenceDisplay({
  sequence,
  currentIndex,
  isVisible,
  onComplete
}: SequenceDisplayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="flex justify-center items-center gap-4 p-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          {sequence.map((item, index) => (
            <motion.div
              key={index}
              className={cn(
                "w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold",
                index === currentIndex
                  ? "bg-blue-500 text-white scale-110"
                  : index < currentIndex
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              )}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: index <= currentIndex ? 1 : 0.8, opacity: 1 }}
              transition={{ 
                delay: index * 0.1,
                duration: 0.3,
                type: "spring",
                stiffness: 200 
              }}
            >
              {item}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface TimerDisplayProps {
  timeRemaining: number;
  totalTime: number;
  className?: string;
  showNumbers?: boolean;
  color?: string;
  warningThreshold?: number;
}

export function TimerDisplay({
  timeRemaining,
  totalTime,
  className,
  showNumbers = true,
  color = 'text-blue-600',
  warningThreshold = 5
}: TimerDisplayProps) {
  const percentage = (timeRemaining / totalTime) * 100;
  const isWarning = timeRemaining <= warningThreshold;
  
  return (
    <div className={cn("relative", className)}>
      <motion.div
        className={cn(
          "text-center font-bold",
          isWarning ? 'text-red-600' : color
        )}
        animate={{ scale: isWarning ? [1, 1.1, 1] : 1 }}
        transition={{ 
          repeat: isWarning ? Infinity : 0,
          duration: 0.5
        }}
      >
        {showNumbers && (
          <div className="text-2xl mb-2">
            {Math.ceil(timeRemaining)}s
          </div>
        )}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full transition-colors duration-300",
              isWarning ? 'bg-red-500' : 'bg-blue-500'
            )}
            initial={{ width: '100%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </motion.div>
    </div>
  );
}

interface WordFlashProps {
  word: string;
  isVisible: boolean;
  duration?: number;
  onComplete?: () => void;
}

export function WordFlash({ 
  word, 
  isVisible, 
  duration = 2000,
  onComplete 
}: WordFlashProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="text-white text-8xl font-bold"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={() => {
              setTimeout(() => {
                onComplete?.();
              }, duration);
            }}
          >
            {word}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}