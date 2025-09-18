import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, Sparkles, X, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AIJobManager, AIJobRequest, AIJobResponse } from '@/services/aiJobManager';

interface ChatReplySuggestionsProps {
  incomingMessage: {
    id: string;
    content: string;
    senderId: string;
    senderName?: string;
  };
  onSelectSuggestion: (suggestion: string) => void;
  onClose: () => void;
  isVisible: boolean;
  chatContext?: any;
  userId?: string;
}

interface SuggestionOption {
  id: string;
  text: string;
  tone: 'professional' | 'casual' | 'friendly' | 'brief';
  type: 'quick' | 'detailed' | 'question';
}

const ChatReplySuggestions: React.FC<ChatReplySuggestionsProps> = ({
  incomingMessage,
  onSelectSuggestion,
  onClose,
  isVisible,
  chatContext,
  userId
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isVisible && incomingMessage.content) {
      generateSuggestions();
    }
  }, [isVisible, incomingMessage.content]);

  const generateSuggestions = async () => {
    if (!incomingMessage?.content) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const jobRequest: AIJobRequest = {
        jobType: 'auto_reply_chat',
        query: `Generate 3 different reply suggestions for this message: "${incomingMessage.content}". 
                Provide one professional, one casual, and one brief response. 
                Format as JSON array with objects containing 'text' and 'tone' fields.`,
        context: {
          incomingMessage: incomingMessage.content,
          senderName: incomingMessage.senderName,
          chatContext: chatContext || {},
          requestType: 'reply_suggestions'
        },
        userId: userId || 'anonymous'
      };
      
      const response = await fetch('/api/ai-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobRequest),
      });

      if (response.ok) {
        const result: AIJobResponse = await response.json();
        
        // Try to parse AI response as JSON, fallback to simple suggestions
        let parsedSuggestions: SuggestionOption[];
        
        try {
          const aiSuggestions = JSON.parse(result.response);
          parsedSuggestions = aiSuggestions.map((suggestion: any, index: number) => ({
            id: `suggestion-${index}`,
            text: suggestion.text || suggestion,
            tone: suggestion.tone || ['professional', 'casual', 'friendly'][index] || 'casual',
            type: index === 0 ? 'quick' : index === 1 ? 'detailed' : 'question'
          }));
        } catch {
          // Fallback: split response into sentences and create suggestions
          const sentences = result.response.split(/[.!?]+/).filter(s => s.trim().length > 0);
          parsedSuggestions = sentences.slice(0, 3).map((sentence, index) => ({
            id: `suggestion-${index}`,
            text: sentence.trim() + (sentence.trim().endsWith('.') ? '' : '.'),
            tone: ['professional', 'casual', 'friendly'][index] as any,
            type: index === 0 ? 'quick' : index === 1 ? 'detailed' : 'question'
          }));
        }
        
        setSuggestions(parsedSuggestions);
        
        toast({
          title: "Reply Suggestions Ready",
          description: `Generated ${parsedSuggestions.length} suggestions for your response`,
        });
      } else {
        throw new Error(`Failed to generate suggestions: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error generating reply suggestions:', error);
      setError('Failed to generate suggestions');
      
      // Provide fallback suggestions
      const fallbackSuggestions: SuggestionOption[] = [
        {
          id: 'fallback-1',
          text: 'Thanks for your message! I\'ll get back to you shortly.',
          tone: 'professional',
          type: 'quick'
        },
        {
          id: 'fallback-2', 
          text: 'Got it! Let me think about this and respond.',
          tone: 'casual',
          type: 'detailed'
        },
        {
          id: 'fallback-3',
          text: 'Could you provide more details about this?',
          tone: 'friendly',
          type: 'question'
        }
      ];
      
      setSuggestions(fallbackSuggestions);
    } finally {
      setIsLoading(false);
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'casual': return 'bg-green-100 text-green-800';
      case 'friendly': return 'bg-purple-100 text-purple-800';
      case 'brief': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quick': return <Send className="h-3 w-3" />;
      case 'detailed': return <Bot className="h-3 w-3" />;
      case 'question': return <Sparkles className="h-3 w-3" />;
      default: return <Bot className="h-3 w-3" />;
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="w-full max-w-md mx-auto mb-4 border-l-4 border-l-blue-500 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4 text-blue-500" />
            AI Reply Suggestions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Message:</strong> "{incomingMessage.content.slice(0, 50)}{incomingMessage.content.length > 50 ? '...' : ''}"
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Generating suggestions...</span>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={generateSuggestions}
              className="text-xs"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelectSuggestion(suggestion.text)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    {getTypeIcon(suggestion.type)}
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getToneColor(suggestion.tone)}`}
                    >
                      {suggestion.tone}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {suggestion.text}
                </p>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Click any suggestion to use it as your reply
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatReplySuggestions;