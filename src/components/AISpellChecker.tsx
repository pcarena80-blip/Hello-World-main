import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader2, Wand2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface SpellCheckSuggestion {
  word: string;
  suggestions: string[];
  start: number;
  end: number;
  severity: 'error' | 'warning' | 'info';
  type: 'spelling' | 'grammar' | 'punctuation' | 'style';
  message?: string;
}

interface AISpellCheckerProps {
  text: string;
  onTextChange: (text: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function AISpellChecker({ 
  text, 
  onTextChange, 
  placeholder = "Start typing...", 
  className = "",
  rows = 3
}: AISpellCheckerProps) {
  const [suggestions, setSuggestions] = useState<SpellCheckSuggestion[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SpellCheckSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Enhanced AI spell checking function with grammar and style checking
  const checkSpelling = async (text: string): Promise<SpellCheckSuggestion[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const suggestions: SpellCheckSuggestion[] = [];
    
    // 1. SPELLING CHECKS
    const words = text.split(/\s+/);
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 2) {
        const spellingSuggestions: { [key: string]: { suggestions: string[], message?: string } } = {
          'teh': { suggestions: ['the'], message: 'Common typo' },
          'recieve': { suggestions: ['receive'], message: 'I before E rule' },
          'seperate': { suggestions: ['separate'], message: 'Common misspelling' },
          'occured': { suggestions: ['occurred'], message: 'Double consonant needed' },
          'definately': { suggestions: ['definitely'], message: 'Common misspelling' },
          'accomodate': { suggestions: ['accommodate'], message: 'Double consonant needed' },
          'begining': { suggestions: ['beginning'], message: 'Double consonant needed' },
          'neccessary': { suggestions: ['necessary'], message: 'One C, two S' },
          'priviledge': { suggestions: ['privilege'], message: 'Common misspelling' },
          'acheive': { suggestions: ['achieve'], message: 'I before E rule' },
          'existance': { suggestions: ['existence'], message: 'Common misspelling' },
          'occassion': { suggestions: ['occasion'], message: 'One C, two S' },
          'embarass': { suggestions: ['embarrass'], message: 'Double consonant needed' },
          'maintainance': { suggestions: ['maintenance'], message: 'Common misspelling' },
          'rythm': { suggestions: ['rhythm'], message: 'Silent H' },
          'adress': { suggestions: ['address'], message: 'Double consonant needed' },
          'becuase': { suggestions: ['because'], message: 'Common typo' },
          'beleive': { suggestions: ['believe'], message: 'I before E rule' },
          'calender': { suggestions: ['calendar'], message: 'Common misspelling' },
          'cemetary': { suggestions: ['cemetery'], message: 'Common misspelling' },
          'commitee': { suggestions: ['committee'], message: 'Double consonant needed' },
          'concious': { suggestions: ['conscious'], message: 'Common misspelling' },
          'dependance': { suggestions: ['dependence'], message: 'Common misspelling' },
          'exagerate': { suggestions: ['exaggerate'], message: 'Double consonant needed' },
          'goverment': { suggestions: ['government'], message: 'Common misspelling' },
          'independant': { suggestions: ['independent'], message: 'Common misspelling' },
          'persistant': { suggestions: ['persistent'], message: 'Common misspelling' },
          'reccomend': { suggestions: ['recommend'], message: 'One C, two M' },
          'refered': { suggestions: ['referred'], message: 'Double consonant needed' },
          'succesful': { suggestions: ['successful'], message: 'Double consonant needed' },
          'thier': { suggestions: ['their'], message: 'Common typo' },
          'untill': { suggestions: ['until'], message: 'Common misspelling' },
          'writting': { suggestions: ['writing'], message: 'Double consonant needed' },
          'alot': { suggestions: ['a lot'], message: 'Should be two words' },
          'alright': { suggestions: ['all right'], message: 'Should be two words' },
          'everytime': { suggestions: ['every time'], message: 'Should be two words' },
          'incase': { suggestions: ['in case'], message: 'Should be two words' },
          'infront': { suggestions: ['in front'], message: 'Should be two words' },
          'inorder': { suggestions: ['in order'], message: 'Should be two words' },
          'upto': { suggestions: ['up to'], message: 'Should be two words' }
        };
        
        if (spellingSuggestions[cleanWord.toLowerCase()]) {
          const start = text.indexOf(word);
          suggestions.push({
            word: cleanWord,
            suggestions: spellingSuggestions[cleanWord.toLowerCase()].suggestions,
            start,
            end: start + word.length,
            severity: 'error',
            type: 'spelling',
            message: spellingSuggestions[cleanWord.toLowerCase()].message
          });
        }
      }
    });

    // 2. GRAMMAR CHECKS
    const grammarPatterns = [
      {
        pattern: /\b(its)\b(?=\s+[a-z])/gi,
        suggestions: ["it's"],
        message: "Use 'it's' for 'it is' or 'it has'",
        type: 'grammar' as const
      },
      {
        pattern: /\b(your)\b(?=\s+(going|coming|doing|trying|getting|making|taking|having|being|feeling|looking|working|studying|learning|teaching|helping|giving|sending|bringing|buying|selling|building|creating|designing|developing|programming|coding|writing|reading|speaking|listening|watching|playing|cooking|cleaning|driving|walking|running|jumping|dancing|singing|paint|draw|write|read|learn|teach|help|give|send|bring|buy|sell|build|create|design|develop|program|code|write|read|speak|listen|watch|play|cook|clean|drive|walk|run|jump|dance|sing))/gi,
        suggestions: ["you're"],
        message: "Use 'you're' for 'you are'",
        type: 'grammar' as const
      },
      {
        pattern: /\b(there)\b(?=\s+(going|coming|doing|trying|getting|making|taking|having|being|feeling|looking|working|studying|learning|teaching|helping|giving|sending|bringing|buying|selling|building|creating|designing|developing|programming|coding|writing|reading|speaking|listening|watching|playing|cooking|cleaning|driving|walking|running|jumping|dancing|singing|paint|draw|write|read|learn|teach|help|give|send|bring|buy|sell|build|create|design|develop|program|code|write|read|speak|listen|watch|play|cook|clean|drive|walk|run|jump|dance|sing))/gi,
        suggestions: ["they're"],
        message: "Use 'they're' for 'they are'",
        type: 'grammar' as const
      },
      {
        pattern: /\b(should of|could of|would of|might of|must of)\b/gi,
        suggestions: ["should have", "could have", "would have", "might have", "must have"],
        message: "Use 'have' instead of 'of' after modal verbs",
        type: 'grammar' as const
      },
      {
        pattern: /\b(less)\b(?=\s+(then|than))/gi,
        suggestions: ["fewer"],
        message: "Use 'fewer' for countable items, 'less' for uncountable",
        type: 'grammar' as const
      },
      {
        pattern: /\b(amount)\b(?=\s+(of\s+)?(people|items|things|books|cars|houses|students|employees|customers|users|visitors|guests|friends|family|members|players|teams|companies|organizations|countries|cities|states|provinces|regions|areas|sections|parts|pieces|units|elements|components|features|functions|methods|tools|resources|materials|products|services|solutions|options|choices|alternatives|possibilities|opportunities|challenges|problems|issues|concerns|questions|answers|responses|replies|comments|suggestions|recommendations|proposals|ideas|thoughts|opinions|views|perspectives|approaches|strategies|tactics|techniques|skills|abilities|talents|gifts|strengths|weaknesses|advantages|disadvantages|benefits|costs|risks|rewards|results|outcomes|consequences|effects|impacts|influences|factors|variables|parameters|criteria|standards|requirements|specifications|guidelines|rules|regulations|laws|policies|procedures|processes|systems|frameworks|models|theories|concepts|principles|values|beliefs|attitudes|emotions|feelings|experiences|memories|dreams|goals|objectives|targets|aims|purposes|reasons|causes|motivations|incentives|drivers|triggers|stimuli|signals|indicators|markers|signs|symptoms|clues|hints|tips|tricks|secrets|mysteries|puzzles|riddles|challenges|contests|competitions|games|sports|activities|events|occasions|celebrations|festivals|holidays|vacations|trips|journeys|adventures|expeditions|missions|projects|tasks|assignments|duties|responsibilities|obligations|commitments|promises|agreements|contracts|deals|arrangements|plans|schedules|timetables|calendars|agendas|programs|courses|classes|lessons|sessions|meetings|conferences|seminars|workshops|training|education|learning|teaching|coaching|mentoring|guidance|advice|counsel|support|help|assistance|aid|service|care|treatment|therapy|healing|recovery|rehabilitation|improvement|development|growth|progress|advancement|enhancement|optimization|upgrade|update|upgrade|renewal|refresh|revival|restoration|repair|maintenance|service|support|help|assistance|aid|care|treatment|therapy|healing|recovery|rehabilitation|improvement|development|growth|progress|advancement|enhancement|optimization|upgrade|update|renewal|refresh|revival|restoration|repair|maintenance))/gi,
        suggestions: ["number"],
        message: "Use 'number' for countable items, 'amount' for uncountable",
        type: 'grammar' as const
      }
    ];

    grammarPatterns.forEach(({ pattern, suggestions: grammarSuggestions, message, type }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        suggestions.push({
          word: match[0],
          suggestions: grammarSuggestions,
          start: match.index,
          end: match.index + match[0].length,
          severity: 'warning',
          type,
          message
        });
      }
    });

