import React, { useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button, Text, IconButton, ActivityIndicator, MD2Colors } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import styles from '../styles/styles';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const handleRegister = () => {
        navigation.navigate('Register');
    };

    const handleLogin = async () => {
        try {
            setLoading(true); // Set loading to true when login is ongoing
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log(`User ${userCredential.user.email} logged in successfully!`);
            setLoading(false); // Set loading back to false after login is complete
            // Navigate to the home screen
            navigation.navigate('Home');
        } catch(error){
            setLoading(false);
            alert('Login failed', error.message);
        }
    };

    return (
    <View style={styles.container}>
        {/* Custom header with home icon */}
        <View style={styles.navBar}>
                <IconButton
                    icon="home"
                    onPress={ () => navigation.navigate('Home') }
                    color="#000" // Customize the color as needed
                    style={styles.homeIcon}
                />
            </View>
        <View>
            <TextInput 
                placeholder="Email"
                onChangeText={setEmail}
                value={email}
                style={styles.input}
            />
            <TextInput
                placeholder="Password"
                onChangeText={setPassword}
                value={password}
                secureTextEntry
                style={styles.input}
            />
            <Button mode="contained" onPress={handleLogin} style={styles.button}>
                Login
            </Button>
        </View>
        <View style={styles.registerSection}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <Button mode="contained" onPress={handleRegister} style={styles.button}>
                Register
            </Button>
        </View>
        <View style={{ marginVertical: 20 }}>
            <ActivityIndicator animating={loading} size="large" color={MD2Colors.purple500} />
        </View>
        
    </View>
  );
};

export default LoginScreen;
