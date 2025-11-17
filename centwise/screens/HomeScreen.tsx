import { backend } from '../api'; 
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Linking,
} from 'react-native';

// Type definitions
interface Transaction {
  id: string;
  merchantName: string;
  amount: number;
  date: string;
  userId: string;
}

interface TransactionItemProps {
  transaction: Transaction;
  index: number;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  totalSaved: number;
}

// API Configuration
const USE_MOCK_AUTH = false;
const API_BASE_URL = 'http://10.0.2.2:3002';

// Mock user data storage
const mockUsers: { [email: string]: User & { password: string } } = {};
const mockTransactions: { [userId: string]: Transaction[] } = {};

// Mock API functions
const mockAuth = {
  login: async (email: string, password: string) => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    const user = mockUsers[email];
    if (!user || user.password !== password) {
      return { success: false, error: 'Invalid email or password' };
    }
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  },
  
  signup: async (email: string, password: string, displayName: string) => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    if (mockUsers[email]) {
      return { success: false, error: 'Email already exists' };
    }
    const newUser: User & { password: string } = {
      uid: `user_${Date.now()}`,
      email,
      displayName,
      totalSaved: 0,
      password,
    };
    mockUsers[email] = newUser;
    mockTransactions[newUser.uid] = [];
    const { password: _, ...userWithoutPassword } = newUser;
    return { success: true, user: userWithoutPassword };
  },
  
  getTransactions: async (userId: string) => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
    const transactions = mockTransactions[userId] || [];
    return { success: true, data: transactions };
  },
};

// Utility functions
const calculateRoundUp = (amount: number): number => {
  const rounded = Math.ceil(amount);
  return rounded - amount;
};

