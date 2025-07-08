import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Calculator, Eye } from "lucide-react";
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
    }

    // Generate word and move to word phase
    const word = getRandomWord();
    setCurrentWordData(word);
    setGameState(prev => ({
      ...prev,
      currentWord: word,
      gamePhase: 'word'
    }));
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
      .map(word => word.trim().toLowerCase())
      .filter(word => word.length > 0);
    
    const correctWords = gameState.rememberedWords.map(word => word.toLowerCase());
    const wordsCorrect = validateWordRecall(userWords, correctWords);
    const isLevelComplete = wordsCorrect === gameState.totalPairs;
    
    // Update stats
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
      
      toast({
        title: "Level Complete!",
        description: `You remembered all ${gameState.totalPairs} words correctly!`,
        variant: "default",
      });

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
        updateGameResult('operation-span', newScore, newLevel);
        toast({
          title: "Game Complete!",
          description: `Final Score: ${newScore}`,
          variant: "default",
        });
        setGameState(prev => ({
          ...prev,
          currentScore: newScore,
          gamePhase: 'feedback'
        }));
      }
    } else {
      // Level failed
      toast({
        title: "Level Failed",
        description: `You got ${wordsCorrect} out of ${gameState.totalPairs} words correct.`,
        variant: "destructive",
      });
      
      updateGameResult('operation-span', gameState.currentScore, gameState.currentLevel);
      setGameState(prev => ({
        ...prev,
        gamePhase: 'feedback'
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
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{gameState.currentLevel}</div>
                <div className="text-sm text-gray-600">Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{gameState.currentScore}</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{gameState.currentPair}</div>
                <div className="text-sm text-gray-600">Pair</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{gameState.totalPairs}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
            
            <Progress 
              value={(gameState.rememberedWords.length / gameState.totalPairs) * 100} 
              className="mb-4"
            />
          </CardContent>
        </Card>

        {gameState.gamePhase === 'math' && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Calculator className="mx-auto text-purple-600 mb-4" size={48} />
                <h2 className="text-xl font-bold mb-2">Solve the Math Problem</h2>
                <p className="text-gray-600">Enter the answer to continue</p>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-purple-800 mb-4">
                  {gameState.currentMathQuestion}
                </div>
                <Input
                  type="number"
                  value={gameState.userMathInput}
                  onChange={(e) => setGameState(prev => ({ ...prev, userMathInput: e.target.value }))}
                  onKeyPress={(e) => handleKeyPress(e, handleMathSubmit)}
                  placeholder="Enter answer"
                  className="text-center text-xl max-w-xs mx-auto"
                />
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleMathSubmit}
                  disabled={!gameState.userMathInput}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Submit Answer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {gameState.gamePhase === 'word' && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Eye className="mx-auto text-green-600 mb-4" size={48} />
                <h2 className="text-xl font-bold mb-2">Remember This Word</h2>
                <p className="text-gray-600">Remember this word for later recall</p>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-green-800 mb-4">
                  {gameState.currentWord}
                </div>
                <p className="text-gray-600">
                  Word {gameState.currentPair} of {gameState.totalPairs}
                </p>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleWordRemember}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Remember & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {gameState.gamePhase === 'recall' && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-2">Recall All Words</h2>
                <p className="text-gray-600">
                  Enter all {gameState.totalPairs} words you remember, separated by commas
                </p>
              </div>
              
              <div className="text-center mb-6">
                <Input
                  value={gameState.userRecallInput}
                  onChange={(e) => setGameState(prev => ({ ...prev, userRecallInput: e.target.value }))}
                  onKeyPress={(e) => handleKeyPress(e, handleRecallSubmit)}
                  placeholder="word1, word2, word3..."
                  className="text-center text-lg max-w-md mx-auto"
                />
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
      </div>
    </div>
  );
}