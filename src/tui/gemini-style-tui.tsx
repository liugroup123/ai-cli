import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';

export interface TUIHandlers {
  onSend: (text: string) => Promise<string>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AppProps {
  handlers: TUIHandlers;
  initialStatus?: string;
}

const App: React.FC<AppProps> = ({ handlers, initialStatus = 'Ready' }) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [inputMode, setInputMode] = useState<'normal' | 'chinese'>('normal');

  // Global key handlers
  useInput((inputChar: string, key: any) => {
    if (key.ctrl && inputChar === 'c') {
      exit();
    }
    
    if (key.ctrl && inputChar === 'e') {
      setInputMode(inputMode === 'normal' ? 'chinese' : 'normal');
    }

    // Dismiss welcome screen on any key
    if (showWelcome && (key.return || inputChar === ' ' || key.escape)) {
      setShowWelcome(false);
    }
  });

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowWelcome(false);

    try {
      const response = await handlers.onSend(text.trim());
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [handlers, isLoading]);

  if (showWelcome) {
    return <WelcomeScreen onDismiss={() => setShowWelcome(false)} />;
  }

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text color="cyan" bold>🤖 AI CLI</Text>
        <Text color="gray"> | {initialStatus} | </Text>
        <Text color="yellow">Ctrl+C: Exit</Text>
        <Text color="gray"> | </Text>
        <Text color="magenta">Ctrl+E: {inputMode === 'chinese' ? '中文' : 'EN'}</Text>
      </Box>

      {/* Chat Area */}
      <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
        {messages.length === 0 ? (
          <Box justifyContent="center" alignItems="center" flexGrow={1}>
            <Text color="gray" dimColor>
              💬 Start a conversation! Type your message below...
            </Text>
          </Box>
        ) : (
          <Box flexDirection="column">
            {messages.slice(-8).map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </Box>
        )}

        {isLoading && (
          <Box marginTop={1}>
            <Text color="cyan">
              <Spinner type="dots" />
              {' '}AI is thinking...
            </Text>
          </Box>
        )}
      </Box>

      {/* Input Area */}
      <Box borderStyle="single" borderColor="blue" paddingX={1}>
        <Text color="blue">{'> '}</Text>
        <Box flexGrow={1}>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSendMessage}
            placeholder={isLoading ? 'AI is responding...' : `Type your message (${inputMode})...`}
            showCursor={!isLoading}
            focus={!isLoading}
          />
        </Box>
      </Box>

      {/* Footer */}
      <Box justifyContent="center" paddingX={1}>
        <Text color="gray" dimColor>
          {isLoading ? 'Please wait...' : 'Press Enter to send • Ctrl+E to toggle input mode'}
        </Text>
      </Box>
    </Box>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const getRoleColor = () => {
    switch (message.role) {
      case 'user': return 'cyan';
      case 'assistant': return 'green';
      case 'system': return 'red';
      default: return 'white';
    }
  };

  const getRoleIcon = () => {
    switch (message.role) {
      case 'user': return '👤';
      case 'assistant': return '🤖';
      case 'system': return '⚠️';
      default: return '💬';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={getRoleColor()} bold>
          {getRoleIcon()} {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI' : 'System'}
        </Text>
        <Text color="gray" dimColor>
          {' '}• {formatTimestamp(message.timestamp)}
        </Text>
      </Box>
      
      <Box 
        borderStyle="round" 
        borderColor={getRoleColor()}
        paddingX={1}
        marginLeft={2}
        marginTop={0}
      >
        <Text>{message.content}</Text>
      </Box>
    </Box>
  );
};

const WelcomeScreen: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  useInput((input: string, key: any) => {
    if (key.return || input === ' ' || key.escape) {
      onDismiss();
    }
  });

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" height="100%">
      <Box marginBottom={2}>
        <Gradient name="rainbow">
          <BigText text="AI CLI" font="block" />
        </Gradient>
      </Box>

      <Box marginBottom={2}>
        <Text color="cyan" bold>
          🚀 Powered by Multiple AI Providers ⚡
        </Text>
      </Box>

      <Box flexDirection="column" alignItems="center" marginBottom={3}>
        <Text color="green" bold>✨ Features:</Text>
        <Text color="white">🤖 OpenAI GPT, Claude, Gemini, Qwen</Text>
        <Text color="white">💬 Interactive Chat Interface</Text>
        <Text color="white">📁 File & Directory Analysis</Text>
        <Text color="white">🔄 Session Management</Text>
        <Text color="white">🌍 Multi-language Support</Text>
      </Box>

      <Box flexDirection="column" alignItems="center" marginBottom={2}>
        <Text color="yellow" bold>🎮 Controls:</Text>
        <Text color="gray">• <Text color="cyan">Enter</Text> - Send message</Text>
        <Text color="gray">• <Text color="cyan">Ctrl+E</Text> - Toggle Chinese input</Text>
        <Text color="gray">• <Text color="cyan">Ctrl+C</Text> - Exit</Text>
      </Box>

      <Box borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
        <Text color="cyan" bold>
          🎯 Press Enter or Space to start chatting!
        </Text>
      </Box>
    </Box>
  );
};

export class GeminiStyleTUI {
  private app: any;

  constructor(private options: { handlers: TUIHandlers; initialStatus?: string }) {}

  start(): void {
    this.app = render(
      <App 
        handlers={this.options.handlers}
        initialStatus={this.options.initialStatus}
      />
    );
  }

  stop(): void {
    if (this.app) {
      this.app.unmount();
    }
  }

  setStatus(_status: string): void {
    // Status is managed internally by React components
  }
}
