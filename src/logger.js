const levels = ['trace', 'debug', 'info', 'warn', 'error'];

class Logger {
  constructor({level}) {
    let threshold = levels.indexOf(level);
    if (threshold === -1) {
      console.warn(`Invalid log level: ${level} - defaulting to info`);
      threshold = 2;
    }

    this.threshold = threshold;
  }

  trace(...args) {
    if (this.threshold <= 0) {
      console.debug(...args);
    }
  }

  debug(...args) {
    if (this.threshold <= 1) {
      console.debug(...args);
    }
  }

  info(...args) {
    if (this.threshold <= 2) {
      console.log(...args);
    }
  }

  warn(...args) {
    if (this.threshold <= 3) {
      console.warn(...args);
    }
  }

  error(...args) {
    if (this.threshold <= 4) {
      console.error(...args);
    }
  }
};

export default Logger;
