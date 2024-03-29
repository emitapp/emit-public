// The overall partent tab navigator screen for the main interface
// This is also the screen that enables FCM because it can only be accessed
// if the user is signed in
import AsyncStorage from '@react-native-community/async-storage';
import auth from "@react-native-firebase/auth";
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import React from 'react';
import { Keyboard, Platform, Pressable, TouchableOpacity, View } from 'react-native';
import { requestNotifications, RESULTS } from 'react-native-permissions';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import { StackActions } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import CircularView from 'reusables/containers/CircularView';
import ProfilePicDisplayer from 'reusables/profiles/ProfilePicComponents';
import MainTheme from 'styling/mainTheme';
import { handleFCMDeletion, handleFCMMessage, handleNotificationOpened } from 'utils/fcmNotificationHandlers';
import { ASYNC_TOKEN_KEY, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import NavigationService from 'utils/NavigationService';
import { cloudFunctionStatuses } from 'utils/serverValues';
import { events, subscribeToEvent, unsubscribeToEvent } from 'utils/subcriptionEvents';
import { Text } from 'react-native-elements'
import ChangesModal from 'reusables/ui/ChangesModal';

import ExploreStackNav from "./SocialSection/SocialSectionStackNav";
import FeedStackNav from './FeedSection/FeedStackNav';
import ProfileAndSettingsStackNav from "./ProfileAndSettings/ProfileAndSettingsStackNav";
import FlareMap from './FlareMap/FlareMap'

const TAB_ICON_HEIGHT = 24

const renderTab = (props, targetRouteName, iconName, title) => {
  const focused = props.navigation.state.routes[props.navigation.state.index].routeName == targetRouteName
  const tintColor = focused ? props.activeTintColor : props.inactiveTintColor
  return (
    <TouchableOpacity
      style={{
        height: "100%", width: "100%",
        justifyContent: "flex-start", alignItems: "center", flex: 1,
      }}
      onPress={() => {
        {
          focused ? props.navigation.dispatch(StackActions.popToTop()) :
            props.navigation.navigate(targetRouteName);
        }
      }
      }>

      <View style={{ alignItems: "center", justifyContent: "center", marginTop: 4 }}>
        <AwesomeIcon name={iconName} size={TAB_ICON_HEIGHT} color={tintColor} />
      </View>
      {renderTabLabel(props.activeTintColor, focused, title)}
    </TouchableOpacity>
  )
}

const renderProfileTab = (props, targetRouteName) => {
  const focused = props.navigation.state.routes[props.navigation.state.index].routeName == targetRouteName
  return (
    <TouchableOpacity
      style={{
        height: "100%", width: "100%",
        justifyContent: "flex-start", alignItems: "center", flex: 1,
      }}
      onPress={() => {
        {
          focused ? props.navigation.dispatch(StackActions.popToTop()) :
            props.navigation.navigate(targetRouteName);
        }
      }
      }>

      <View style={{ marginTop: 4 }}>
        <TabBarProfilePic focused={focused} color={props.activeTintColor} />
      </View>
      {renderTabLabel(props.activeTintColor, focused, "Profile")}
    </TouchableOpacity>
  )
}

const renderTabLabel = (activeTintColor, focused, title) => {
  return (
    <View style={{
      backgroundColor: focused ? activeTintColor : "transparent",

      marginTop: 4,
      ...Platform.select({
        ios: {
          width: 80,
          borderRadius: 8
        },
        android: {
          width: 50,
          flex: 1,
          borderTopEndRadius: 8,
          borderTopStartRadius: 8,
        }
      }),
      alignContent: "center",
      justifyContent: "flex-start"
    }}>
      <Text style={{ fontSize: 12, textAlign: "center", color: focused ? "white" : "black" }}>{title}</Text>
    </View>
  )
}


const Tab = createBottomTabNavigator(
  {
    FeedStackNav,
    ExploreStackNav,
    ProfileAndSettingsStackNav,
    FlareMap
  },
  {
    defaultNavigationOptions: ({ navigation }) =>
    ({
      tabBarComponent: (props) => <TabBarComponent  {...props} />
    }),
    tabBarOptions: {
      style: {
        borderTopWidth: 1,
        borderTopColor: "lightgrey", //TODO:Link back to MainTheme
      },
      showLabel: false,
      activeTintColor: MainTheme.colors.primary,
      inactiveTintColor: "grey", //TODO:Link back to MainTheme
    },
  }
);

export default class Main extends React.Component {

  //https://reactnavigation.org/docs/en/common-mistakes.html
  static router = Tab.router;

  constructor(props) {
    super(props);
    this.unsubscribeFromTokenRefresh = null;
    this.unsubscribeFromOnMessage = null;
    this.unsubscribeFromOnMessageDelete = null;
    this.unsubscribeFromGetInitialNotification = null;
    this.unsubscribeFromOnNotificationOpenedApp = null;
  }

  componentDidMount = () => {
    this.setUpFCM();
  }

  componentWillUnmount = () => {
    if (this.unsubscribeFromTokenRefresh) this.unsubscribeFromTokenRefresh()
    if (this.unsubscribeFromOnMessage) this.unsubscribeFromOnMessage()
    if (this.unsubscribeFromOnMessageDelete) this.unsubscribeFromOnMessageDelete()
    if (this.unsubscribeFromOnNotificationOpenedApp) this.unsubscribeFromOnNotificationOpenedApp()
    if (this.unsubscribeFromGetInitialNotification) this.unsubscribeFromGetInitialNotification()
  }

  render() {
    return (
      <>
        <ChangesModal />
        <Tab navigation={this.props.navigation} />
      </>
    )
  }

  //Designed based on...
  //https://github.com/invertase/react-native-firebase/issues/2657#issuecomment-572906900
  /**
   * Asks for notification permissions, registers for remote messages (for iOS),
   * then syncs FCM token with server and sets FCM listeners
   */
  setUpFCM = async () => {
    try {
      const response = await requestNotifications(['alert', 'sound'])
      if (response.status != RESULTS.GRANTED && response.status != RESULTS.LIMITED) {
        logError(new Error("Denied notification permission"), false)
        return;
      }

      //This doesn't look terribly necessary,
      //But according to Mike Hardy on Discord, requestPermission has a side 
      //effect of setting some listeners, so we're doing it this way
      //This is needed just for iOS, btw
      let permissionGranted = true
      if (Platform.OS == 'ios') {
        const permissionStatus = await messaging().requestPermission()
        permissionGranted =
          permissionStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          permissionStatus === messaging.AuthorizationStatus.PROVISIONAL;
      }

      if (!permissionGranted) {
        logError(new Error("permissionGranted still false after requestNotifications success"))
        return
      }

      //Not actually needed becuase this is done by defualt (unless disabled)
      //But meh
      await messaging().registerDeviceForRemoteMessages();

      this.syncToken() //Asyncronous
      this.setFCMListeners()
    } catch (err) {
      logError(err)
    }
  }


  setFCMListeners = () => {
    this.unsubscribeFromOnMessageDelete = messaging().onDeletedMessages(async () => {
      await handleFCMDeletion()
    });

    //This is only for forground messages
    //Background message handler has been set in index.js
    this.unsubscribeFromOnMessage = messaging().onMessage(async (remoteMessage) => {
      await handleFCMMessage(remoteMessage)
    });

    this.unsubscribeFromTokenRefresh = messaging().onTokenRefresh(token => {
      this.syncToken() //Asyncronous
    });

    this.unsubscribeFromOnNotificationOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
      handleNotificationOpened(remoteMessage);
    });

    this.unsubscribeFromGetInitialNotification = messaging().onNotificationOpenedApp((remoteMessage) => {
      if (remoteMessage) {
        handleNotificationOpened(remoteMessage);
      }
    });
  }


  /**
   * Gets the app instance's current FCM token and syncs it with the server
   * (relative to the currently signed in user)
   */
  syncToken = async () => {
    try {
      if (!messaging().isDeviceRegisteredForRemoteMessages) return;
      //getToken has (undefined, '*') arguments cuz of 
      //https://github.com/invertase/react-native-firebase/issues/3714#issuecomment-741521581
      //this issue might not be affecting us (because I don't think we use deleteToken),
      //but it can't hurt to keep it in
      const fcmToken = await messaging().getToken(undefined, '*')
      const cachedToken = await AsyncStorage.getItem(ASYNC_TOKEN_KEY)
      if (fcmToken != cachedToken) {
        const syncFunction = functions().httpsCallable('updateFCMTokenData')
        const response = await timedPromise(syncFunction(fcmToken), LONG_TIMEOUT)
        if (response.data.status != cloudFunctionStatuses.OK) return; //Don't cache the token (so we can retry later)
        await AsyncStorage.setItem(ASYNC_TOKEN_KEY, fcmToken)
      }
    } catch (err) {
      if (err.name != "timeout") logError(err)
    }
  }
}

