import { StyleSheet } from 'react-native';
import { MD2Colors } from 'react-native-paper';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        margin: 'auto'
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: 60,
        backgroundColor: '#f2f2f2'
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: 'gray',
    },
    homeIcon: {
        position: 'absolute',
        left: 0, // Adjust the value as needed to position the icon
    },
    button: {
        margin: 5,
        color:`${MD2Colors.purple500}`
    }
});

export default styles;