const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(2)}`;
};

// Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  color: string;
  icon: string;
}> = ({ title, value, subtitle, color, icon }) => {
  return (
    <View style={[styles.statsCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsIcon}>{icon}</Text>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
      <Text style={[styles.statsValue, { color }]}>{value}</Text>
      <Text style={styles.statsSubtitle}>{subtitle}</Text>
    </View>
  );
};

// Enhanced Transaction Item Component
const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, index }) => {
  const roundUpAmount = calculateRoundUp(transaction.amount);
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.transactionItem, { opacity: fadeAnim }]}>
      <View style={styles.transactionContent}>
        <View style={styles.merchantAvatar}>
          <Text style={styles.merchantInitial}>
            {transaction.merchantName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.merchantName}>{transaction.merchantName}</Text>
          <Text style={styles.transactionDate}>
            {new Date(transaction.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
      <View style={styles.transactionAmounts}>
        <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsBadgeText}>+{formatCurrency(roundUpAmount)}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// QR Scanner Modal Component
const QRScannerModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (data: string) => void;
}> = ({ visible, onClose, onScanSuccess }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<string>('');
  const [manualUPI, setManualUPI] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);

  const requestCameraPermission = async () => {
    try {
      // Note: In a real app, you would use expo-camera or react-native-camera
      // This is a placeholder for demonstration
      Alert.alert(
        'Camera Permission',
        'Camera access is required to scan QR codes. In a production app, this would request camera permissions.',
        [
          {
            text: 'Grant Permission',
            onPress: () => {
              setHasPermission(true);
              Alert.alert(
                'QR Scanner',
                'In a production app, camera would open here. For now, use manual UPI input.',
                [{ text: 'OK', onPress: () => setShowManualInput(true) }]
              );
            },
          },
          { text: 'Cancel', onPress: () => onClose(), style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      requestCameraPermission();
    }
  }, [visible]);

  const handleManualSubmit = () => {
    if (!manualUPI.trim()) {
      Alert.alert('Error', 'Please enter a valid UPI ID');
      return;
    }
    onScanSuccess(manualUPI);
    setManualUPI('');
    setShowManualInput(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.qrModalContainer}>
        <View style={styles.qrModalContent}>
          {showManualInput ? (
            <>
              <Text style={styles.qrModalTitle}>Enter UPI ID</Text>
              <Text style={styles.qrModalSubtitle}>
                Enter the merchant's UPI ID manually
              </Text>
              
              <TextInput
                style={styles.upiInput}
                placeholder="merchant@upi"
                value={manualUPI}
                onChangeText={setManualUPI}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#999"
              />
              
              <TouchableOpacity
                style={styles.qrSubmitButton}
                onPress={handleManualSubmit}
              >
                <Text style={styles.qrSubmitButtonText}>Continue</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.qrSecondaryButton}
                onPress={() => setShowManualInput(false)}
              >
                <Text style={styles.qrSecondaryButtonText}>Try QR Scanner</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.qrModalTitle}>QR Code Scanner</Text>
              <Text style={styles.qrModalSubtitle}>
                Scan a merchant's QR code to make payment
              </Text>
              
              <View style={styles.qrPlaceholder}>
                <View style={styles.qrFrame}>
                  <View style={[styles.qrCorner, styles.qrCornerTL]} />
                  <View style={[styles.qrCorner, styles.qrCornerTR]} />
                  <View style={[styles.qrCorner, styles.qrCornerBL]} />
                  <View style={[styles.qrCorner, styles.qrCornerBR]} />
                  <Text style={styles.qrPlaceholderText}>📷</Text>
                  <Text style={styles.qrPlaceholderSubtext}>
                    Camera Preview
                  </Text>
                </View>
              </View>
              
              <Text style={styles.qrInfoText}>
                Position the QR code within the frame
              </Text>
              
              <TouchableOpacity
                style={styles.qrSecondaryButton}
                onPress={() => setShowManualInput(true)}
              >
                <Text style={styles.qrSecondaryButtonText}>Enter UPI ID Manually</Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity style={styles.qrCloseButton} onPress={onClose}>
            <Text style={styles.qrCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Authentication Modal Component
const AuthModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}> = ({ visible, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
  if (!email || !password || (!isLogin && !displayName)) {
    setError('Please fill in all fields');
    return;
  }

  setLoading(true);
  setError('');

  try {
    let result;

    if (USE_MOCK_AUTH) {
      if (isLogin) {
        result = await mockAuth.login(email, password);
      } else {
        result = await mockAuth.signup(email, password, displayName);
      }
    } else {
      // Demo backend flow (no real passwords). Use email as uid for demo.
      const uid = email.toLowerCase();

      if (isLogin) {
        // Try to fetch existing user. If not found, create one (demo-friendly).
        try {
          const userResp = await backend.getUser(uid);
          if (userResp && userResp.success && userResp.user) {
            const backendUser = userResp.user;
            // map backend user to frontend User interface
            result = {
              success: true,
              user: {
                uid: backendUser.uid,
                email: backendUser.email,
                displayName: backendUser.displayName,
                totalSaved: Number(backendUser.savings) || 0,
              },
            };
          } else {
            // user not found — create (fallback)
            const createResp = await backend.createUser(uid, displayName || uid.split('@')[0], email, 500);
            if (createResp && createResp.success) {
              result = {
                success: true,
                user: {
                  uid,
                  email,
                  displayName: createResp.user.displayName || (displayName || uid.split('@')[0]),
                  totalSaved: Number(createResp.user.savings) || 0,
                },
              };
            } else {
              result = { success: false, error: createResp?.error || 'Login failed' };
            }
          }
        } catch (err: unknown) {
          // treat as not found -> attempt create
          try {
            const createResp = await backend.createUser(uid, displayName || uid.split('@')[0], email, 500);
            if (createResp && createResp.success) {
              result = {
                success: true,
                user: {
                  uid,
                  email,
                  displayName: createResp.user.displayName || (displayName || uid.split('@')[0]),
                  totalSaved: Number(createResp.user.savings) || 0,
                },
              };
            } else {
              result = { success: false, error: createResp?.error || 'Login failed' };
            }
          } catch (e) {
            result = { success: false, error: (e as Error).message || 'Login failed' };
          }
        }
      } else {
        // Signup flow -> create user on backend (demo)
        try {
          const createResp = await backend.createUser(email.toLowerCase(), displayName, email, 500);
          if (createResp && createResp.success) {
            result = {
              success: true,
              user: {
                uid: createResp.user.uid || email.toLowerCase(),
                email: createResp.user.email || email,
                displayName: createResp.user.displayName || displayName,
                totalSaved: Number(createResp.user.savings) || 0,
              },
            };
          } else {
            result = { success: false, error: createResp?.error || 'Signup failed' };
          }
        } catch (e) {
          result = { success: false, error: (e as Error).message || 'Signup failed' };
        }
      }
    }

   if (result && result.success) {
  const userData = result.user as User | undefined;
  if (!userData) {
    setError('Authentication succeeded but user data is missing');
  } else {
    // ensure the shape matches our User interface
    const mappedUser: User = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      totalSaved: (userData.totalSaved ?? Number(userData.totalSaved) ?? 0) as number,
    };
    onAuthSuccess(mappedUser);
  }
} else {
  setError(result?.error || 'Authentication failed');
}

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};


  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              placeholderTextColor="#999"
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TouchableOpacity
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.authButtonText}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={() => {
              setIsLogin(!isLogin);
              resetForm();
            }}
          >
            <Text style={styles.switchModeText}>
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Main HomeScreen Component
const HomeScreen: React.FC = ( {navigation }: any) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalSaved, setTotalSaved] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [qrScannerVisible, setQrScannerVisible] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [goalsVisible, setGoalsVisible] = useState(false);
  const [monthlyGoal] = useState<number>(500);

  const fetchTransactions = async (userId: string): Promise<void> => {
    try {
      let result;
      
      if (USE_MOCK_AUTH) {
        result = await backend.getTransactions(userId);
      } else {
        const response = await fetch(`${API_BASE_URL}/api/transactions?userId=${userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        result = await response.json();
        if (!response.ok) {
          result.success = false;
        }
      }

      if (result.success) {
        const transactionsData = result.data as Transaction[];
        setTransactions(transactionsData);
     // fetch user to get latest balance/savings from backend
try {
  const userResp = await backend.getUser(userId);
  if (userResp && userResp.success && userResp.user) {
    // backend returns user.user with { uid, email, displayName, balance, savings }
    const backendUser = userResp.user;
    // update totalSaved from backend savings (savings is a string like "12.34")
    const savingsNum = Number(backendUser.savings ?? 0);
    setTotalSaved(prev => {
      // keep previous aggregation if backend doesn't provide meaningful savings
      return isNaN(savingsNum) ? prev : savingsNum;
    });
  }
} catch (e) {
  console.log('Could not fetch user balance/savings:', (e as Error).message);
}

        const total = transactionsData.reduce((sum: number, transaction: Transaction) => {
          return sum + calculateRoundUp(transaction.amount);
        }, 0);
        setTotalSaved(total);
      } else {
        console.error('Error fetching transactions:', result.error);
      }
    } catch (error: unknown) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions. Please try again.', [{ text: 'OK' }]);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = (): void => {
    if (user) {
      setRefreshing(true);
      fetchTransactions(user.uid);
    }
  };

  const handleStartNewPayment = (): void => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    Alert.alert(
      'Ready to save more?',
      'Choose payment method',
      [
        { 
          text: 'QR Scanner', 
          onPress: () => setQrScannerVisible(true)
        },
        { 
          text: 'UPI ID', 
          onPress: () => {
            setQrScannerVisible(true);
            // Will open with manual input
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

const handleQRScanSuccess = async (upi: string) => {
  try {
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to make a payment.');
      return;
    }

    // For demo: prompt / determine an amount. Replace with your real flow.
    const demoAmount = 123.45; // or get from a payment input modal

    // call backend.makePayment which exists in api.ts
    const resp = await backend.makePayment(user.uid, upi, demoAmount);

    // backend.makePayment returns { success, transaction, newBalance, savings }
    if (resp && resp.success) {
      Alert.alert(
        'Payment Successful',
        `Paid ₹${Number(resp.transaction.merchantAmount).toFixed(2)}\nSaved ₹${Number(resp.transaction.roundUp).toFixed(2)}`
      );

      // refresh transactions and user info
      await fetchTransactions(user.uid);

      try {
        const uResp = await backend.getUser(user.uid);
        if (uResp && uResp.success && uResp.user) {
          // update any UI user state if you store it here
          // setUser(...) if desired - map fields accordingly
          // e.g. setTotalSaved(Number(uResp.user.savings ?? 0));
          const savingsNum = Number(uResp.user.savings ?? 0);
          setTotalSaved(isNaN(savingsNum) ? totalSaved : savingsNum);
        }
      } catch (e) {
        console.log('Failed to refresh user after payment:', (e as Error).message);
      }
    } else {
      Alert.alert('Payment failed', resp?.error || 'Unknown error');
    }
  } catch (err) {
    console.error('Payment error:', err);
    Alert.alert('Payment error', (err as Error).message || 'Failed to process payment');
  }
};


  const handleSignOut = async (): Promise<void> => {
    try {
      setUser(null);
      setTransactions([]);
      setTotalSaved(0);
      Alert.alert('Success', 'Signed out successfully');
    } catch (error: unknown) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleAuthSuccess = (userData: User) => {
     backend.createUser(
    userData.uid,
    userData.displayName,
    userData.email,
    500
  ).catch(err => console.log("createUser:", err.message));
    setUser(userData);
    setTotalSaved(userData.totalSaved);
    setAuthModalVisible(false);
    Alert.alert('Success', `Welcome, ${userData.displayName}!`);
    fetchTransactions(userData.uid);
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Morning' : currentHour < 17 ? 'Afternoon' : 'Evening';
  const progressPercentage = Math.min((totalSaved / monthlyGoal) * 100, 100);

  // Not authenticated state
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.headerGradient}>
          <View style={styles.welcomeHeader}>
            <Text style={styles.welcomeHeaderTitle}>Welcome to RoundUP</Text>
            <Text style={styles.welcomeHeaderSubtitle}>Save spare change automatically</Text>
          </View>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeEmoji}>💰</Text>
          <Text style={styles.welcomeTitle}>Start Your Journey</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in or create an account to start saving your spare change with every transaction
          </Text>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => setAuthModalVisible(true)}
          >
            <Text style={styles.primaryButtonText}>Sign In / Sign Up</Text>
          </TouchableOpacity>
        </View>

        <AuthModal
          visible={authModalVisible}
          onClose={() => setAuthModalVisible(false)}
          onAuthSuccess={handleAuthSuccess}
        />

        <QRScannerModal
          visible={qrScannerVisible}
          onClose={() => setQrScannerVisible(false)}
          onScanSuccess={handleQRScanSuccess}
        />
      </View>
    );
  }

  // Authenticated state
  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greetingText}>Good {greeting}</Text>
            <Text style={styles.headerTitle}>Let's save together! 🎯</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleSignOut}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} />
        }
      >
        {/* Main Savings Card */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsHeader}>
            <Text style={styles.savingsLabel}>Total Saved</Text>
            <TouchableOpacity>
              <Text style={styles.infoIcon}>ℹ️</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.savingsAmount}>{formatCurrency(totalSaved)}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {progressPercentage.toFixed(0)}% of ₹{monthlyGoal} monthly goal
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{transactions.length}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {transactions.length > 0 ? formatCurrency(totalSaved / transactions.length) : '₹0.00'}
              </Text>
              <Text style={styles.statLabel}>Avg. Saved</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartNewPayment}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonIcon}>💳</Text>
            <Text style={styles.primaryButtonText}>Start New Payment</Text>
          </TouchableOpacity>
