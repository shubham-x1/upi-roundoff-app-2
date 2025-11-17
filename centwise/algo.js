/**
 * UPI Roundup Savings Algorithm
 * Automatically rounds up payments to help users meet monthly savings goals
 */

class RoundupSavingsCalculator {
  constructor() {
    this.monthlyGoal = 0;
    this.roundupMultiple = 10;
    this.payments = [];
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
  }

  /**
   * Set monthly savings goal
   * @param {number} goal - Target savings amount for the month
   */
  setMonthlyGoal(goal) {
    if (goal < 0) throw new Error('Goal must be positive');
    this.monthlyGoal = parseFloat(goal);
    return this;
  }

  /**
   * Set roundup multiple (5, 10, 50, 100, etc.)
   * @param {number} multiple - Amount to round up to
   */
  setRoundupMultiple(multiple) {
    if (multiple <= 0) throw new Error('Multiple must be greater than 0');
    this.roundupMultiple = parseFloat(multiple);
    return this;
  }

  /**
   * Calculate roundup amount for a payment
   * @param {number} amount - Original payment amount
   * @returns {number} Roundup amount
   */
  calculateRoundup(amount) {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return 0;
    
    const remainder = num % this.roundupMultiple;
    if (remainder === 0) return 0;
    
    return this.roundupMultiple - remainder;
  }

  /**
   * Calculate dynamic roundup based on goal progress
   * Adjusts roundup amount to help meet monthly goal
   * @param {number} amount - Original payment amount
   * @returns {object} Roundup calculation with dynamic adjustment
   */
  calculateDynamicRoundup(amount) {
    const baseRoundup = this.calculateRoundup(amount);
    const currentSavings = this.getTotalRoundup();
    const remainingGoal = this.monthlyGoal - currentSavings;
    const daysLeftInMonth = this.getDaysLeftInMonth();
    const avgTransactionsPerDay = this.getAvgTransactionsPerDay();
    
    // Estimate transactions remaining this month
    const estimatedRemainingTransactions = Math.max(
      daysLeftInMonth * avgTransactionsPerDay,
      1
    );
    
    // Calculate required average roundup to meet goal
    const requiredAvgRoundup = remainingGoal > 0 
      ? remainingGoal / estimatedRemainingTransactions 
      : 0;
    
    // Suggest dynamic roundup
    let suggestedRoundup = baseRoundup;
    let adjustmentReason = 'standard';
    
    if (remainingGoal > 0 && requiredAvgRoundup > baseRoundup) {
      // Need to round up more to meet goal
      suggestedRoundup = Math.ceil(requiredAvgRoundup / this.roundupMultiple) * this.roundupMultiple;
      adjustmentReason = 'behind_goal';
    } else if (currentSavings >= this.monthlyGoal) {
      // Goal already met, use minimum roundup
      suggestedRoundup = baseRoundup;
      adjustmentReason = 'goal_met';
    }
    
    return {
      originalAmount: amount,
      baseRoundup: baseRoundup,
      suggestedRoundup: suggestedRoundup,
      roundedAmount: amount + suggestedRoundup,
      adjustmentReason: adjustmentReason,
      goalProgress: this.getGoalProgress(),
      remainingToGoal: Math.max(remainingGoal, 0)
    };
  }

  /**
   * Process a payment with roundup
   * @param {number} amount - Payment amount
   * @param {string} description - Payment description (optional)
   * @param {boolean} useDynamic - Use dynamic roundup calculation
   * @returns {object} Payment record with roundup details
   */
  processPayment(amount, description = '', useDynamic = false) {
    const timestamp = new Date();
    const roundupData = useDynamic 
      ? this.calculateDynamicRoundup(amount)
      : {
          originalAmount: amount,
          baseRoundup: this.calculateRoundup(amount),
          suggestedRoundup: this.calculateRoundup(amount),
          roundedAmount: amount + this.calculateRoundup(amount),
          adjustmentReason: 'standard'
        };
    
    const payment = {
      id: this.generateId(),
      timestamp: timestamp,
      description: description,
      ...roundupData
    };
    
    this.payments.push(payment);
    return payment;
  }

  /**
   * Get total roundup savings
   * @returns {number} Total roundup amount
   */
  getTotalRoundup() {
    return this.payments.reduce((sum, p) => sum + p.suggestedRoundup, 0);
  }

  /**
   * Get total original payment amount
   * @returns {number} Total original payments
   */
  getTotalPayments() {
    return this.payments.reduce((sum, p) => sum + p.originalAmount, 0);
  }

