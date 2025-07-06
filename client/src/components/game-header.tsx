import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { getStoredProgress } from "@/lib/storage";

interface GameHeaderProps {
  onBackToMenu?: () => void;
  showBackButton?: boolean;
}

export function GameHeader({ onBackToMenu, showBackButton = false }: GameHeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const progress = getStoredProgress();
  const bestScore = Math.max(...Object.values(progress.bestScores));

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToMenu}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="bg-primary text-white rounded-lg p-3">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                BrainVault
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Cognitive Training Assessment
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Best Score</div>
              <div className="font-semibold text-lg text-primary">
                {bestScore.toLocaleString()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="rounded-lg p-2"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
