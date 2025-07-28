import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Eraser, Check } from "lucide-react";
import { AnimatedProgress, CircularProgress } from "@/components/ui/animated-progress";
import { AnimatedScore, LevelProgress } from "@/components/ui/animated-score";
import { SequenceDisplay, TimerDisplay } from "@/components/ui/game-animations";
import { motion, AnimatePresence } from "framer-motion";
import { GameMode, GameState, GamePhase } from "@shared/schema";
import { 
  MODES, 
  generateSequence, 
  getCorrectAnswer, 
  validateAnswer, 
  calculateScore,
  calculateAccuracy 
} from "@/lib/game-logic";
import { updateGameResult } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface GameInterfaceProps {
  mode: GameMode;
  onBackToMenu: () => void;
}

export function GameInterface({ mode, onBackToMenu }: GameInterfaceProps) {
  const { toast } = useToast();
  const config = MODES[mode];
  
  const [gameState, setGameState] = useState<GameState>({
    currentMode: mode,
    currentLevel: 1,
    currentScore: 0,
    currentSequence: [],
    userInput: '',
    gamePhase: 'display',
    timeRemaining: 30,
    stats: {
      correct: 0,
      incorrect: 0,
      totalTime: 0,
      attempts: 0
    }
  });

  const [displayTimer, setDisplayTimer] = useState<NodeJS.Timeout | null>(null);
  const [gameTimer, setGameTimer] = useState<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [previousScore, setPreviousScore] = useState(0);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (displayTimer) clearTimeout(displayTimer);
      if (gameTimer) clearInterval(gameTimer);
    };
  }, [displayTimer, gameTimer]);

  const startLevel = useCallback(() => {
    // Convert level (1-5) to sequence length (3-7)
    const sequenceLength = gameState.currentLevel + 2;
    const sequence = generateSequence(mode, sequenceLength);
    setGameState(prev => ({
      ...prev,
      currentSequence: sequence,
      userInput: '',
      gamePhase: 'display',
      timeRemaining: 30
    }));

    // Show sequence for 3 seconds
    const timer = setTimeout(() => {
      setGameState(prev => ({ ...prev, gamePhase: 'input' }));
      setStartTime(Date.now());
      startGameTimer();
    }, 3000);
    setDisplayTimer(timer);
  }, [mode, gameState.currentLevel]);

  const startGameTimer = () => {
    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeRemaining <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
    setGameTimer(timer);
  };

  const handleTimeUp = () => {
    const responseTime = Date.now() - startTime;
    const correctAnswer = getCorrectAnswer(gameState.currentSequence, config.reverse);
    showFeedback(false, gameState.userInput, correctAnswer, responseTime);
  };

  const submitAnswer = () => {
    if (gameTimer) clearInterval(gameTimer);
    
    const responseTime = Date.now() - startTime;
    const correctAnswer = getCorrectAnswer(gameState.currentSequence, config.reverse);
    const isCorrect = validateAnswer(gameState.userInput, correctAnswer);
    
    showFeedback(isCorrect, gameState.userInput, correctAnswer, responseTime);
  };

  const showFeedback = (isCorrect: boolean, userAnswer: string, correctAnswer: string, responseTime: number) => {
    setGameState(prev => {
      const newStats = {
        ...prev.stats,
        correct: prev.stats.correct + (isCorrect ? 1 : 0),
        incorrect: prev.stats.incorrect + (isCorrect ? 0 : 1),
        totalTime: prev.stats.totalTime + responseTime,
        attempts: prev.stats.attempts + 1
      };

      let newScore = prev.currentScore;
      if (isCorrect) {
        setPreviousScore(prev.currentScore);
        newScore += calculateScore(prev.currentLevel, prev.timeRemaining);
      }

      return {
        ...prev,
        gamePhase: 'feedback',
        currentScore: newScore,
        stats: newStats
      };
    });

    if (isCorrect) {
      toast({
        title: "Correct!",
        description: "Great job! Moving to the next level.",
      });
    } else {
      toast({
        title: "Not quite right",
        description: `The correct answer was: ${correctAnswer}`,
        variant: "destructive",
      });
    }
  };

  const continueGame = () => {
    const wasCorrect = gameState.stats.correct > gameState.stats.incorrect;
    
    if (wasCorrect && gameState.currentLevel < 5) {
      setGameState(prev => ({ ...prev, currentLevel: prev.currentLevel + 1 }));
    }

    // If reached max level or failed too many times, end the session
    if (gameState.currentLevel >= 5 || gameState.stats.incorrect >= 3) {
      // Save results and return to menu
      updateGameResult(
        mode,
        gameState.currentLevel,
        gameState.currentScore,
        gameState.stats.correct,
        gameState.stats.incorrect,
        gameState.stats.totalTime
      );
      
      toast({
        title: "Session Complete!",
        description: `Final score: ${gameState.currentScore}`,
      });
      
      // Add a small delay to ensure the toast shows before navigation
      setTimeout(() => {
        onBackToMenu();
      }, 2000);
      return;
    }

    startLevel();
  };

  const clearInput = () => {
    setGameState(prev => ({ ...prev, userInput: '' }));
  };

  const handleInputChange = (value: string) => {
    // Filter input based on mode type and clean it
    let filteredValue = value.trim();
    
    if (config.type === 'digit') {
      // Remove all non-digits and spaces, handle common substitutions
      filteredValue = value
        .replace(/[Oo]/g, '0')  // Convert O to 0
        .replace(/[Il]/g, '1')  // Convert I/l to 1
        .replace(/[^0-9]/g, ''); // Remove non-digits
    } else {
      // Remove spaces and non-letters, convert to uppercase
      filteredValue = value
        .replace(/[^A-Za-z]/g, '')
        .toUpperCase();
    }
    
    // Limit length to reasonable maximum
    if (filteredValue.length <= 7) {
      setGameState(prev => ({ ...prev, userInput: filteredValue }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gameState.gamePhase === 'input') {
      submitAnswer();
    }
  };

  // Start first level on mount
  useEffect(() => {
    startLevel();
  }, [startLevel]);

  const progressPercentage = ((gameState.currentLevel - 1) / (5 - 1)) * 100;
  const timerProgress = (gameState.timeRemaining / 30) * 100;

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {config.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {config.description}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <AnimatedScore 
                value={gameState.currentLevel} 
                label="Level" 
                color="text-primary"
                size="md"
              />
              <AnimatedScore 
                value={gameState.currentScore} 
                previousValue={previousScore}
                label="Score" 
                color="text-green-600"
                size="md"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <LevelProgress 
              currentLevel={gameState.currentLevel} 
              maxLevel={5} 
              className="mb-2"
            />
            <AnimatedProgress 
              value={progressPercentage} 
              color="bg-gradient-to-r from-blue-500 to-purple-500"
              height="h-2"
              animated={true}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Level 1</span>
            <span>Level 5</span>
          </div>
        </CardContent>
      </Card>

      {/* Game Display Area */}
      <Card>
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {gameState.gamePhase === 'display' && (
              <motion.div
                key="display-phase"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <motion.div 
                  className="mb-6"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Remember this sequence
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Pay attention - it will disappear soon
                  </div>
                </motion.div>
                
                <SequenceDisplay
                  sequence={gameState.currentSequence}
                  currentIndex={gameState.currentSequence.length - 1}
                  isVisible={true}
                />

                <motion.div 
                  className="text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-gray-500 dark:text-gray-400">Memorize the sequence above</div>
                </motion.div>
              </motion.div>
            )}
            {gameState.gamePhase === 'input' && (
              <motion.div
                key="input-phase"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <motion.div 
                  className="mb-6"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Enter the sequence
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {config.reverse 
                      ? `Type the ${config.type}s in reverse order` 
                      : `Type the ${config.type}s in the same order`}
                  </div>
                </motion.div>

                {/* Animated Timer */}
                <motion.div 
                  className="flex justify-center mb-8"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <CircularProgress
                    value={gameState.timeRemaining}
                    max={30}
                    size={96}
                    strokeWidth={8}
                    color={gameState.timeRemaining <= 5 ? "#ef4444" : "#3b82f6"}
                    showValue={true}
                    animated={true}
                  />
                </motion.div>

                <motion.div 
                  className="max-w-md mx-auto mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Input
                    type="text"
                    value={gameState.userInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="text-center text-2xl font-mono py-3"
                    placeholder="Enter sequence..."
                    autoFocus
                  />
                </motion.div>

                <motion.div 
                  className="flex justify-center space-x-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button variant="outline" onClick={clearInput}>
                    <Eraser className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button 
                    onClick={submitAnswer}
                    disabled={gameState.userInput.length === 0}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Submit
                  </Button>
                </motion.div>

                <motion.div 
                  className="mt-4 text-xs text-gray-400 dark:text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Press Enter to submit or use the button above
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {gameState.gamePhase === 'feedback' && (
            <div className="text-center">
              {gameState.stats.correct > gameState.stats.incorrect ? (
                <div>
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-600 mb-2">Correct!</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Great job! Moving to the next level.
                    </p>
                  </div>
                  
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 max-w-lg mx-auto mb-6">
                    <CardContent className="p-4">
                      <div className="text-green-700 dark:text-green-300 font-semibold mb-2">
                        +{calculateScore(gameState.currentLevel, gameState.timeRemaining)} Points
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400 mb-3">Level completed</div>
                      
                      {/* Show correct answer confirmation */}
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Correct sequence:
                      </div>
                      <div className="flex justify-center space-x-2 mb-2">
                        {getCorrectAnswer(gameState.currentSequence, config.reverse).split('').map((char, index) => (
                          <span 
                            key={index}
                            className="bg-green-100 dark:bg-green-800/20 text-green-700 dark:text-green-300 px-2 py-1 rounded font-mono text-sm"
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Your answer: {gameState.userInput}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-600 mb-2">Not Quite</h3>
                    <p className="text-gray-600 dark:text-gray-400">Let's try this level again.</p>
                  </div>

                  <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 max-w-lg mx-auto mb-6">
                    <CardContent className="p-4">
                      <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                        Correct sequence was:
                      </div>
                      <div className="flex justify-center space-x-2 mb-2">
                        {getCorrectAnswer(gameState.currentSequence, config.reverse).split('').map((char, index) => (
                          <span 
                            key={index}
                            className="bg-red-100 dark:bg-red-800/20 text-red-700 dark:text-red-300 px-3 py-1 rounded font-mono"
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-red-500 dark:text-red-400">
                        Your answer: {gameState.userInput || '(no answer)'}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={onBackToMenu}>
                  Exit Training
                </Button>
                <Button onClick={continueGame}>
                  Continue
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {gameState.stats.correct}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Correct</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {gameState.stats.incorrect}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Incorrect</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {gameState.stats.attempts > 0 
                ? `${(gameState.stats.totalTime / gameState.stats.attempts / 1000).toFixed(1)}s`
                : '0s'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Time</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              {calculateAccuracy(gameState.stats.correct, gameState.stats.attempts)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Accuracy</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
