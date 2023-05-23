import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TextInput, Button, RadioButton, IconButton, ActivityIndicator, MD2Colors } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase'; // Update the path if necessary
import styles from '../styles/styles';
import { setDoc, doc } from 'firebase/firestore';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Customer'); // Default role is 'Customer'
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = async () => {
    if (password !== password2) {
      alert("Passwords don't match!");
      return;
    }

    setLoading(true);
    
    try {
      if (username === '') {
        throw new Error("Username missing!");
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Registration successful:', user);

      // Create user entry in Firestore
      const ref = doc(db, 'authenticationCollection', user.uid);
      await setDoc(ref, {
        uid: user.uid,
        email: email,
        username: username,
        role: role,
        credits: 10000
      });

      setLoading(false);
      console.log("Data added successfully to Firestore");
      navigation.navigate('Home');
    } catch (error) {
      setLoading(false);
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        {/* Custom header with home icon */}
        <View style={styles.navBar}>
          <IconButton
            icon="home"
            onPress={() => navigation.navigate('Home')}
            color="#000" // Customize the color as needed
            style={styles.homeIcon}
          />
        </View>
        <RadioButton.Group
          onValueChange={newValue => setRole(newValue)}
          value={role}
          flexDirection="row" // Set flexDirection to 'row'
        >
          <View style={styles.roleItem}>
            <RadioButton value="Customer" />
            <Text>Customer</Text>
          </View>
          <View style={styles.roleItem}>
            <RadioButton value="Artist" />
            <Text>Artist</Text>
          </View>
        </RadioButton.Group>
        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          label="Verify Password"
          value={password2}
          onChangeText={setPassword2}
          secureTextEntry
          style={styles.input}
        />
        <Button mode="contained" onPress={handleRegister} style={styles.button}>
          Register
        </Button>
        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Already a member?</Text>
          <Button mode="contained" onPress={handleLogin} style={styles.button}>
            Login
          </Button>
        </View>
      </View>
      <View style={{ marginVertical: 20 }}>
        <ActivityIndicator animating={loading} size="large" color={MD2Colors.purple500} />
      </View>
    </View>
  );
};

export default RegisterScreen;
