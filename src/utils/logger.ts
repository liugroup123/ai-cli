import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

export class Logger {
  private logLevel: LogLevel = LogLevel.INFO;
  private logFile?: string;
  private enableConsole: boolean = true;
  private enableFile: boolean = false;

  constructor(options: {
    level?: LogLevel;
    logFile?: string;
    enableConsole?: boolean;
    enableFile?: boolean;
  } = {}) {
    this.logLevel = options.level ?? LogLevel.INFO;
    this.logFile = options.logFile;
    this.enableConsole = options.enableConsole ?? true;
    this.enableFile = options.enableFile ?? false;
  }

  debug(message: string, data?: any, source?: string): void {
    this.log(LogLevel.DEBUG, message, data, source);
  }

  info(message: string, data?: any, source?: string): void {
    this.log(LogLevel.INFO, message, data, source);
  }

  warn(message: string, data?: any, source?: string): void {
    this.log(LogLevel.WARN, message, data, source);
  }

  error(message: string, data?: any, source?: string): void {
    this.log(LogLevel.ERROR, message, data, source);
  }

  private log(level: LogLevel, message: string, data?: any, source?: string): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      source
    };

    if (this.enableConsole) {
      this.logToConsole(entry);
    }

    if (this.enableFile && this.logFile) {
      this.logToFile(entry).catch(err => {
        console.error('Failed to write to log file:', err);
      });
    }
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelStr = LogLevel[entry.level];
    const source = entry.source ? `[${entry.source}]` : '';
    
    let coloredMessage: string;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        coloredMessage = chalk.gray(`${timestamp} DEBUG ${source} ${entry.message}`);
        break;
      case LogLevel.INFO:
        coloredMessage = chalk.blue(`${timestamp} INFO ${source} ${entry.message}`);
        break;
      case LogLevel.WARN:
        coloredMessage = chalk.yellow(`${timestamp} WARN ${source} ${entry.message}`);
        break;
      case LogLevel.ERROR:
        coloredMessage = chalk.red(`${timestamp} ERROR ${source} ${entry.message}`);
        break;
      default:
        coloredMessage = `${timestamp} ${levelStr} ${source} ${entry.message}`;
    }

    console.log(coloredMessage);

    if (entry.data) {
      console.log(chalk.gray('Data:'), entry.data);
    }
  }

  private async logToFile(entry: LogEntry): Promise<void> {
    if (!this.logFile) return;

    const timestamp = entry.timestamp.toISOString();
    const levelStr = LogLevel[entry.level];
    const source = entry.source ? `[${entry.source}]` : '';
    
    let logLine = `${timestamp} ${levelStr} ${source} ${entry.message}`;
    
    if (entry.data) {
      logLine += ` | Data: ${JSON.stringify(entry.data)}`;
    }
    
    logLine += '\n';

    try {
      await fs.appendFile(this.logFile, logLine, 'utf-8');
    } catch (error) {
      // Fallback to console if file logging fails
      console.error('Failed to write to log file:', error);
    }
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setLogFile(filePath: string): void {
    this.logFile = filePath;
    this.enableFile = true;
  }

  enableFileLogging(enable: boolean = true): void {
    this.enableFile = enable;
  }

  enableConsoleLogging(enable: boolean = true): void {
    this.enableConsole = enable;
  }

  async clearLogFile(): Promise<void> {
    if (this.logFile) {
      try {
        await fs.writeFile(this.logFile, '', 'utf-8');
      } catch (error) {
        this.error('Failed to clear log file', error);
      }
    }
  }

  async getLogEntries(limit?: number): Promise<LogEntry[]> {
    if (!this.logFile) {
      return [];
    }

    try {
      const content = await fs.readFile(this.logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      
      const entries: LogEntry[] = [];
      
      for (const line of lines) {
        try {
          const entry = this.parseLogLine(line);
          if (entry) {
            entries.push(entry);
          }
        } catch {
          // Skip malformed lines
        }
      }

      // Return most recent entries first
      entries.reverse();
      
      return limit ? entries.slice(0, limit) : entries;
    } catch (error) {
      this.error('Failed to read log file', error);
      return [];
    }
  }

  private parseLogLine(line: string): LogEntry | null {
    // Parse log line format: "timestamp LEVEL [source] message | Data: {...}"
    const regex = /^(\S+)\s+(\w+)\s*(\[.*?\])?\s+(.*?)(?:\s+\|\s+Data:\s+(.*))?$/;
    const match = line.match(regex);
    
    if (!match) {
      return null;
    }

    const [, timestamp, levelStr, source, message, dataStr] = match;
    
    const level = LogLevel[levelStr as keyof typeof LogLevel];
    if (level === undefined) {
      return null;
    }

    let data: any;
    if (dataStr) {
      try {
        data = JSON.parse(dataStr);
      } catch {
        data = dataStr;
      }
    }

    return {
      timestamp: new Date(timestamp),
      level,
      message,
      data,
      source: source ? source.slice(1, -1) : undefined // Remove brackets
    };
  }

  // Utility methods for common logging patterns
  logApiCall(method: string, url: string, status?: number, duration?: number): void {
    const message = `${method} ${url}`;
    const data = { status, duration };
    
    if (status && status >= 400) {
      this.error(message, data, 'API');
    } else {
      this.info(message, data, 'API');
    }
  }

  logUserAction(action: string, details?: any): void {
    this.info(`User action: ${action}`, details, 'USER');
  }

  logSystemEvent(event: string, details?: any): void {
    this.info(`System event: ${event}`, details, 'SYSTEM');
  }

  logPerformance(operation: string, duration: number, details?: any): void {
    const message = `${operation} completed in ${duration}ms`;
    const data = { duration, ...details };
    
    if (duration > 5000) {
      this.warn(message, data, 'PERF');
    } else {
      this.debug(message, data, 'PERF');
    }
  }

  // Create a child logger with a specific source
  createChild(source: string): Logger {
    const child = new Logger({
      level: this.logLevel,
      logFile: this.logFile,
      enableConsole: this.enableConsole,
      enableFile: this.enableFile
    });

    // Override log method to include source
    const originalLog = child.log.bind(child);
    child.log = (level: LogLevel, message: string, data?: any, childSource?: string) => {
      originalLog(level, message, data, childSource || source);
    };

    return child;
  }
}
