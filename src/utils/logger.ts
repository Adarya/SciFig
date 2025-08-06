// Logger utility for frontend logging
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  component?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    
    // Set log level based on environment
    const envLogLevel = import.meta.env.VITE_LOG_LEVEL;
    if (envLogLevel && LogLevel[envLogLevel as keyof typeof LogLevel] !== undefined) {
      this.logLevel = LogLevel[envLogLevel as keyof typeof LogLevel];
    } else {
      this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
    }
  }

  private formatMessage(level: LogLevel, message: string, component?: string): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const componentPrefix = component ? `[${component}]` : '';
    return `${timestamp} ${levelName} ${componentPrefix} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  debug(message: string, data?: any, component?: string) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, component);
    if (data) {
      console.log(formattedMessage, data);
    } else {
      console.log(formattedMessage);
    }
  }

  info(message: string, data?: any, component?: string) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, component);
    if (data) {
      console.info(formattedMessage, data);
    } else {
      console.info(formattedMessage);
    }
  }

  warn(message: string, data?: any, component?: string) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.WARN, message, component);
    if (data) {
      console.warn(formattedMessage, data);
    } else {
      console.warn(formattedMessage);
    }
  }

  error(message: string, error?: any, component?: string) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.ERROR, message, component);
    if (error) {
      console.error(formattedMessage, error);
    } else {
      console.error(formattedMessage);
    }
  }

  // API request logging
  apiRequest(method: string, url: string, data?: any) {
    this.debug(`API ${method} ${url}`, data, 'API');
  }

  apiResponse(method: string, url: string, status: number, data?: any) {
    if (status >= 400) {
      this.error(`API ${method} ${url} failed with status ${status}`, data, 'API');
    } else {
      this.debug(`API ${method} ${url} success (${status})`, data, 'API');
    }
  }

  // Component lifecycle logging
  componentMount(componentName: string) {
    this.debug(`Component mounted`, undefined, componentName);
  }

  componentUnmount(componentName: string) {
    this.debug(`Component unmounted`, undefined, componentName);
  }

  // User action logging
  userAction(action: string, data?: any) {
    this.info(`User action: ${action}`, data, 'USER');
  }
}

// Export singleton instance
export const logger = new Logger();

// In development, expose logger to global scope for debugging
if (import.meta.env.DEV) {
  (window as any).logger = logger;
  console.log('🔍 Logger available globally as window.logger');
}

// Export default for easier imports
export default logger; 