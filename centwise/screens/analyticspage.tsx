import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Analytics Screen Component for React Navigation
const AnalyticsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  // Get data from route params, or use default values
  const totalSaved = route?.params?.totalSaved || 0;
  const transactionCount = route?.params?.transactionCount || 0;
  
  const avgSaving = transactionCount > 0 ? totalSaved / transactionCount : 0;

  const weeklyData = [
    { day: 'Mon', amount: totalSaved * 0.12 },
    { day: 'Tue', amount: totalSaved * 0.18 },
    { day: 'Wed', amount: totalSaved * 0.15 },
    { day: 'Thu', amount: totalSaved * 0.20 },
    { day: 'Fri', amount: totalSaved * 0.14 },
    { day: 'Sat', amount: totalSaved * 0.11 },
    { day: 'Sun', amount: totalSaved * 0.10 },
  ];

  const categoryData = [
    { category: 'Food & Dining', amount: totalSaved * 0.35, color: '#FF6B6B', icon: '🍔' },
    { category: 'Shopping', amount: totalSaved * 0.25, color: '#4ECDC4', icon: '🛍️' },
    { category: 'Transport', amount: totalSaved * 0.20, color: '#FFD93D', icon: '🚗' },
    { category: 'Entertainment', amount: totalSaved * 0.12, color: '#A8E6CF', icon: '🎮' },
    { category: 'Others', amount: totalSaved * 0.08, color: '#B8B8D1', icon: '📦' },
  ];

  const maxWeeklyAmount = Math.max(...weeklyData.map(d => d.amount));

  return (
    <View style={styles.pageContainer}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Analytics</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.pageContent} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#7C3AED' }]}>
            <Text style={styles.summaryIcon}>💰</Text>
            <Text style={styles.summaryValue}>₹{totalSaved.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Saved</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#10B981' }]}>
            <Text style={styles.summaryIcon}>📊</Text>
            <Text style={styles.summaryValue}>{transactionCount}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.summaryIcon}>📈</Text>
            <Text style={styles.summaryValue}>₹{avgSaving.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Avg. Saving</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Savings</Text>
          <Text style={styles.chartSubtitle}>Your savings over the last 7 days</Text>
          
          <View style={styles.chartContainer}>
            {weeklyData.map((item, index) => {
              const barHeight = maxWeeklyAmount > 0 ? (item.amount / maxWeeklyAmount) * 150 : 0;
              return (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.bar, { height: barHeight }]}>
                      <Text style={styles.barValue}>₹{item.amount.toFixed(0)}</Text>
                    </View>
                  </View>
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Category Breakdown</Text>
          <Text style={styles.chartSubtitle}>Where you're saving the most</Text>
          
          <View style={styles.categoryList}>
            {categoryData.map((item, index) => {
              const percentage = totalSaved > 0 ? (item.amount / totalSaved) * 100 : 0;
              return (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryIcon}>{item.icon}</Text>
                      <Text style={styles.categoryName}>{item.category}</Text>
                    </View>
                    <Text style={styles.categoryAmount}>₹{item.amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.categoryBarContainer}>
                    <View
                      style={[
                        styles.categoryBar,
                        { width: `${percentage}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryPercentage}>{percentage.toFixed(1)}%</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.chartTitle}>💡 Insights</Text>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>🔥</Text>
            <View style={styles.insightText}>
              <Text style={styles.insightTitle}>Great Progress!</Text>
              <Text style={styles.insightDescription}>
                You've saved {transactionCount} times this month. Keep it up!
              </Text>
            </View>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>📅</Text>
            <View style={styles.insightText}>
              <Text style={styles.insightTitle}>Best Saving Day</Text>
              <Text style={styles.insightDescription}>
                Thursday is your best day with ₹{(totalSaved * 0.20).toFixed(2)} saved
              </Text>
            </View>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>🎯</Text>
            <View style={styles.insightText}>
              <Text style={styles.insightTitle}>Top Category</Text>
              <Text style={styles.insightDescription}>
                Food & Dining gives you the most savings
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#7C3AED',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  pageContent: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    backgroundColor: '#7C3AED',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
    minHeight: 30,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  barLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  categoryList: {
    marginTop: 10,
  },
  categoryItem: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  categoryBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  insightsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightItem: {
    flexDirection: 'row',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  insightIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default AnalyticsScreen;