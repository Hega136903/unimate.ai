import OpenAI from 'openai';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { logger } from '../utils/logger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: { responseMimeType: "application/json" }
});

export interface AIQuestionRequest {
  question: string;
  context?: string;
  userId?: string;
  subject?: string;
}

export interface AIRecommendation {
  studyTips: string[];
  courseRecommendations: string[];
  scheduleOptimizations: string[];
  personalizedAdvice: string;
}

export interface StudySession {
  id: string;
  topic: string;
  duration: number;
  difficulty: string;
  exercises: Exercise[];
  resources: string[];
  createdAt: string;
  summary: string;
}

export interface Exercise {
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string;
  explanation: string;
}

type AIProvider = 'google' | 'openai' | 'fallback';

export class AIService {
  private provider: AIProvider;

  constructor() {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
      this.provider = 'google';
      logger.info('✅ Google Gemini AI is configured as the primary provider.');
    } else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      this.provider = 'openai';
      logger.info('✅ OpenAI is configured as the primary provider.');
    } else {
      this.provider = 'fallback';
      logger.warn('⚠️ No primary AI provider configured. Using intelligent fallback responses.');
      logger.info('To enable real AI: Set GEMINI_API_KEY or OPENAI_API_KEY in backend/.env file');
    }
  }
  
  /**
   * Process AI question using the configured provider
   */
  async processQuestion(request: AIQuestionRequest): Promise<string> {
    logger.info(`Processing question with ${this.provider}...`);
    
    try {
      switch (this.provider) {
        case 'google':
          return await this.processWithGoogle(request);
        case 'openai':
          return await this.processWithOpenAI(request);
        default:
          return this.getFallbackResponse(request.question);
      }
    } catch (error) {
      logger.error(`Error with ${this.provider}:`, error);
      logger.info('Falling back to intelligent local responses...');
      return this.getFallbackResponse(request.question);
    }
  }

  /**
   * Process question with Google Gemini
   */
  private async processWithGoogle(request: AIQuestionRequest): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(request.subject);
    const userPrompt = this.buildUserPrompt(request.question, request.context);

    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 8192, // Increased for potentially larger JSON
      responseMimeType: request.subject === 'JSON Data Generation' ? "application/json" : "text/plain",
    };

    const chat = geminiModel.startChat({
      history: [{ role: 'user', parts: [{ text: systemPrompt }] }, { role: 'model', parts: [{ text: "Understood. I am Unimate, an AI study assistant. I will help the user." }] }],
      generationConfig,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    const result = await chat.sendMessage(userPrompt);
    const response = result.response;
    
    if (!response || !response.text()) {
      throw new Error('No response from Google Gemini');
    }

    logger.info(`✅ Google Gemini response generated successfully for user ${request.userId}`);
    return response.text();
  }

  /**
   * Process question with OpenAI GPT
   */
  private async processWithOpenAI(request: AIQuestionRequest): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(request.subject);
    const userPrompt = this.buildUserPrompt(request.question, request.context);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    logger.info(`✅ OpenAI response generated successfully for user ${request.userId}`);
    return response;
  }

  /**
   * Generate personalized study recommendations
   */
  async generateRecommendations(userId: string, userPreferences?: any): Promise<AIRecommendation> {
    try {
      if (this.provider === 'fallback') {
        logger.warn('Using fallback recommendations.');
        return this.getFallbackRecommendations(userPreferences);
      }

      logger.info(`Generating personalized recommendations for user ${userId} with preferences: ${JSON.stringify(userPreferences)}`);

      const prompt = `
        You are an expert academic advisor. Generate personalized study recommendations for a university student.
        Your response MUST be a single, valid JSON object, adhering to the following structure. Do not add any other text or markdown.
        {
          "studyTips": ["tip1", "tip2", "tip3", "tip4"],
          "courseRecommendations": ["course1", "course2", "course3", "course4"],
          "scheduleOptimizations": ["optimization1", "optimization2", "optimization3", "optimization4"],
          "personalizedAdvice": "A paragraph of personalized advice."
        }
        Base the recommendations on these user details and preferences: 
        - Interests: ${userPreferences?.interests?.join(', ') || 'Not specified'}
        - Learning Style: ${userPreferences?.learningStyle || 'Not specified'}
        - Department: ${userPreferences?.department || 'Not specified'}
        - Year: ${userPreferences?.year || 'Not specified'}
        - University: ${userPreferences?.university || 'Not specified'}
        - Role: ${userPreferences?.role || 'Not specified'}
        - User Plan (if provided by user): ${userPreferences?.plan ? JSON.stringify(userPreferences.plan) : 'Not provided'}
        The advice should be specific to their department/year where possible and align with their stated goals in the plan.
      `;

      const responseText = await this.processQuestion({ 
        question: prompt, 
        userId, 
        subject: 'JSON Data Generation' 
      });
      
      if (!responseText) {
        logger.warn('No response from AI for recommendations, using fallback.');
        return this.getFallbackRecommendations(userPreferences);
      }
      
      try {
        // Use the new robust JSON extractor
        const parsedJson = this.extractJsonFromResponse(responseText);

        if (parsedJson) {
          // Basic validation
          if (parsedJson.studyTips && parsedJson.courseRecommendations && parsedJson.scheduleOptimizations && parsedJson.personalizedAdvice) {
            logger.info(`✅ ${this.provider} recommendations parsed successfully for user ${userId}`);
            return parsedJson as AIRecommendation;
          } else {
            logger.warn(`Parsed JSON for recommendations is missing required fields for user ${userId}, using fallback.`);
            logger.debug('Invalid JSON structure received:', responseText);
            return this.getFallbackRecommendations(userPreferences);
          }
        } else {
          logger.error(`Fatal Error: Could not extract JSON from AI recommendation response for user ${userId}.`);
          logger.error('Raw response that caused error:', responseText);
          return this.getFallbackRecommendations(userPreferences);
        }
      } catch (parseError) {
        logger.error(`Fatal Error parsing AI recommendation response for user ${userId}:`, parseError);
        logger.error('Raw response that caused error:', responseText);
        return this.getFallbackRecommendations(userPreferences);
      }

    } catch (error) {
      logger.error(`Error generating AI recommendations for user ${userId}:`, error);
      logger.info('Using fallback recommendations...');
      return this.getFallbackRecommendations(userPreferences);
    }
  }

  /**
   * Extracts a JSON object from a string, ignoring surrounding text.
   * @param text The raw text response from the AI.
   * @returns A parsed JSON object, or null if no valid JSON is found.
   */
  private extractJsonFromResponse(text: string): any | null {
    logger.debug('Attempting to extract JSON from raw text:', text);
    
    // Find the first '{' and the last '}' to identify the JSON block
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      logger.warn('Could not find a valid JSON structure (missing {}).');
      return null;
    }

    const jsonString = text.substring(startIndex, endIndex + 1);

    try {
      // Attempt to parse the extracted string
      return JSON.parse(jsonString);
    } catch (error) {
      logger.error('Failed to parse the extracted JSON string:', error);
      logger.error('Extracted string was:', jsonString);
      return null;
    }
  }

  /**
   * Create AI-powered study session with exercises
   */
  async createStudySession(topic: string, duration: number, difficulty: string, userId: string, userPreferences?: any): Promise<StudySession> {
    try {
      if (this.provider === 'fallback') {
        return this.getFallbackStudySession(topic, duration, difficulty, userPreferences);
      }

      logger.info(`Creating personalized study session for topic: ${topic}, user: ${userId} with preferences: ${JSON.stringify(userPreferences)}`);

      // Create personalized prompt based on user preferences
      const interests = userPreferences?.interests || [];
      const learningStyle = userPreferences?.learningStyle || 'visual';
      
      let personalizedPrompt = `Create a comprehensive study session for the topic: "${topic}".
      Duration: ${duration} minutes
      Difficulty: ${difficulty}
      Learning Style: ${learningStyle}`;
      
      if (interests.length > 0) {
        personalizedPrompt += `\nUser Interests: ${interests.join(', ')}`;
        personalizedPrompt += `\nPlease connect concepts to these interests where relevant.`;
      }
      
      personalizedPrompt += `\n\nAdapt the content for ${learningStyle} learners:
      - Visual: Include references to diagrams, charts, mind maps
      - Auditory: Include discussion points, verbal explanations
      - Kinesthetic: Include hands-on activities, practical exercises  
      - Reading/Writing: Include detailed written explanations, note-taking strategies`;

      personalizedPrompt += `\n\nGenerate:
      1. A brief summary of the topic tailored for ${learningStyle} learners (2-3 sentences)
      2. 3 multiple choice questions with 4 options each and explanations
      3. 2 true/false questions with explanations
      4. 1 short answer question with a sample answer
      5. 3 learning resources specific to ${learningStyle} learning style
      
      Format your response as a single, valid JSON object with clear structure. Do not include any markdown formatting like \`\`\`json.`;

      const response = await this.processQuestion({ question: personalizedPrompt, userId, subject: 'JSON Data Generation' });
      
      if (!response) {
        return this.getFallbackStudySession(topic, duration, difficulty, userPreferences);
      }

      try {
        // Use the new robust JSON extractor
        const parsedContent = this.extractJsonFromResponse(response);
        
        if (parsedContent) {
          return this.formatStudySession(parsedContent, topic, duration, difficulty);
        } else {
          logger.error(`Could not extract JSON from study session response for topic: ${topic}`);
          return this.getFallbackStudySession(topic, duration, difficulty, userPreferences);
        }
      } catch (parseError) {
        logger.error('Error parsing AI response for study session:', parseError);
        return this.getFallbackStudySession(topic, duration, difficulty, userPreferences);
      }

    } catch (error) {
      logger.error('Error creating AI study session:', error);
      return this.getFallbackStudySession(topic, duration, difficulty, userPreferences);
    }
  }

  /**
   * Summarize study content using AI
   */
  async summarizeContent(content: string, maxLength: number = 200): Promise<string> {
    try {
      if (this.provider === 'fallback') {
        return content.substring(0, maxLength) + '...';
      }

      const prompt = `Summarize the following educational content in approximately ${maxLength} words. 
      Focus on key concepts and main points that a student should understand:
      
      ${content}`;

      return await this.processQuestion({ question: prompt });
    } catch (error) {
      logger.error('Error summarizing content:', error);
      return content.substring(0, maxLength) + '...';
    }
  }

  /**
   * Build a system prompt for the AI
   */
  private buildSystemPrompt(subject?: string): string {
    if (subject === 'JSON Data Generation') {
      return "You are a data generation assistant. Your only job is to return valid, raw JSON based on the user's request. Do not include any explanatory text, markdown, or any characters outside of the JSON object.";
    }
    return `You are Unimate, an advanced AI study assistant for university students. Your goal is to provide clear, accurate, and supportive guidance. 
    - Be encouraging and use a slightly formal, academic tone.
    - Break down complex topics into understandable parts.
    - If you don't know an answer, admit it and suggest ways the student can find the information.
    - Keep responses concise and focused on the student's question.`;
  }

  /**
   * Build a user prompt for the AI
   */
  private buildUserPrompt(question: string, context?: string): string {
    let prompt = `Question: "${question}"`;
    if (context) {
      prompt += `\n\nContext from our previous conversation (for reference only):\n${context}`;
    }
    return prompt;
  }

  /**
   * Provide a fallback response when AI services are unavailable
   */
  private getFallbackResponse(question: string): string {
    logger.info('Providing intelligent fallback response...');
    const lowerQuestion = question.toLowerCase();

    const responses: { [key: string]: string } = {
      'hello': "Hello! I'm Unimate, your AI study assistant. How can I help you with your studies today?",
      'thank you': "You're welcome! Is there anything else I can assist you with?",
      'machine learning': 'Machine learning is a fascinating field! It involves teaching computers to learn from data. Key concepts include supervised learning (like classification), unsupervised learning (like clustering), and reinforcement learning. A great starting point is Andrew Ng\'s course on Coursera.',
      'data structures': 'Data structures are essential for efficient programming. Common ones include arrays, linked lists, stacks, queues, trees, and graphs. Understanding their time and space complexity is crucial for technical interviews.',
      'study schedule': 'To create a good study schedule, start by listing all your subjects and deadlines. Allocate specific time blocks for each, and be sure to include breaks. Techniques like the Pomodoro Technique (25 mins study, 5 mins break) can be very effective.',
      'default': "I'm currently operating in fallback mode. While my full capabilities are limited, I can offer some general guidance. Could you please specify a topic you're interested in, like 'data structures' or 'study schedule'?"
    };

    for (const keyword in responses) {
      if (lowerQuestion.includes(keyword)) {
        return responses[keyword];
      }
    }
    return responses['default'];
  }

  private getFallbackRecommendations(userPreferences?: any): AIRecommendation {
    const interests = userPreferences?.interests || [];
    const learningStyle = userPreferences?.learningStyle || 'visual';
    
    // Personalized study tips based on learning style
    const studyTipsByStyle = {
      visual: [
        "Create mind maps and diagrams to visualize complex concepts and their relationships.",
        "Use color-coding and highlighting when taking notes to organize information visually.",
        "Watch educational videos and use infographics to supplement your reading materials.",
        "Create flowcharts and timelines to understand processes and sequences."
      ],
      auditory: [
        "Record yourself explaining concepts and listen to the recordings during review sessions.",
        "Join study groups where you can discuss topics and hear different perspectives.",
        "Use text-to-speech software to convert your notes into audio format.",
        "Create rhymes, songs, or mnemonics to help remember important information."
      ],
      kinesthetic: [
        "Use hands-on activities and experiments to understand theoretical concepts.",
        "Take frequent breaks and incorporate movement into your study routine.",
        "Write notes by hand rather than typing to engage muscle memory.",
        "Use manipulatives, models, or physical objects to represent abstract ideas."
      ],
      'reading/writing': [
        "Rewrite your notes in different formats and create comprehensive study guides.",
        "Practice active reading by summarizing each section in your own words.",
        "Write practice essays and explanations to reinforce your understanding.",
        "Create detailed outlines and bullet-point lists for complex topics."
      ]
    };

    // Personalized course recommendations based on interests
    const coursesByInterest = {
      technology: ["Advanced JavaScript and Web Development", "Machine Learning Fundamentals", "Mobile App Development", "Cybersecurity Essentials"],
      science: ["Research Methods in Science", "Data Analysis and Statistics", "Environmental Science", "Advanced Mathematics"],
      business: ["Digital Marketing Strategy", "Financial Analysis", "Project Management", "Entrepreneurship Basics"],
      arts: ["Digital Design Principles", "Creative Writing", "Art History", "Media Production"],
      health: ["Public Health Fundamentals", "Nutrition Science", "Psychology of Learning", "Health Data Analytics"],
      default: ["Critical Thinking and Problem Solving", "Communication Skills", "Time Management", "Research and Information Literacy"]
    };

    // Get study tips based on learning style
    const studyTips = studyTipsByStyle[learningStyle as keyof typeof studyTipsByStyle] || studyTipsByStyle.visual;
    
    // Get course recommendations based on interests
    let courseRecommendations = coursesByInterest.default;
    if (interests.length > 0) {
      const primaryInterest = interests[0].toLowerCase();
      for (const [key, courses] of Object.entries(coursesByInterest)) {
        if (primaryInterest.includes(key)) {
          courseRecommendations = courses;
          break;
        }
      }
    }

    // Personalized schedule optimizations
    const scheduleOptimizations = [
      `Schedule your most challenging subjects during your peak energy hours (${learningStyle === 'visual' ? 'morning with good lighting' : learningStyle === 'auditory' ? 'when environment is quiet' : 'when you can move freely'}).`,
      "Use the Pomodoro Technique: 25 minutes of focused study followed by 5-minute breaks.",
      "Block out time for your interests like " + (interests.length > 0 ? interests.join(' and ') : 'hobbies') + " to maintain motivation.",
      "Review material within 24 hours of learning it to improve retention by up to 60%."
    ];

    // Personalized advice
    const personalizedAdvice = `Based on your ${learningStyle} learning style${interests.length > 0 ? ` and interest in ${interests.join(', ')}` : ''}, focus on study methods that align with how you naturally process information. Remember that consistency is more important than intensity - establish a sustainable routine that incorporates your preferred learning approach. Consider joining study groups or online communities related to your interests to enhance motivation and understanding.`;

    return {
      studyTips,
      courseRecommendations,
      scheduleOptimizations,
      personalizedAdvice
    };
  }

  /**
   * Provide a fallback study session with personalization
   */
  private getFallbackStudySession(topic: string, duration: number, difficulty: string, userPreferences?: any): StudySession {
    const interests = userPreferences?.interests || [];
    const learningStyle = userPreferences?.learningStyle || 'visual';
    
    // Personalized summary based on learning style and interests
    let summary = `This is a personalized study session for "${topic}" optimized for ${learningStyle} learners.`;
    if (interests.length > 0) {
      summary += ` This session connects concepts to your interests in ${interests.join(' and ')}.`;
    }
    
    // Personalized exercises based on learning style
    const exercisesByStyle = {
      visual: {
        type: 'multiple_choice' as const,
        question: `Which visual method would best help you understand ${topic}?`,
        options: ['Mind mapping', 'Flowcharts', 'Diagrams', 'Color-coded notes'],
        correctAnswer: 0,
        explanation: 'Mind mapping helps visual learners organize and connect concepts effectively.'
      },
      auditory: {
        type: 'multiple_choice' as const,
        question: `Which auditory technique would enhance your learning of ${topic}?`,
        options: ['Recording explanations', 'Group discussions', 'Reading aloud', 'Audio lectures'],
        correctAnswer: 0,
        explanation: 'Recording your own explanations helps auditory learners process and retain information.'
      },
      kinesthetic: {
        type: 'multiple_choice' as const,
        question: `Which hands-on approach would best help you learn ${topic}?`,
        options: ['Practical exercises', 'Note-taking by hand', 'Physical models', 'Movement breaks'],
        correctAnswer: 0,
        explanation: 'Practical exercises engage kinesthetic learners through active participation.'
      },
      'reading/writing': {
        type: 'multiple_choice' as const,
        question: `Which written method would enhance your understanding of ${topic}?`,
        options: ['Detailed summaries', 'Comprehensive outlines', 'Practice essays', 'Bullet-point lists'],
        correctAnswer: 0,
        explanation: 'Creating detailed summaries helps reading/writing learners process information thoroughly.'
      }
    };
    
    const personalizedExercise = exercisesByStyle[learningStyle as keyof typeof exercisesByStyle] || exercisesByStyle.visual;
    
    // Personalized resources based on interests and learning style
    const baseResources = [
      `Online ${learningStyle === 'visual' ? 'video tutorials and infographics' : 
         learningStyle === 'auditory' ? 'podcasts and audio lectures' :
         learningStyle === 'kinesthetic' ? 'interactive simulations' : 
         'comprehensive reading materials'} for ${topic}`,
      'Course textbook and supplementary materials',
      `Study groups focused on ${topic}`
    ];
    
    if (interests.length > 0) {
      baseResources.push(`Resources connecting ${topic} to ${interests.join(' and ')}`);
    }

    return {
      id: `fallback_${Date.now()}`,
      topic,
      duration,
      difficulty,
      summary,
      exercises: [personalizedExercise],
      resources: baseResources,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Format the AI's response for a study session
   */
  private formatStudySession(parsedContent: any, topic: string, duration: number, difficulty: string): StudySession {
    // Basic validation and formatting
    const exercises = (parsedContent.exercises || []).map((ex: any) => ({
      type: ex.type || 'short_answer',
      question: ex.question || 'No question provided.',
      options: ex.options || [],
      correctAnswer: ex.correctAnswer ?? 'No answer provided.',
      explanation: ex.explanation || 'No explanation provided.'
    }));

    return {
      id: `ai_${Date.now()}`,
      topic,
      duration,
      difficulty,
      summary: parsedContent.summary || `A study session on ${topic}.`,
      exercises,
      resources: parsedContent.resources || [],
      createdAt: new Date().toISOString()
    };
  }
}

export const aiService = new AIService();
