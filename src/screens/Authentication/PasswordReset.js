import auth from '@react-native-firebase/auth';
import React from 'react';
import { View, ImageBackground, StatusBar } from 'react-native';
import S from "styling";
import { MEDIUM_TIMEOUT, timedPromise, showDelayedSnackbar } from 'utils/helpers';
import { ThemeConsumer } from 'react-native-elements';
import { Text, Button, Input } from 'react-native-elements'
import { MinorActionButton } from 'reusables/ui/ReusableButtons'
import { DefaultLoadingModal } from 'reusables/ui/LoadingComponents'
import ErrorMessageText from 'reusables/ui/ErrorMessageText';
import { KeyboardAvoidingAndDismissingView } from 'reusables/containers/KeyboardComponents';


export default class PasswordReset extends React.Component {

  state = { email: '', errorMessage: null, modalVisible: false }

  render() {
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <KeyboardAvoidingAndDismissingView>
            <ImageBackground
              source={require('media/AuthFlowBackground.jpg')}
              style={{ ...S.styles.container, backgroundColor: "black" }}
              resizeMode='cover'>
              <StatusBar backgroundColor={'black'} barStyle="light-content" />

              <DefaultLoadingModal isVisible={this.state.modalVisible} />

              <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 30,
                backgroundColor: "white",
                height: "auto",
                padding: 20,
                marginHorizontal: 30
              }}>

                <Text h3
                  style={{ marginVertical: 8 }}>
                  Password Reset
              </Text>

                <Text style={{ textAlign: "center", marginVertical: 8 }}>
                  Enter the email for your Emit account's email address so that we can send a password reset email.
              </Text>

                <ErrorMessageText message={this.state.errorMessage} />

                <Input
                  autoCapitalize="none"
                  placeholder="johnDoe@gmail.com"
                  label="Email"
                  keyboardType="email-address"
                  onChangeText={email => this.setState({ email })}
                  value={this.state.email}
                />

                <Button
                  title="Send Email"
                  onPress={this.sendPassResetEmail} />


                <MinorActionButton
                  title="Go Back"
                  onPress={() => this.props.navigation.navigate('Login')} />

              </View>
            </ImageBackground>
          </KeyboardAvoidingAndDismissingView>
        )}
      </ThemeConsumer>
    )
  }

  sendPassResetEmail = async () => {
    if (!this.state.email) {
      this.setState({ errorMessage: "You haven't entered an email!" })
      return
    }
    this.setState({ modalVisible: true, errorMessage: "" })
    try {
      //If this succeeds, then the onAuthStateChanged listener set in App.js will handle navigation
      var signInPromise = auth().sendPasswordResetEmail(this.state.email)
      await timedPromise(signInPromise, MEDIUM_TIMEOUT)
      showDelayedSnackbar("Email sent")
    } catch (err) {
      this.setState({ errorMessage: err.message })
    }
    this.setState({ modalVisible: false })
  }
}