import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Brain, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { generateCultureFairQuestions, calculateCultureFairScore, validateCultureFairAnswer } from '@/lib/game-logic';
import { updateGameResult } from '@/lib/storage';
import { CultureFairState, CultureFairQuestion } from '@shared/schema';

interface CultureFairGameProps {
  onBackToMenu: () => void;
}

const initialState: CultureFairState = {
  currentQuestion: 0,
  currentScore: 0,
  totalQuestions: 8,
  gamePhase: 'question',
  selectedAnswer: null,
  timeRemaining: 30,
  stats: {
    correct: 0,
    incorrect: 0,
    totalTime: 0,
    attempts: 0
  }
};

export function CultureFairGame({ onBackToMenu }: CultureFairGameProps) {
  const [gameState, setGameState] = useState<CultureFairState>(initialState);
  const [questions] = useState<CultureFairQuestion[]>(generateCultureFairQuestions());
  const [showTransition, setShowTransition] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [transitionData, setTransitionData] = useState<{
    title: string;
    description: string;
    type: 'success' | 'error' | 'info';
  }>({ title: '', description: '', type: 'info' });
  const [previousScore, setPreviousScore] = useState(0);
  const { toast } = useToast();

  const currentQuestion = questions[gameState.currentQuestion];
  const progress = ((gameState.currentQuestion) / gameState.totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (gameState.gamePhase === 'question' && gameState.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.timeRemaining === 0) {
      handleTimeUp();
    }
  }, [gameState.timeRemaining, gameState.gamePhase]);

  const handleTimeUp = () => {
    setTransitionData({
      title: "Time's Up!",
      description: "You didn't answer in time. Moving to the next question.",
      type: 'error'
    });
    setShowTransition(true);
    
    setGameState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        incorrect: prev.stats.incorrect + 1,
        attempts: prev.stats.attempts + 1
      }
    }));

    setTimeout(() => {
      setShowTransition(false);
      moveToNextQuestion();
    }, 2000);
  };

  const handleAnswerSelect = (answer: string) => {
    if (gameState.selectedAnswer) return; // Prevent multiple selections

    const isCorrect = validateCultureFairAnswer(answer, currentQuestion.correctAnswer);
    
    setGameState(prev => ({
      ...prev,
      selectedAnswer: answer,
      stats: {
        ...prev.stats,
        correct: prev.stats.correct + (isCorrect ? 1 : 0),
        incorrect: prev.stats.incorrect + (isCorrect ? 0 : 1),
        attempts: prev.stats.attempts + 1,
        totalTime: prev.stats.totalTime + (30 - prev.timeRemaining)
      }
    }));

    if (isCorrect) {
      setTransitionData({
        title: "Correct!",
        description: "Well done! You found the right answer.",
        type: 'success'
      });
      setPreviousScore(gameState.currentScore);
      setGameState(prev => ({
        ...prev,
        currentScore: prev.currentScore + 10
      }));
    } else {
      setTransitionData({
        title: "Incorrect",
        description: `The correct answer was: ${currentQuestion.correctAnswer}`,
        type: 'error'
      });
    }
    
    setShowTransition(true);
    
    setTimeout(() => {
      setShowTransition(false);
      moveToNextQuestion();
    }, 2500);
  };

  const moveToNextQuestion = () => {
    if (gameState.currentQuestion + 1 < gameState.totalQuestions) {
      setGameState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        selectedAnswer: null,
        timeRemaining: 30
      }));
    } else {
      completeGame();
    }
  };

  const completeGame = () => {
    const finalScore = calculateCultureFairScore(gameState.stats.correct, gameState.totalQuestions);
    
    setGameState(prev => ({
      ...prev,
      gamePhase: 'complete'
    }));

    updateGameResult('culture-fair-iq', gameState.stats.correct, finalScore, gameState.stats.correct, gameState.stats.incorrect, gameState.stats.totalTime);
    
    toast({
      title: "Test Complete!",
      description: `Your estimated IQ: ${finalScore}`,
      variant: "default",
    });
  };

  const resetGame = () => {
    setGameState(initialState);
    setPreviousScore(0);
    setShowTransition(false);
    setShowInstructions(true);
  };

  const startGame = () => {
    setShowInstructions(false);
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-orange-500';
      case 4: return 'bg-red-500';
      case 5: return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'series': return '➡️';
      case 'classification': return '🔍';
      case 'matrices': return '⬜';
      case 'conditions': return '⚖️';
      default: return '❓';
    }
  };

  const getVisualPattern = (question: CultureFairQuestion) => {
    switch (question.type) {
      case 'series':
        if (question.id === 1) return '⬜ ◼️ ⬜ ◼️ ?';
        if (question.id === 2) return '◆ ◇ ◆ ◇ ?';
        if (question.id === 3) return '🔺 🔶 ⬟ ⬢ ?';
        return '⬜ ◼️ ⬜ ?';
      case 'classification':
        if (question.id === 4) return '🔺 🔺 🔺 ◼️';
        if (question.id === 5) return '🔺 🔶 🔷 ◼️';
        if (question.id === 6) return '▲ ▲ ▲ ▼';
        return '🔺 🔺 ◼️ 🔺';
      case 'matrices':
        if (question.id === 7) return '◼️ ⬜ → ◼️\n⬜ ◼️ → ⬜\n🔺 ◼️ → ?';
        if (question.id === 8) return '🔸 🔹 🔷\n🔸 🔹 🔷\n🔸 🔹 ?';
        if (question.id === 9) return '◆ ◇ ⬟\n◇ ⬟ 🔶\n⬟ 🔶 ?';
        return '◼️ ⬜ ◼️\n⬜ ◼️ ⬜\n◼️ ⬜ ?';
      case 'conditions':
        if (question.id === 10) return 'Rule: ▲ = filled, ▽ = empty\nWhich fits: ▲ ?';
        if (question.id === 11) return 'Rule: ⬤ = small, ◼️ = large\nWhich fits: round ?';
        if (question.id === 12) return 'Rule: >4 sides = blue, ≤4 sides = black\nWhich fits: hexagon ?';
        return 'Apply the rule → ?';
      default:
        return 'Pattern → ?';
    }
  };

  // Instructions Screen
  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Card className="p-8">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-green-600 flex items-center justify-center gap-2">
                  <Brain className="w-8 h-8" />
                  Culture Fair Intelligence Test
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-lg text-gray-700 mb-6">
                  This test measures your ability to solve visual puzzles without relying on language or cultural knowledge.
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-blue-700 mb-2">🔗 Series Completion</h3>
                    <p className="text-sm text-blue-600">
                      Look at the sequence of shapes and find the pattern. 
                      Determine what comes next in the series.
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-bold text-purple-700 mb-2">🔍 Classification</h3>
                    <p className="text-sm text-purple-600">
                      Find the shape that doesn't belong with the others. 
                      Look for differences in size, orientation, or type.
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-bold text-orange-700 mb-2">⬜ Matrices</h3>
                    <p className="text-sm text-orange-600">
                      Complete the pattern in the grid. 
                      Look at how shapes change across rows and columns.
                    </p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-bold text-red-700 mb-2">⚖️ Conditions</h3>
                    <p className="text-sm text-red-600">
                      Apply the given rules to choose the correct shape. 
                      Read the rule carefully and select the shape that fits.
                    </p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-bold text-yellow-700 mb-2">📝 Test Instructions</h3>
                  <ul className="text-sm text-yellow-600 space-y-1">
                    <li>• You have 30 seconds per question</li>
                    <li>• Read each rule carefully before selecting your answer</li>
                    <li>• 8 questions total with progressive difficulty</li>
                    <li>• Your IQ score will be calculated based on performance</li>
                  </ul>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <Button onClick={startGame} size="lg" className="bg-green-600 hover:bg-green-700">
                    Start Test
                  </Button>
                  <Button onClick={onBackToMenu} variant="outline" size="lg">
                    Back to Menu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (gameState.gamePhase === 'complete') {
    const finalScore = calculateCultureFairScore(gameState.stats.correct, gameState.totalQuestions);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Card className="p-8">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-green-600 flex items-center justify-center gap-2">
                  <CheckCircle className="w-8 h-8" />
                  Test Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-6xl font-bold text-green-500">
                  {finalScore}
                </div>
                <div className="text-xl text-gray-600">
                  Estimated IQ Score
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {gameState.stats.correct}
                    </div>
                    <div className="text-sm text-green-600">Correct</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {gameState.stats.incorrect}
                    </div>
                    <div className="text-sm text-red-600">Incorrect</div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">
                    Accuracy: {Math.round((gameState.stats.correct / gameState.totalQuestions) * 100)}%
                  </div>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <Button onClick={resetGame} variant="outline">
                    Play Again
                  </Button>
                  <Button onClick={onBackToMenu}>
                    Back to Menu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-green-600">Culture Fair Intelligence Test</h1>
          </div>
          
          <div className="flex items-center justify-center gap-6 mb-4">
            <Badge variant="secondary">
              Question {gameState.currentQuestion + 1} of {gameState.totalQuestions}
            </Badge>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-blue-600 font-medium">{gameState.timeRemaining}s</span>
            </div>
            <div className="text-green-600 font-medium">
              Score: {gameState.currentScore}
            </div>
          </div>
          
          <Progress value={progress} className="w-full max-w-md mx-auto" />
        </motion.div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={gameState.currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{getQuestionTypeIcon(currentQuestion.type)}</span>
                  {currentQuestion.title}
                  <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                    Level {currentQuestion.difficulty}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">{currentQuestion.description}</p>
                  
                  {/* Visual Pattern Display */}
                  <div className="bg-gray-50 p-8 rounded-lg mb-6">
                    <div className="text-center">
                      <div className="text-4xl mb-4 whitespace-pre-line font-mono">
                        {getVisualPattern(currentQuestion)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {currentQuestion.type === 'series' && 'Find the pattern and select what comes next'}
                        {currentQuestion.type === 'classification' && 'Which shape does not belong?'}
                        {currentQuestion.type === 'matrices' && 'Complete the pattern'}
                        {currentQuestion.type === 'conditions' && 'Apply the rule to find the answer'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Options */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentQuestion.options.map((option, index) => (
                      <Button
                        key={index}
                        variant={gameState.selectedAnswer === option ? "default" : "outline"}
                        className={`h-20 text-2xl ${
                          gameState.selectedAnswer === option 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={gameState.selectedAnswer !== null}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Transition Overlay */}
        <AnimatePresence>
          {showTransition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="bg-white rounded-lg p-8 max-w-md mx-4 text-center"
              >
                <div className="mb-4">
                  {transitionData.type === 'success' && <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />}
                  {transitionData.type === 'error' && <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />}
                  {transitionData.type === 'info' && <Brain className="w-16 h-16 text-blue-500 mx-auto" />}
                </div>
                <h3 className="text-2xl font-bold mb-2">{transitionData.title}</h3>
                <p className="text-gray-600">{transitionData.description}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back Button */}
        <div className="text-center">
          <Button variant="outline" onClick={onBackToMenu}>
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}