import React, { useEffect, useState } from 'react';
import { View, TextInput, Image, Alert } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../firebase';
import { ref, uploadBytes } from "firebase/storage";
import { getDoc, setDoc, doc } from 'firebase/firestore';
import styles from '../styles/styles';

const AddProductScreen = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tracks, setTracks] = useState([]);
    const [price, setPrice] = useState('');
    const [poster, setPoster] = useState(null);
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState('');
    const [imageId, setImageId] = useState('');
    const navigation = useNavigation();

    const getUsernameAndUIDFromDb = async (user) => {
        try {
            const docRef = doc(db, 'authenticationCollection', user.uid);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                const documentData = docSnapshot.data();
                console.log('Document data:', documentData.username);
                setUserName(documentData.username);
                setUserId(documentData.uid);
            } else {
                console.log('Document not found');
                throw new Error('Document not found');
            }
        } catch (error) {
            console.error('Error fetching document:', error);
            throw error;
        }
    };

    useEffect(() => {
        const fetchUserName = async () => {
            try {
                const user = auth.currentUser;
            if (user) {
                await getUsernameAndUIDFromDb(user);
            } else {
                console.log("User not logged in");
            }
            } catch (error) {
            console.error('Error fetching data:', error);
            }
        };
        
        fetchUserName();
    }, []);

    const handleChooseImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please grant camera roll permission to choose an image.');
                return;
            }
    
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
        });
    
        if (!result.canceled) {
            setPoster(result);
        }
        } catch (error) {
            console.error('Error selecting image:', error);
        }
    };

    const handleUploadImage = async () => {
        if (poster) {
            const { uri } = poster;
            const imageName = uri.split('/').pop();
            console.log(poster.uri);
            try {
                const response = await fetch(uri);
                const blob = await response.blob();
                const reference = ref(storage, `images/${imageName}`);
                
                await uploadBytes(reference, blob);

                setImageId(imageName);
                
                Alert.alert('Image uploaded successfully');
            } catch (error) {
                console.error('Error uploading image:', error.message);
            }
        } else {
            Alert.alert('No image selected');
        }
    };

    const handleAddProduct = async () => {
        try {
            if (!title || !poster || !price) {
                throw new Error('Please fill in all the required fields.');
            }
            const productData = {
                title: title,
                artist: userName,
                artistId: userId,
                description: description,
                tracks: tracks,
                price: parseInt(price),
                favoritedBy: [],
                ownedBy: []
            }

            const productRef = doc(db, 'allProductsCollection', imageId);

            console.log(userName);

            await setDoc(productRef, productData);

            Alert.alert('Product uploaded successfully');
            console.log("Data added successfully to firestore"); 
        } catch (error) {
        console.error('Error adding product:', error.message);
        }
    };

    return (
    <View style={styles.container}>
        {/* Navigation bar */}
        <View style={styles.navBar}>
        <IconButton
            icon="home"
            onPress={() => { navigation.navigate('Home') }}
            color="#000" // Customize the color as needed
            style={styles.homeIcon}
        />
        </View>
        <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
        />
        <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
        />
        <TextInput
            placeholder="Price in credits"
            value={price}
            onChangeText={setPrice}
        />
        
        <IconButton
            icon="file-image-plus"
            onPress={handleChooseImage}
            style={styles.button}
        />
        {poster && <Image source={{ uri: poster.uri }} style={{ width: 200, height: 200 }} />}
        <Button mode="contained" onPress={handleUploadImage} style={styles.button}>
                Upload Image
        </Button>

        <Button mode="contained" onPress={handleAddProduct} style={styles.button}>
                Add Product
        </Button>
    </View>
    );
};

export default AddProductScreen;
