import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Calculator, HelpCircle, RotateCcw, Puzzle, Layers, Target } from "lucide-react";
import { MainGame } from "@shared/schema";
import { MAIN_GAMES } from "@/lib/main-games";
import { getStoredProgress, resetProgress } from "@/lib/storage";

interface MainGameSelectionProps {
  onSelectGame: (game: MainGame) => void;
  onShowInstructions: () => void;
}

const iconMap = {
  'brain': Brain,
  'calculator': Calculator,
  'puzzle': Target,
  'layers': Layers,
};

const backgroundColorMap = {
  blue: 'bg-gradient-to-br from-blue-400 to-blue-600',
  red: 'bg-gradient-to-br from-red-400 to-red-600',
  green: 'bg-gradient-to-br from-green-400 to-green-600',
  purple: 'bg-gradient-to-br from-purple-400 to-purple-600',
};

export function MainGameSelection({ onSelectGame, onShowInstructions }: MainGameSelectionProps) {
  const progress = getStoredProgress();

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      resetProgress();
      window.location.reload();
    }
  };

  // Calculate best stats for each main game
  const getGameStats = (game: MainGame) => {
    const gameConfig = MAIN_GAMES[game];
    if (!gameConfig.modes) return { bestLevel: 0, bestScore: 0 };
    
    const bestLevel = Math.max(...gameConfig.modes.map(mode => progress.bestLevels[mode]));
    const bestScore = Math.max(...gameConfig.modes.map(mode => progress.bestScores[mode]));
    return { bestLevel, bestScore };
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Choose Your Training Game
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Select from our collection of cognitive assessment games. Each game tests different aspects of working memory and attention.
        </p>
      </div>

      {/* Main Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(MAIN_GAMES).map(([key, config]) => {
          const game = key as MainGame;
          const Icon = iconMap[config.icon as keyof typeof iconMap];
          const bgColorClass = backgroundColorMap[config.color as keyof typeof backgroundColorMap];
          const { bestLevel, bestScore } = getGameStats(game);
          
          return (
            <Card 
              key={game}
              className={`hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group relative overflow-hidden border-0 ${bgColorClass}`}
              onClick={() => onSelectGame(game)}
            >
              <CardContent className="p-8 h-full flex flex-col text-white">
                {/* Game Icon and Title */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="rounded-xl p-4 bg-white/20 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-12 w-12 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                    {config.title}
                  </h3>
                  <p className="text-sm text-white/80 mb-4">
                    {config.description}
                  </p>
                </div>
                
                {/* Stats */}
                <div className="mt-auto">
                  <div className="text-center">
                    <div className="text-sm text-white/70 mb-2">
                      Best Performance
                    </div>
                    <div className="text-lg font-bold text-white">
                      Level {bestLevel} • {bestScore.toLocaleString()} pts
                    </div>
                  </div>
                </div>
                
                {/* NEW badge for newest games */}
                {game === 'wisconsin-card-sorting-test' && (
                  <div className="absolute top-4 right-4 bg-white text-purple-500 text-xs px-2 py-1 rounded-full font-bold">
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
                {progress.overallStats.totalCorrect + progress.overallStats.totalIncorrect > 0 
                  ? Math.round((progress.overallStats.totalCorrect / (progress.overallStats.totalCorrect + progress.overallStats.totalIncorrect)) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {progress.overallStats.sessionsCompleted > 0 
                  ? Math.round(progress.overallStats.totalTime / progress.overallStats.sessionsCompleted / 1000)
                  : 0}s
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {Math.max(...Object.values(progress.bestLevels))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Best Level Reached</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex items-center justify-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onShowInstructions}>
          <HelpCircle className="h-4 w-4 mr-2" />
          Instructions
        </Button>
        <Button variant="outline" onClick={handleResetProgress}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Progress
        </Button>
      </div>
    </div>
  );
}