class TabBarComponent extends React.PureComponent {

  state = {
    isVisible: true
  }

  componentDidMount() {
    this.keyboardWillShowSub = Keyboard.addListener('keyboardDidShow', this.keyboardWillShow)
    this.keyboardWillHideSub = Keyboard.addListener('keyboardDidHide', this.keyboardWillHide)
  }

  componentWillUnmount() {
    this.keyboardWillShowSub.remove()
    this.keyboardWillHideSub.remove()
  }

  keyboardWillShow = event => {
    this.setState({ isVisible: false })
  }

  keyboardWillHide = event => {
    this.setState({ isVisible: true })
  }

  render() {
    if (!this.state.isVisible) return null
    const { styleProps, ...otherProps } = this.props
    return (
      <View {...otherProps}
        style={{
          ...styleProps,
          ...Platform.select({
            //Height gotten from 
            //https://github.com/react-navigation/react-navigation/blob/5c7f892d77298f5c89534fa78a1a6a59c7f35a60/packages/tabs/src/views/BottomTabBar.tsx#L36
            ios: { height: 70 },
            default: { height: 49 }
          }),
          flexDirection: "row",
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {renderTab(otherProps, "FlareMap", "map-marker-alt", "Map")}
        {renderTab(otherProps, "FeedStackNav", "fire", "Feed")}
        <FlareCreationButton />
        {renderTab(otherProps, "ExploreStackNav", "globe-americas", "Explore")}
        {renderProfileTab(otherProps, "ProfileAndSettingsStackNav")}

      </View>)
  }
}


class FlareCreationButton extends React.PureComponent {

  pressedColors = {
    outerBorder: "lightgrey",
    innerBorder: "white",
    innerCircle: MainTheme.colors.primary,
    iconColor: "white"
  }

  unpressedColors = {
    outerBorder: MainTheme.colors.primary,
    innerBorder: "lightgrey",
    innerCircle: "white",
    iconColor: MainTheme.colors.primary
  }

  state = {
    pressedDown: false
  }

  render() {
    const { pressedDown } = this.state;
    return (
      <Pressable
        style={{
          alignSelf: "flex-end",
          marginHorizontal: 4,
          ...Platform.select({
            ios: {
              marginBottom: 20
            },
            default: {
            }
          })
        }}
        onPressIn={() => this.setState({ pressedDown: true })}
        onPressOut={() => this.setState({ pressedDown: false })}
        onPress={() => NavigationService.navigate('NewBroadcastForm', { needUserConfirmation: false })}
        android_ripple={{ color: MainTheme.colors.primary, borderless: true }}
      >
        <CircularView
          style={{ backgroundColor: pressedDown ? this.pressedColors.outerBorder : this.unpressedColors.outerBorder }} diameter={55} >
          {/** 
         * // TODO: Link back to MainTheme
         **/}
          <CircularView style={{ backgroundColor: pressedDown ? this.pressedColors.innerBorder : this.unpressedColors.innerBorder }} diameter={50} >
            <CircularView style={{ backgroundColor: pressedDown ? this.pressedColors.innerCircle : this.unpressedColors.innerCircle }} diameter={40} >
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <AwesomeIcon name="plus" size={30} color={pressedDown ? this.pressedColors.iconColor : this.unpressedColors.iconColor} light />
              </View>
            </CircularView>
          </CircularView>
        </CircularView>
      </Pressable>
    )
  }
}

//This has been designed to only get the URL once, and 
//subsequent instances won't redownload it.
//This was done becuase tab bar elements are completely
//killed and reinstantiated with every navigation, 
//so the profile pic kept on flashing
export class TabBarProfilePic extends React.PureComponent {

  static imageData = null

  static resetTabBarProfilePicImageRef = () => {
    TabBarProfilePic.imageData = null
  }

  componentDidMount() {
    subscribeToEvent(events.PROFILE_PIC_CHANGE, this, () => {
      TabBarProfilePic.resetTabBarProfilePicImageRef()
      this.pictureComponent.refresh()
    })
  }

  componentWillUnmount() {
    unsubscribeToEvent(events.PROFILE_PIC_CHANGE, this)
  }

  render() {
    return (
      <CircularView diameter={TAB_ICON_HEIGHT} style={{ borderColor: this.props.color, borderWidth: this.props.focused ? 5 : 0 }}>
        <ProfilePicDisplayer
          diameter={TAB_ICON_HEIGHT - 2}
          uid={auth().currentUser.uid}
          ref={ref => this.pictureComponent = ref}
          onImageDataGotten={(imageData) => TabBarProfilePic.imageData = imageData}
          imageData={TabBarProfilePic.imageData}
        />
      </CircularView>

    )
  }
}
