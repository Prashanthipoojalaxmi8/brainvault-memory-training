import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Eraser, Check } from "lucide-react";
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
    currentLevel: 3,
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

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (displayTimer) clearTimeout(displayTimer);
      if (gameTimer) clearInterval(gameTimer);
    };
  }, [displayTimer, gameTimer]);

  const startLevel = useCallback(() => {
    const sequence = generateSequence(mode, gameState.currentLevel);
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
    
    if (wasCorrect && gameState.currentLevel < 7) {
      setGameState(prev => ({ ...prev, currentLevel: prev.currentLevel + 1 }));
    }

    // If reached max level or failed too many times, end the session
    if (gameState.currentLevel >= 7 || gameState.stats.incorrect >= 3) {
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
      
      onBackToMenu();
      return;
    }

    startLevel();
  };

  const clearInput = () => {
    setGameState(prev => ({ ...prev, userInput: '' }));
  };

  const handleInputChange = (value: string) => {
    // Filter input based on mode type
    let filteredValue = value;
    if (config.type === 'digit') {
      filteredValue = value.replace(/[^0-9]/g, '');
    } else {
      filteredValue = value.replace(/[^A-Za-z]/g, '').toUpperCase();
    }
    
    setGameState(prev => ({ ...prev, userInput: filteredValue }));
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

  const progressPercentage = ((gameState.currentLevel - 3) / (7 - 3)) * 100;
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
              <div className="text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Level</div>
                <div className="text-xl font-bold text-primary">{gameState.currentLevel}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
                <div className="text-xl font-bold text-green-600">
                  {gameState.currentScore.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          
          <Progress value={progressPercentage} className="mb-2" />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Level 3</span>
            <span>Level 7</span>
          </div>
        </CardContent>
      </Card>

      {/* Game Display Area */}
      <Card>
        <CardContent className="p-8">
          {gameState.gamePhase === 'display' && (
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Remember this sequence
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Pay attention - it will disappear soon
                </div>
              </div>
              
              <div className="flex justify-center space-x-4 mb-8">
                {gameState.currentSequence.map((item, index) => (
                  <div
                    key={index}
                    className="bg-primary text-white rounded-lg w-16 h-16 flex items-center justify-center text-2xl font-bold shadow-md animate-pulse-slow"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400">Memorize the sequence above</div>
              </div>
            </div>
          )}

          {gameState.gamePhase === 'input' && (
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Enter the sequence
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {config.reverse 
                    ? `Type the ${config.type}s in reverse order` 
                    : `Type the ${config.type}s in the same order`}
                </div>
              </div>

              {/* Timer Circle */}
              <div className="flex justify-center mb-8">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                      fill="none" 
                      strokeDasharray="283" 
                      strokeDashoffset={283 - (timerProgress / 100) * 283}
                      className="text-primary timer-circle"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">
                      {gameState.timeRemaining}
                    </span>
                  </div>
                </div>
              </div>

              <div className="max-w-md mx-auto mb-6">
                <Input
                  type="text"
                  value={gameState.userInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-center text-2xl font-mono py-3"
                  placeholder="Enter sequence..."
                  autoFocus
                />
              </div>

              <div className="flex justify-center space-x-4">
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
              </div>

              <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                Press Enter to submit or use the button above
              </div>
            </div>
          )}

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
                  
                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 max-w-sm mx-auto mb-6">
                    <CardContent className="p-4">
                      <div className="text-green-700 dark:text-green-300 font-semibold">
                        +{calculateScore(gameState.currentLevel, gameState.timeRemaining)} Points
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">Level completed</div>
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
