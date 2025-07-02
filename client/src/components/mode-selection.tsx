import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ArrowLeft, 
  Grid3X3, 
  Grid2X2, 
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
};

const colorMap = {
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
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
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Choose Training Mode
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Select a cognitive assessment mode to begin training. Each mode tests different aspects of working memory and attention.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(MODES).map(([key, config]) => {
          const mode = key as GameMode;
          const Icon = iconMap[config.icon as keyof typeof iconMap];
          const colorClass = colorMap[config.color as keyof typeof colorMap];
          const bestLevel = progress.bestLevels[mode];
          
          return (
            <Card 
              key={mode}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => onSelectMode(mode)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`rounded-lg p-3 flex-shrink-0 ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary transition-colors">
                      {config.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {config.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Grid3X3 className="h-3 w-3 mr-1" />
                        Levels: 3-7 {config.type === 'digit' ? 'digits' : 'letters'}
                      </span>
                      <span className="flex items-center">
                        ⏱️ 30s per task
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Personal Best</span>
                    <span className="font-semibold text-primary">
                      {bestLevel > 0 ? `Level ${bestLevel}` : 'Not attempted'}
                    </span>
                  </div>
                </div>
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
