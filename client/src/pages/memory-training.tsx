import { useState } from "react";
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
    setCurrentGame(null);
    setCurrentMode(null);
  };

  const handleBackToModes = () => {
    setCurrentMode(null);
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
      </main>

      <InstructionsModal 
        open={showInstructions}
        onClose={handleCloseInstructions}
      />
    </div>
  );
}
