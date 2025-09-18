export interface AIJobType {
  id: string;
  name: string;
  description: string;
  preferredModel: 'gemini' | 'cohere';
  systemPrompt: string;
  category: 'task_management' | 'project_management' | 'chat' | 'general';
}

export interface AIJobRequest {
  jobType: string;
  query: string;
  context?: any;
  userId?: string;
}

export interface AIJobResponse {
  response: string;
  model: string;
  jobType: string;
  timestamp: string;
}

// Define job types with their contexts and preferred AI models
export const AI_JOB_TYPES: Record<string, AIJobType> = {
  // Task Management Jobs - Gemini (fast summarization, classification, structured data)
  summarize_tasks: {
    id: 'summarize_tasks',
    name: 'Summarize Tasks',
    description: 'Summarize user tasks and provide insights',
    preferredModel: 'gemini',
    systemPrompt: 'You are an AI assistant specialized in task management. Summarize the provided tasks clearly and concisely, highlighting priorities, deadlines, and progress. Focus on actionable insights.',
    category: 'task_management'
  },
  
  classify_task_priority: {
    id: 'classify_task_priority',
    name: 'Classify Task Priority',
    description: 'Analyze and suggest task priority levels',
    preferredModel: 'gemini',
    systemPrompt: 'You are an AI assistant that analyzes tasks and suggests appropriate priority levels (low, medium, high, urgent). Consider deadlines, dependencies, and business impact.',
    category: 'task_management'
  },
  
  suggest_task_breakdown: {
    id: 'suggest_task_breakdown',
    name: 'Suggest Task Breakdown',
    description: 'Break down complex tasks into smaller subtasks',
    preferredModel: 'gemini',
    systemPrompt: 'You are an AI assistant that breaks down complex tasks into smaller, manageable subtasks. Provide clear, actionable steps with estimated timeframes.',
    category: 'task_management'
  },
  
  analyze_task_progress: {
    id: 'analyze_task_progress',
    name: 'Analyze Task Progress',
    description: 'Analyze task progress and suggest improvements',
    preferredModel: 'gemini',
    systemPrompt: 'You are an AI assistant that analyzes task progress data and provides insights on productivity, bottlenecks, and improvement suggestions.',
    category: 'task_management'
  },
  
  // Project Management Jobs - Gemini (structured analysis)
  summarize_project_status: {
    id: 'summarize_project_status',
    name: 'Summarize Project Status',
    description: 'Provide project status summary and insights',
    preferredModel: 'gemini',
    systemPrompt: 'You are an AI assistant specialized in project management. Summarize project status, progress, risks, and provide actionable recommendations.',
    category: 'project_management'
  },
  
  suggest_project_timeline: {
    id: 'suggest_project_timeline',
    name: 'Suggest Project Timeline',
    description: 'Suggest realistic project timelines and milestones',
    preferredModel: 'gemini',
    systemPrompt: 'You are an AI assistant that creates realistic project timelines. Consider task dependencies, resource availability, and potential risks.',
    category: 'project_management'
  },
  
  // Chat & Communication Jobs - Cohere (creative writing, conversations)
  suggest_chat_reply: {
    id: 'suggest_chat_reply',
    name: 'Suggest Chat Reply',
    description: 'Suggest appropriate replies for chat messages',
    preferredModel: 'cohere',
    systemPrompt: 'You are an AI assistant that suggests professional and contextually appropriate replies for business chat messages. Keep responses concise and helpful.',
    category: 'chat'
  },
  
  generate_meeting_summary: {
    id: 'generate_meeting_summary',
    name: 'Generate Meeting Summary',
    description: 'Create meeting summaries from chat conversations',
    preferredModel: 'cohere',
    systemPrompt: 'You are an AI assistant that creates comprehensive meeting summaries from chat conversations. Include key decisions, action items, and next steps.',
    category: 'chat'
  },
  
  compose_professional_message: {
    id: 'compose_professional_message',
    name: 'Compose Professional Message',
    description: 'Compose professional messages and emails',
    preferredModel: 'cohere',
    systemPrompt: 'You are an AI assistant that composes professional, clear, and effective business messages. Adapt tone and style to the context provided.',
    category: 'chat'
  },
  
  // General Jobs - Cohere (creative and explanatory tasks)
  translate_text: {
    id: 'translate_text',
    name: 'Translate Text',
    description: 'Translate text between languages',
    preferredModel: 'cohere',
    systemPrompt: 'You are an AI assistant that provides accurate translations while maintaining context and tone. Specify the source and target languages clearly.',
    category: 'general'
  },
  
  generate_creative_content: {
    id: 'generate_creative_content',
    name: 'Generate Creative Content',
    description: 'Generate creative content like posts, descriptions, etc.',
    preferredModel: 'cohere',
    systemPrompt: 'You are an AI assistant that creates engaging, creative content. Adapt style and tone to the specified requirements and target audience.',
    category: 'general'
  },
  
  explain_concept: {
    id: 'explain_concept',
    name: 'Explain Concept',
    description: 'Explain complex concepts in simple terms',
    preferredModel: 'cohere',
    systemPrompt: 'You are an AI assistant that explains complex concepts in clear, simple terms. Use examples and analogies to make concepts easy to understand.',
    category: 'general'
  },
  
  general_chat: {
    id: 'general_chat',
    name: 'General Chat',
    description: 'General conversation and assistance',
    preferredModel: 'cohere',
    systemPrompt: 'You are a helpful AI assistant for a task and project management application. Provide helpful, professional responses while being conversational and friendly.',
    category: 'general'
  },

  // Team Chat AI Integration
  auto_reply_chat: {
    id: 'auto_reply_chat',
    name: 'Auto Reply Chat',
    description: 'Generate smart auto-replies for chat messages',
    preferredModel: 'cohere',
    systemPrompt: 'You are an AI assistant that generates short, helpful chat replies. Provide contextually appropriate responses that are professional yet conversational. Keep replies concise and actionable.',
    category: 'chat'
  },

  summarize_chat: {
    id: 'summarize_chat',
    name: 'Summarize Chat',
    description: 'Summarize team chat conversations into key points',
    preferredModel: 'gemini',
    systemPrompt: 'You summarize team chat conversations into key action points. Extract important decisions, deadlines, assignments, and next steps. Present information in a clear, organized format.',
    category: 'chat'
  },

  translate_chat: {
    id: 'translate_chat',
    name: 'Translate Chat',
    description: 'Translate team messages for multilingual teams',
    preferredModel: 'cohere',
    systemPrompt: 'You translate team messages into the target language while maintaining professional tone and context. Preserve technical terms and proper nouns when appropriate.',
    category: 'chat'
  },

  extract_tasks_from_chat: {
    id: 'extract_tasks_from_chat',
    name: 'Extract Tasks from Chat',
    description: 'Analyze chats and extract possible tasks',
    preferredModel: 'gemini',
    systemPrompt: 'You analyze chats and extract possible tasks for the project manager. Identify action items, deadlines, assignments, and deliverables mentioned in conversations. Format as structured task suggestions.',
    category: 'task_management'
  },

  // Project Management AI Integration
  create_project: {
    id: 'create_project',
    name: 'Create Project',
    description: 'Create structured project plans from plain text ideas',
    preferredModel: 'gemini',
    systemPrompt: 'You create a structured project plan from a plain text idea. Extract project name, objectives, timeline, deliverables, and team requirements. Return well-organized project data with realistic milestones.',
    category: 'project_management'
  },

  generate_project_description: {
    id: 'generate_project_description',
    name: 'Generate Project Description',
    description: 'Generate clear project descriptions, goals, and milestones',
    preferredModel: 'cohere',
    systemPrompt: 'You generate a clear project description, goals, and milestones. Create comprehensive project documentation that includes scope, objectives, success criteria, and key deliverables.',
    category: 'project_management'
  },

  suggest_team_roles: {
    id: 'suggest_team_roles',
    name: 'Suggest Team Roles',
    description: 'Suggest team member roles and assignments',
    preferredModel: 'gemini',
    systemPrompt: 'You suggest team member roles and assignments for a new project. Analyze project requirements and recommend appropriate roles, responsibilities, and team structure based on skills and workload.',
    category: 'project_management'
  },

  // Task Management AI Integration
  create_task: {
    id: 'create_task',
    name: 'Create Task',
    description: 'Create tasks with assignee, deadline, and description from user input',
    preferredModel: 'gemini',
    systemPrompt: `You are an AI assistant specialized in creating comprehensive tasks from natural language input. You can handle both specific task requests and random task generation.

For RANDOM TASK generation (when user asks for "random task", "create a random task", etc.):
- Generate a realistic, professional task that could exist in a business environment
- Include all task properties with sensible defaults
- Make it diverse and interesting (not always the same type)

For SPECIFIC TASK requests:
- Extract all available information from the user input
- Fill in missing details with intelligent assumptions

ALWAYS return a complete JSON object with ALL these fields:

{
  "title": "Clear, actionable task title (max 100 chars)",
  "description": "Detailed description explaining what needs to be done, why it's important, and any specific requirements",
  "priority": "High|Medium|Low (based on urgency, importance, and business impact)",
  "status": "upcoming|in-progress|completed|on-hold|cancelled (choose appropriate status)",
  "assignedTo": "user_name_or_email (from available users, or 'unassigned' if none specified)",
  "dueDate": "YYYY-MM-DD (calculate from natural language or set reasonable deadline)",
  "startDate": "YYYY-MM-DD (today or mentioned date)",
  "estimatedHours": number (realistic estimate based on task complexity),
  "tags": ["relevant", "keywords", "for", "categorization"]
}

Guidelines:
- Use context.currentDate for date calculations
- For random tasks: Create diverse, realistic business tasks (marketing, development, operations, etc.)
- For specific tasks: Extract all mentioned details and make reasonable assumptions for missing ones
- Priority: High for urgent/deadline-driven, Medium for normal business tasks, Low for nice-to-have items
- Estimated hours: 1-4 for simple tasks, 4-8 for medium complexity, 8+ for complex projects
- Tags: Use 2-4 relevant keywords that help categorize the task

Return ONLY the JSON object, no additional text.`,
    category: 'task_management'
  },

  prioritize_task: {
    id: 'prioritize_task',
    name: 'Prioritize Task',
    description: 'Analyze tasks and assign priority levels',
    preferredModel: 'gemini',
    systemPrompt: 'You analyze tasks and assign priority levels (High, Medium, Low). Consider deadlines, dependencies, business impact, and resource requirements to determine appropriate priority levels.',
    category: 'task_management'
  },

  generate_subtasks: {
    id: 'generate_subtasks',
    name: 'Generate Subtasks',
    description: 'Break down large tasks into smaller actionable subtasks',
    preferredModel: 'gemini',
    systemPrompt: 'You break down a large task into smaller actionable subtasks. Create logical task decomposition with clear dependencies, estimated timeframes, and specific deliverables for each subtask.',
    category: 'task_management'
  },

  summarize_progress: {
    id: 'summarize_progress',
    name: 'Summarize Progress',
    description: 'Summarize project and task updates for admin',
    preferredModel: 'gemini',
    systemPrompt: 'You summarize project and task updates for the admin. Provide comprehensive progress reports including completed tasks, pending items, blockers, and recommendations for next steps.',
    category: 'task_management'
  }
};

