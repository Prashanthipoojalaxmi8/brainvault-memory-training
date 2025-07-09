import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Calculator, Eye } from "lucide-react";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { AnimatedScore, LevelProgress } from "@/components/ui/animated-score";
import { GameTransition, WordFlash } from "@/components/ui/game-animations";
import { motion, AnimatePresence } from "framer-motion";
import { OperationSpanState } from "@shared/schema";
import { 
  generateMathQuestion, 
  getRandomWord, 
  validateMathAnswer, 
  validateWordRecall 
} from "@/lib/game-logic";
import { updateGameResult } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface OperationSpanGameProps {
  onBackToMenu: () => void;
}

export function OperationSpanGame({ onBackToMenu }: OperationSpanGameProps) {
  const { toast } = useToast();
  
  // Get total pairs based on level (this is how many words user needs to remember)
  const getTotalPairs = (level: number) => {
    switch (level) {
      case 1: return 3;
      case 2: return 4;
      case 3: return 5;
      default: return 3;
    }
  };

  const [gameState, setGameState] = useState<OperationSpanState>({
    currentLevel: 1,
    currentScore: 0,
    currentPair: 1,
    totalPairs: getTotalPairs(1),
    currentMathQuestion: '',
    currentMathAnswer: 0,
    currentWord: '',
    rememberedWords: [],
    userMathInput: '',
    userRecallInput: '',
    gamePhase: 'math',
    stats: {
      mathCorrect: 0,
      mathIncorrect: 0,
      wordsCorrect: 0,
      totalTime: 0,
      attempts: 0
    }
  });

  const [currentMathData, setCurrentMathData] = useState<{question: string, answer: number} | null>(null);
  const [currentWordData, setCurrentWordData] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionData, setTransitionData] = useState<{title: string, description?: string, type: 'success' | 'error' | 'info'}>({title: '', type: 'info'});
  const [showWordFlash, setShowWordFlash] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);

  // Initialize first math question when component mounts
  useEffect(() => {
    if (!isInitialized) {
      const mathData = generateMathQuestion(gameState.currentLevel);
      setCurrentMathData(mathData);
      setGameState(prev => ({
        ...prev,
        currentMathQuestion: mathData.question,
        currentMathAnswer: mathData.answer,
        userMathInput: '',
        gamePhase: 'math'
      }));
      setIsInitialized(true);
    }
  }, [isInitialized, gameState.currentLevel]);

  const handleMathSubmit = () => {
    if (!currentMathData) return;
    
    const isCorrect = validateMathAnswer(gameState.userMathInput, currentMathData.answer);
    
    console.log('DEBUG Math:', {
      userInput: gameState.userMathInput,
      correctAnswer: currentMathData.answer,
      question: currentMathData.question,
      isCorrect
    });
    
    // Update stats
    setGameState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        mathCorrect: prev.stats.mathCorrect + (isCorrect ? 1 : 0),
        mathIncorrect: prev.stats.mathIncorrect + (isCorrect ? 0 : 1)
      }
    }));

    if (!isCorrect) {
      toast({
        title: "Math Incorrect",
        description: `The correct answer was ${currentMathData.answer}`,
        variant: "destructive",
      });
    } else {
      console.log('DEBUG Math Correct - no toast shown');
    }

    // Generate word and move to word phase
    const word = getRandomWord();
    setCurrentWordData(word);
    setGameState(prev => ({
      ...prev,
      currentWord: word,
      gamePhase: 'word'
    }));
    
    // Show word flash animation
    setShowWordFlash(true);
  };

  const handleWordRemember = () => {
    const newRememberedWords = [...gameState.rememberedWords, currentWordData];
    
    // Check if we've collected enough words
    if (newRememberedWords.length >= gameState.totalPairs) {
      // Move to recall phase
      setGameState(prev => ({
        ...prev,
        rememberedWords: newRememberedWords,
        gamePhase: 'recall',
        userRecallInput: ''
      }));
    } else {
      // Generate next math question for next pair
      const mathData = generateMathQuestion(gameState.currentLevel);
      setCurrentMathData(mathData);
      
      setGameState(prev => ({
        ...prev,
        rememberedWords: newRememberedWords,
        currentPair: prev.currentPair + 1,
        currentMathQuestion: mathData.question,
        currentMathAnswer: mathData.answer,
        userMathInput: '',
        gamePhase: 'math'
      }));
    }
  };

  const handleRecallSubmit = () => {
    const userWords = gameState.userRecallInput
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0);
    
    const correctWords = gameState.rememberedWords;
    const wordsCorrect = validateWordRecall(userWords, correctWords);
    const isLevelComplete = wordsCorrect === gameState.totalPairs;
    
    console.log('DEBUG Recall:', {
      userWords,
      correctWords,
      wordsCorrect,
      totalPairs: gameState.totalPairs,
      isLevelComplete
    });
    
    // Update stats first
    setGameState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        wordsCorrect: prev.stats.wordsCorrect + wordsCorrect,
        attempts: prev.stats.attempts + 1
      }
    }));

    if (isLevelComplete) {
      const newLevel = gameState.currentLevel + 1;
      const newScore = gameState.currentScore + (wordsCorrect * 10);
      setPreviousScore(gameState.currentScore);
      
      console.log('DEBUG Level Complete:', { newLevel, newScore, wordsCorrect });
      
      // Show success transition
      setTransitionData({
        title: "Level Complete!",
        description: `You remembered all ${gameState.totalPairs} words correctly!`,
        type: 'success'
      });
      setShowTransition(true);
      
      // Use longer delay to show success message
      setTimeout(() => {
        setShowTransition(false);
        
        if (newLevel <= 3) {
          // Move to next level
          const nextLevelPairs = getTotalPairs(newLevel);
          const mathData = generateMathQuestion(newLevel);
          setCurrentMathData(mathData);
          
          setGameState(prev => ({
            ...prev,
            currentLevel: newLevel,
            currentScore: newScore,
            totalPairs: nextLevelPairs,
            currentPair: 1,
            rememberedWords: [],
            currentMathQuestion: mathData.question,
            currentMathAnswer: mathData.answer,
            userMathInput: '',
            userRecallInput: '',
            gamePhase: 'math'
          }));
        } else {
          // Game complete
          console.log('DEBUG Game Complete - updating result:', {
            mode: 'operation-span',
            level: newLevel,
            score: newScore,
            mathCorrect: gameState.stats.mathCorrect,
            mathIncorrect: gameState.stats.mathIncorrect,
            wordsCorrect: gameState.stats.wordsCorrect
          });
          updateGameResult(
            'operation-span', 
            newLevel, 
            newScore, 
            gameState.stats.wordsCorrect, 
            gameState.stats.mathIncorrect, 
            gameState.stats.totalTime
          );
          setGameState(prev => ({
            ...prev,
            currentScore: newScore,
            gamePhase: 'feedback'
          }));
        }
      }, 3000); // Longer delay for better UX
    } else {
      console.log('DEBUG Level Failed:', { wordsCorrect, totalPairs: gameState.totalPairs });
      
      // Level failed
      setTransitionData({
        title: "Level Failed",
        description: `You got ${wordsCorrect} out of ${gameState.totalPairs} words correct. Try again!`,
        type: 'error'
      });
      setShowTransition(true);
      
      setTimeout(() => {
        setShowTransition(false);
        console.log('DEBUG Level Failed - updating result:', {
          mode: 'operation-span',
          level: gameState.currentLevel,
          score: gameState.currentScore,
          mathCorrect: gameState.stats.mathCorrect,
          mathIncorrect: gameState.stats.mathIncorrect,
          wordsCorrect: gameState.stats.wordsCorrect
        });
        updateGameResult(
          'operation-span', 
          gameState.currentLevel, 
          gameState.currentScore, 
          gameState.stats.wordsCorrect, 
          gameState.stats.mathIncorrect, 
          gameState.stats.totalTime
        );
        setGameState(prev => ({
          ...prev,
          gamePhase: 'feedback'
        }));
      }, 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const resetGame = () => {
    const mathData = generateMathQuestion(1);
    setCurrentMathData(mathData);
    setCurrentWordData('');
    
    setGameState({
      currentLevel: 1,
      currentScore: 0,
      currentPair: 1,
      totalPairs: getTotalPairs(1),
      currentMathQuestion: mathData.question,
      currentMathAnswer: mathData.answer,
      currentWord: '',
      rememberedWords: [],
      userMathInput: '',
      userRecallInput: '',
      gamePhase: 'math',
      stats: {
        mathCorrect: 0,
        mathIncorrect: 0,
        wordsCorrect: 0,
        totalTime: 0,
        attempts: 0
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="text-purple-600" size={24} />
                <h1 className="text-2xl font-bold text-purple-800">Operation Span Task</h1>
              </div>
              <Button onClick={onBackToMenu} variant="outline">
                Back to Menu
              </Button>
            </div>
            
            <div className="flex gap-6 mb-6">
              <AnimatedScore 
                value={gameState.currentLevel} 
                label="Level" 
                color="text-purple-600"
                size="md"
              />
              <AnimatedScore 
                value={gameState.currentScore} 
                previousValue={previousScore}
                label="Score" 
                color="text-blue-600"
                size="md"
              />
              <AnimatedScore 
                value={gameState.currentPair} 
                label="Pair" 
                color="text-green-600"
                size="md"
              />
              <AnimatedScore 
                value={gameState.totalPairs} 
                label="Total" 
                color="text-orange-600"
                size="md"
              />
            </div>
            
            <div className="mb-4">
              <LevelProgress 
                currentLevel={gameState.currentLevel} 
                maxLevel={3} 
                className="mb-2"
              />
              <AnimatedProgress 
                value={gameState.rememberedWords.length} 
                max={gameState.totalPairs}
                color="bg-gradient-to-r from-blue-500 to-purple-500"
                height="h-3"
                showValue={true}
              />
            </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {gameState.gamePhase === 'math' && (
            <motion.div
              key="math-phase"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <motion.div 
                    className="text-center mb-6"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Calculator className="mx-auto text-purple-600 mb-4" size={48} />
                    </motion.div>
                    <h2 className="text-xl font-bold mb-2">Solve the Math Problem</h2>
                    <p className="text-gray-600">Enter the answer to continue</p>
                  </motion.div>
                  
                  <motion.div 
                    className="text-center mb-6"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div 
                      className="text-3xl font-bold text-purple-800 mb-4"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {gameState.currentMathQuestion}
                    </motion.div>
                    <Input
                      type="number"
                      value={gameState.userMathInput}
                      onChange={(e) => setGameState(prev => ({ ...prev, userMathInput: e.target.value }))}
                      onKeyPress={(e) => handleKeyPress(e, handleMathSubmit)}
                      placeholder="Enter answer"
                      className="text-center text-xl max-w-xs mx-auto"
                    />
                  </motion.div>
                  
                  <motion.div 
                    className="flex justify-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button 
                      onClick={handleMathSubmit}
                      disabled={!gameState.userMathInput}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Submit Answer
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

          {gameState.gamePhase === 'word' && (
            <motion.div
              key="word-phase"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <motion.div 
                    className="text-center mb-6"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Eye className="mx-auto text-green-600 mb-4" size={48} />
                    </motion.div>
                    <h2 className="text-xl font-bold mb-2">Remember This Word</h2>
                    <p className="text-gray-600">Remember this word for later recall</p>
                  </motion.div>
                  
                  <motion.div 
                    className="text-center mb-6"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <motion.div 
                      className="text-4xl font-bold text-green-800 mb-4"
                      animate={{ 
                        textShadow: ["0 0 0px #22c55e", "0 0 20px #22c55e", "0 0 0px #22c55e"],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {gameState.currentWord}
                    </motion.div>
                    <p className="text-gray-600">
                      Word {gameState.currentPair} of {gameState.totalPairs}
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    className="flex justify-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button 
                      onClick={handleWordRemember}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Remember & Continue
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

        {gameState.gamePhase === 'recall' && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-2">Recall All Words</h2>
                <p className="text-gray-600 mb-2">
                  Enter all {gameState.totalPairs} words you remember, separated by commas
                </p>
                <p className="text-sm text-gray-500">
                  Remember the words in the order they appeared
                </p>
              </div>
              
              <div className="text-center mb-6">
                <Input
                  value={gameState.userRecallInput}
                  onChange={(e) => setGameState(prev => ({ ...prev, userRecallInput: e.target.value }))}
                  onKeyPress={(e) => handleKeyPress(e, handleRecallSubmit)}
                  placeholder="Apple, Chair, Tree..."
                  className="text-center text-lg max-w-md mx-auto"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Tip: Enter words in the same order they appeared
                </p>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleRecallSubmit}
                  disabled={!gameState.userRecallInput}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Submit Recall
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {gameState.gamePhase === 'feedback' && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
                <h2 className="text-xl font-bold mb-2">Game Complete!</h2>
                <p className="text-gray-600">Final Score: {gameState.currentScore}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {gameState.stats.mathCorrect}
                  </div>
                  <div className="text-sm text-gray-600">Math Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {gameState.stats.wordsCorrect}
                  </div>
                  <div className="text-sm text-gray-600">Words Correct</div>
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button onClick={resetGame} className="bg-purple-600 hover:bg-purple-700">
                  Play Again
                </Button>
                <Button onClick={onBackToMenu} variant="outline">
                  Back to Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Game Transition Animations */}
        <GameTransition
          isVisible={showTransition}
          title={transitionData.title}
          description={transitionData.description}
          type={transitionData.type}
          onComplete={() => setShowTransition(false)}
        />
        
        {/* Word Flash Animation */}
        <WordFlash
          word={gameState.currentWord}
          isVisible={showWordFlash}
          duration={1500}
          onComplete={() => setShowWordFlash(false)}
        />
      </div>
    </div>
  );
}