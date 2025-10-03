import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Target, RotateCcw, Home, Play, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface TMTCircle {
  id: string;
  value: string | number;
  x: number;
  y: number;
  clicked: boolean;
  type: 'number' | 'letter';
}

interface TMTResults {
  mode: 'TMT-A' | 'TMT-B';
  completionTime: number;
  errors: number;
  completed: boolean;
}

interface TrailMakingTestProps {
  onBackToMenu: () => void;
}

export function TrailMakingTest({ onBackToMenu }: TrailMakingTestProps) {
  const { toast } = useToast();
  const [gameMode, setGameMode] = useState<'select' | 'TMT-A' | 'TMT-B' | 'session'>('select');
  const [circles, setCircles] = useState<TMTCircle[]>([]);
  const [currentTarget, setCurrentTarget] = useState<string | number>(1);
  const [targetType, setTargetType] = useState<'number' | 'letter'>('number');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [completionTime, setCompletionTime] = useState<number>(0);
  const [errors, setErrors] = useState(0);
  const [isSessionMode, setIsSessionMode] = useState(false);
  const [sessionResults, setSessionResults] = useState<TMTResults[]>([]);
  const [showError, setShowError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate random positions for circles without overlap
  const generatePositions = (count: number): { x: number; y: number }[] => {
    const positions: { x: number; y: number }[] = [];
    const minDistance = 12; // 12% minimum distance between circles
    const maxAttempts = 200;
    
    for (let i = 0; i < count; i++) {
      let attempt = 0;
      let position: { x: number; y: number };
      
      do {
        position = {
          x: Math.random() * (85 - 8) + 8, // 8-93% to keep within bounds
          y: Math.random() * (85 - 8) + 8  // 8-93% to keep within bounds
        };
        attempt++;
      } while (
        attempt < maxAttempts &&
        positions.some(pos => 
          Math.sqrt(Math.pow(pos.x - position.x, 2) + Math.pow(pos.y - position.y, 2)) < minDistance
        )
      );
      
      positions.push(position);
    }
    return positions;
  };

  // Initialize TMT-A (numbers 1-25)
  const initializeTMTA = () => {
    const positions = generatePositions(25);
    const newCircles: TMTCircle[] = [];
    
    for (let i = 1; i <= 25; i++) {
      newCircles.push({
        id: `num-${i}`,
        value: i,
        x: positions[i - 1].x,
        y: positions[i - 1].y,
        clicked: false,
        type: 'number'
      });
    }
    
    setCircles(newCircles);
    setCurrentTarget(1);
    setTargetType('number');
  };

  // Initialize TMT-B (numbers 1-13 and letters A-L)
  const initializeTMTB = () => {
    const positions = generatePositions(25);
    const newCircles: TMTCircle[] = [];
    
    // Add numbers 1-13
    for (let i = 1; i <= 13; i++) {
      newCircles.push({
        id: `num-${i}`,
        value: i,
        x: positions[newCircles.length].x,
        y: positions[newCircles.length].y,
        clicked: false,
        type: 'number'
      });
    }
    
    // Add letters A-L
    for (let i = 0; i < 12; i++) {
      const letter = String.fromCharCode(65 + i); // A-L
      newCircles.push({
        id: `letter-${letter}`,
        value: letter,
        x: positions[newCircles.length].x,
        y: positions[newCircles.length].y,
        clicked: false,
        type: 'letter'
      });
    }
    
    setCircles(newCircles);
    setCurrentTarget(1);
    setTargetType('number');
  };

  // Get next target for TMT-B alternating pattern
  const getNextTarget = (current: string | number, type: 'number' | 'letter'): { target: string | number; type: 'number' | 'letter' } => {
    if (gameMode === 'TMT-A') {
      return { target: (current as number) + 1, type: 'number' };
    }
    
    // TMT-B alternating pattern
    if (type === 'number') {
      const nextLetter = String.fromCharCode(64 + (current as number)); // A, B, C...
      return { target: nextLetter, type: 'letter' };
    } else {
      const nextNumber = (current as string).charCodeAt(0) - 64 + 1; // A->2, B->3...
      return { target: nextNumber, type: 'number' };
    }
  };

  // Check if game is complete
  const isGameComplete = (current: string | number, type: 'number' | 'letter'): boolean => {
    if (gameMode === 'TMT-A') {
      return current === 25;
    }
    // TMT-B ends at 13 (the sequence is 1-A-2-B-...-12-L-13)
    return type === 'number' && current === 13;
  };

  const handleCircleClick = (circle: TMTCircle) => {
    if (!gameStarted || gameCompleted || circle.clicked) return;

    // Start timer on first correct click
    if (!startTime) {
      setStartTime(Date.now());
    }

    // Check if this is the correct target
    if (circle.value === currentTarget && circle.type === targetType) {
      // Correct click - mark the circle as clicked first
      setCircles(prev => prev.map(c => 
        c.id === circle.id ? { ...c, clicked: true } : c
      ));

      // Check if this was the last target
      const wasLastTarget = isGameComplete(currentTarget, targetType);
      
      if (wasLastTarget) {
        // Delay game completion slightly so user sees the last circle turn green
        setTimeout(() => {
          const endTime = Date.now();
          const totalTime = Math.round((endTime - (startTime || endTime)) / 1000);
          setCompletionTime(totalTime);
          setGameCompleted(true);
          
          const result: TMTResults = {
            mode: gameMode as 'TMT-A' | 'TMT-B',
            completionTime: totalTime,
            errors,
            completed: true
          };
          
          if (isSessionMode) {
            setSessionResults(prev => [...prev, result]);
            
            // If TMT-A completed in session mode, start TMT-B
            if (gameMode === 'TMT-A') {
              setTimeout(() => {
                setGameMode('TMT-B');
                initializeTMTB();
                resetGameState();
              }, 2000);
            }
          }
          
          toast({
            title: "Congratulations!",
            description: `${gameMode} completed in ${totalTime} seconds with ${errors} errors.`,
          });
        }, 300);
      } else {
        // Set next target
        const next = getNextTarget(currentTarget, targetType);
        setCurrentTarget(next.target);
        setTargetType(next.type);
      }
    } else {
      // Incorrect click
      setErrors(prev => prev + 1);
      setShowError(true);
      setTimeout(() => setShowError(false), 1000);
      
      toast({
        title: "Incorrect!",
        description: `Click ${currentTarget} next.`,
        variant: "destructive"
      });
    }
  };

  const resetGameState = () => {
    setGameStarted(false);
    setGameCompleted(false);
    setStartTime(null);
    setCompletionTime(0);
    setErrors(0);
    setShowError(false);
  };

  const startGame = (mode: 'TMT-A' | 'TMT-B' | 'session') => {
    resetGameState();
    setGameMode(mode);
    setIsSessionMode(mode === 'session');
    
    if (mode === 'TMT-A' || mode === 'session') {
      initializeTMTA();
      setGameMode('TMT-A');
    } else {
      initializeTMTB();
    }
    
    setGameStarted(true);
  };

  const resetGame = () => {
    resetGameState();
    if (gameMode === 'TMT-A') {
      initializeTMTA();
    } else {
      initializeTMTB();
    }
    setGameStarted(true);
  };

  const backToModeSelection = () => {
    setGameMode('select');
    setSessionResults([]);
    resetGameState();
  };

  if (gameMode === 'select') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Trail Making Test</h2>
            <p className="text-gray-600">
              Test your visual scanning, cognitive flexibility, and processing speed
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startGame('TMT-A')}
              className="cursor-pointer"
            >
              <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">TMT-A</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect numbers 1-25 in ascending order as quickly as possible
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                    <span>1 → 2 → 3 → ... → 25</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startGame('TMT-B')}
              className="cursor-pointer"
            >
              <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RotateCcw className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">TMT-B</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Alternate between numbers and letters in sequence
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-purple-600">
                    <span>1 → A → 2 → B → ... → 13 → L</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startGame('session')}
              className="cursor-pointer"
            >
              <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Session Mode</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Complete TMT-A followed by TMT-B for comprehensive assessment
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                    <span>TMT-A → TMT-B</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="text-center">
            <Button onClick={onBackToMenu} variant="outline" className="w-auto">
              <Home className="w-4 h-4 mr-2" />
              Back to Main Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold">
              {gameMode === 'TMT-A' ? 'Trail Making Test A' : 'Trail Making Test B'}
            </h2>
            {isSessionMode && (
              <div className="text-sm text-gray-500">
                Session Mode - {sessionResults.length + 1}/2
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Timer className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-mono">
                {startTime ? Math.round((Date.now() - startTime) / 1000) : 0}s
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-red-600" />
              <span className="text-lg font-semibold">Errors: {errors}</span>
            </div>
            
            <div className="text-lg font-semibold">
              Next: <span className={`${targetType === 'number' ? 'text-blue-600' : 'text-purple-600'}`}>
                {currentTarget}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-gray-50"
        style={{ minHeight: '600px' }}
      >
        <AnimatePresence>
          {showError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            >
              <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
                <p className="font-semibold">Incorrect - go back!</p>
                <p className="text-sm">Click {currentTarget} next</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {circles.map((circle) => (
          <button
            key={circle.id}
            onClick={() => handleCircleClick(circle)}
            className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg transform -translate-x-1/2 -translate-y-1/2 ${
              circle.clicked 
                ? 'bg-green-500 border-green-600 text-white' 
                : circle.type === 'number'
                ? 'bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200'
                : 'bg-purple-100 border-purple-400 text-purple-800 hover:bg-purple-200'
            }`}
            style={{
              left: `${circle.x}%`,
              top: `${circle.y}%`,
            }}
            disabled={circle.clicked || !gameStarted || gameCompleted}
          >
            {circle.value}
          </button>
        ))}

        {/* Game Completed Modal */}
        <AnimatePresence>
          {gameCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
              >
                <div className="text-center">
                  <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4">
                    {gameMode} Complete!
                  </h3>
                  
                  <div className="space-y-2 mb-6">
                    <p className="text-lg">
                      <strong>Time:</strong> {completionTime} seconds
                    </p>
                    <p className="text-lg">
                      <strong>Errors:</strong> {errors}
                    </p>
                  </div>

                  {/* Session Results */}
                  {isSessionMode && sessionResults.length > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-3">Session Results:</h4>
                      {sessionResults.map((result, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{result.mode}:</span>
                          <span>{result.completionTime}s ({result.errors} errors)</span>
                        </div>
                      ))}
                      {sessionResults.length === 2 && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex justify-between font-semibold">
                            <span>TMT B-A Difference:</span>
                            <span>{sessionResults[1].completionTime - sessionResults[0].completionTime}s</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button onClick={resetGame} className="flex-1">
                      Play Again
                    </Button>
                    <Button onClick={backToModeSelection} variant="outline" className="flex-1">
                      Mode Select
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="bg-white border-t p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Button onClick={backToModeSelection} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Mode Selection
          </Button>
          
          <div className="text-sm text-gray-600">
            {gameMode === 'TMT-A' 
              ? 'Click numbers 1-25 in ascending order'
              : 'Alternate: 1→A→2→B→3→C...→13→L'
            }
          </div>
          
          <Button onClick={resetGame} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}