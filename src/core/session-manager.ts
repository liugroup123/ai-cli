import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfigManager } from './config';
import { ChatMessage } from './ai-provider';

export interface Session {
  id: string;
  name: string;
  model: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface SessionSummary {
  id: string;
  name: string;
  model: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export class SessionManager {
  private sessionsDir: string;
  private currentSession?: Session;

  constructor(private configManager: ConfigManager) {
    this.sessionsDir = join(configManager.getConfigDir(), 'sessions');
    this.ensureSessionsDir();
  }

  private async ensureSessionsDir(): Promise<void> {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async createSession(model: string, name?: string): Promise<Session> {
    const id = this.generateSessionId();
    const session: Session = {
      id,
      name: name || `Session ${new Date().toLocaleDateString()}`,
      model,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.currentSession = session;
    await this.saveSessionToDisk(session);
    
    return session;
  }

  async loadSession(sessionId: string): Promise<Session> {
    try {
      const sessionPath = join(this.sessionsDir, `${sessionId}.json`);
      const sessionData = await fs.readFile(sessionPath, 'utf-8');
      const session: Session = JSON.parse(sessionData);
      
      // Convert date strings back to Date objects
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date(session.updatedAt);
      
      this.currentSession = session;
      return session;
    } catch (error) {
      throw new Error(`Failed to load session ${sessionId}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async saveSession(sessionId: string, name?: string): Promise<void> {
    if (!this.currentSession || this.currentSession.id !== sessionId) {
      throw new Error('No active session to save');
    }

    if (name) {
      this.currentSession.name = name;
    }

    this.currentSession.updatedAt = new Date();
    await this.saveSessionToDisk(this.currentSession);
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionPath = join(this.sessionsDir, `${sessionId}.json`);
      await fs.unlink(sessionPath);
      
      if (this.currentSession?.id === sessionId) {
        this.currentSession = undefined;
      }
    } catch (error) {
      throw new Error(`Failed to delete session ${sessionId}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async listSessions(): Promise<SessionSummary[]> {
    try {
      const files = await fs.readdir(this.sessionsDir);
      const sessionFiles = files.filter(file => file.endsWith('.json'));
      
      const sessions: SessionSummary[] = [];
      
      for (const file of sessionFiles) {
        try {
          const sessionPath = join(this.sessionsDir, file);
          const sessionData = await fs.readFile(sessionPath, 'utf-8');
          const session: Session = JSON.parse(sessionData);
          
          sessions.push({
            id: session.id,
            name: session.name,
            model: session.model,
            messageCount: session.messages.length,
            createdAt: new Date(session.createdAt).toLocaleString(),
            updatedAt: new Date(session.updatedAt).toLocaleString()
          });
        } catch {
          // Skip corrupted session files
        }
      }
      
      // Sort by updated date (newest first)
      return sessions.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      throw new Error(`Failed to list sessions: ${error instanceof Error ? error.message : error}`);
    }
  }

  async addMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    if (!this.currentSession || this.currentSession.id !== sessionId) {
      await this.loadSession(sessionId);
    }

    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const message: ChatMessage = {
      role,
      content,
      timestamp: new Date()
    };

    this.currentSession.messages.push(message);
    this.currentSession.updatedAt = new Date();

    // Auto-save if enabled
    if (this.configManager.get('autoSave')) {
      await this.saveSessionToDisk(this.currentSession);
    }
  }

  async exportSession(sessionId: string): Promise<string> {
    const session = await this.loadSession(sessionId);
    
    const exportData = {
      session,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importSession(sessionData: string): Promise<Session> {
    try {
      const importData = JSON.parse(sessionData);
      const session: Session = importData.session;
      
      // Generate new ID to avoid conflicts
      session.id = this.generateSessionId();
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date();
      
      await this.saveSessionToDisk(session);
      return session;
    } catch (error) {
      throw new Error(`Failed to import session: ${error instanceof Error ? error.message : error}`);
    }
  }

  getCurrentSession(): Session | undefined {
    return this.currentSession;
  }

  async cleanupOldSessions(): Promise<void> {
    const maxSessions = this.configManager.get('maxSessions');
    const sessions = await this.listSessions();
    
    if (sessions.length > maxSessions) {
      const sessionsToDelete = sessions.slice(maxSessions);
      
      for (const session of sessionsToDelete) {
        await this.deleteSession(session.id);
      }
    }
  }

  async searchSessions(query: string): Promise<SessionSummary[]> {
    const sessions = await this.listSessions();
    
    return sessions.filter(session => 
      session.name.toLowerCase().includes(query.toLowerCase()) ||
      session.model.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getSessionStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    modelUsage: Record<string, number>;
    averageMessagesPerSession: number;
  }> {
    const sessions = await this.listSessions();
    
    const stats = {
      totalSessions: sessions.length,
      totalMessages: sessions.reduce((sum, s) => sum + s.messageCount, 0),
      modelUsage: {} as Record<string, number>,
      averageMessagesPerSession: 0
    };

    // Calculate model usage
    sessions.forEach(session => {
      stats.modelUsage[session.model] = (stats.modelUsage[session.model] || 0) + 1;
    });

    // Calculate average
    stats.averageMessagesPerSession = stats.totalSessions > 0 
      ? Math.round(stats.totalMessages / stats.totalSessions) 
      : 0;

    return stats;
  }

  private async saveSessionToDisk(session: Session): Promise<void> {
    try {
      await this.ensureSessionsDir();
      const sessionPath = join(this.sessionsDir, `${session.id}.json`);
      await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save session: ${error instanceof Error ? error.message : error}`);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Backup and restore functionality
  async backupSessions(backupPath: string): Promise<void> {
    try {
      const sessions = await this.listSessions();
      const backup: { sessions: Session[]; createdAt: string; version: string } = {
        sessions: [],
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      };

      for (const sessionSummary of sessions) {
        const session = await this.loadSession(sessionSummary.id);
        backup.sessions.push(session);
      }

      await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to backup sessions: ${error instanceof Error ? error.message : error}`);
    }
  }

  async restoreSessions(backupPath: string): Promise<void> {
    try {
      const backupData = await fs.readFile(backupPath, 'utf-8');
      const backup = JSON.parse(backupData);

      for (const sessionData of backup.sessions) {
        const session: Session = sessionData;
        session.id = this.generateSessionId(); // Generate new IDs
        await this.saveSessionToDisk(session);
      }
    } catch (error) {
      throw new Error(`Failed to restore sessions: ${error instanceof Error ? error.message : error}`);
    }
  }
}
