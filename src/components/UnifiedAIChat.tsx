import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Brain, 
  Sparkles, 
  Target,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AIJobManager, AIJobRequest, AIJobResponse } from '@/services/aiJobManager';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  jobType?: string;
  model?: string;
  aiModel?: string;
}

interface UnifiedAIChatProps {
  taskContext?: any;
  projectContext?: any;
  chatContext?: any;
  userId?: string;
  enableJobDetection?: boolean;
  defaultModel?: 'gemini' | 'openai' | 'cohere' | 'deepai';
}

const MODEL_CONFIGS = {
  gemini: {
    name: 'Gemini',
    icon: Brain,
    color: 'bg-blue-500',
    endpoint: '/api/chat'
  },
  openai: {
    name: 'ChatGPT',
    icon: Bot,
    color: 'bg-green-500',
    endpoint: '/api/chat'
  },
  cohere: {
    name: 'Cohere',
    icon: Sparkles,
    color: 'bg-purple-500',
    endpoint: '/api/chat'
  },
  deepai: {
    name: 'DeepAI',
    icon: Target,
    color: 'bg-orange-500',
    endpoint: '/api/chat'
  }
};

const UnifiedAIChat: React.FC<UnifiedAIChatProps> = ({
  taskContext,
  projectContext,
  chatContext,
  userId,
  enableJobDetection = true,
  defaultModel = 'gemini'
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<keyof typeof MODEL_CONFIGS>(defaultModel);
  const [selectedJobType, setSelectedJobType] = useState<string>('auto');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildContext = () => {
    const context: any = {};
    
    if (taskContext) {
      context.tasks = taskContext;
    }
    
    if (projectContext) {
      context.projects = projectContext;
    }
    
    if (chatContext) {
      context.chat = chatContext;
    }
    
    return context;
  };

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response;
      let aiMessage: Message;

      // Try job-based AI first if enabled
      if (enableJobDetection && selectedJobType !== 'traditional') {
        try {
          const jobRequest: AIJobRequest = {
            query: userMessage.content,
            context: buildContext(),
            userId: userId || 'anonymous',
            jobType: selectedJobType === 'auto' ? undefined : selectedJobType
          };

          console.log('Job-based AI request:', jobRequest);
          
          const jobResponse = await fetch('/api/ai-job', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(jobRequest),
          });

          if (jobResponse.ok) {
            const jobResult: AIJobResponse = await jobResponse.json();
            
            aiMessage = {
              id: generateMessageId(),
              role: 'assistant',
              content: jobResult.response,
              timestamp: new Date(),
              jobType: jobResult.jobType,
              aiModel: jobResult.model || selectedModel
            };
            
            setMessages(prev => [...prev, aiMessage]);
            
            toast({
              title: "Smart AI Response",
              description: `Detected: ${jobResult.jobType} task`,
            });
            
            setIsLoading(false);
            return;
          }
        } catch (jobError) {
          console.log('Job-based AI failed, falling back to traditional chat:', jobError);
        }
      }

      // Fallback to traditional chat
      const requestBody = {
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        model: selectedModel
      };
      
      console.log(`${MODEL_CONFIGS[selectedModel].name} API Request:`, requestBody);
      
      response = await fetch(MODEL_CONFIGS[selectedModel].endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`${MODEL_CONFIGS[selectedModel].name} API Response:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const responseData = await response.json();
        
        aiMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: responseData.response || responseData.content || 'No response content received.',
          timestamp: new Date(),
          aiModel: selectedModel
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorText = await response.text();
        console.error(`${MODEL_CONFIGS[selectedModel].name} API request failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        const errorMessage: Message = {
          id: generateMessageId(),
          role: 'assistant',
          content: `Error: Failed to get response. ${response.status} ${response.statusText}`,
          timestamp: new Date(),
          aiModel: selectedModel
        };
        
        setMessages(prev => [...prev, errorMessage]);
        
        toast({
          title: "Error",
          description: `Failed to get response from ${MODEL_CONFIGS[selectedModel].name}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Chat request failed:', error);
      
      const errorMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        aiModel: selectedModel
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ModelIcon = MODEL_CONFIGS[selectedModel].icon;

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ModelIcon className="h-5 w-5" />
            AI Chat 
            Suham ne banaya, chal raha hai duaon pe
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={(value: keyof typeof MODEL_CONFIGS) => setSelectedModel(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODEL_CONFIGS).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {config.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {enableJobDetection && (
              <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="task_management">Task Mgmt</SelectItem>
                  <SelectItem value="project_planning">Planning</SelectItem>
                  <SelectItem value="code_review">Code Review</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className={`p-2 rounded-full ${MODEL_CONFIGS[message.aiModel as keyof typeof MODEL_CONFIGS]?.color || 'bg-gray-500'}`}>
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white ml-auto'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.jobType && (
                    <Badge variant="secondary" className="text-xs">
                      {message.jobType}
                    </Badge>
                  )}
                  {message.aiModel && (
                    <Badge variant="outline" className="text-xs">
                      {MODEL_CONFIGS[message.aiModel as keyof typeof MODEL_CONFIGS]?.name || message.aiModel}
                    </Badge>
                  )}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="p-2 rounded-full bg-blue-500">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${MODEL_CONFIGS[selectedModel].color}`}>
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${MODEL_CONFIGS[selectedModel].name}...`}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UnifiedAIChat;