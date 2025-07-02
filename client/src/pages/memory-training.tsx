import { useState } from "react";
import { GameHeader } from "@/components/game-header";
import { ModeSelection } from "@/components/mode-selection";
import { GameInterface } from "@/components/game-interface";
import { InstructionsModal } from "@/components/instructions-modal";
import { GameMode } from "@shared/schema";

export default function MemoryTraining() {
  const [currentMode, setCurrentMode] = useState<GameMode | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSelectMode = (mode: GameMode) => {
    setCurrentMode(mode);
  };

  const handleBackToMenu = () => {
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
        onBackToMenu={handleBackToMenu}
        showBackButton={currentMode !== null}
      />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {currentMode ? (
          <GameInterface 
            mode={currentMode} 
            onBackToMenu={handleBackToMenu}
          />
        ) : (
          <ModeSelection 
            onSelectMode={handleSelectMode}
            onShowInstructions={handleShowInstructions}
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