  /**
   * Get goal progress percentage
   * @returns {number} Progress percentage (0-100)
   */
  getGoalProgress() {
    if (this.monthlyGoal === 0) return 0;
    return Math.min((this.getTotalRoundup() / this.monthlyGoal) * 100, 100);
  }

  /**
   * Get average roundup per transaction
   * @returns {number} Average roundup amount
   */
  getAverageRoundup() {
    if (this.payments.length === 0) return 0;
    return this.getTotalRoundup() / this.payments.length;
  }

  /**
   * Estimate transactions needed to reach goal
   * @returns {number} Estimated number of transactions
   */
  getEstimatedTransactionsToGoal() {
    const remaining = this.monthlyGoal - this.getTotalRoundup();
    if (remaining <= 0) return 0;
    
    const avgRoundup = this.getAverageRoundup();
    if (avgRoundup === 0) {
      // Use base roundup calculation on average payment
      const avgPayment = this.getAveragePayment();
      const estimatedRoundup = this.calculateRoundup(avgPayment || 100);
      return estimatedRoundup > 0 ? Math.ceil(remaining / estimatedRoundup) : 0;
    }
    
    return Math.ceil(remaining / avgRoundup);
  }

  /**
   * Get average payment amount
   * @returns {number} Average payment
   */
  getAveragePayment() {
    if (this.payments.length === 0) return 0;
    return this.getTotalPayments() / this.payments.length;
  }

  /**
   * Get days left in current month
   * @returns {number} Days remaining
   */
  getDaysLeftInMonth() {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate() - now.getDate() + 1;
  }

  /**
   * Get average transactions per day
   * @returns {number} Average daily transactions
   */
  getAvgTransactionsPerDay() {
    if (this.payments.length === 0) return 1;
    
    const now = new Date();
    const dayOfMonth = now.getDate();
    return this.payments.length / dayOfMonth;
  }

  /**
   * Get summary report
   * @returns {object} Complete summary
   */
  getSummary() {
    return {
      monthlyGoal: this.monthlyGoal,
      roundupMultiple: this.roundupMultiple,
      totalPayments: this.getTotalPayments(),
      totalRoundup: this.getTotalRoundup(),
      goalProgress: this.getGoalProgress(),
      remainingToGoal: Math.max(this.monthlyGoal - this.getTotalRoundup(), 0),
      transactionCount: this.payments.length,
      averageRoundup: this.getAverageRoundup(),
      averagePayment: this.getAveragePayment(),
      estimatedTransactionsNeeded: this.getEstimatedTransactionsToGoal(),
      daysLeftInMonth: this.getDaysLeftInMonth(),
      goalAchieved: this.getTotalRoundup() >= this.monthlyGoal
    };
  }

  /**
   * Get payment history
   * @param {number} limit - Number of recent payments to return
   * @returns {array} Payment records
   */
  getPaymentHistory(limit = null) {
    const sorted = [...this.payments].sort((a, b) => b.timestamp - a.timestamp);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Reset for new month
   */
  resetMonth() {
    this.payments = [];
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
  }

  /**
   * Generate unique ID
   * @returns {string} Unique identifier
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export data as JSON
   * @returns {string} JSON string
   */
  exportData() {
    return JSON.stringify({
      monthlyGoal: this.monthlyGoal,
      roundupMultiple: this.roundupMultiple,
      payments: this.payments,
      summary: this.getSummary()
    }, null, 2);
  }
}

// Example Usage
const calculator = new RoundupSavingsCalculator();

// Set monthly savings goal and roundup multiple
calculator
  .setMonthlyGoal(1000)
  .setRoundupMultiple(10);

// Process some payments
console.log('=== PAYMENT 1 ===');
const payment1 = calculator.processPayment(247.50, 'Grocery shopping');
console.log(payment1);

console.log('\n=== PAYMENT 2 ===');
const payment2 = calculator.processPayment(89.99, 'Mobile recharge');
console.log(payment2);

console.log('\n=== PAYMENT 3 (Dynamic) ===');
const payment3 = calculator.processPayment(456.75, 'Restaurant bill', true);
console.log(payment3);

console.log('\n=== SUMMARY ===');
console.log(calculator.getSummary());

console.log('\n=== PAYMENT HISTORY ===');
console.log(calculator.getPaymentHistory(3));

// Export all data
console.log('\n=== EXPORTED DATA ===');
console.log(calculator.exportData());

// Export the class for use in other modules
// module.exports = RoundupSavingsCalculator;