    // 3. PUNCTUATION CHECKS
    const punctuationPatterns = [
      {
        pattern: /([a-zA-Z])([A-Z])/g,
        suggestions: ["$1 $2"],
        message: "Missing space between words",
        type: 'punctuation' as const
      },
      {
        pattern: /\b([a-zA-Z]+)([A-Z][a-zA-Z]+)\b/g,
        suggestions: ["$1 $2"],
        message: "Missing space between words",
        type: 'punctuation' as const
      },
      {
        pattern: /([.!?])([A-Z])/g,
        suggestions: ["$1 $2"],
        message: "Missing space after sentence ending",
        type: 'punctuation' as const
      },
      {
        pattern: /([a-zA-Z])([0-9])/g,
        suggestions: ["$1 $2"],
        message: "Consider adding space between word and number",
        type: 'punctuation' as const
      }
    ];

    punctuationPatterns.forEach(({ pattern, suggestions: punctSuggestions, message, type }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        suggestions.push({
          word: match[0],
          suggestions: punctSuggestions,
          start: match.index,
          end: match.index + match[0].length,
          severity: 'info',
          type,
          message
        });
      }
    });

    // 4. STYLE CHECKS
    const stylePatterns = [
      {
        pattern: /\b(very\s+very)\b/gi,
        suggestions: ["extremely", "incredibly", "remarkably"],
        message: "Avoid redundant 'very very'",
        type: 'style' as const
      },
      {
        pattern: /\b(really\s+really)\b/gi,
        suggestions: ["truly", "genuinely", "absolutely"],
        message: "Avoid redundant 'really really'",
        type: 'style' as const
      },
      {
        pattern: /\b(a lot of)\b/gi,
        suggestions: ["many", "numerous", "several"],
        message: "Consider more specific alternatives",
        type: 'style' as const
      },
      {
        pattern: /\b(and\s+and)\b/gi,
        suggestions: ["and"],
        message: "Remove redundant 'and'",
        type: 'style' as const
      }
    ];

    stylePatterns.forEach(({ pattern, suggestions: styleSuggestions, message, type }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        suggestions.push({
          word: match[0],
          suggestions: styleSuggestions,
          start: match.index,
          end: match.index + match[0].length,
          severity: 'info',
          type,
          message
        });
      }
    });
    
    return suggestions;
  };

  // Check spelling when text changes
  useEffect(() => {
    if (text.length > 3) { // Reduced from 10 to 3 for better responsiveness
      const timeoutId = setTimeout(async () => {
        setIsChecking(true);
        try {
          const results = await checkSpelling(text);
          setSuggestions(results);
          console.log('Spell check results:', results); // Debug log
        } catch (error) {
          console.error('Spell check failed:', error);
        } finally {
          setIsChecking(false);
        }
      }, 300); // Reduced debounce time for better responsiveness
      
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [text]);

  // Handle suggestion selection
  const applySuggestion = (suggestion: SpellCheckSuggestion, replacement: string) => {
    const newText = text.substring(0, suggestion.start) + 
                   replacement + 
                   text.substring(suggestion.end);
    onTextChange(newText);
    setSelectedSuggestion(null);
    setShowSuggestions(false);
  };

  // Handle text selection for suggestions
  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      
      if (start !== end) {
        const selectedText = text.substring(start, end);
        const suggestion = suggestions.find(s => 
          s.start <= start && s.end >= end && s.word === selectedText
        );
        
        if (suggestion) {
          setSelectedSuggestion(suggestion);
          setShowSuggestions(true);
        }
      }
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestion(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onSelect={handleTextSelection}
          placeholder={placeholder}
          className={`w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${className}`}
          rows={rows}
        />
        
        {/* AI Status Indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {isChecking && (
            <div className="flex items-center gap-1 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">AI checking...</span>
            </div>
          )}
          
          {!isChecking && suggestions.length === 0 && text.length > 3 && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">No issues found</span>
            </div>
          )}
          
          {!isChecking && suggestions.length > 0 && (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">
                {suggestions.length} issue{suggestions.length !== 1 ? 's' : ''}
                {suggestions.some(s => s.type === 'spelling') && ' 🔤'}
                {suggestions.some(s => s.type === 'grammar') && ' 📝'}
                {suggestions.some(s => s.type === 'punctuation') && ' ❗'}
                {suggestions.some(s => s.type === 'style') && ' ✨'}
              </span>
            </div>
          )}
          
          {/* Debug: Manual check button */}
          {text.length > 0 && !isChecking && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                setIsChecking(true);
                try {
                  const results = await checkSpelling(text);
                  setSuggestions(results);
                  console.log('Manual spell check results:', results);
                } catch (error) {
                  console.error('Manual spell check failed:', error);
                } finally {
                  setIsChecking(false);
                }
              }}
              className="text-xs h-6 px-2"
            >
              <Wand2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions Popup */}
      {showSuggestions && selectedSuggestion && (
        <div
          ref={suggestionRef}
          className="absolute z-50 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg min-w-64"
          style={{
            top: '100%',
            left: '0',
            right: '0'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Wand2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">AI Suggestions</span>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">"{selectedSuggestion.word}"</span> might be misspelled
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedSuggestion.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestion(selectedSuggestion, suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(false)}
                className="text-xs text-gray-500"
              >
                Dismiss
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Add to dictionary (mock)
                  setSuggestions(suggestions.filter(s => s !== selectedSuggestion));
                  setShowSuggestions(false);
                }}
                className="text-xs text-blue-600"
              >
                Add to dictionary
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Suggestions */}
      {suggestions.length > 0 && !showSuggestions && (
        <div className="mt-3 space-y-2">
          <div className="text-xs text-gray-600 font-medium mb-2">AI Suggestions:</div>
          {suggestions.slice(0, 5).map((suggestion, index) => {
            const getTypeColor = (type: string) => {
              switch (type) {
                case 'spelling': return 'text-red-600 border-red-200 bg-red-50';
                case 'grammar': return 'text-orange-600 border-orange-200 bg-orange-50';
                case 'punctuation': return 'text-blue-600 border-blue-200 bg-blue-50';
                case 'style': return 'text-purple-600 border-purple-200 bg-purple-50';
                default: return 'text-gray-600 border-gray-200 bg-gray-50';
              }
            };

            const getTypeIcon = (type: string) => {
              switch (type) {
                case 'spelling': return '🔤';
                case 'grammar': return '📝';
                case 'punctuation': return '❗';
                case 'style': return '✨';
                default: return '💡';
              }
            };

            return (
              <div key={index} className="flex items-start gap-3 text-sm p-2 rounded-lg border border-gray-100 bg-white">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-xs ${getTypeColor(suggestion.type)}`}>
                      {suggestion.word}
                    </Badge>
                    <span className="text-xs text-gray-500 capitalize">{suggestion.type}</span>
                    {suggestion.message && (
                      <span className="text-xs text-gray-600 italic">- {suggestion.message}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.suggestions.slice(0, 3).map((suggestionText, suggestionIndex) => (
                      <Button
                        key={suggestionIndex}
                        variant="ghost"
                        size="sm"
                        onClick={() => applySuggestion(suggestion, suggestionText)}
                        className="text-xs h-6 px-2 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {suggestionText}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {suggestions.length > 5 && (
            <div className="text-xs text-gray-500 text-center">
              +{suggestions.length - 5} more suggestions available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
