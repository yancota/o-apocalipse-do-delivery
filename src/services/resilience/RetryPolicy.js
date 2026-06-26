class RetryPolicy {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts !== undefined ? options.maxAttempts : 4; // 1 initial + 3 retries
    this.backoffMs = options.backoffMs !== undefined ? options.backoffMs : 500;
    this.timeoutMs = options.timeoutMs !== undefined ? options.timeoutMs : 2000;
  }

  async execute(action) {
    let lastError;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await this.executeWithTimeout(action);
      } catch (error) {
        lastError = error;
        if (attempt < this.maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.backoffMs));
        }
      }
    }
    throw lastError;
  }

  async executeWithTimeout(action) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Timeout operacional do gateway"));
      }, this.timeoutMs);
    });

    try {
      const result = await Promise.race([
        action(),
        timeoutPromise
      ]);
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

module.exports = { RetryPolicy };
