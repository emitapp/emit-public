// Self explanatory what this does

import React from 'react'
import { StyleSheet, Text, TextInput, View, Button } from 'react-native'
import auth from '@react-native-firebase/auth';

export default class Login extends React.Component {

    state = { email: '', password: '', errorMessage: null }  

    render() {
      return (
        <View style={styles.container}>
          <Text>Login</Text>
          {this.state.errorMessage &&
            <Text style={{ color: 'red' }}>
              {this.state.errorMessage}
            </Text>}
          <TextInput
            style={styles.textInput}
            autoCapitalize="none"
            placeholder="Email"
            onChangeText={email => this.setState({ email })}
            value={this.state.email}
          />
          <TextInput
            secureTextEntry
            style={styles.textInput}
            autoCapitalize="none"
            placeholder="Password"
            onChangeText={password => this.setState({ password })}
            value={this.state.password}
          />
          <Button title="Login" onPress={this.handleLogin} />
          <Button
            title="Don't have an account? Sign Up"
            onPress={() => this.props.navigation.navigate('SignUp')}
          />
        </View>
      )
    }
    
    handleLogin = () => {
      var signInPromise = auth()
        .signInWithEmailAndPassword(this.state.email, this.state.password)
        .then(() => {
            this.props.navigation.navigate('Main')
          })

      timedPromise(signInPromise, 5000).catch(error => {
          if (error == "Timed out") this.setState({ errorMessage: error})
          else this.setState({ errorMessage: error.message })
        })
    }

  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    textInput: {
      height: 40,
      width: '90%',
      borderColor: 'gray',
      borderWidth: 1,
      marginTop: 8
    }
  })