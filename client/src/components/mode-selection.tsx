import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ArrowLeft, 
  Grid3X3, 
  Grid2X2, 
  Calculator,
  HelpCircle, 
  RotateCcw 
} from "lucide-react";
import { MODES } from "@/lib/game-logic";
import { GameMode } from "@shared/schema";
import { 
  getStoredProgress, 
  resetProgress, 
  getOverallSuccessRate, 
  getAverageResponseTime, 
  getAverageSpanLength 
} from "@/lib/storage";

interface ModeSelectionProps {
  onSelectMode: (mode: GameMode) => void;
  onShowInstructions: () => void;
}

const iconMap = {
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'grid-3x3': Grid3X3,
  'grid-2x2': Grid2X2,
  'calculator': Calculator,
};

const colorMap = {
  blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-700',
  green: 'bg-gradient-to-br from-green-500 to-green-700',
  orange: 'bg-gradient-to-br from-orange-500 to-orange-700',
  red: 'bg-gradient-to-br from-red-500 to-red-700',
};

const backgroundColorMap = {
  blue: 'bg-gradient-to-br from-blue-400 to-blue-600',
  purple: 'bg-gradient-to-br from-purple-400 to-purple-600',
  green: 'bg-gradient-to-br from-green-400 to-green-600',
  orange: 'bg-gradient-to-br from-orange-400 to-orange-600',
  red: 'bg-gradient-to-br from-red-400 to-red-600',
};

export function ModeSelection({ onSelectMode, onShowInstructions }: ModeSelectionProps) {
  const progress = getStoredProgress();
  const successRate = getOverallSuccessRate();
  const avgResponseTime = getAverageResponseTime();
  const avgSpanLength = getAverageSpanLength();

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      resetProgress();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Memory Training Games
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose from our collection of cognitive assessment games. Each game tests different aspects of working memory and attention.
        </p>
      </div>

      {/* Square Widget Games Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Object.entries(MODES).map(([key, config]) => {
          const mode = key as GameMode;
          const Icon = iconMap[config.icon as keyof typeof iconMap];
          const colorClass = colorMap[config.color as keyof typeof colorMap];
          const bgColorClass = backgroundColorMap[config.color as keyof typeof backgroundColorMap];
          const bestLevel = progress.bestLevels[mode];
          const bestScore = progress.bestScores[mode];
          
          return (
            <Card 
              key={mode}
              className={`aspect-square hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group relative overflow-hidden border-0 ${bgColorClass}`}
              onClick={() => onSelectMode(mode)}
            >
              <CardContent className="p-4 h-full flex flex-col text-white">
                {/* Game Icon and Title */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className={`rounded-xl p-3 ${colorClass} mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-sm font-bold text-white mb-1 leading-tight">
                    {config.title.split(' - ')[0]}
                  </h3>
                  <p className="text-xs text-white/80 mb-2">
                    {config.title.includes(' - ') ? config.title.split(' - ')[1] : config.type === 'mixed' ? 'Dual Task' : config.reverse ? 'Reverse' : 'Forward'}
                  </p>
                </div>
                
                {/* Stats */}
                <div className="mt-auto">
                  <div className="text-center">
                    <div className="text-xs text-white/70">
                      Best: L{bestLevel} • {bestScore}pts
                    </div>
                  </div>
                </div>
                
                {/* NEW badge for new games */}
                {(mode === 'operation-span' || bestLevel === 0) && (
                  <div className="absolute top-2 right-2 bg-white text-red-500 text-xs px-2 py-1 rounded-full font-bold">
                    NEW
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats Summary */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Training Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {progress.totalSessions}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Sessions Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {successRate}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {avgResponseTime}s
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {avgSpanLength}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Avg Span Length</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onShowInstructions}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Instructions
          </Button>
          <Button variant="outline" onClick={handleResetProgress}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Progress
          </Button>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Based on Wechsler Memory Scale Assessment
        </div>
      </div>
    </div>
  );
}
