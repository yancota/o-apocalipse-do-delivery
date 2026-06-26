class CircuitBreaker {
  constructor(options = {}) {
    this.windowSize = options.windowSize !== undefined ? options.windowSize : 10;
    this.minRequests = options.minRequests !== undefined ? options.minRequests : 5;
    this.failureThreshold = options.failureThreshold !== undefined ? options.failureThreshold : 0.5; // >= 50%
    this.cooldownMs = options.cooldownMs !== undefined ? options.cooldownMs : 10000;
    
    this.state = 'CLOSED';
    this.history = []; // true for success, false for failure
    this.nextAllowedTime = 0;
  }

  isOpen() {
    this.checkCooldown();
    return this.state === 'OPEN';
  }

  checkCooldown() {
    if (this.state === 'OPEN' && Date.now() >= this.nextAllowedTime) {
      this.state = 'HALF_OPEN';
    }
  }

  async execute(action) {
    if (this.isOpen()) {
      throw new Error("Circuit breaker is open");
    }

    try {
      const result = await action();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.history = [];
    }
    this.pushHistory(true);
  }

  recordFailure() {
    this.pushHistory(false);
    this.evaluateState();
  }

  pushHistory(success) {
    this.history.push(success);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }
  }

  evaluateState() {
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAllowedTime = Date.now() + this.cooldownMs;
      return;
    }

    if (this.state === 'CLOSED' && this.history.length >= this.minRequests) {
      const failures = this.history.filter(s => !s).length;
      const rate = failures / this.history.length;
      if (rate >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAllowedTime = Date.now() + this.cooldownMs;
      }
    }
  }
}

module.exports = { CircuitBreaker };
