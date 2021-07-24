import auth from '@react-native-firebase/auth';
import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { Button, Text, ThemeConsumer } from 'react-native-elements'
import { logError, getFullVersionInfo, ShowNotSupportedAlert } from 'utils/helpers';
import UserProfileSummary from 'reusables/UserProfileSummary'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import FeatherIcon from 'react-native-vector-icons/Feather'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import ErrorMessageText from 'reusables/ErrorMessageText';
import { subscribeToEvent, unsubscribeToEvent, events } from 'utils/subcriptionEvents'
import { analyticsLoggingOut } from 'utils/analyticsFunctions';

export default class SettingsMain extends React.Component {

  constructor(props) {
    super(props)
    this.state = { refreshing: false, verificationEmailError: "", version: "calculating..." }
    getFullVersionInfo().then(version => this.setState({ version }))
  }

  componentDidMount() {
    subscribeToEvent(events.PROFILE_PIC_CHANGE, this, () => this.summaryComponent.refresh())
  }

  componentWillUnmount() {
    unsubscribeToEvent(events.PROFILE_PIC_CHANGE, this)
  }

  render() {
    const { currentUser } = auth()
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <ScrollView
            style={{ ...styles.scrollView, backgroundColor: theme.colors.grey5 }}
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
              <RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />
            }>

            <View style={{ ...styles.section, borderTopWidth: 0 }}>
              <UserProfileSummary
                style={{ marginTop: 16 }}
                ref={ref => this.summaryComponent = ref}
                imageDiameter={120} />
            </View>

            <View style={styles.section}>
              <Text>
                {currentUser.email}
              </Text>
              <Text>
                Your email is {currentUser.emailVerified ? "" : "not"} verified
            </Text>
              <ErrorMessageText message={this.state.verificationEmailError} />
              {!currentUser.emailVerified &&
                <Button
                  title="Send Verification Email"
                  onPress={this.sendEmailVerification}
                  type="clear"
                  containerStyle={{ margin: 0 }}
                />
              }
            </View>

            <View style={styles.section}>
              <SettingSectionButton
                title="Edit Profile"
                icon={<FontAwesomeIcon name="edit" />}
                color={theme.colors.grey0}
                onPress={() => this.props.navigation.navigate("EditProfileScreen")}
              />
              <SettingSectionButton
                title="Notifications"
                icon={<FontAwesomeIcon name="bell" />}
                color={theme.colors.grey0}
                onPress={() => this.props.navigation.navigate("NotificationSettings")}
              />
              <SettingSectionButton
                title="Your Account and Data"
                icon={<FeatherIcon name="lock" />}
                color={theme.colors.grey0}
                onPress={() => this.props.navigation.navigate("AccountManagementScreen")}
              />
              <SettingSectionButton
                title="Contact Emit"
                icon={<FontAwesomeIcon name="paper-plane" />}
                color={theme.colors.grey0}
                onPress={() => this.props.navigation.navigate("ContactSupportPage")}
              />
              <SettingSectionButton
                title="Legal"
                icon={<MaterialIcon name="briefcase-outline" />}
                color={theme.colors.grey0}
                onPress={() => this.props.navigation.navigate("LegalNotices")}
              />
              <SettingSectionButton
                title="Logout"
                icon={<MaterialIcon name="logout" />}
                color="red"
                onPress={this.signOut}
                style={{ borderBottomWidth: 0 }}
              />
            </View>

            <Text style={{ textAlign: "center", fontSize: 12, marginBottom: 4 }}>
              {this.state.version}
              {"\n"}
            Powered by Passion
          </Text>

          </ScrollView>
        )}
      </ThemeConsumer>
    )
  }

  signOut = async () => {
    try {
      await auth().signOut()
      analyticsLoggingOut()
      //If this succeeds, then the onAuthStateChanged listener set in App.js will handle navigation
    } catch (err) {
      logError(err, true, "Sign out error!")
    }
  }

  wait = (timeout) => {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  }

  onRefresh = () => {
    this.summaryComponent.refresh()
    this.wait(500).then(this.setState({ refreshing: false }))
  }

  sendEmailVerification = () => {
    ShowNotSupportedAlert()
    //probably wanna use this here:
    //auth().currentUser.sendEmailVerification() 
  }
}


class SettingSectionButton extends React.Component {
  render() {
    const { icon, title, color, onPress, style } = this.props
    return (
      <Button
        title={title}
        type="clear"
        icon={
          <icon.type {...icon.props} color={color} size={20} />
        }
        titleStyle={{ marginLeft: 8, color: color }}
        containerStyle={{ ...styles.settingsButton, ...style, borderBottomColor: color }}
        buttonStyle={{ justifyContent: "flex-start" }}
        onPress={onPress}
      />
    )
  }
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1
  },
  scrollContainer: {
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  section: {
    marginBottom: 6,
    backgroundColor: "white",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "grey",
  },
  settingsButton: {
    width: "90%",
    borderBottomWidth: 0.5,
    paddingBottom: 4
  }
})