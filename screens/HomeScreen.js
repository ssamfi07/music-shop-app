import React, { useEffect, useState } from 'react';
import { View, FlatList, ScrollView, Alert } from 'react-native';
import { Avatar, Button, Card, Text, ActivityIndicator, MD2Colors, Badge, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db, storage } from '../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, getDoc, doc, where, startAfter, limit, orderBy, query, updateDoc, arrayUnion } from 'firebase/firestore';
import styles from '../styles/styles';

const LeftContent = props => <Avatar.Icon {...props} icon="album" />

const HomeScreen = () => {
    const navigation = useNavigation();
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState('');
    const [userName, setUserName] = useState('');
    const [credits, setCredits] = useState(null);
    const [products, setProducts] = useState([]);
    const [visibleProducts, setVisibleProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastFetchedDocId, setLastFetchedDocId] = useState(null);


    const getUserRoleUsernameCreditsFromDb = async (user) => {
        try {
            const docRef = doc(db, 'authenticationCollection', user.uid);
            const docSnapshot = await getDoc(docRef);
        
            if (docSnapshot.exists()) {
                // Document exists, you can access the data using docSnapshot.data()
                const documentData = docSnapshot.data();
                console.log('Document data:', documentData);
                setUserRole(documentData.role);
                setUserName(documentData.username);
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
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            if (user) {
                // Fetch the user role from Firestore
                await getUserRoleUsernameCreditsFromDb(user);
            }
            });
            return () => {
                unsubscribe();
            };
      }, []);

    useFocusEffect(
        React.useCallback(() => {
            const fetchCredits = async () => {
            try {
                if (user) {
                await getUserRoleUsernameCreditsFromDb(user);
                }
                } catch (error) {
                    console.error('Error fetching credits:', error);
                }
            };
        
            fetchCredits();
        }, [user])
    );

    useFocusEffect(
        React.useCallback(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const q = query(collection(db, 'allProductsCollection'));

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

            const resolvedProductsData = await Promise.all(promises);
            const filteredProducts = resolvedProductsData.filter((product) => product !== null);
            setProducts(filteredProducts);
            setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
        }, [])
    );


    useEffect(() => {
        // Update the visible products when the products state changes
        setVisibleProducts(products);
    }, [products]);

    const handleLoadMore = async () => {
        try {
            const q = query(
            collection(db, 'allProductsCollection'),
            orderBy("artist"),
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

    // Function to handle adding the current user to the "favoritedBy" field
    const handleAddToFavorites = async (productId) => {
        try {
            if (!user) {
                console.log("User not logged in");
                return;
            }

            const productRef = doc(db, 'allProductsCollection', productId);
            const productSnapshot = await getDoc(productRef);

            if (productSnapshot.exists()) {
                const productData = productSnapshot.data();

                if (productData.favoritedBy.includes(user.uid)) {
                    alert("Product already favorited by the user");
                    return;
                }

                // Update the "favoritedBy" field with the user's ID
                const updatedFavoritedBy = arrayUnion(user.uid);
                await updateDoc(productRef, { favoritedBy: updatedFavoritedBy });

                alert("Added to favorites successfully");
            } else {
                alert("Product not found");
            }
        } catch (error) {
            console.error('Error adding to favorites:', error);
        }
    };

    const handleAddCredits = async () => {
        setIsLoading(true);
        try {
            const docRef = doc(db, 'authenticationCollection', user.uid);
            try {
                await updateDoc(docRef, {
                  credits: credits+10000,
                });
                alert('Credits updated successfully!');
                setIsLoading(false);
                await getUserRoleUsernameCreditsFromDb(user);
              } catch (error) {
                alert('Error updating credits:', error);
              }

        } catch (error) {
            console.error('Error fetching document:', error);
            throw error;
        }
    };

    const handleTransactionConfirmation = () => {
        try {
            if (user !== null) {
                // Display a confirmation pop-up
                Alert.alert(
                'Confirm Transaction',
                'Press OK to confirm the $100 transaction.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'OK', onPress: handleAddCredits },
                ]
                );
            }
            else {
                alert("You are not logged in!");
            }
            } catch (error) {
                console.error('Adding credits error: ', error);
            }
      };

    const handleSignOut = () => {
        auth.signOut()
        .then(() => {
            setUser(null);
            setUserRole('');
            setUserName('');
            setCredits(null);
            // Navigate to the Login screen after sign out
            navigation.navigate('Login');
        })
        .catch((error) => {
            console.log('Error signing out:', error);
        });
    };

    const handleContactUs = () => {
        navigation.navigate('ContactUs');
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
                    {userRole === 'Customer' && ( // Only show the Add to Favorites button for customers
                    <>
                        <Button onPress={() => handleAddToFavorites(product.id)}>Add to Favorites</Button>
                        <Button onPress={() => navigation.navigate('Product', { product })}>Details</Button>
                    </>
                    )}
                </Card.Actions>
            </Card>
        </View>
    );

    return (
        <View style={styles.container}>
            {user ? (
                <>
                    <Text variant="titleMedium" style={{ alignSelf: 'flex-end', marginRight: 16, height: 'auto' }}>{`Credits: ${credits}`}</Text>
                    <Text variant="titleMedium" style={{ alignSelf: 'flex-end', marginRight: 16, height: 'auto' }}>{`${userName}: ${userRole}`}</Text>
                </>
            ) : null}
            
            {/* Navigation bar */}
            <ScrollView horizontal contentContainerStyle={styles.navBar}>
                <Button mode="contained" onPress={handleContactUs} style={styles.button}>
                        Contact Us
                </Button>
                {user ? (
                <>
                    {/* Conditional rendering based on user role */}
                    {userRole === 'Artist' ? (
                    <>
                        <Button mode="contained" onPress={ () => { navigation.navigate('Products') } } style={styles.button}>
                            Products
                        </Button>
                        <Button mode="contained" onPress={ () => { navigation.navigate('AddProduct') } } style={styles.button}>
                            Add Product
                        </Button>
                    </>
                    ) : 
                    <>
                        <Button mode="contained" onPress={ () => { navigation.navigate('Favorites') } } style={styles.button}>
                            Favorites
                        </Button>
                        <Button mode="contained" onPress={ () => { navigation.navigate('Owned') } } style={styles.button}>
                            Owned
                        </Button>
                    </> }
                    <Button mode="contained" onPress={handleSignOut} style={styles.button}>
                        Sign Out
                    </Button>
                </>
                ) : (
                    <Button mode="contained" onPress={() => navigation.navigate('Login')} style={styles.button}>
                        Login
                    </Button>
                )}
            </ScrollView>
            {/* Main content */}
            <FlatList
                data={visibleProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} >
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <ActivityIndicator animating={isLoading} size="large" color={MD2Colors.purple500} />
                </View>
                {user ? <IconButton
                    icon="credit-card-plus-outline"
                    onPress={() => handleTransactionConfirmation(userName)}
                    style={{alignSelf: 'flex-end', marginRight: 16, height: 'auto'}}
                />: null}
            </View>
        </View>
    );
};

export default HomeScreen;
