import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GameHeader } from "@/components/game-header";
import { MainGameSelection } from "@/components/main-game-selection";
import { WMSModeSelection } from "@/components/wms-mode-selection";
import { GameInterface } from "@/components/game-interface";
import { OperationSpanGame } from "@/components/operation-span-game";
import { WisconsinCardSortingTest } from "@/components/wisconsin-card-sorting-test";

import { InstructionsModal } from "@/components/instructions-modal";
import { GameMode, MainGame } from "@shared/schema";

export default function MemoryTraining() {
  const [currentGame, setCurrentGame] = useState<MainGame | null>(null);
  const [currentMode, setCurrentMode] = useState<GameMode | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSelectGame = (game: MainGame) => {
    setCurrentGame(game);
    if (game === 'operation-span-task') {
      setCurrentMode('operation-span');
    } else if (game === 'wisconsin-card-sorting-test') {
      setCurrentMode('wcst');
    }
  };

  const handleSelectMode = (mode: GameMode) => {
    setCurrentMode(mode);
  };

  const handleBackToGames = () => {
    console.log('Navigating back to games - clearing current game and mode');
    setCurrentGame(null);
    setCurrentMode(null);
    setShowInstructions(false);
  };

  const handleBackToModes = () => {
    setCurrentMode(null);
    setShowInstructions(false);
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <GameHeader 
        onBackToMenu={currentMode ? handleBackToModes : currentGame ? handleBackToGames : undefined}
        showBackButton={currentMode !== null || currentGame !== null}
      />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Debug info (can be removed in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 mb-2">
            Debug: currentGame={currentGame}, currentMode={currentMode}
          </div>
        )}
        
        {!currentGame && (
          <MainGameSelection 
            onSelectGame={handleSelectGame}
            onShowInstructions={handleShowInstructions}
          />
        )}
        
        {currentGame === 'wechsler-memory-scale' && !currentMode && (
          <WMSModeSelection 
            onSelectMode={handleSelectMode}
            onBackToGames={handleBackToGames}
          />
        )}
        
        {currentMode === 'operation-span' && (
          <OperationSpanGame 
            onBackToMenu={handleBackToGames}
          />
        )}
        
        {currentMode === 'wcst' && (
          <WisconsinCardSortingTest 
            onBackToMenu={handleBackToGames}
          />
        )}
        
        {currentMode && currentMode !== 'operation-span' && currentMode !== 'wcst' && (
          <GameInterface 
            mode={currentMode} 
            onBackToMenu={handleBackToModes}
          />
        )}
        
        {/* Fallback for edge cases - should not happen in normal operation */}
        {currentGame && !currentMode && currentGame !== 'wechsler-memory-scale' && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Something went wrong. Please go back to the main menu.</p>
            <Button onClick={handleBackToGames} variant="outline">
              Back to Menu
            </Button>
          </div>
        )}
      </main>

      <InstructionsModal 
        open={showInstructions}
        onClose={handleCloseInstructions}
      />
    </div>
  );
}
