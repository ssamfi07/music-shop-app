import React from 'react';
import { View } from 'react-native';
import { Card, Text, Button, Avatar} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import styles from '../styles/styles';

const LeftContent = props => <Avatar.Icon {...props} icon="album" />

const ProductScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { product } = route.params;

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
    <View style={styles.container}>
        <Card>
        <Card.Title title={product.artist} left={LeftContent} />
        <Card.Content>
            <Text variant="titleLarge">{product.title}</Text>
            <Text variant="bodyMedium">{product.description}</Text>
        </Card.Content>
        <Card.Cover source={{ uri: product.imageUrl }} />
        </Card>
        <Button onPress={handleGoBack} style={styles.button}>
            Go Back
        </Button>
    </View>
    );
};

export default ProductScreen;
