import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Timer, Target, Brain, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { DCATState } from "@shared/schema";

interface DigitCancellationTaskProps {
  onBackToMenu: () => void;
}

export function DigitCancellationTask({ onBackToMenu }: DigitCancellationTaskProps) {
  const [gameState, setGameState] = useState<DCATState>(() => ({
    currentLevel: 1,
    targetDigits: [6],
    grid: [],
    markedPositions: new Set<string>(),
    gamePhase: 'instructions',
    timeRemaining: 60,
    timeLimit: 60,
    stats: {
      hits: 0,
      omissions: 0,
      falsePositives: 0,
      totalTargets: 0,
      accuracy: 0,
      speed: 0
    },
    trial: 1,
    totalTrials: 3,
    gridSize: { rows: 10, cols: 10 }
  }));

  // Generate random grid based on difficulty
  const generateGrid = useCallback((level: number) => {
    const difficulty = {
      1: { rows: 10, cols: 10, targets: [6] },
      2: { rows: 12, cols: 12, targets: [4, 6] },
      3: { rows: 15, cols: 15, targets: [3, 6, 9] }
    };

    const config = difficulty[level as keyof typeof difficulty] || difficulty[1];
    const grid: number[][] = [];
    let targetCount = 0;

    for (let i = 0; i < config.rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < config.cols; j++) {
        // 15% chance of target digit, 85% random digit
        const isTarget = Math.random() < 0.15;
        if (isTarget) {
          const targetDigit = config.targets[Math.floor(Math.random() * config.targets.length)];
          row.push(targetDigit);
          targetCount++;
        } else {
          // Generate non-target digit
          let digit;
          do {
            digit = Math.floor(Math.random() * 10);
          } while (config.targets.includes(digit));
          row.push(digit);
        }
      }
      grid.push(row);
    }

    return { grid, targetCount, config };
  }, []);

  // Start new trial
  const startTrial = useCallback(() => {
    const { grid, targetCount, config } = generateGrid(gameState.currentLevel);
    
    setGameState(prev => ({
      ...prev,
      grid,
      targetDigits: config.targets,
      markedPositions: new Set(),
      gamePhase: 'playing',
      timeRemaining: prev.timeLimit,
      stats: {
        ...prev.stats,
        totalTargets: targetCount
      },
      gridSize: { rows: config.rows, cols: config.cols }
    }));
  }, [gameState.currentLevel, generateGrid]);

  // Handle digit click
  const handleDigitClick = useCallback((row: number, col: number) => {
    if (gameState.gamePhase !== 'playing') return;

    const position = `${row},${col}`;
    const digit = gameState.grid[row][col];
    const isTarget = gameState.targetDigits.includes(digit);
    const alreadyMarked = gameState.markedPositions.has(position);

    if (alreadyMarked) return; // Don't allow unmarking

    setGameState(prev => {
      const newMarkedPositions = new Set(prev.markedPositions);
      newMarkedPositions.add(position);

      const newStats = { ...prev.stats };
      if (isTarget) {
        newStats.hits++;
      } else {
        newStats.falsePositives++;
      }

      return {
        ...prev,
        markedPositions: newMarkedPositions,
        stats: newStats
      };
    });
  }, [gameState.gamePhase, gameState.grid, gameState.targetDigits, gameState.markedPositions]);

  // Timer effect
  useEffect(() => {
    if (gameState.gamePhase === 'playing' && gameState.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);

      return () => clearTimeout(timer);
    } else if (gameState.gamePhase === 'playing' && gameState.timeRemaining === 0) {
      // Time's up - calculate results
      finishTrial();
    }
  }, [gameState.gamePhase, gameState.timeRemaining]);

  const finishTrial = useCallback(() => {
    // Calculate omissions (targets not marked)
    let omissions = 0;
    gameState.grid.forEach((row, rowIndex) => {
      row.forEach((digit, colIndex) => {
        if (gameState.targetDigits.includes(digit)) {
          const position = `${rowIndex},${colIndex}`;
          if (!gameState.markedPositions.has(position)) {
            omissions++;
          }
        }
      });
    });

    const totalMarked = gameState.markedPositions.size;
    const accuracy = gameState.stats.totalTargets > 0 
      ? (gameState.stats.hits / gameState.stats.totalTargets) * 100 
      : 0;
    const speed = gameState.stats.hits / (gameState.timeLimit - gameState.timeRemaining || 1);

    setGameState(prev => ({
      ...prev,
      gamePhase: 'complete',
      stats: {
        ...prev.stats,
        omissions,
        accuracy: Math.round(accuracy),
        speed: Math.round(speed * 100) / 100
      }
    }));
  }, [gameState.grid, gameState.targetDigits, gameState.markedPositions, gameState.stats, gameState.timeLimit, gameState.timeRemaining]);

  const nextTrial = useCallback(() => {
    if (gameState.trial < gameState.totalTrials) {
      setGameState(prev => ({
        ...prev,
        currentLevel: prev.currentLevel + 1,
        trial: prev.trial + 1,
        gamePhase: 'instructions',
        timeLimit: Math.max(30, prev.timeLimit - 10) // Reduce time each trial
      }));
    } else {
      onBackToMenu();
    }
  }, [gameState.trial, gameState.totalTrials, onBackToMenu]);

  const resetGame = useCallback(() => {
    setGameState({
      currentLevel: 1,
      targetDigits: [6],
      grid: [],
      markedPositions: new Set<string>(),
      gamePhase: 'instructions',
      timeRemaining: 60,
      timeLimit: 60,
      stats: {
        hits: 0,
        omissions: 0,
        falsePositives: 0,
        totalTargets: 0,
        accuracy: 0,
        speed: 0
      },
      trial: 1,
      totalTrials: 3,
      gridSize: { rows: 10, cols: 10 }
    });
  }, []);

  if (gameState.gamePhase === 'instructions') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Target className="w-12 h-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-blue-700 dark:text-blue-300">
              Digit Cancellation Task
            </CardTitle>
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant="outline">Trial {gameState.trial}/{gameState.totalTrials}</Badge>
              <Badge variant="secondary">Level {gameState.currentLevel}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3">Your Mission:</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Find and click on ALL target digits as quickly and accurately as possible!
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Target Digits:</h4>
                <div className="flex justify-center gap-3">
                  {gameState.targetDigits.map((digit, index) => (
                    <div key={index} className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xl font-bold">
                      {digit}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <div className="font-semibold text-green-800 dark:text-green-200">Hit</div>
                  <div className="text-green-600 dark:text-green-300">Click target digits</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                  <div className="font-semibold text-red-800 dark:text-red-200">False Positive</div>
                  <div className="text-red-600 dark:text-red-300">Avoid non-targets</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Time Limit: {gameState.timeLimit} seconds
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={startTrial} className="bg-blue-600 hover:bg-blue-700">
                <Brain className="w-4 h-4 mr-2" />
                Start Trial
              </Button>
              <Button onClick={onBackToMenu} variant="outline">
                Back to Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState.gamePhase === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-green-900 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700 dark:text-green-300">
              Trial {gameState.trial} Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{gameState.stats.hits}</div>
                <div className="text-sm text-green-800 dark:text-green-200">Hits</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{gameState.stats.omissions}</div>
                <div className="text-sm text-red-800 dark:text-red-200">Missed</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{gameState.stats.falsePositives}</div>
                <div className="text-sm text-orange-800 dark:text-orange-200">False Positives</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{gameState.stats.accuracy}%</div>
                <div className="text-sm text-blue-800 dark:text-blue-200">Accuracy</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold mb-2">Speed: {gameState.stats.speed} targets/sec</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {gameState.stats.totalTargets} total targets in grid
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {gameState.trial < gameState.totalTrials ? (
                <Button onClick={nextTrial} className="bg-blue-600 hover:bg-blue-700">
                  Next Trial (Level {gameState.currentLevel + 1})
                </Button>
              ) : (
                <Button onClick={resetGame} className="bg-green-600 hover:bg-green-700">
                  Play Again
                </Button>
              )}
              <Button onClick={onBackToMenu} variant="outline">
                Back to Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Playing phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300">
                Digit Cancellation Task
              </h2>
              <div className="flex gap-2">
                <Badge>Trial {gameState.trial}/{gameState.totalTrials}</Badge>
                <Badge variant="secondary">Level {gameState.currentLevel}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Target digits display */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Targets:</span>
              {gameState.targetDigits.map((digit, index) => (
                <div key={index} className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold">
                  {digit}
                </div>
              ))}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-red-500" />
              <span className="text-lg font-bold text-red-500">
                {Math.floor(gameState.timeRemaining / 60)}:{(gameState.timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* Progress */}
            <div className="w-24">
              <Progress 
                value={(gameState.timeLimit - gameState.timeRemaining) / gameState.timeLimit * 100} 
                className="h-2"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded text-center">
            <div className="text-lg font-bold text-green-600">{gameState.stats.hits}</div>
            <div className="text-xs text-green-800 dark:text-green-200">Hits</div>
          </div>
          <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded text-center">
            <div className="text-lg font-bold text-red-600">{gameState.stats.falsePositives}</div>
            <div className="text-xs text-red-800 dark:text-red-200">False Positives</div>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded text-center">
            <div className="text-lg font-bold text-blue-600">{gameState.stats.totalTargets}</div>
            <div className="text-xs text-blue-800 dark:text-blue-200">Total Targets</div>
          </div>
          <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded text-center">
            <div className="text-lg font-bold text-purple-600">
              {gameState.stats.totalTargets > 0 ? Math.round((gameState.stats.hits / gameState.stats.totalTargets) * 100) : 0}%
            </div>
            <div className="text-xs text-purple-800 dark:text-purple-200">Accuracy</div>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div 
            className="grid gap-1 mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${gameState.gridSize.cols}, minmax(0, 1fr))`,
              maxWidth: '600px'
            }}
          >
            {gameState.grid.map((row, rowIndex) =>
              row.map((digit, colIndex) => {
                const position = `${rowIndex},${colIndex}`;
                const isMarked = gameState.markedPositions.has(position);
                const isTarget = gameState.targetDigits.includes(digit);
                
                return (
                  <button
                    key={position}
                    onClick={() => handleDigitClick(rowIndex, colIndex)}
                    className={`
                      w-8 h-8 text-sm font-bold rounded transition-all duration-200 border
                      ${isMarked 
                        ? isTarget 
                          ? 'bg-green-500 text-white border-green-600 shadow-lg' 
                          : 'bg-red-500 text-white border-red-600 shadow-lg'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                      }
                      ${isMarked ? 'scale-110' : 'hover:scale-105'}
                    `}
                    disabled={isMarked}
                  >
                    {digit}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center mt-6">
          <Button onClick={() => finishTrial()} variant="outline">
            Finish Early
          </Button>
        </div>
      </div>
    </div>
  );
}