import React, { useState, useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { Card, Text, Button, Avatar, ActivityIndicator, MD2Colors, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db, storage } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import styles from '../styles/styles';

const LeftContent = props => <Avatar.Icon {...props} icon="album" />

const OwnedScreen = () => {
    const navigation = useNavigation();
    const [ownedProducts, setOwnedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastFetchedDocId, setLastFetchedDocId] = useState(null);

    const fetchOwnedProducts = async () => {
    try {
            const user = auth.currentUser;
            if (!user) {
            setOwnedProducts([]);
            setIsLoading(false);
            return;
        }

        const q = query(collection(db, 'allProductsCollection'), where('ownedBy', 'array-contains', user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.docs.length > 0) {
            const lastDocSnapshot = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastFetchedDocId(lastDocSnapshot.id);
        }

        const promises = querySnapshot.docs.map(async (doc) => {
        try {
            const product = doc.data();
            product.id = doc.id;
            const imageName = `${doc.id}`;
            const imageUrl = `images/${imageName}`;
            const storageRef = ref(storage, imageUrl);
            const url = await getDownloadURL(storageRef);
            product.imageUrl = url;
            return product;
        } catch (error) {
            console.log(error.message);
            return null;
        }
        });

        const productsData = await Promise.all(promises);
        const filteredProducts = productsData.filter((product) => product !== null); // Filter out null values

        setOwnedProducts(filteredProducts);
        setIsLoading(false);
    } catch (error) {
        console.error('Error fetching owned products:', error);
    }
    };

    useEffect(() => {
        fetchOwnedProducts();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            fetchOwnedProducts();
    }, [])
    );

    const renderProductItem = ({ item: product }) => (
    <View key={product.id}>
        <Card>
        <Card.Title title={product.artist} left={LeftContent} />
        <Card.Content>
            <Text variant="titleLarge">{product.title}</Text>
            <Text variant="bodyMedium">{product.description}</Text>
        </Card.Content>
        <Card.Cover source={{ uri: product.imageUrl }} />
        <Card.Actions>
            <Button onPress={() => navigation.navigate('Product', { product })}>Details</Button>
        </Card.Actions>
        </Card>
    </View>
    );

    return (
    <View style={styles.container}>
        <View style={styles.navBar}>
                <IconButton
                    icon="home"
                    onPress={ () => navigation.navigate('Home') }
                    color="#000" // Customize the color as needed
                    style={styles.homeIcon}
                />
        </View>
        <FlatList
            data={ownedProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            refreshing={isLoading}
            onRefresh={fetchOwnedProducts}
        />
        <View>
            <ActivityIndicator animating={isLoading} size="large" color={MD2Colors.purple500} />
        </View>
    </View>
    );
};

export default OwnedScreen;
