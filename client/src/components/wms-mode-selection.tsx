import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Grid3X3, Grid2X2, ArrowLeftIcon } from "lucide-react";
import { GameMode } from "@shared/schema";
import { WMS_MODES } from "@/lib/main-games";
import { getStoredProgress } from "@/lib/storage";

interface WMSModeSelectionProps {
  onSelectMode: (mode: GameMode) => void;
  onBackToGames: () => void;
}

const iconMap = {
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'grid-3x3': Grid3X3,
  'grid-2x2': Grid2X2,
};

const colorMap = {
  blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-700',
  green: 'bg-gradient-to-br from-green-500 to-green-700',
  orange: 'bg-gradient-to-br from-orange-500 to-orange-700',
};

const backgroundColorMap = {
  blue: 'bg-gradient-to-br from-blue-400 to-blue-600',
  purple: 'bg-gradient-to-br from-purple-400 to-purple-600',
  green: 'bg-gradient-to-br from-green-400 to-green-600',
  orange: 'bg-gradient-to-br from-orange-400 to-orange-600',
};

export function WMSModeSelection({ onSelectMode, onBackToGames }: WMSModeSelectionProps) {
  const progress = getStoredProgress();

  return (
    <div className="space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center space-x-4 mb-8">
        <Button
          variant="outline"
          onClick={onBackToGames}
          className="flex items-center space-x-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Games</span>
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Wechsler Memory Scale
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a memory span training mode
          </p>
        </div>
      </div>

      {/* WMS Modes Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(WMS_MODES).map(([key, config]) => {
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
                {/* Mode Icon and Title */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className={`rounded-xl p-3 ${colorClass} mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-sm font-bold text-white mb-1 leading-tight">
                    {config.title.split(' - ')[0]}
                  </h3>
                  <p className="text-xs text-white/80 mb-2">
                    {config.title.split(' - ')[1]}
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Training Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            How Wechsler Memory Scale Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Digit Span</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Tests your ability to remember and repeat sequences of numbers.
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Forward: Repeat numbers in the same order</li>
                <li>• Backward: Repeat numbers in reverse order</li>
                <li>• 5 levels: 3-7 digits per sequence</li>
                <li>• 30 seconds to respond</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Spatial Span</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Tests your ability to remember and repeat sequences of letters.
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Forward: Type letters in the same order</li>
                <li>• Backward: Type letters in reverse order</li>
                <li>• 5 levels: 3-7 letters per sequence</li>
                <li>• 30 seconds to respond</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}