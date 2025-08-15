import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigManager } from './config';

export interface AIModel {
  name: string;
  provider: string;
  maxTokens: number;
  supportsStreaming: boolean;
}

export interface GenerateOptions {
  model: string;
  sessionId?: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export class AIProvider {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private gemini?: GoogleGenerativeAI;
  private qwenOpenAI?: OpenAI; // OpenAI-compatible client for Qwen (DashScope)
  private conversations: Map<string, ChatMessage[]> = new Map();

  constructor(private configManager: ConfigManager) {
    this.initializeProviders();
  }

  refresh(): void {
    // Re-read keys and re-init providers
    this.openai = undefined;
    this.anthropic = undefined;
    this.gemini = undefined;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize OpenAI
    const openaiKey = this.configManager.get('openaiApiKey');
    if (openaiKey) {
      this.openai = new OpenAI({
        apiKey: openaiKey
      });
    }

    // Initialize Anthropic
    const anthropicKey = this.configManager.get('anthropicApiKey');
    if (anthropicKey) {
      this.anthropic = new Anthropic({
        apiKey: anthropicKey
      });
    }

    // Initialize Gemini
    const geminiKey = this.configManager.get('geminiApiKey');
    if (geminiKey) {
      this.gemini = new GoogleGenerativeAI(geminiKey);
    }

    // Initialize Qwen (DashScope OpenAI-compatible)
    const qwenKey = this.configManager.get('qwenApiKey') as string | undefined;
    const qwenBaseUrl = this.configManager.get('qwenBaseUrl') as string | undefined;
    if (qwenKey) {
      this.qwenOpenAI = new OpenAI({ apiKey: qwenKey, baseURL: qwenBaseUrl });
    }
  }

  async generateResponse(prompt: string, options: GenerateOptions): Promise<string> {
    const { model, sessionId, stream = true } = options;

    // Get conversation history if sessionId provided
    const messages = sessionId ? this.getConversationHistory(sessionId) : [];
    messages.push({ role: 'user', content: prompt });

    try {
      let response: string;

      if (model.startsWith('gpt-')) {
        response = await this.generateOpenAIResponse(messages, options);
      } else if (model.startsWith('claude-')) {
        response = await this.generateAnthropicResponse(messages, options);
      } else if (model.startsWith('gemini-')) {
        response = await this.generateGeminiResponse(messages, options);
      } else if (model.startsWith('qwen-')) {
        if (!this.qwenOpenAI) throw new Error('Qwen not configured');
        response = await this.generateOpenAIResponseWithClient(this.qwenOpenAI, messages, options);
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }

      // Store conversation history
      if (sessionId) {
        messages.push({ role: 'assistant', content: response });
        this.conversations.set(sessionId, messages);
      }

      return response;
    } catch (error) {
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async generateOpenAIResponse(messages: ChatMessage[], options: GenerateOptions): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const response = await this.openai.chat.completions.create({
      model: options.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: options.maxTokens || this.configManager.get('maxTokens'),
      temperature: options.temperature || this.configManager.get('temperature'),
      stream: options.stream && this.configManager.get('streaming')
    });

    if (options.stream && this.configManager.get('streaming')) {
      let fullResponse = '';
      for await (const chunk of response as any) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        process.stdout.write(content);
      }
      return fullResponse;
    } else {
      return (response as any).choices[0]?.message?.content || '';
    }
  }

  private async generateOpenAIResponseWithClient(client: OpenAI, messages: ChatMessage[], options: GenerateOptions): Promise<string> {
    const response = await client.chat.completions.create({
      model: options.model,
      messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
      max_tokens: options.maxTokens || this.configManager.get('maxTokens'),
      temperature: options.temperature || this.configManager.get('temperature'),
      stream: options.stream && this.configManager.get('streaming')
    } as any);

    if (options.stream && this.configManager.get('streaming')) {
      let fullResponse = '';
      for await (const chunk of response as any) {
        const content = chunk.choices?.[0]?.delta?.content || '';
        fullResponse += content;
        process.stdout.write(content);
      }
      return fullResponse;
    } else {
      return (response as any).choices?.[0]?.message?.content || '';
    }
  }

  private async generateAnthropicResponse(messages: ChatMessage[], options: GenerateOptions): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Anthropic not configured');
    }

    // Convert messages format for Anthropic
    const anthropicMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

