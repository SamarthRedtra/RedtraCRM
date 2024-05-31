import React, {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, Platform, StyleSheet, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import WebView from "react-native-webview";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const Body = () => {
    const [expoPushToken, setExpoPushToken] = useState('');
    // const [notification, setNotification] = useState(false); test
    const notificationListener = useRef();
    const responseListener = useRef();

    const insets = useSafeAreaInsets();
    const [jsToInject, setJsToInject] = useState('');
    const [canGoBack, setCanGoBack] = useState(false);

    const webView = useRef();

    const handleBack = useCallback(() => {
        if (canGoBack && webView.current) {
            webView?.current?.goBack?.();
            return true;
        }
        return false;
    }, [canGoBack]);

    useEffect(() => {
        BackHandler.addEventListener("hardwareBackPress", handleBack);
        return () => {
            BackHandler.removeEventListener("hardwareBackPress", handleBack);
        };
    }, [handleBack]);

    useEffect(() => {
        registerForPushNotificationsAsync()
            .then(token => setExpoPushToken(token))
            .catch((error) => console.log(error));

        // notificationListener.current = Notifications
        //     .addNotificationReceivedListener(notification => {
        //         console.log("notification", JSON.stringify(notification));
        //         // setNotification(notification);
        //     });

        responseListener.current = Notifications
            .addNotificationResponseReceivedListener(response => {
                const urlPth = response?.notification?.request?.trigger?.remoteMessage?.data?.url_path ||
                    response?.request?.content?.data?.url_path ||
                    response?.notification?.request?.content?.data?.url_path ||
                    response?.notification?.request?.trigger?.data?.body?.url_path
                console.log(urlPth)
                if (urlPth) {
                    const changeUrlJs = `
                    if(window.updateLocation) window.updateLocation('${urlPth}');
                    `
                    webView?.current?.injectJavaScript?.(changeUrlJs);
                }
            });

        return () => {
            // Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    useEffect(() => {
        console.log(expoPushToken)
        if (expoPushToken) {
            const jsToInject = `window.getPushNotificationToken = () => '${expoPushToken}';`
            setJsToInject(jsToInject)
            webView?.current?.injectJavaScript?.(jsToInject);
        }
    }, [expoPushToken]);

    return (
        <View style={{
            width: '100%',
            height: '100%',
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right
        }}>
            <View style={{
                height: '100%',
                width: '100%',
                flex: 1,
                backgroundColor: 'red',
            }}>
                <WebView
                    containerStyle={{
                        height: '100%'
                    }}
                    ref={webView}
                    injectedJavaScript={jsToInject}
                    style={styles.container}
                    source={{uri: `https://redtra.com/crm`}}
                    allowsBackForwardNavigationGestures
                    onLoadProgress={(event) => setCanGoBack(event.nativeEvent.canGoBack)}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        margin:0
    },
});

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

async function schedulePushNotification() {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "You've got mail! 📬",
            body: 'Here is the notification body',
            data: {data: 'goes here'},
        },
        trigger: {seconds: 2}, // or a Date
    });
}

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const {status: existingStatus} = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const {status} = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync({projectId: '0b25dba7-554f-45e5-b39c-07bfb3df9b7d'})).data;
    } else {
        alert('Must use physical device for Push Notifications');
    }
    return token;
}


export default Body;