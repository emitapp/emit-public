import auth from '@react-native-firebase/auth';
import React from 'react';
import { View, Image } from 'react-native';
import S from "styling";
import { logError, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import { ThemeConsumer } from 'react-native-elements';
import {Text, Button, Input} from 'react-native-elements'
import {MinorActionButton} from 'reusables/ReusableButtons'
import {DefaultLoadingModal} from 'reusables/LoadingComponents'
import ErrorMessageText from 'reusables/ErrorMessageText';
import Snackbar from 'react-native-snackbar'


export default class PasswordReset extends React.Component {

    state = { email: '', errorMessage: null, modalVisible: false }  

    render() {
      return (
        <ThemeConsumer>
        {({ theme }) => (
          <View style={{...S.styles.container, backgroundColor: theme.colors.primary}}>

          <DefaultLoadingModal isVisible={this.state.modalVisible} />

          <Image
            source={require('media/unDrawPizzaEating.png')}
            style = {{position: 'absolute', bottom: 0, height: "50%", opacity: 0.3}}
            resizeMode = 'contain'/>

            <View style = {{
              justifyContent: 'center',
              alignItems: 'center', 
              borderRadius: 30, 
              backgroundColor: "white", 
              height: "auto",
              padding: 20,
              marginHorizontal: 30}}>

              <Text h3 
                style = {{color: theme.colors.primary, marginVertical: 8}}>
                  Password Reset
              </Text>

              <Text  style={{textAlign: "center", marginVertical:8}}>
                Enter the email for your Biteup account's email address so that we can send a password reset email.
              </Text>

              <ErrorMessageText message = {this.state.errorMessage} />

              <Input
                autoCapitalize="none"
                placeholder="johnDoe@gmail.com"
                label = "Email"
                keyboardType = "email-address"
                onChangeText={email => this.setState({ email })}
                value={this.state.email}
              />

              <Button 
                title="Send Email" 
                onPress={this.sendPassResetEmail}/>


              <MinorActionButton
              title="Go Back"
              onPress={() => this.props.navigation.navigate('Login')}/>
              
            </View>
          </View>
        )}
        </ThemeConsumer>
      )
    }
    
    sendPassResetEmail = async () => {
      if (!this.state.email){
        this.setState({errorMessage: "You haven't entered an email!"})
        return
      }
      this.setState({modalVisible: true, errorMessage: ""})
      try{
        //If this succeeds, then the onAuthStateChanged listener set in App.js will handle navigation
        var signInPromise = auth().sendPasswordResetEmail(this.state.email)
        await timedPromise(signInPromise, MEDIUM_TIMEOUT)
        this.showDelayedSnackbar("Email sent")
      }catch(err){
        this.setState({ errorMessage: err.message})
      }   
      this.setState({modalVisible: false}) 
    }

    //There are modals being opened and closed on this screen, and if I close a modal
    //and then show the snackbar, the snackbar might be attached to the modal that was jsut in 
    //the process of being removed, meaning the snackbar will never be displayed. 
    //So, I use a small timeout to give the snackbar a bit of a delay
    //https://github.com/cooperka/react-native-snackbar/issues/67
    showDelayedSnackbar = (message) => {
      setTimeout(
        () => {
          Snackbar.show({
            text: message, 
            duration: Snackbar.LENGTH_SHORT
          });
        },
        200
      )
    }
  }