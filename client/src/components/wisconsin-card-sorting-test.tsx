import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Circle, Triangle, Star, Square, ArrowLeft } from 'lucide-react';
import { 
  WCSTCard, 
  WCSTState, 
  WCSTPhase 
} from '@shared/schema';
import { 
  createWCSTDeck, 
  createWCSTReferenceCards, 
  chooseWCSTRule, 
  validateWCSTMatch, 
  shouldSwitchWCSTRule,
  calculateWCSTScore 
} from '@/lib/game-logic';
import { updateGameResult } from '@/lib/storage';

interface WisconsinCardSortingTestProps {
  onBackToMenu: () => void;
}

export function WisconsinCardSortingTest({ onBackToMenu }: WisconsinCardSortingTestProps) {
  const [deck, setDeck] = useState<WCSTCard[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameState, setGameState] = useState<WCSTState>({
    currentCard: { color: 'Red', shape: 'Circle', number: 1 },
    referenceCards: [],
    currentRule: 'color',
    gamePhase: 'display',
    attempts: 0,
    correctCount: 0,
    consecutiveCorrect: 0,
    ruleSwitches: 0,
    perseverationErrors: 0,
    stats: {
      totalAttempts: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      averageResponseTime: 0,
      ruleBreaks: 0,
    },
    isComplete: false,
  });

  const [feedback, setFeedback] = useState<string>('');
  const [showRuleChange, setShowRuleChange] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const newDeck = createWCSTDeck();
    const referenceCards = createWCSTReferenceCards();
    const initialRule = chooseWCSTRule();
    
    setDeck(newDeck);
    setShowInstructions(true);
    setFeedback(''); // Clear any existing feedback
    setShowRuleChange(false); // Clear rule change notification
    setGameState({
      currentCard: newDeck[0],
      referenceCards,
      currentRule: initialRule,
      gamePhase: 'display',
      attempts: 0,
      correctCount: 0,
      consecutiveCorrect: 0,
      ruleSwitches: 0,
      perseverationErrors: 0,
      stats: {
        totalAttempts: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        averageResponseTime: 0,
        ruleBreaks: 0,
      },
      isComplete: false,
    });
    setStartTime(Date.now());
  };

  const handleCardSelection = (selectedIndex: number) => {
    if (gameState.gamePhase !== 'display' || gameState.isComplete) return;

    const selectedCard = gameState.referenceCards[selectedIndex];
    const isCorrect = validateWCSTMatch(gameState.currentCard, selectedCard, gameState.currentRule);
    
    console.log('WCST Match Debug:', {
      currentCard: gameState.currentCard,
      selectedCard,
      currentRule: gameState.currentRule,
      isCorrect,
      feedback: isCorrect ? 'Correct!' : 'Incorrect'
    });
    
    const responseTime = Date.now() - startTime;
    
    setGameState(prev => {
      const newState = {
        ...prev,
        attempts: prev.attempts + 1,
        stats: {
          ...prev.stats,
          totalAttempts: prev.stats.totalAttempts + 1,
          totalCorrect: prev.stats.totalCorrect + (isCorrect ? 1 : 0),
          totalIncorrect: prev.stats.totalIncorrect + (isCorrect ? 0 : 1),
          averageResponseTime: (prev.stats.averageResponseTime * prev.stats.totalAttempts + responseTime) / (prev.stats.totalAttempts + 1),
        },
        gamePhase: 'feedback' as WCSTPhase,
      };

      if (isCorrect) {
        newState.correctCount = prev.correctCount + 1;
        newState.consecutiveCorrect = prev.consecutiveCorrect + 1;
      } else {
        newState.consecutiveCorrect = 0;
        // Check if this is a perseveration error (sticking to old rule after switch)
        if (prev.consecutiveCorrect >= 6 && prev.ruleSwitches > 0) {
          newState.perseverationErrors = prev.perseverationErrors + 1;
        }
      }

      return newState;
    });

    setFeedback(isCorrect ? 'Correct!' : 'Incorrect');
    
    // Check if we should switch rules
    if (isCorrect && shouldSwitchWCSTRule(gameState.consecutiveCorrect + 1)) {
      setTimeout(() => {
        switchRule();
      }, 1500);
    } else {
      setTimeout(() => {
        nextCard();
      }, 1500);
    }
  };

  const switchRule = () => {
    const currentRule = gameState.currentRule;
    let newRule = chooseWCSTRule();
    
    // Ensure new rule is different from current
    while (newRule === currentRule) {
      newRule = chooseWCSTRule();
    }

    setGameState(prev => ({
      ...prev,
      currentRule: newRule,
      consecutiveCorrect: 0,
      ruleSwitches: prev.ruleSwitches + 1,
      stats: {
        ...prev.stats,
        ruleBreaks: prev.stats.ruleBreaks + 1,
      },
    }));

    // Only show rule change notification if there are still attempts left after this one
    if (gameState.attempts < 29) {
      setShowRuleChange(true);
      setTimeout(() => {
        setShowRuleChange(false);
        nextCard();
      }, 2000);
    } else {
      // If this is the last attempt, don't show rule change notification
      nextCard();
    }
  };

  const nextCard = () => {
    // Clear feedback when moving to next card
    setFeedback('');
    
    if (gameState.attempts >= 30) {
      // Save final results
      const finalScore = calculateWCSTScore(
        gameState.stats.totalAttempts,
        gameState.stats.totalCorrect,
        gameState.perseverationErrors
      );
      
      updateGameResult('wcst', 1, finalScore, gameState.stats.totalCorrect, gameState.stats.totalIncorrect, gameState.stats.averageResponseTime);
      
      setGameState(prev => ({
        ...prev,
        gamePhase: 'complete',
        isComplete: true,
      }));
      return;
    }

    const nextCardIndex = gameState.attempts + 1;
    if (nextCardIndex < deck.length) {
      setGameState(prev => ({
        ...prev,
        currentCard: deck[nextCardIndex],
        gamePhase: 'display',
      }));
      setStartTime(Date.now());
    } else {
      // Save final results
      const finalScore = calculateWCSTScore(
        gameState.stats.totalAttempts,
        gameState.stats.totalCorrect,
        gameState.perseverationErrors
      );
      
      updateGameResult('wcst', 1, finalScore, gameState.stats.totalCorrect, gameState.stats.totalIncorrect, gameState.stats.averageResponseTime);
      
      setGameState(prev => ({
        ...prev,
        gamePhase: 'complete',
        isComplete: true,
      }));
    }
  };

  const getShapeIcon = (shape: string) => {
    switch (shape) {
      case 'Circle': return <Circle className="w-8 h-8" />;
      case 'Triangle': return <Triangle className="w-8 h-8" />;
      case 'Star': return <Star className="w-8 h-8" />;
      case 'Square': return <Square className="w-8 h-8" />;
      default: return <Circle className="w-8 h-8" />;
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'Red': return 'text-red-500';
      case 'Green': return 'text-green-500';
      case 'Blue': return 'text-blue-500';
      case 'Yellow': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const renderCard = (card: WCSTCard, isClickable: boolean = false, onClick?: () => void) => (
    <Card 
      className={`p-4 border-2 transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:border-blue-500 hover:shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        <div className={`flex flex-col items-center space-y-2 ${getColorClass(card.color)}`}>
          <div className="flex flex-wrap justify-center gap-1">
            {Array.from({ length: card.number }).map((_, i) => (
              <div key={i}>
                {getShapeIcon(card.shape)}
              </div>
            ))}
          </div>
          <div className="text-sm font-medium">
            {card.color} {card.shape} ({card.number})
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const finalScore = calculateWCSTScore(
    gameState.stats.totalAttempts,
    gameState.stats.totalCorrect,
    gameState.perseverationErrors
  );

  // Instructions screen
  if (showInstructions) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold">Wisconsin Card Sorting Test</h1>
          </div>
          <Button onClick={onBackToMenu} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="text-purple-600 text-6xl mb-4">🧠</div>
              <h2 className="text-3xl font-bold text-purple-600">How to Play</h2>
              
              <div className="space-y-4 text-left max-w-2xl mx-auto">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">🎯 Goal</h3>
                  <p>Match cards according to a hidden rule. The rule can be based on color, shape, or number.</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">🔄 Rule Changes</h3>
                  <p>After 6 consecutive correct matches, the rule will change without warning. You must adapt!</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">📊 Scoring</h3>
                  <p>You'll complete 30 attempts. Higher accuracy and fewer perseveration errors = better score.</p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="font-bold text-lg mb-2 text-orange-600">⚠️ Important</h3>
                  <p className="text-orange-600">The sorting rule is hidden - you must discover it through trial and error!</p>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowInstructions(false)} 
                className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-3"
              >
                Start Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState.gamePhase === 'complete') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold">Wisconsin Card Sorting Test</h1>
          </div>
          <Button onClick={onBackToMenu} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h2 className="text-3xl font-bold text-green-600">Test Complete!</h2>
              <p className="text-xl text-gray-600">Final Score: {finalScore}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{gameState.stats.totalAttempts}</div>
                  <div className="text-sm text-gray-600">Total Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{gameState.stats.totalCorrect}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{gameState.stats.totalIncorrect}</div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{gameState.ruleSwitches}</div>
                  <div className="text-sm text-gray-600">Rule Switches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{gameState.perseverationErrors}</div>
                  <div className="text-sm text-gray-600">Perseveration Errors</div>
                </div>
              </div>

              <div className="flex justify-center space-x-4 mt-8">
                <Button onClick={initializeGame} className="bg-purple-600 hover:bg-purple-700">
                  Play Again
                </Button>
                <Button onClick={onBackToMenu} variant="outline">
                  Back to Menu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold">Wisconsin Card Sorting Test</h1>
        </div>
        <Button onClick={onBackToMenu} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Button>
      </div>



      {showRuleChange && (
        <Card className="border-4 border-orange-500 bg-gradient-to-r from-orange-100 to-yellow-100 shadow-2xl animate-pulse">
          <CardContent className="p-8 text-center">
            <div className="text-orange-600 text-6xl mb-4 animate-bounce">⚠️</div>
            <h3 className="text-3xl font-bold text-orange-600 mb-4 uppercase tracking-wide">RULE HAS CHANGED!</h3>
            <p className="text-xl text-orange-700 font-semibold">The sorting rule has switched. You must figure out the new rule through trial and error.</p>
          </CardContent>
        </Card>
      )}

      {gameState.gamePhase === 'feedback' && (
        <Card className={`border-2 ${feedback === 'Correct!' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <CardContent className="p-4 text-center">
            <h3 className={`text-lg font-bold ${feedback === 'Correct!' ? 'text-green-600' : 'text-red-600'}`}>
              {feedback === 'Correct!' ? '✓' : '✗'} {feedback}
            </h3>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Current Card to Match</h2>
              <div className="flex justify-center">
                <div className="w-40">
                  {renderCard(gameState.currentCard)}
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold mb-4">Choose a Reference Card to Match</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gameState.referenceCards.map((card, index) => (
                  <div key={index} className="w-full">
                    {renderCard(card, gameState.gamePhase === 'display', () => handleCardSelection(index))}
                  </div>
                ))}
              </div>
            </div>


          </div>
        </CardContent>
      </Card>
    </div>
  );
}