import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Type definitions
interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  color: string;
}

// Goals Screen Component for React Navigation
const GoalsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  // Get totalSaved from route params, or use default value
  const totalSaved = route?.params?.totalSaved || 0;

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: totalSaved * 0.4,
      deadline: '2025-12-31',
      category: 'Savings',
      color: '#7C3AED',
    },
    {
      id: '2',
      title: 'Vacation Trip',
      targetAmount: 25000,
      currentAmount: totalSaved * 0.3,
      deadline: '2025-08-15',
      category: 'Travel',
      color: '#10B981',
    },
    {
      id: '3',
      title: 'New Laptop',
      targetAmount: 50000,
      currentAmount: totalSaved * 0.2,
      deadline: '2025-10-01',
      category: 'Technology',
      color: '#F59E0B',
    },
    {
      id: '4',
      title: 'Investment Fund',
      targetAmount: 100000,
      currentAmount: totalSaved * 0.1,
      deadline: '2026-01-01',
      category: 'Investment',
      color: '#EF4444',
    },
  ]);

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    category: '',
  });

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.deadline) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      deadline: newGoal.deadline,
      category: newGoal.category || 'General',
      color: '#7C3AED',
    };

    setGoals([...goals, goal]);
    setShowAddGoal(false);
    setNewGoal({ title: '', targetAmount: '', deadline: '', category: '' });
    Alert.alert('Success', 'Goal added successfully!');
  };

  const handleDeleteGoal = (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setGoals(goals.filter(g => g.id !== goalId)),
        },
      ]
    );
  };

  return (
    <View style={styles.pageContainer}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Savings Goals</Text>
        <TouchableOpacity onPress={() => setShowAddGoal(true)} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.pageContent} showsVerticalScrollIndicator={false}>
        {/* Total Progress Card */}
        <View style={styles.totalProgressCard}>
          <Text style={styles.totalProgressTitle}>Total Goals Progress</Text>
          <Text style={styles.totalProgressAmount}>₹{totalSaved.toFixed(2)}</Text>
          <Text style={styles.totalProgressSubtitle}>Saved across all goals</Text>
          <View style={styles.totalProgressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{goals.length}</Text>
              <Text style={styles.progressStatLabel}>Active Goals</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                {goals.filter(g => (g.currentAmount / g.targetAmount) * 100 >= 100).length}
              </Text>
              <Text style={styles.progressStatLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Goals List */}
        <Text style={styles.sectionTitle}>Your Goals</Text>
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const daysLeft = Math.ceil(
            (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );

          return (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalTitleContainer}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalCategory}>{goal.category}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteGoal(goal.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.goalAmounts}>
                <Text style={styles.goalCurrentAmount}>
                  ₹{goal.currentAmount.toFixed(2)}
                </Text>
                <Text style={styles.goalTargetAmount}>
                  of ₹{goal.targetAmount.toFixed(2)}
                </Text>
              </View>

              <View style={styles.goalProgressBar}>
                <View
                  style={[
                    styles.goalProgressFill,
                    { width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color },
                  ]}
                />
              </View>

              <View style={styles.goalFooter}>
                <Text style={styles.goalProgress}>{progress.toFixed(1)}% Complete</Text>
                <Text style={styles.goalDeadline}>
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddGoal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddGoal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Goal</Text>

            <TextInput
              style={styles.input}
              placeholder="Goal Title"
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Target Amount (₹)"
              value={newGoal.targetAmount}
              onChangeText={(text) => setNewGoal({ ...newGoal, targetAmount: text })}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Category (e.g., Travel, Savings)"
              value={newGoal.category}
              onChangeText={(text) => setNewGoal({ ...newGoal, category: text })}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Deadline (YYYY-MM-DD)"
              value={newGoal.deadline}
              onChangeText={(text) => setNewGoal({ ...newGoal, deadline: text })}
              placeholderTextColor="#999"
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleAddGoal}>
              <Text style={styles.submitButtonText}>Create Goal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddGoal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  pageContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  totalProgressCard: {
    backgroundColor: '#7C3AED',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  totalProgressTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  totalProgressAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  totalProgressSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  totalProgressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  progressStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  goalCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  goalCategory: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  goalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  goalCurrentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginRight: 8,
  },
  goalTargetAmount: {
    fontSize: 16,
    color: '#6B7280',
  },
  goalProgressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  goalDeadline: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});

export default GoalsScreen;