import OpenAI from 'openai';
import { Source, StudyMaterialType, QuizData, FlashcardData, MindMapData, PresentationData, Slide } from "../types";

// Configuration interfaces
export interface QuizConfig {
  questionCount: 'less' | 'standard' | 'more';
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface FlashcardConfig {
  cardCount: 'less' | 'standard' | 'more';
  style: 'concepts' | 'definitions' | 'qa';
  topic?: string;
}

export interface PresentationConfig {
  slideCount: 'short' | 'standard' | 'detailed';
  audience: 'general' | 'professional' | 'academic';
  topic?: string;
}

export interface InfographicConfig {
  style: 'minimalist' | 'detailed' | 'vibrant';
  layout: '1:1' | '9:16' | '16:9';
  topic?: string;
}

export interface MindMapConfig {
  complexity: 'simple' | 'standard' | 'complex';
  topic?: string;
}

export type AnyAIConfig = QuizConfig | FlashcardConfig | PresentationConfig | InfographicConfig | MindMapConfig;

export class GeminiService {
  private openai: OpenAI | null = null;
  private apiKey: string;
  private readonly MAX_CONTEXT_CHARS = 240000;
  private readonly MAX_SOURCE_CHARS = 80000;
  private readonly MAX_SUMMARY_CHARS = 120000;

  constructor() {
    this.apiKey = '';
    this.initClient();
  }

  private getStoredKey(): string {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('OPENROUTER_API_KEY') || window.localStorage.getItem('openrouterApiKey');
      if (stored) return stored;
    }
    const env = (import.meta as any).env || process.env;
    return env.VITE_OPENROUTER_API_KEY || '';
  }

