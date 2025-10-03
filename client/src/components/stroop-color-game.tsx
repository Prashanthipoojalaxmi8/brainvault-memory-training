import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Palette, Timer, Trophy, Brain } from "lucide-react";
import { StroopState } from "@shared/schema";

interface StroopColorGameProps {
  onBackToMenu: () => void;
}

// Available colors - simple and easy to recognize
const COLORS = ["Red", "Blue", "Yellow", "Green", "Pink", "Purple"];

// Round settings with question counts
const ROUND_SETTINGS = [
  { questions: 10 }, // Round 1 - 10 questions
  { questions: 15 }, // Round 2 - 15 questions
  { questions: 20 }, // Round 3 - 20 questions
];

// Color mapping for CSS colors - bright and clear
const COLOR_MAP: Record<string, string> = {
  Red: "#DC2626",
  Blue: "#2563EB",
  Yellow: "#EAB308",
  Green: "#16A34A", 
  Pink: "#EC4899",
  Purple: "#9333EA"
};

export function StroopColorGame({ onBackToMenu }: StroopColorGameProps) {
  const [gameState, setGameState] = useState<StroopState>(() => ({
    gamePhase: 'instructions',
    currentRound: 1,
    totalRounds: 3,
    score: 0,
    timeRemaining: 0,
    currentWord: "",
    currentColor: "",
    userInput: "",
    roundStartTime: null,
    stats: {
      totalAttempts: 0,
      correctAnswers: 0,
      averageResponseTime: 0,
      roundScores: []
    }
  }));
  
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  // Generate a new word/color combination
  const generateNewWord = useCallback(() => {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    setGameState(prev => ({
      ...prev,
      currentWord: word,
      currentColor: color,
      userInput: ""
    }));
  }, []);

  // End current round
  const endRound = useCallback(() => {
    setGameState(prev => {
      const newRoundScores = [...prev.stats.roundScores, prev.score - (prev.stats.roundScores.reduce((sum, score) => sum + score, 0))];
      
      return {
        ...prev,
        gamePhase: prev.currentRound >= prev.totalRounds ? 'gameComplete' : 'roundComplete',
        stats: {
          ...prev.stats,
          roundScores: newRoundScores
        }
      };
    });
  }, []);

  // Start a new round
  const startRound = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'playing',
      roundStartTime: Date.now()
    }));
    
    setQuestionsAnswered(0);
    generateNewWord();
  }, [generateNewWord]);

  // Check user's answer
  const checkAnswer = useCallback(() => {
    if (gameState.gamePhase !== 'playing') return;

    const userAnswer = gameState.userInput.trim();
    const isCorrect = userAnswer.toLowerCase() === gameState.currentColor.toLowerCase();
    const roundIndex = gameState.currentRound - 1;
    const maxQuestions = ROUND_SETTINGS[roundIndex]?.questions || 10;
    
    if (isCorrect) {
      setGameState(prev => ({
        ...prev,
        score: prev.score + 1
      }));
    }

    setGameState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalAttempts: prev.stats.totalAttempts + 1,
        correctAnswers: prev.stats.correctAnswers + (isCorrect ? 1 : 0)
      }
    }));

    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);
    
    // Check if round is complete
    if (newQuestionsAnswered >= maxQuestions) {
      endRound();
    } else {
      // Generate next word
      generateNewWord();
    }
  }, [gameState.gamePhase, gameState.userInput, gameState.currentColor, gameState.currentRound, questionsAnswered, generateNewWord, endRound]);

  // Start next round
  const nextRound = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      gamePhase: 'playing',
      roundStartTime: Date.now()
    }));
    
    setQuestionsAnswered(0);
    generateNewWord();
  }, [generateNewWord]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState({
      gamePhase: 'instructions',
      currentRound: 1,
      totalRounds: 3,
      score: 0,
      timeRemaining: 0,
      currentWord: "",
      currentColor: "",
      userInput: "",
      roundStartTime: null,
      stats: {
        totalAttempts: 0,
        correctAnswers: 0,
        averageResponseTime: 0,
        roundScores: []
      }
    });
    setQuestionsAnswered(0);
  }, []);

  // Handle enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  }, [checkAnswer]);

  // Instructions screen
  if (gameState.gamePhase === 'instructions') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-purple-900 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Palette className="w-12 h-12 text-purple-600" />
            </div>
            <CardTitle className="text-3xl text-purple-700 dark:text-purple-300">
              Stroop Color Game
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-300">
                🧠 Test Your Cognitive Control!
              </p>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg space-y-3">
                <h3 className="font-bold text-lg">How to Play:</h3>
                <div className="text-left space-y-2">
                  <p>• You'll see color words displayed in different colors</p>
                  <p>• <strong>Type the COLOR of the text, not the word itself!</strong></p>
                  <p>• For example: if you see <span style={{color: COLOR_MAP.Blue}}>RED</span>, type "Blue"</p>
                  <p>• Press Enter or click Submit after each answer</p>
                  <p>• Complete 3 rounds with increasing difficulty</p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Questions Per Round:</h4>
                <div className="flex justify-center gap-4 text-sm">
                  {ROUND_SETTINGS.map((round, index) => (
                    <Badge key={index} variant="secondary">
                      Round {index + 1}: {round.questions} questions
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={startRound} className="bg-purple-600 hover:bg-purple-700" data-testid="button-start-game">
                Start Game
              </Button>
              <Button onClick={onBackToMenu} variant="outline" data-testid="button-back-menu">
                Back to Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Round complete screen
  if (gameState.gamePhase === 'roundComplete') {
    const currentRoundScore = gameState.score - (gameState.stats.roundScores.slice(0, -1).reduce((sum, score) => sum + score, 0));
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-purple-900 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-purple-700 dark:text-purple-300">
              Round {gameState.currentRound} Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">{currentRoundScore}</div>
                <div className="text-gray-600 dark:text-gray-300">Points This Round</div>
              </div>
              
              <div className="text-lg">
                Total Score: <span className="font-bold text-purple-600">{gameState.score}</span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={nextRound} className="bg-purple-600 hover:bg-purple-700" data-testid="button-next-round">
                Next Round (Round {gameState.currentRound + 1})
              </Button>
              <Button onClick={onBackToMenu} variant="outline" data-testid="button-back-menu-round">
                Back to Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game complete screen
  if (gameState.gamePhase === 'gameComplete') {
    const accuracy = gameState.stats.totalAttempts > 0 
      ? Math.round((gameState.stats.correctAnswers / gameState.stats.totalAttempts) * 100) 
      : 0;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-purple-900 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-16 h-16 text-yellow-600" />
            </div>
            <CardTitle className="text-3xl text-purple-700 dark:text-purple-300">
              🎉 Game Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <div className="text-4xl font-bold text-purple-600 mb-2">{gameState.score}</div>
                <div className="text-gray-600 dark:text-gray-300">Final Score</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <div className="text-xl font-bold text-green-600">{accuracy}%</div>
                  <div className="text-sm text-green-800 dark:text-green-200">Accuracy</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                  <div className="text-xl font-bold text-blue-600">{gameState.stats.totalAttempts}</div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">Total Attempts</div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Round Breakdown:</h3>
                <div className="grid grid-cols-5 gap-2">
                  {gameState.stats.roundScores.map((score, index) => (
                    <div key={index} className="text-center">
                      <div className="text-lg font-bold">{score}</div>
                      <div className="text-xs text-gray-500">R{index + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={resetGame} className="bg-purple-600 hover:bg-purple-700" data-testid="button-play-again">
                Play Again
              </Button>
              <Button onClick={onBackToMenu} variant="outline" data-testid="button-back-menu-complete">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Palette className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-purple-700 dark:text-purple-300">
                Stroop Color Game
              </h2>
              <div className="flex gap-2">
                <Badge>Round {gameState.currentRound}/{gameState.totalRounds}</Badge>
                <Badge variant="secondary">Score: {gameState.score}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Question Counter */}
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <span className="text-xl font-bold text-purple-500" data-testid="text-questions">
                {questionsAnswered} / {ROUND_SETTINGS[gameState.currentRound - 1]?.questions || 10}
              </span>
            </div>

            {/* Progress */}
            <div className="w-32">
              <Progress 
                value={(questionsAnswered / (ROUND_SETTINGS[gameState.currentRound - 1]?.questions || 10)) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex flex-col items-center justify-center space-y-8">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-2">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-300">
                Type the COLOR of the text, not the word!
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-8">
              {/* Current Word Display */}
              <div className="py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div 
                  className="text-8xl font-bold select-none" 
                  style={{ color: COLOR_MAP[gameState.currentColor] }}
                  data-testid="text-current-word"
                >
                  {gameState.currentWord}
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-4">
                <Input
                  type="text"
                  value={gameState.userInput}
                  onChange={(e) => setGameState(prev => ({ ...prev, userInput: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  placeholder="Type the color..."
                  className="text-xl text-center font-semibold"
                  autoFocus
                  data-testid="input-color"
                />
                
                <Button 
                  onClick={checkAnswer}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2"
                  data-testid="button-submit-answer"
                >
                  Submit Answer
                </Button>
              </div>

              {/* Available colors hint */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Available colors: {COLORS.join(", ")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}