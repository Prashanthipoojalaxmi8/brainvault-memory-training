import { useState, useEffect, useCallback } from "react";
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
  
  const [gameState, setGameState] = useState<OperationSpanState>({
    currentLevel: 1,
    currentScore: 0,
    currentPair: 1,
    totalPairs: 3,
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

  const [timeRemaining, setTimeRemaining] = useState(20);
  const [startTime, setStartTime] = useState<number>(0);
  const [mathTimer, setMathTimer] = useState<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const generateNewPair = useCallback(() => {
    setGameState(prev => {
      const mathData = generateMathQuestion(prev.currentLevel);
      const word = getRandomWord();
      
      return {
        ...prev,
        currentMathQuestion: mathData.question,
        currentMathAnswer: mathData.answer,
        currentWord: word,
        userMathInput: '',
        gamePhase: 'math'
      };
    });
    setStartTime(Date.now());
    setTimeRemaining(20);
  }, []);

  const submitMathAnswer = () => {
    // Clear any existing timers first
    if (mathTimer) {
      clearTimeout(mathTimer);
      setMathTimer(null);
    }
    
    const isCorrect = validateMathAnswer(gameState.userMathInput, gameState.currentMathAnswer);
    
    setGameState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        mathCorrect: prev.stats.mathCorrect + (isCorrect ? 1 : 0),
        mathIncorrect: prev.stats.mathIncorrect + (isCorrect ? 0 : 1),
        totalTime: prev.stats.totalTime + (Date.now() - startTime)
      },
      gamePhase: 'word'
    }));

    if (!isCorrect) {
      toast({
        title: "Math Incorrect",
        description: `The correct answer was ${gameState.currentMathAnswer}`,
        variant: "destructive",
      });
    }
  };

  const rememberWordAndContinue = () => {
    setGameState(prev => {
      const newRememberedWords = [...prev.rememberedWords, prev.currentWord];
      
      if (prev.currentPair >= prev.totalPairs) {
        return {
          ...prev,
          rememberedWords: newRememberedWords,
          gamePhase: 'recall',
          userRecallInput: ''
        };
      } else {
        return {
          ...prev,
          rememberedWords: newRememberedWords,
          currentPair: prev.currentPair + 1
        };
      }
    });

    if (gameState.currentPair < gameState.totalPairs) {
      setTimeout(() => {
        generateNewPair();
      }, 1000);
    }
  };

  const submitWordRecall = () => {
    const userWords = gameState.userRecallInput.split(',').map(w => w.trim());
    const wordsCorrect = validateWordRecall(userWords, gameState.rememberedWords);
    const totalPossible = gameState.rememberedWords.length;
    const isPerfect = wordsCorrect === totalPossible;
    
    const levelScore = (gameState.stats.mathCorrect * 10) + (wordsCorrect * 20);
    
    setGameState(prev => ({
      ...prev,
      currentScore: prev.currentScore + levelScore,
      stats: {
        ...prev.stats,
        wordsCorrect: prev.stats.wordsCorrect + wordsCorrect,
        attempts: prev.stats.attempts + 1
      },
      gamePhase: 'feedback'
    }));

    if (isPerfect) {
      toast({
        title: "Perfect Recall!",
        description: `You remembered all ${totalPossible} words in the correct order.`,
      });
    } else {
      toast({
        title: "Incomplete Recall",
        description: `You need to remember all ${totalPossible} words in the exact order to score points.`,
        variant: "destructive"
      });
    }
  };

  const continueToNextLevel = () => {
    if (gameState.currentLevel >= 3) {
      // Game complete
      updateGameResult(
        'operation-span',
        gameState.currentLevel,
        gameState.currentScore,
        gameState.stats.mathCorrect + gameState.stats.wordsCorrect,
        gameState.stats.mathIncorrect + (gameState.totalPairs * gameState.stats.attempts - gameState.stats.wordsCorrect),
        gameState.stats.totalTime
      );
      
      toast({
        title: "Game Complete!",
        description: `Final score: ${gameState.currentScore}`,
      });
      
      onBackToMenu();
      return;
    }

    setGameState(prev => ({
      ...prev,
      currentLevel: prev.currentLevel + 1,
      currentPair: 1,
      rememberedWords: [],
      userMathInput: '',
      userRecallInput: ''
    }));
    
    setTimeout(() => {
      generateNewPair();
    }, 1000);
  };

  const handleMathKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gameState.gamePhase === 'math') {
      submitMathAnswer();
    }
  };

  const handleRecallKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gameState.gamePhase === 'recall') {
      submitWordRecall();
    }
  };

  // Initialize game only once
  useEffect(() => {
    if (!isInitialized) {
      const mathData = generateMathQuestion(1);
      const word = getRandomWord();
      
      setGameState(prev => ({
        ...prev,
        currentMathQuestion: mathData.question,
        currentMathAnswer: mathData.answer,
        currentWord: word,
        userMathInput: '',
        gamePhase: 'math'
      }));
      setStartTime(Date.now());
      setTimeRemaining(20);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (mathTimer) clearTimeout(mathTimer);
    };
  }, [mathTimer]);

  const progressPercentage = ((gameState.currentLevel - 1) / 2) * 100;

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Operation Span Task
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Solve math problems while remembering words
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
            <span>Level 1</span>
            <span>Level 3</span>
          </div>
        </CardContent>
      </Card>

      {/* Game Display Area */}
      <Card>
        <CardContent className="p-8">
          {gameState.gamePhase === 'math' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Solve this math problem
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Pair {gameState.currentPair} of {gameState.totalPairs}
                </div>
              </div>
              
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-primary mb-6">
                  {gameState.currentMathQuestion} = ?
                </div>
                
                <div className="max-w-xs mx-auto mb-6">
                  <Input
                    type="number"
                    value={gameState.userMathInput}
                    onChange={(e) => setGameState(prev => ({ ...prev, userMathInput: e.target.value }))}
                    onKeyPress={handleMathKeyPress}
                    className="text-center text-2xl font-mono py-3"
                    placeholder="Your answer..."
                    autoFocus
                  />
                </div>

                <Button 
                  onClick={submitMathAnswer}
                  disabled={gameState.userMathInput.trim() === ''}
                  className="px-8"
                >
                  Submit Answer
                </Button>
              </div>
            </div>
          )}

          {gameState.gamePhase === 'word' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Remember this word
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  You'll need to recall it later in order
                </div>
              </div>
              
              <div className="text-center mb-8">
                <div className="bg-green-100 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-8 max-w-sm mx-auto mb-6">
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {gameState.currentWord}
                  </div>
                </div>
                
                <Button onClick={rememberWordAndContinue} className="px-8">
                  I've Memorized It
                </Button>
              </div>
            </div>
          )}

          {gameState.gamePhase === 'recall' && (
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Recall all words in exact order
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Type the {gameState.totalPairs} words separated by commas
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full inline-block">
                  ⚠️ Must be ALL words in EXACT order to score points
                </div>
              </div>
              
              <div className="max-w-lg mx-auto mb-6">
                <Input
                  type="text"
                  value={gameState.userRecallInput}
                  onChange={(e) => setGameState(prev => ({ ...prev, userRecallInput: e.target.value }))}
                  onKeyPress={handleRecallKeyPress}
                  className="text-center text-lg py-3"
                  placeholder="word1, word2, word3..."
                  autoFocus
                />
              </div>

              <Button 
                onClick={submitWordRecall}
                disabled={gameState.userRecallInput.trim() === ''}
                className="px-8"
              >
                Submit Words
              </Button>
            </div>
          )}

          {gameState.gamePhase === 'feedback' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-blue-600 mb-2">Level {gameState.currentLevel} Complete!</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {gameState.currentLevel < 3 ? "Moving to the next level..." : "Game completed!"}
                </p>
              </div>
              
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 max-w-lg mx-auto mb-6">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Correct word sequence was:
                  </div>
                  <div className="flex justify-center space-x-2 mb-2">
                    {gameState.rememberedWords.map((word, index) => (
                      <span 
                        key={index}
                        className="bg-blue-100 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded font-medium"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Your recall: {gameState.userRecallInput || '(no answer)'}
                  </div>
                  {validateWordRecall(gameState.userRecallInput.split(',').map(w => w.trim()), gameState.rememberedWords) === gameState.rememberedWords.length ? (
                    <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                      ✓ Perfect match - All words correct in order
                    </div>
                  ) : (
                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                      ✗ Incomplete - Need all words in exact order
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={onBackToMenu}>
                  Exit Training
                </Button>
                <Button onClick={continueToNextLevel}>
                  {gameState.currentLevel < 3 ? 'Next Level' : 'Finish'}
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
              {gameState.stats.mathCorrect}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Math Correct</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {gameState.stats.mathIncorrect}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Math Incorrect</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {gameState.stats.wordsCorrect}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Words Correct</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {gameState.currentPair}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Current Pair</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}