import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, TextInput, Button, IconButton } from 'react-native-paper';
import styles from '../styles/styles';

const ContactUsScreen = () => {
    const email = 'contact@example.com';
    const phoneNumber = '+1234567890';
    const [message, setMessage] = React.useState('');
    const navigation = useNavigation();

    const handleMessageSubmit = () => {
        // Logic to handle the submitted message
        console.log('Submitted message:', message);
        // Reset the message input
        setMessage('');
    };

    return (
        <View>
            {/* Custom header with home icon */}
            <View style={styles.navBar}>
                <IconButton
                    icon="home"
                    onPress={ () => navigation.navigate('Home') }
                    color="#000" // Customize the color as needed
                    style={styles.homeIcon}
                />
            </View>
            <Text>Email: {email}</Text>
            <Text>Phone: {phoneNumber}</Text>

            <TextInput
                style={{ height: 150, borderColor: 'gray', borderWidth: 1, marginTop: 20 }}
                multiline
                placeholder="Enter your message"
                value={message}
                onChangeText={setMessage}
            />
                
            <Button mode="contained" onPress={handleMessageSubmit} style={styles.button}>
                Submit
            </Button>
        </View>
    );
};

export default ContactUsScreen;
