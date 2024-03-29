//This is a rerouting page. It uses firebase.auth, AsyncStorage, and the realtime database
//to decide which page to send the user based on their auth status.

import AsyncStorage from '@react-native-community/async-storage';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { View } from 'react-native';
import {TimeoutLoadingComponent} from 'reusables/ui/LoadingComponents'

import S from "styling";
import { ASYNC_SETUP_KEY, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';


export default class Loading extends React.Component {

  constructor(props){
    super(props);
    this.state = {timedout: false}
  }

  componentDidMount() {
    this.makeDecision() 
  }

  render() {
    return (
      <View style={S.styles.container}>
        <TimeoutLoadingComponent 
          hasTimedOut = {this.state.timedout}
          retryFunction = {() => {
            this.setState({timedout: false})
            this.makeDecision()
          }}
        />
      </View>
    )
  }

  //Decides which page to navigate to next
  makeDecision = async () => {
    try{
      const user = auth().currentUser
      if (!user){ 
        this.props.navigation.navigate('LandingPage');
      }else{
        const isSetUp = await AsyncStorage.getItem(ASYNC_SETUP_KEY);
        if (isSetUp){
          this.props.navigation.navigate('MainTabNav');
        }else{ 
          //Looks like he might not be set up, let's make sure first
          const uid = auth().currentUser.uid; 
          const ref = database().ref(`/userSnippets/${uid}`);
          const snapshot = await timedPromise(ref.once('value'), LONG_TIMEOUT);
          if (snapshot.exists()){
            await AsyncStorage.setItem(ASYNC_SETUP_KEY, "yes")
            this.props.navigation.navigate('MainTabNav');
          } 
          else this.props.navigation.navigate('AccountSetUp');
        } 
      }
    }catch(err){
      if (err.name == "timeout"){
        logError(err, false)
        this.setState({timedout: true})
      }else{
        logError(err)
      }
    }
  }
}