// Job type detection patterns
export const JOB_DETECTION_PATTERNS: Record<string, RegExp[]> = {
  summarize_tasks: [
    /summarize.*tasks?/i,
    /task.*summary/i,
    /overview.*tasks?/i,
    /what.*tasks?.*doing/i
  ],
  
  classify_task_priority: [
    /priority.*task/i,
    /how.*important.*task/i,
    /urgent.*task/i,
    /prioritize.*task/i
  ],
  
  suggest_task_breakdown: [
    /break.*down.*task/i,
    /subtasks?/i,
    /divide.*task/i,
    /steps.*complete/i
  ],
  
  analyze_task_progress: [
    /progress.*analysis/i,
    /how.*doing.*tasks?/i,
    /productivity.*report/i,
    /task.*performance/i
  ],
  
  summarize_project_status: [
    /project.*status/i,
    /summarize.*project/i,
    /project.*overview/i,
    /how.*project.*going/i
  ],
  
  suggest_project_timeline: [
    /timeline.*project/i,
    /schedule.*project/i,
    /when.*complete.*project/i,
    /project.*deadline/i
  ],
  
  suggest_chat_reply: [
    /suggest.*reply/i,
    /how.*respond/i,
    /what.*say/i,
    /reply.*suggestion/i
  ],
  
  generate_meeting_summary: [
    /meeting.*summary/i,
    /summarize.*meeting/i,
    /meeting.*notes/i,
    /action.*items/i
  ],
  
  compose_professional_message: [
    /compose.*message/i,
    /write.*email/i,
    /draft.*message/i,
    /professional.*message/i
  ],
  
  translate_text: [
    /translate/i,
    /translation/i,
    /convert.*language/i,
    /in.*spanish|french|german|chinese|japanese/i
  ],
  
  generate_creative_content: [
    /generate.*post/i,
    /create.*content/i,
    /write.*creative/i,
    /social.*media.*post/i
  ],
  
  explain_concept: [
    /explain/i,
    /what.*is/i,
    /how.*does.*work/i,
    /help.*understand/i
  ],

  // Team Chat AI Integration Patterns
  auto_reply_chat: [
    /auto.*reply/i,
    /suggest.*reply/i,
    /smart.*reply/i,
    /quick.*response/i,
    /how.*should.*respond/i
  ],

  summarize_chat: [
    /summarize.*chat/i,
    /chat.*summary/i,
    /key.*points.*conversation/i,
    /conversation.*summary/i,
    /what.*discussed/i
  ],

  translate_chat: [
    /translate.*message/i,
    /translate.*chat/i,
    /convert.*language.*message/i,
    /multilingual.*chat/i
  ],

  extract_tasks_from_chat: [
    /extract.*tasks.*chat/i,
    /tasks.*from.*conversation/i,
    /action.*items.*chat/i,
    /find.*tasks.*discussion/i,
    /todo.*from.*chat/i
  ],

  // Project Management AI Integration Patterns
  create_project: [
    /create.*project/i,
    /new.*project/i,
    /start.*project/i,
    /setup.*project/i,
    /project.*for/i
  ],

  generate_project_description: [
    /project.*description/i,
    /describe.*project/i,
    /project.*goals/i,
    /project.*objectives/i,
    /project.*scope/i
  ],

  suggest_team_roles: [
    /team.*roles/i,
    /assign.*roles/i,
    /who.*should.*work/i,
    /team.*assignments/i,
    /suggest.*team/i
  ],

  // Task Management AI Integration Patterns
  create_task: [
    /create.*task/i,
    /new.*task/i,
    /add.*task/i,
    /assign.*task/i,
    /task.*for/i,
    /random.*task/i,
    /generate.*task/i,
    /make.*task/i,
    /build.*task/i,
    /task.*like.*this/i,
    /create.*a.*task.*like/i,
    /task.*with.*description/i
  ],

  prioritize_task: [
    /prioritize.*task/i,
    /task.*priority/i,
    /important.*task/i,
    /urgent.*task/i,
    /high.*priority/i
  ],

  generate_subtasks: [
    /break.*task/i,
    /subtasks/i,
    /divide.*task/i,
    /task.*breakdown/i,
    /smaller.*tasks/i
  ],

  summarize_progress: [
    /progress.*summary/i,
    /status.*report/i,
    /project.*progress/i,
    /task.*progress/i,
    /how.*things.*going/i
  ]
};

