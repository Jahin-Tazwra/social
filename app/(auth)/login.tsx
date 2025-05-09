import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, Text, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuth } from '../../hooks/AuthProvider';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    const response = await signIn(email, password);
    if (response.data) {
      router.replace('/(tabs)');
    } else if (response.error) {
      setError((response.error as any)?.message || 'Login failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <Text style={{ textAlign: 'center' }}>Loading...</Text>
        ) : (
          <>
            <Text variant="headlineMedium" style={styles.title}>
              Welcome to Shomaj
            </Text>
            
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />

            {error && (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            )}
            
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            >
              Login
            </Button>
            
            <Button
              mode="text"
              onPress={() => router.push('/register')}
              style={styles.button}
            >
              Don't have an account? Register
            </Button>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
}); 