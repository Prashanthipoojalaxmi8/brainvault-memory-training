import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Grid3X3, Grid2X2, Calculator } from "lucide-react";

interface InstructionsModalProps {
  open: boolean;
  onClose: () => void;
}

export function InstructionsModal({ open, onClose }: InstructionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">How to Play</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Training Modes</h4>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900/20 rounded p-1 flex-shrink-0">
                  <ArrowRight className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <strong>Digit Span Forward:</strong> Remember number sequences and repeat them in the same order.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 dark:bg-purple-900/20 rounded p-1 flex-shrink-0">
                  <ArrowLeft className="h-3 w-3 text-purple-600" />
                </div>
                <div>
                  <strong>Digit Span Backward:</strong> Remember number sequences and repeat them in reverse order.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 dark:bg-green-900/20 rounded p-1 flex-shrink-0">
                  <Grid3X3 className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <strong>Spatial Span Forward:</strong> Remember letter sequences and type them in the same order.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-orange-100 dark:bg-orange-900/20 rounded p-1 flex-shrink-0">
                  <Grid2X2 className="h-3 w-3 text-orange-600" />
                </div>
                <div>
                  <strong>Spatial Span Backward:</strong> Remember letter sequences and type them in reverse order.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-red-100 dark:bg-red-900/20 rounded p-1 flex-shrink-0">
                  <Calculator className="h-3 w-3 text-red-600" />
                </div>
                <div>
                  <strong>Operation Span Task:</strong> Solve math problems while remembering words, then recall all words in order.
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">How It Works</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Memory Training (4 modes)</h5>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>A sequence will be displayed for 3 seconds</li>
                  <li>The sequence disappears and you have 30 seconds to respond</li>
                  <li>Type your answer and press Submit or Enter</li>
                  <li>Get feedback and continue to the next level if correct</li>
                  <li>Sequences get longer as you progress (3 to 7 items)</li>
                  <li>The session ends when you reach level 7 or make too many mistakes</li>
                </ol>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Operation Span Task</h5>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>Solve math problems while remembering words shown after each problem</li>
                  <li>Complete all math-word pairs in a level (3 pairs per level)</li>
                  <li>Recall all words in the exact order they were presented</li>
                  <li>Progress through 3 levels with increasing difficulty</li>
                  <li>Type words separated by commas for recall</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Tips for Success</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>Focus completely on the sequence when it's shown</li>
              <li>Use verbal rehearsal to keep items in memory</li>
              <li>For backward modes, try to visualize reversing the sequence</li>
              <li>Take breaks between sessions to avoid mental fatigue</li>
              <li>Practice regularly to improve your working memory capacity</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Scoring</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>Base score increases with each level (Level × 50 points)</li>
              <li>Time bonus for faster responses (up to 60 extra points)</li>
              <li>Your best scores and levels are saved automatically</li>
              <li>Track your progress over time in the statistics panel</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-4">
          <Button onClick={onClose} className="w-full">
            Got It, Let's Start!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