export class AIJobManager {
  /**
   * Detect job type from user query
   */
  static detectJobType(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Check each job type pattern
    for (const [jobType, patterns] of Object.entries(JOB_DETECTION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(lowerQuery)) {
          return jobType;
        }
      }
    }
    
    // Default to general chat
    return 'general_chat';
  }
  
  /**
   * Get job configuration by type
   */
  static getJobConfig(jobType: string): AIJobType | null {
    return AI_JOB_TYPES[jobType] || null;
  }
  
  /**
   * Build context-aware prompt for AI
   */
  static buildContextPrompt(jobType: string, query: string, context?: any): string {
    const jobConfig = this.getJobConfig(jobType);
    if (!jobConfig) {
      return query;
    }
    
    let contextPrompt = jobConfig.systemPrompt + '\n\n';
    
    // Add context based on job category
    if (context) {
      switch (jobConfig.category) {
        case 'task_management':
          if (context.tasks) {
            contextPrompt += `Current tasks context:\n${JSON.stringify(context.tasks, null, 2)}\n\n`;
          }
          break;
          
        case 'project_management':
          if (context.projects) {
            contextPrompt += `Current projects context:\n${JSON.stringify(context.projects, null, 2)}\n\n`;
          }
          break;
          
        case 'chat':
          if (context.chatHistory) {
            contextPrompt += `Chat history context:\n${JSON.stringify(context.chatHistory, null, 2)}\n\n`;
          }
          break;
      }
    }
    
    contextPrompt += `User query: ${query}`;
    
    return contextPrompt;
  }
  
  /**
   * Get all job types by category
   */
  static getJobTypesByCategory(category: string): AIJobType[] {
    return Object.values(AI_JOB_TYPES).filter(job => job.category === category);
  }
  
  /**
   * Get all available job types
   */
  static getAllJobTypes(): AIJobType[] {
    return Object.values(AI_JOB_TYPES);
  }
}