  private initClient() {
    const nextKey = this.getStoredKey();
    if (!nextKey) return;
    if (this.apiKey === nextKey && this.openai) return;

    this.apiKey = nextKey;
    console.log('API key loaded (first 8 chars):', this.apiKey.substring(0, 8) + '...');
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        'HTTP-Referer': window.location.origin || 'http://localhost:3000',
        'X-Title': 'NotebookLM Clone',
      }
    });
  }
  private checkAPI() {
    this.initClient();
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Check API key.');
    }
  }

  private cleanJsonResponse(text: string): string {
    if (!text) return '{}';
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-z]*\n/i, '').replace(/\n```$/g, '').trim();
    }
    return cleaned;
  }

  private trimText(text: string, maxChars: number): { text: string; truncated: boolean } {
    if (text.length <= maxChars) return { text, truncated: false };
    return { text: text.slice(0, maxChars), truncated: true };
  }

  private buildContext(
    sources: Source[],
    options?: { maxChars?: number; perSourceMaxChars?: number; includeHeaders?: boolean }
  ): { context: string; wasTruncated: boolean } {
    const maxChars = options?.maxChars ?? this.MAX_CONTEXT_CHARS;
    const perSourceMaxChars = options?.perSourceMaxChars ?? this.MAX_SOURCE_CHARS;
    const includeHeaders = options?.includeHeaders ?? true;

    const pieces: string[] = [];
    let total = 0;
    let truncated = false;

    for (const source of sources) {
      if (total >= maxChars) break;

      const header = includeHeaders ? `[MANBA: ${source.name}]\n` : '';
      const remaining = Math.max(0, maxChars - total - header.length);
      if (remaining <= 0) break;

      const sourceText = source.metadata?.text || source.content || '';
      const trimmed = this.trimText(sourceText, Math.min(perSourceMaxChars, remaining));
      if (trimmed.truncated || sourceText.length > perSourceMaxChars) truncated = true;

      const nextPiece = header + trimmed.text;
      pieces.push(nextPiece);
      total += nextPiece.length + 2;
    }

    if (total >= maxChars) truncated = true;

    return { context: pieces.join('\n\n'), wasTruncated: truncated };
  }

  async summarizeSource(source: Source): Promise<string> {
    try {
      this.checkAPI();
      const model = 'google/gemini-2.0-flash-001';
      const sourceText = source.metadata?.text || source.content || '';
      const trimmed = this.trimText(sourceText, this.MAX_SUMMARY_CHARS);
      if (trimmed.truncated) {
        console.warn('Summary context truncated to avoid token limits.');
      }
      const prompt = `Quyidagi manba mazmunini tahlil qiling va eng muhim 3-5 ta nuqtani (bullet points) o'zbek tilida qisqacha tushuntiring. Sarlavha yozmang, faqat nuqtalarni bering:\n\n[MANBA: ${source.name}]\n${trimmed.text}`;

      const response = await this.openai!.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: "Siz o'ta aqlli tahlilchisiz. Ma'lumotni qisqa va lo'nda yetkazasiz." },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      });
      return response.choices[0]?.message?.content || "Xulosa yaratib bo'lmadi.";
    } catch (error: any) {
      console.error('❌ Error creating summary:', error);
      return `Xulosa yaratishda xatolik: ${error.message}`;
    }
  }

  async chatWithSources(
    messages: { role: 'user' | 'assistant'; text: string }[],
    sources: Source[]
  ): Promise<string> {
    try {
      this.checkAPI();

      const model = 'meta-llama/llama-3-8b-instruct:free';
      const contextPayload = sources.length > 0
        ? this.buildContext(sources, { includeHeaders: true })
        : { context: '', wasTruncated: false };
      if (contextPayload.wasTruncated) {
        console.warn('Chat context truncated to avoid token limits.');
      }
      const context = sources.length > 0
        ? `Siz tadqiqotchi yordamchisiz. Faqat quyidagi manbalar mazmuniga asoslanib javob bering:\n${contextPayload.context}`
        : 'Siz aqlli AI yordamchisiz.';

      const conversation = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      })) as any[];

      console.log('📤 Sending request to OpenRouter...');
      console.log('Model:', model);
      console.log('Message count:', messages.length);
      console.log('Source count:', sources.length);

      const response = await this.openai!.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: `Sizning javoblaringiz o'ta aniq, akademik va manbalarga tayangan bo'lishi shart. O'zbek tilida so'zlashasiz.\n\n${context}` },
          ...conversation
        ],
        temperature: 0.4,
      });

      console.log('✅ Successful API response');
      return response.choices[0]?.message?.content || "Javob yaratib bo'lmadi.";

    } catch (error: any) {
      console.error('🔥 Error in chatWithSources:', error);

      if (error.status === 401) {
        throw new Error('401: Not authorized. Check API key in .env file');
      } else if (error.status === 429) {
        throw new Error('429: Too many requests. Try again later');
      } else if (error.status === 402) {
        throw new Error('402: Payment required. Check OpenRouter balance');
      } else if (error.message?.includes('Network Error')) {
        throw new Error('Network error. Check internet connection');
      }

      throw new Error(`API error: ${error.message || 'Unknown error'}`);
    }
  }

  private async generateImageForSlide(slide: Slide): Promise<string | null> {
    try {
      this.checkAPI();
      const prompt = `Professional presentation slide visualization for: ${slide.title}. Use modern business style, clean design. NO TEXT inside image.`;

      // 2. Size muammosini hal qilish: faqat ruxsat etilgan o'lchamlardan foydalanish
      const response = await this.openai!.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        size: "1024x1024", // OpenAI SDK faqat ma'lum o'lchamlarni qabul qiladi
        response_format: "b64_json",
        n: 1,
      });

      if (response.data?.[0]?.b64_json) {
        return `data:image/png;base64,${response.data[0].b64_json}`;
      }
      return null;
    } catch (err) {
      console.warn("Rasm yaratishda xatolik:", err);
      return null;
    }
  }

  async generateInfographicImage(sources: Source[], config: InfographicConfig): Promise<string> {
    this.checkAPI();
    const context = sources.map(s => s.content).join('\n\n').slice(0, 2000);

    console.log('🖼️ Starting infographic generation...');
    console.log('Config:', config);
    console.log('Context length:', context.length);

    try {
      // 1. OpenRouter images endpoint orqali sinab ko'rish (asosiy usul)
      const prompt = this.buildInfographicPrompt(context, config);
      console.log('Generated prompt:', prompt.substring(0, 200) + '...');

      // OpenRouter-da ishlaydigan modelni tanlash
      // 'black-forest-labs/flux-schnell' - bu model OpenRouter-da tasvir yaratish uchun
      const imageModel = 'black-forest-labs/flux-schnell';
      // const imageModel = 'stabilityai/stable-diffusion-3.5-large';
      // const imageModel = 'proximacentauribeta/beyonder-4.0'
      // To'g'ridan-to'g'ri fetch orqali API ga murojaat qilish
      // Bu usul TypeScript xatosiz ishlaydi
      const imageUrl = await this.generateWithDirectFetch(prompt, config, imageModel);
      console.log('✅ Image generated successfully');
      return imageUrl;


    } catch (error: any) {
      console.error('❌ Image generation failed:', error);

      // Fallback: Agar API ishlamasa, placeholder yaratish
      return this.createFallbackInfographic(context, config);
    }
  }

  private buildInfographicPrompt(context: string, config: InfographicConfig): string {
    const styleMap = {
      'minimalist': 'minimalist, clean, simple, modern, white space, elegant',
      'detailed': 'detailed, intricate, comprehensive, informative, data-rich',
      'vibrant': 'vibrant, colorful, energetic, eye-catching, bold colors'
    };

    const layoutMap = {
      '1:1': 'square layout, balanced composition',
      '9:16': 'vertical layout, portrait orientation',
      '16:9': 'horizontal layout, landscape orientation'
    };

    const topic = config.topic || 'information visualization';

    return `Professional infographic illustration about: ${topic}.
Style: ${styleMap[config.style]}. 
Layout: ${layoutMap[config.layout]}.
Content: ${context.substring(0, 500)}
Important: No text inside image, only visual elements.`;
  }

  private async generateWithDirectFetch(prompt: string, config: InfographicConfig, modelName: string): Promise<string> {
    // OpenRouter images API endpoint
    const apiUrl = 'https://openrouter.ai/api/v1/images/generations';

    // Size ni to'g'ri formatda aniqlash
    let size = '1024x1024'; // Default
    if (config.layout === '9:16') {
      size = '768x1024'; // Portrait
    } else if (config.layout === '16:9') {
      size = '1024x576'; // Landscape
    }

    const requestBody = {
      model: modelName,
      prompt: prompt,
      n: 1,
      size: size,
      response_format: 'b64_json' as const
    };

    console.log('📤 Sending to OpenRouter images API...');
    console.log('Model:', modelName);
    console.log('Size:', size);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'NotebookLM Clone'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error:', errorText);

        // Agar 405 bo'lsa (method not allowed), boshqa model sinab ko'rish
        if (response.status === 405) {
          console.log('🔄 Trying alternative model...');
          return await this.tryAlternativeModel(prompt, config);
        }

        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📥 API response received');

      if (data.data && data.data[0] && data.data[0].b64_json) {
        const base64Image = data.data[0].b64_json;
        return `data:image/png;base64,${base64Image}`;
      } else if (data.data && data.data[0] && data.data[0].url) {
        // Agar URL orqali qaytarsa
        return data.data[0].url;
      } else {
        console.error('❌ Unexpected response:', data);
        throw new Error('Invalid response from image API');
      }
    } catch (fetchError: any) {
      console.error('❌ Fetch error:', fetchError);
      throw fetchError;
    }
  }

  private async tryAlternativeModel(prompt: string, config: InfographicConfig): Promise<string> {
    // Boshqa modellarni sinab ko'rish
    const alternativeModels = [
      'stabilityai/stable-diffusion-3.5-large',
      'proximacentauribeta/beyonder-4.0',
      'openai/dall-e-2'
    ];

    for (const model of alternativeModels) {
      console.log(`🔄 Trying model: ${model}`);
      try {
        const size = this.getImageSize(config.layout);

        const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            prompt: prompt,
            n: 1,
            size: size,
            response_format: 'b64_json'
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data?.[0]?.b64_json) {
            return `data:image/png;base64,${data.data[0].b64_json}`;
          }
        }
      } catch (error) {
        console.warn(`Model ${model} failed:`, error);
        // Keyingi modelga o'tish
      }
    }

    throw new Error('All image models failed');
  }

  private getImageSize(layout: InfographicConfig['layout']): string {
    // OpenRouter API uchun size
    switch (layout) {
      case '1:1': return '1024x1024';
      case '9:16': return '768x1024';
      case '16:9': return '1024x576';
      default: return '1024x1024';
    }
  }

  private createFallbackInfographic(context: string, config: InfographicConfig): string {
    // Agar API ishlamasa, SVG orqali sifatli placeholder yaratish
    const width = config.layout === '9:16' ? 450 : config.layout === '16:9' ? 800 : 600;
    const height = config.layout === '9:16' ? 800 : config.layout === '16:9' ? 450 : 600;

    // Ranglar stilga qarab
    let bgColor, primaryColor, textColor;
    switch (config.style) {
      case 'minimalist':
        bgColor = '#ffffff';
        primaryColor = '#1a1a1a';
        textColor = '#374151';
        break;
      case 'vibrant':
        bgColor = '#1e3a8a';
        primaryColor = '#3b82f6';
        textColor = '#ffffff';
        break;
      case 'detailed':
      default:
        bgColor = '#f8fafc';
        primaryColor = '#0f172a';
        textColor = '#334155';
        break;
    }

    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <!-- Background -->
        <rect width="100%" height="100%" fill="${bgColor}"/>
        
        <!-- Border -->
        <rect x="20" y="20" width="${width - 40}" height="${height - 40}" 
              fill="none" stroke="${primaryColor}" stroke-width="3" stroke-dasharray="10,5"/>
        
        <!-- Central icon -->
        <circle cx="${width / 2}" cy="${height / 3}" r="60" fill="${primaryColor}"/>
        <text x="${width / 2}" y="${height / 3}" text-anchor="middle" 
              font-family="Arial" font-size="40" fill="${bgColor}" dy=".3em">📊</text>
        
        <!-- Title -->
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" 
              font-family="Arial" font-size="24" font-weight="bold" fill="${textColor}">
          Infographic
        </text>
        
        <!-- Style info -->
        <text x="${width / 2}" y="${height / 2 + 40}" text-anchor="middle" 
              font-family="Arial" font-size="16" fill="${textColor}">
          ${config.style} • ${config.layout}
        </text>
        
        <!-- Content preview -->
        <text x="${width / 2}" y="${height / 2 + 80}" text-anchor="middle" 
              font-family="Arial" font-size="14" fill="${textColor}" opacity="0.8">
          Based on ${Math.min(context.split(' ').length, 100)} words
        </text>
        
        <!-- Decorative elements -->
        <circle cx="${width * 0.2}" cy="${height * 0.8}" r="15" fill="${primaryColor}" opacity="0.3"/>
        <circle cx="${width * 0.8}" cy="${height * 0.8}" r="15" fill="${primaryColor}" opacity="0.3"/>
        <rect x="${width * 0.35}" y="${height * 0.75}" width="${width * 0.3}" height="10" 
              fill="${primaryColor}" opacity="0.5"/>
      </svg>`;

    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  }

  async generateStudyMaterial(
    type: StudyMaterialType,
    sources: Source[],
    config?: AnyAIConfig
  ): Promise<string | QuizData | FlashcardData | MindMapData | PresentationData> {
    this.checkAPI();
    const model = 'google/gemini-2.0-flash-001';
    const contextPayload = this.buildContext(sources, { includeHeaders: true });
    if (contextPayload.wasTruncated) {
      console.warn('Study material context truncated to avoid token limits.');
    }
    const context = contextPayload.context;

    if (['quiz', 'flashcard', 'mindmap', 'presentation'].includes(type)) {
      let systemPrompt = "";
      let targetCount = 10;

      if (type === 'quiz') {
        const qConfig = config as QuizConfig;
        targetCount = qConfig?.questionCount === 'less' ? 5 : qConfig?.questionCount === 'more' ? 20 : 10;
        const topicHint = qConfig?.topic ? `Mavzu: ${qConfig.topic}.` : '';
        const difficulty = qConfig?.difficulty || 'medium';
        const difficultyHint = difficulty === 'hard'
          ? "Savollar chuqur, murakkab, tahliliy va noaniq (lekin aniq javobli) bo'lsin. Detallarga e'tibor bering."
          : difficulty === 'easy'
            ? "Savollar sodda va asosiy tushunchalarga tayansin."
            : "Savollar o'rtacha murakkablikda bo'lsin.";
        systemPrompt = `Siz ekspert o'qituvchisiz. ${topicHint} O'zbek tilida AYNAN ${targetCount} TA SAVOLDAN iborat test yarating. Miqdor o'ta muhim. ${difficultyHint}
        Javobni quyidagi JSON formatda qaytaring:
        {
          "title": "Mavzu nomi",
          "questions": [
            {
              "question": "Savol matni",
              "options": ["A", "B", "C", "D"],
              "correctAnswerIndex": 0,
              "explanation": "Tushuntirish"
            }
          ]
        }`;
      } else if (type === 'flashcard') {
        const fConfig = config as FlashcardConfig;
        targetCount = fConfig?.cardCount === 'less' ? 10 : fConfig?.cardCount === 'more' ? 30 : 15;
        systemPrompt = `O'quv kartochkalari yarating. O'zbek tilida AYNAN ${targetCount} TA KARTОCHKA bo'lishi shart.
        Javobni quyidagi JSON formatda qaytaring:
        {
            "title": "Mavzu",
            "cards": [
                { "question": "Savol", "answer": "Javob" }
            ]
        }`;
      } else if (type === 'mindmap') {
        const mConfig = config as MindMapConfig;
        const complexityPrompt = mConfig?.complexity === 'simple' ? "Oddiy" : mConfig?.complexity === 'complex' ? "Batafsil" : "O'rtacha";
        systemPrompt = `O'zbek tilida iyerarxik aqliy xarita tuzing. ${complexityPrompt} iyerarxiya bo'lsin.
        Javobni quyidagi JSON formatda qaytaring:
        {
            "title": "Mavzu",
            "rootNode": {
                "label": "Markaziy tugun",
                "children": [
                    { "label": "Bolla tugun", "children": [...] }
                ]
            }
        }`;
      } else if (type === 'presentation') {
        const pConfig = config as PresentationConfig;
        targetCount = pConfig?.slideCount === 'short' ? 5 : pConfig?.slideCount === 'detailed' ? 15 : 10;
        systemPrompt = `O'zbek tilida AYNAN ${targetCount} TA SLAYD uchun mazmun yarating.
        Javobni quyidagi JSON formatda qaytaring:
        {
            "title": "Prezentatsiya mavzusi",
            "slides": [
                {
                    "title": "Slayd sarlavhasi",
                    "content": ["Nuqta 1", "Nuqta 2"]
                }
            ]
        }`;
      }

      const response = await this.openai!.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Matn asosida ${type} yarating. Manbalar:\n\n${context}` }
        ],
        response_format: { type: "json_object" }
      });

      const data = JSON.parse(response.choices[0]?.message?.content || '{}');

      if (type === 'presentation' && data.slides) {
        for (const slide of data.slides) {
          slide.imageUrl = await this.generateImageForSlide(slide).catch(() => null);
        }
      }

      return data;
    }

    const response = await this.openai!.chat.completions.create({
      model,
      messages: [
        { role: 'user', content: `Tahlil qiling va ${type} (o'zbek tilida) yarating:\n\n${context}` }
      ],
    });
    return response.choices[0]?.message?.content || "Material yaratib bo'lmadi.";
  }
}

export const geminiService = new GeminiService();