    const response = await this.anthropic.messages.create({
      model: options.model,
      messages: anthropicMessages,
      max_tokens: options.maxTokens || this.configManager.get('maxTokens'),
      temperature: options.temperature || this.configManager.get('temperature'),
      stream: options.stream && this.configManager.get('streaming')
    });

    if (options.stream && this.configManager.get('streaming')) {
      let fullResponse = '';
      for await (const chunk of response as any) {
        if (chunk.type === 'content_block_delta') {
          const content = chunk.delta?.text || '';
          fullResponse += content;
          process.stdout.write(content);
        }
      }
      return fullResponse;
    } else {
      return (response as any).content[0]?.text || '';
    }
  }

  private async generateGeminiResponse(messages: ChatMessage[], options: GenerateOptions): Promise<string> {
    if (!this.gemini) {
      throw new Error('Gemini not configured');
    }

    const model = this.gemini.getGenerativeModel({ model: options.model });

    // Convert conversation to Gemini format
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1];

    if (options.stream && this.configManager.get('streaming')) {
      const result = await chat.sendMessageStream(lastMessage.content);
      let fullResponse = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        process.stdout.write(chunkText);
      }

      return fullResponse;
    } else {
      const result = await chat.sendMessage(lastMessage.content);
      return result.response.text();
    }
  }

  private getConversationHistory(sessionId: string): ChatMessage[] {
    return this.conversations.get(sessionId) || [];
  }

  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
  }

  async getAvailableModels(): Promise<AIModel[]> {
    const models: AIModel[] = [];

    // OpenAI models
    if (this.openai) {
      models.push(
        { name: 'gpt-4', provider: 'OpenAI', maxTokens: 8192, supportsStreaming: true },
        { name: 'gpt-4-turbo', provider: 'OpenAI', maxTokens: 128000, supportsStreaming: true },
        { name: 'gpt-3.5-turbo', provider: 'OpenAI', maxTokens: 4096, supportsStreaming: true }
      );
    }

    // Anthropic models
    if (this.anthropic) {
      models.push(
        { name: 'claude-3-opus', provider: 'Anthropic', maxTokens: 200000, supportsStreaming: true },
        { name: 'claude-3-sonnet', provider: 'Anthropic', maxTokens: 200000, supportsStreaming: true },
        { name: 'claude-3-haiku', provider: 'Anthropic', maxTokens: 200000, supportsStreaming: true }
      );
    }

    // Gemini models
    if (this.gemini) {
      models.push(
        { name: 'gemini-pro', provider: 'Google', maxTokens: 32768, supportsStreaming: true },
        { name: 'gemini-pro-vision', provider: 'Google', maxTokens: 16384, supportsStreaming: true }
      );
    }

    // Qwen models (visible when configured)
    if (this.qwenOpenAI) {
      models.push(
        { name: 'qwen-plus', provider: 'Qwen', maxTokens: 32768, supportsStreaming: true },
        { name: 'qwen-max', provider: 'Qwen', maxTokens: 32768, supportsStreaming: true }
      );
    }

    return models;
  }

  getProviderForModel(model: string): string {
    if (model.startsWith('gpt-')) return 'openai';
    if (model.startsWith('claude-')) return 'anthropic';
    if (model.startsWith('gemini-')) return 'gemini';
    if (model.startsWith('qwen-')) return 'qwen';
    throw new Error(`Unknown model provider for: ${model}`);
  }

  isModelAvailable(model: string): boolean {
    const provider = this.getProviderForModel(model);

    switch (provider) {
      case 'openai':
        return !!this.openai;
      case 'anthropic':
        return !!this.anthropic;
      case 'gemini':
        return !!this.gemini;
      case 'qwen':
        return !!this.qwenOpenAI;
      default:
        return false;
    }
  }

  // Token counting utilities
  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  validateTokenLimit(text: string, model: string): boolean {
    const tokens = this.estimateTokens(text);
    const models = {
      'gpt-4': 8192,
      'gpt-4-turbo': 128000,
      'gpt-3.5-turbo': 4096,
      'claude-3-opus': 200000,
      'claude-3-sonnet': 200000,
      'claude-3-haiku': 200000,
      'gemini-pro': 32768,
      'gemini-pro-vision': 16384
    };

    const limit = models[model as keyof typeof models] || 4096;
    return tokens <= limit;
  }
}