<View style={styles.secondaryButtons}>
  <TouchableOpacity 
    style={styles.secondaryButton}
    onPress={() => navigation.navigate('Analytics')}
  >
    <Text style={styles.secondaryButtonIcon}>📊</Text>
    <Text style={styles.secondaryButtonText}>Analytics</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.secondaryButton}
    onPress={() => navigation.navigate('Goals')}
  >
    <Text style={styles.secondaryButtonIcon}>🎯</Text>
    <Text style={styles.secondaryButtonText}>Goals</Text>
  </TouchableOpacity>
</View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatsCard
            title="THIS WEEK"
            value={formatCurrency(totalSaved * 0.3)}
            subtitle="3 transactions"
            color="#00D4AA"
            icon="📈"
          />
          <StatsCard
            title="BEST DAY"
            value={formatCurrency(totalSaved * 0.15)}
            subtitle="Yesterday"
            color="#FF6B6B"
            icon="🔥"
          />
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.refreshButton}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>💰</Text>
              <Text style={styles.emptyStateTitle}>Start Your Journey</Text>
              <Text style={styles.emptyStateText}>
                Make your first payment and watch your spare change grow into meaningful savings!
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleStartNewPayment}
              >
                <Text style={styles.emptyStateButtonText}>Make First Payment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.slice(0, 10).map((transaction: Transaction, index: number) => (
                <TransactionItem key={transaction.id} transaction={transaction} index={index} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <QRScannerModal
        visible={qrScannerVisible}
        onClose={() => setQrScannerVisible(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    backgroundColor: '#7C3AED',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  welcomeHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  welcomeHeaderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  savingsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -8,
    padding: 24,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savingsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  infoIcon: {
    fontSize: 16,
  },
  savingsAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  actionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryButtonIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statsTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    paddingBottom: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  refreshButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  transactionsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  merchantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  merchantInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  transactionInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  savingsBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
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
    fontSize: 26,
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
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  authButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  authButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  switchModeButton: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchModeText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  // QR Scanner Modal Styles
  qrModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  qrModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  qrModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  qrModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  qrFrame: {
    width: 250,
    height: 250,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  qrCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#7C3AED',
    borderWidth: 4,
  },
  qrCornerTL: {
    top: 10,
    left: 10,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  qrCornerTR: {
    top: 10,
    right: 10,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  qrCornerBL: {
    bottom: 10,
    left: 10,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  qrCornerBR: {
    bottom: 10,
    right: 10,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  qrPlaceholderText: {
    fontSize: 64,
    marginBottom: 8,
  },
  qrPlaceholderSubtext: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  qrInfoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  upiInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  qrSubmitButton: {
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
  qrSubmitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  qrSecondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  qrSecondaryButtonText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '500',
  },
  qrCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  qrCloseButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});

export default HomeScreen;