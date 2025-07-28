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
    },
    mistakes: {
      mathErrors: [],
      wordErrors: []
    }
  });

  // Store operation-word pairs for the recall phase
  const [operationWordPairs, setOperationWordPairs] = useState<{operation: string, word: string, answer: number}[]>([]);
  const [shuffledRecallOperations, setShuffledRecallOperations] = useState<{operation: string, word: string, answer: number}[]>([]);
  const [currentRecallIndex, setCurrentRecallIndex] = useState(0);

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
    
    // Update stats and track mistakes
    setGameState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        mathCorrect: prev.stats.mathCorrect + (isCorrect ? 1 : 0),
        mathIncorrect: prev.stats.mathIncorrect + (isCorrect ? 0 : 1)
      },
      mistakes: {
        ...prev.mistakes,
        mathErrors: isCorrect ? prev.mistakes.mathErrors : [
          ...prev.mistakes.mathErrors,
          {
            level: prev.currentLevel,
            question: currentMathData.question,
            userAnswer: prev.userMathInput,
            correctAnswer: currentMathData.answer
          }
        ]
      }
    }));

    // Show immediate feedback for math answer
    if (isCorrect) {
      setTransitionData({
        title: "Correct!",
        description: "Well done! Now remember this word:",
        type: 'success'
      });
    } else {
      setTransitionData({
        title: "Incorrect",
        description: `Wrong answer. The correct answer was ${currentMathData.answer}. Now remember this word:`,
        type: 'error'
      });
    }
    
    setShowTransition(true);
    
    // Generate word and store the operation-word pair
    const word = getRandomWord();
    setCurrentWordData(word);
    
    // Store the operation-word pair
    setOperationWordPairs(prev => [
      ...prev,
      {
        operation: currentMathData.question,
        word: word,
        answer: currentMathData.answer
      }
    ]);
    
    setTimeout(() => {
      setShowTransition(false);
      setGameState(prev => ({
        ...prev,
        currentWord: word,
        gamePhase: 'word'
      }));
      
      // Show word flash animation
      setShowWordFlash(true);
    }, 1500); // Show feedback for 1.5 seconds
  };

  const handleWordRemember = () => {
    const newRememberedWords = [...gameState.rememberedWords, currentWordData];
    
    // Check if we've collected enough words
    if (newRememberedWords.length >= gameState.totalPairs) {
      // Shuffle the operations for recall phase to make it more challenging
      const shuffled = [...operationWordPairs].sort(() => Math.random() - 0.5);
      setShuffledRecallOperations(shuffled);
      setCurrentRecallIndex(0);
      
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
    const currentOperation = shuffledRecallOperations[currentRecallIndex];
    const userAnswer = gameState.userRecallInput.trim().toLowerCase();
    const correctAnswer = currentOperation.word.toLowerCase();
    const isCorrect = userAnswer === correctAnswer;
    
    console.log('DEBUG Single Operation Recall:', {
      operation: currentOperation.operation,
      userAnswer,
      correctAnswer: currentOperation.word,
      isCorrect
    });
    
    // Update stats
    setGameState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        wordsCorrect: prev.stats.wordsCorrect + (isCorrect ? 1 : 0),
        attempts: prev.stats.attempts + 1
      },
      mistakes: {
        ...prev.mistakes,
        wordErrors: isCorrect ? prev.mistakes.wordErrors : [
          ...prev.mistakes.wordErrors,
          {
            level: prev.currentLevel,
            userWords: [userAnswer],
            correctWords: [currentOperation.word],
            correctCount: 0,
            operation: currentOperation.operation
          }
        ]
      }
    }));

    // Check if this was the last operation
    if (currentRecallIndex + 1 >= shuffledRecallOperations.length) {
      // Calculate total correct answers for this level
      const totalCorrect = gameState.stats.wordsCorrect + (isCorrect ? 1 : 0);
      const isLevelComplete = totalCorrect === gameState.totalPairs;
      
      if (isLevelComplete) {
        const newLevel = gameState.currentLevel + 1;
        const newScore = gameState.currentScore + (totalCorrect * 10);
        setPreviousScore(gameState.currentScore);
        
        setTransitionData({
          title: "Level Complete!",
          description: `Perfect! You matched all ${gameState.totalPairs} operations with their words!`,
          type: 'success'
        });
        setShowTransition(true);
        
        setTimeout(() => {
          setShowTransition(false);
          
          if (newLevel <= 3) {
            // Reset for next level
            setOperationWordPairs([]);
            setShuffledRecallOperations([]);
            setCurrentRecallIndex(0);
            
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
              gamePhase: 'math',
              stats: {
                mathCorrect: 0,
                mathIncorrect: 0,
                wordsCorrect: 0,
                totalTime: 0,
                attempts: 0
              }
            }));
          } else {
            // Game complete
            updateGameResult(
              'operation-span', 
              newLevel, 
              newScore, 
              totalCorrect, 
              gameState.stats.mathIncorrect, 
              gameState.stats.totalTime
            );
            setGameState(prev => ({
              ...prev,
              currentScore: newScore,
              gamePhase: 'feedback'
            }));
          }
        }, 3000);
      } else {
        // Level failed
        setTransitionData({
          title: "Level Failed",
          description: `You got ${totalCorrect} out of ${gameState.totalPairs} operations correct. Try again!`,
          type: 'error'
        });
        setShowTransition(true);
        
        setTimeout(() => {
          setShowTransition(false);
          updateGameResult(
            'operation-span', 
            gameState.currentLevel, 
            gameState.currentScore, 
            totalCorrect, 
            gameState.stats.mathIncorrect, 
            gameState.stats.totalTime
          );
          setGameState(prev => ({
            ...prev,
            gamePhase: 'feedback'
          }));
        }, 3000);
      }
    } else {
      // Move to next operation
      setCurrentRecallIndex(prev => prev + 1);
      setGameState(prev => ({
        ...prev,
        userRecallInput: ''
      }));
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
    setOperationWordPairs([]);
    setShuffledRecallOperations([]);
    setCurrentRecallIndex(0);
    
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
      },
      mistakes: {
        mathErrors: [],
        wordErrors: []
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

        {gameState.gamePhase === 'recall' && shuffledRecallOperations.length > 0 && (
          <motion.div
            key="recall-phase"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Calculator className="mx-auto text-blue-600 mb-4" size={48} />
                  <h2 className="text-xl font-bold mb-2">Operation Recall Challenge</h2>
                  <p className="text-gray-600 mb-2">
                    What word was associated with this operation?
                  </p>
                  <p className="text-sm text-gray-500">
                    Question {currentRecallIndex + 1} of {shuffledRecallOperations.length}
                  </p>
                </div>
                
                <div className="text-center mb-6">
                  <motion.div 
                    className="text-4xl font-bold text-blue-800 mb-6 p-4 bg-blue-50 rounded-lg inline-block"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {shuffledRecallOperations[currentRecallIndex]?.operation} = ?
                  </motion.div>
                  
                  <p className="text-lg text-gray-700 mb-4">
                    Instead of the number, enter the word that was shown with this operation:
                  </p>
                  
                  <Input
                    value={gameState.userRecallInput}
                    onChange={(e) => setGameState(prev => ({ ...prev, userRecallInput: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, handleRecallSubmit)}
                    placeholder="Enter the word..."
                    className="text-center text-xl max-w-xs mx-auto"
                  />
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    onClick={handleRecallSubmit}
                    disabled={!gameState.userRecallInput}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Submit Word
                  </Button>
                </div>
                
                <div className="mt-4 text-center">
                  <AnimatedProgress 
                    value={currentRecallIndex} 
                    max={shuffledRecallOperations.length}
                    color="bg-gradient-to-r from-blue-500 to-purple-500"
                    height="h-2"
                    showValue={false}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Progress: {currentRecallIndex} / {shuffledRecallOperations.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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

              {/* Mistake Summary */}
              {(gameState.mistakes.mathErrors.length > 0 || gameState.mistakes.wordErrors.length > 0) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-center">Mistake Summary</h3>
                  
                  {gameState.mistakes.mathErrors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-red-600 mb-2">Math Errors:</h4>
                      <div className="space-y-2">
                        {gameState.mistakes.mathErrors.map((error, index) => (
                          <div key={index} className="bg-red-50 p-3 rounded text-sm">
                            <div className="font-medium">Level {error.level}: {error.question}</div>
                            <div className="text-red-700">
                              Your answer: {error.userAnswer} | Correct answer: {error.correctAnswer}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {gameState.mistakes.wordErrors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-orange-600 mb-2">Word Recall Errors:</h4>
                      <div className="space-y-2">
                        {gameState.mistakes.wordErrors.map((error, index) => (
                          <div key={index} className="bg-orange-50 p-3 rounded text-sm">
                            <div className="font-medium">
                              Level {error.level}: {error.operation ? `Operation: ${error.operation}` : `${error.correctCount}/${error.correctWords.length} correct`}
                            </div>
                            <div className="text-orange-700">
                              Your answer: {error.userWords.join(', ')}
                            </div>
                            <div className="text-orange-700">
                              Correct answer: {error.correctWords.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
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