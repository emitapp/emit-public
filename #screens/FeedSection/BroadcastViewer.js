import React from 'react'
import { StyleSheet, Text, View, Button, ActivityIndicator, TouchableOpacity } from 'react-native'
import Modal from 'react-native-modal'

import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';

import { epochToDateString, timedPromise, LONG_TIMEOUT } from '../../#constants/helpers';
import TimeoutLoadingComponent from '../../#reusableComponents/TimeoutLoadingComponent'
import {responderStatuses, returnStatuses} from '../../#constants/serverValues'
import DynamicInfiniteScroll from '../../#reusableComponents/DynamicInfiniteScroll'

export default class BroadcastViewer extends React.Component {

    constructor(props) {
        super(props);
        this.state = { 
            errorMessage: null, 
            broadcastData: null,
            isModalVisible: false,
            showConfirmed: false
        }

        this.broadcastSnippet = this.props.navigation.getParam('broadcast', {uid: " ", owner: {uid: " "}})
    }

  componentDidMount = () => {
    database()
    .ref(`activeBroadcasts/${this.broadcastSnippet.owner.uid}/public/${this.broadcastSnippet.uid}`)
    .on('value', snap => this.setState({broadcastData: snap.val()}))
  }

  componentWillUnmount = () => {
    database()
    .ref(`activeBroadcasts/${this.broadcastSnippet.owner.uid}/public/${this.broadcastSnippet.uid}`)
    .off()
  }



  render() {
    return (
      <View style={styles.container}>
        <Modal 
          isVisible={this.state.isModalVisible}
          style = {{justifyContent: "center", alignItems: "center"}}
          animationIn = "fadeInUp"
          animationOut = 'fadeOutUp'
          animationOutTiming = {0}>
          <ActivityIndicator />
        </Modal>

        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}

        {this.state.broadcastData && 
        <View>
            <Text>Owner Name: {this.broadcastSnippet.owner.name}</Text>
            <Text>Owner uid: {this.broadcastSnippet.owner.uid}</Text>
            <Text>Broadcast uid: {this.broadcastSnippet.uid}</Text>
            <Text>Location: {this.state.broadcastData.location}</Text>
            <Text>Note: {this.state.broadcastData.note || " "}</Text>
            <Text>Death Time: {epochToDateString(this.state.broadcastData.deathTimestamp)}</Text>
            <Text>Confirmations: {this.state.broadcastData.totalConfirmations}</Text>
        </View>}

        {this.displayBroadcastAction()}

        {!this.state.broadcastData &&
            <TimeoutLoadingComponent
            hasTimedOut={false}
            retryFunction={() => null}/>
        }

        {!this.state.showConfirmed &&
          <Button 
            title="Show Other Confirmations" 
            onPress={() => this.setState({showConfirmed: true})}/>
        }

        {this.state.showConfirmed &&
          <DynamicInfiniteScroll style = {{width: "100%", flex: 1}}
            chunkSize = {10}
            errorHandler = {this.scrollErrorHandler}
            renderItem = {this.itemRenderer}
            generation = {0}
            dbref = {
              database()
              .ref(`activeBroadcasts/${this.broadcastSnippet.owner.uid}/responders/${this.broadcastSnippet.uid}`)
              .orderByChild("status")
              .equalTo(responderStatuses.CONFIRMED)
            }
            ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
          />
        }
      </View>
    )
  }

  displayBroadcastAction = () => {
    if (!this.broadcastSnippet.status){
      return (<Button title="Express Interest" onPress={this.sendConfirmationRequest} />)
    }else{
      return <Text>{this.broadcastSnippet.status}</Text>
    }
  }

  sendConfirmationRequest = async () => {
    this.setState({isModalVisible: true})
    try{
      const newStatus = (this.state.broadcastData.autoConfirm ? responderStatuses.CONFIRMED : responderStatuses.PENDING)
      const newStatuses = {}
      newStatuses[auth().currentUser.uid] = newStatus

      const requestFunction = functions().httpsCallable('setBroadcastResponse');
      const response = await timedPromise(requestFunction({
        broadcasterUid: this.broadcastSnippet.owner.uid,
        broadcastUid: this.broadcastSnippet.uid,
        newStatuses
      }), LONG_TIMEOUT);

      if (response.data.status === returnStatuses.OK){
        this.broadcastSnippet.status = newStatus
        this.setState({errorMessage: "Success (I know this isn't an error but meh)"})
      }else{
          console.log(response, "problematic response")
      }
    }catch(err){
      if (err.message == "timeout"){
          this.setState({errorMessage: "Timeout!"})
      }else{
          console.log(err)          
      }
    }
    this.setState({isModalVisible: false})
  }

  scrollErrorHandler = (err) => {
    console.log(err)
    this.setState({errorMessage: err.message})
  }

  itemRenderer = ({ item }) => {
    return (
      <TouchableOpacity 
        style = {styles.listElement}>
        <Text>{item.name}</Text>
        <Text>{item.uid}</Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  newBroadcastButton: {
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: "mediumseagreen",
    width: "100%", 
    height: 50,
    flexDirection: 'row'
  },
  listElement: {
    backgroundColor: 'ghostwhite',
    alignItems: "flex-start",
    marginLeft: 10,
    marginRight: 10
  }
})