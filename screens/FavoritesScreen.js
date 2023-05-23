import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Avatar, Button, Card, Text, ActivityIndicator, MD2Colors, IconButton, Badge } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db, storage } from '../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { collection, where, getDocs, getDoc, updateDoc, doc, orderBy, query, limit, startAfter, arrayRemove, arrayUnion } from 'firebase/firestore';
import styles from '../styles/styles';

const LeftContent = props => <Avatar.Icon {...props} icon="album" />

const FavoritesScreen = () => {
    const navigation = useNavigation();
    const [userId, setUserId] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [visibleProducts, setVisibleProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastFetchedDocId, setLastFetchedDocId] = useState(null);
    const [credits, setCredits] = useState(null);

    const getUserCreditsFromDb = async (userId) => {
        try {
            const docRef = doc(db, 'authenticationCollection', userId);
            const docSnapshot = await getDoc(docRef);
        
            if (docSnapshot.exists()) {
                // Document exists, you can access the data using docSnapshot.data()
                const documentData = docSnapshot.data();
                console.log('Document data:', documentData);
                if (documentData.credits !== undefined) {
                    setCredits(documentData.credits);
                  }
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
                setUserId(user.uid);
            } else {
                console.log("User not logged in");
            }
            } catch (error) {
            console.error('Error fetching data:', error);
            }
        };

        fetchUserName();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            const fetchCredits = async () => {
            try {
                if (userId) {
                await getUserCreditsFromDb(userId);
                }
            } catch (error) {
                console.error('Error fetching credits:', error);
            }
            };
        
            fetchCredits();
        }, [userId])
    );

    useEffect(() => {
        const fetchData = async () => {
            try {

                const q = query(collection(db, "allProductsCollection"), where('favoritedBy', 'array-contains', userId));

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
                setFavorites(filteredProducts);
                setIsLoading(false);
            } catch (error) {
            console.error('Error fetching data:', error);
            }
    };

    fetchData();
    }, [userId]);

    useEffect(() => {
        // Update the visible products when the products state changes
        setVisibleProducts(favorites);
    }, [favorites]);

    const handleLoadMore = async () => {
        try {
            const q = query(
            collection(db, 'allProductsCollection'),
            where('favoritedBy', 'array-contains', userId),
            orderBy("price"),
            startAfter(lastFetchedDocId),
            limit(10)
            );

            const querySnapshot = await getDocs(q);

            const newProducts = [];

            if (!querySnapshot.empty) {
            const promises = querySnapshot.docs.map(async (doc) => {
                try {
                    const product = doc.data();
                    product.id = doc.id;
                    const imageName = `${doc.id}`;
                    const imageUrl = `images/${imageName}`;
                    const storageRef = ref(storage, imageUrl);
                    const url = await getDownloadURL(storageRef);
                    product.imageUrl = url;
                    newProducts.push(product);
                } catch (error) {
                console.log(error.message);
                }
            });

            await Promise.all(promises);

            setVisibleProducts((prevProducts) => [...prevProducts, ...newProducts]);
            // Update the last fetched document ID
            const lastDocSnapshot = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastFetchedDocId(lastDocSnapshot.id);
            } else {
            throw Error("No more products to load");
            }
        } catch (error) {
            console.log('Error loading more products:', error);
        }
    };

    const handleRemoveFromFavorites = async (productId) => {
        try {
            if (!userId) {
            console.log('User not logged in');
            return;
            }

            const productRef = doc(db, 'allProductsCollection', productId);
            const productSnapshot = await getDoc(productRef);

            if (productSnapshot.exists()) {
            const productData = productSnapshot.data();
        
            if (!productData.favoritedBy.includes(userId)) {
                console.log("Product is not favorited by the user");
                return;
            }

            // Update the "favoritedBy" field by removing the user's ID
            const updatedFavoritedBy = arrayRemove(userId);
            await updateDoc(productRef, { favoritedBy: updatedFavoritedBy });

            // Remove the unfavorited product from the favorites array
            setFavorites((prevFavorites) =>
                prevFavorites.filter((product) => product.id !== productId)
            );

                alert("Removed from favorites successfully");
            } else {
                alert("Product not found");
            }
        } catch (error) {
            alert('Error removing from favorites:', error);
        }
    };

    const handleBuyButtonPress = async (itemId, itemCredits, artistId, customerId) => {
        try {
            const customerDocRef = doc(db, 'authenticationCollection', customerId);
            const customerDoc = await getDoc(customerDocRef);
            const customerData = customerDoc.data();
            const customerCredits = customerData.credits || 0;

            if (customerCredits < itemCredits) {
                alert('Insufficient credits');
                return;
            }

            const productRef = doc(db, 'allProductsCollection', itemId);
            
            const productSnapshot = await getDoc(productRef);

            if (productSnapshot.exists()) {
                const productData = productSnapshot.data();
                console.log(productData);
                if (productData.ownedBy.includes(customerId)) {
                    alert("Product already owned by the user");
                    return;
                }

                // Update the "ownedBy" field with the user's ID
                const updatedOwnedBy = arrayUnion(customerId);
                await updateDoc(productRef, { ownedBy: updatedOwnedBy });

                console.log("Added to owned successfully");
                const updatedCustomerCredits = customerCredits - itemCredits;

                const artistDocRef = doc(db, 'authenticationCollection', artistId);
                const artistDoc = await getDoc(artistDocRef);
                const artistData = artistDoc.data();
                const artistCredits = artistData.credits || 0;
                const updatedArtistCredits = artistCredits + itemCredits;

                await updateDoc(customerDocRef, { credits: updatedCustomerCredits });
                await updateDoc(artistDocRef, { credits: updatedArtistCredits });

                alert('Purchase successful');
            } else {
                console.log("Product not found");
            }
            
        } catch (error) {
            alert('Error updating credits:', error);
        }
    };

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
                <Badge size={30} style={{
                        backgroundColor: '#9c27b0',
                        alignSelf: 'center',
                        marginLeft: 8,
                    }}>{product.price}</Badge>
                <Button onPress={() => navigation.navigate('Product', { product })}>Details</Button>
                <Button onPress={() => handleBuyButtonPress(product.id, product.price, product.artistId, userId)}>
                    Buy
                </Button>
                <Button onPress={() => handleRemoveFromFavorites(product.id)}>
                    Remove
                </Button>
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
                <Text variant="titleLarge" style={{ alignSelf: 'flex-end', marginRight: 16, height: 'auto' }}>{`Credits: ${credits}`}</Text>
            </View>
            <FlatList
                data={visibleProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
            />
            <View>
                <ActivityIndicator animating={isLoading} size="large" color={MD2Colors.purple500} />
            </View>
    </View>
    );
};

export default FavoritesScreen;
