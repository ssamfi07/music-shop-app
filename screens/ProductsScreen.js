import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Avatar, Card, Text, ActivityIndicator, MD2Colors, IconButton, Badge, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, getDoc, doc, where, startAfter, limit, orderBy, query } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import styles from '../styles/styles';

const LeftContent = props => <Avatar.Icon {...props} icon="album" />

const ProductsScreen = () => {
    const navigation = useNavigation();
    const [products, setProducts] = useState([]);
    const [visibleProducts, setVisibleProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [lastFetchedDocId, setLastFetchedDocId] = useState(null);

    const getUsernameFromDb = async (user) => {
        try {
            const docRef = doc(db, 'authenticationCollection', user.uid);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                const documentData = docSnapshot.data();
                console.log('Document data:', documentData.username);
                setUserName(documentData.username);
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
                await getUsernameFromDb(user);
            } else {
                console.log("User not logged in");
            }
            } catch (error) {
            console.error('Error fetching data:', error);
            }
        };
        
        fetchUserName();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log(userName);

                const q = query(collection(db, "allProductsCollection"), where("artist", "==", userName));

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
                setProducts(filteredProducts);
                setIsLoading(false);
            } catch (error) {
            console.error('Error fetching data:', error);
            }
    };

    fetchData();
    }, [userName]);

    useEffect(() => {
        // Update the visible products when the products state changes
        setVisibleProducts(products);
    }, [products]);

    const handleLoadMore = async () => {
        try {
            const q = query(
            collection(db, 'allProductsCollection'),
            where("artist", "==", userName),
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

export default ProductsScreen;
