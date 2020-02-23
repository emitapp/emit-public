import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import React from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import BannerButton from 'reusables/BannerButton';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import S from "styling";
import { epochToDateString, logError, LONG_TIMEOUT, timedPromise } from 'utils/helpers';
import { responderStatuses, returnStatuses } from 'utils/serverValues';


export default class ResponsesViewer extends React.Component {

    constructor(props) {
        super(props);
        this.broadcastData = this.props.navigation.getParam('broadcast', {uid: " "})
        this.respondersListPath = `activeBroadcasts/${auth().currentUser.uid}/responders/${this.broadcastData.uid}`

        this.state = { 
            errorMessage: null, 
            responseStatusDeltas: {},
            isModalVisible: false,
            currentTargetStatus: this.broadcastData.autoConfirm ? responderStatuses.CONFIRMED : responderStatuses.PENDING,
            searchGeneration: 0
        }
    }

  componentDidMount = () => {
    //I'd want to remove the removed responser from the responseStatusDeltas object
    //If it's there too.
    database()
    .ref(this.respondersListPath)
    .on('child_removed', snap => {
      let { [snap.key]: _, ...newDeltaObject } = this.state.responseStatusDeltas
      this.setState({responseStatusDeltas: newDeltaObject})
    })
  }

  componentWillUnmount = () => {
    database()
    .ref(this.respondersListPath)
    .off()
  }

  render() {
    return (
      <View style={S.styles.containerFlexStart}>
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

        <View>
            <Text>Location: {this.broadcastData.location}</Text>
            <Text>Note: {this.broadcastData.note || " "}</Text>
            <Text>Death Time: {epochToDateString(this.broadcastData.deathTimestamp)}</Text>
        </View>

        <View style = {{width: "100%", height: 30, flexDirection: 'row'}}>
            <TouchableOpacity 
                style = {this.buttonThemeChooser(responderStatuses.PENDING)}
                onPress={() => this.setState({
                  currentTargetStatus: responderStatuses.PENDING,
                  searchGeneration: ++this.state.searchGeneration
                })}>
                <Text>PENDING</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style = {this.buttonThemeChooser(responderStatuses.CONFIRMED)}
                onPress={() => this.setState({
                  currentTargetStatus: responderStatuses.CONFIRMED,
                  searchGeneration: ++this.state.searchGeneration
                })}>                
                <Text>CONFIRMED</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style = {this.buttonThemeChooser(responderStatuses.IGNORED)}
                onPress={() => this.setState({
                  currentTargetStatus: responderStatuses.IGNORED,
                  searchGeneration: ++this.state.searchGeneration
                })}>   
                <Text>IGNORED</Text>
            </TouchableOpacity>
        </View>

        <DynamicInfiniteScroll style = {{width: "100%", flex: 1}}
          chunkSize = {10}
          errorHandler = {this.scrollErrorHandler}
          renderItem = {this.itemRenderer}
          generation = {this.state.searchGeneration}
          dbref = {
            database()
            .ref(this.respondersListPath)
            .orderByChild("status")
            .equalTo(this.state.currentTargetStatus)
          }
          ItemSeparatorComponent = {() => <View style = {{height: 10, backgroundColor: "grey"}}/>}
        />

        <BannerButton
          onPress={this.confirmChanges}
          title="CONFIRM CHANGES"
          iconName = {S.strings.add}
          color = {S.colors.buttonGreen}
        />
      </View>
    )
  }

  scrollErrorHandler = (err) => {
    logError(err)
    this.setState({errorMessage: err.message})
  }

  itemRenderer = ({ item }) => {
    return (
      <View 
        style = {S.styles.listElement}>
        <Text>{item.name}</Text>
        <Text>{item.uid}</Text>
        {item.status !== responderStatuses.CONFIRMED && 
          <Button title = "Accept" onPress = {() => this.createDelta(item.uid, responderStatuses.CONFIRMED)}/>}
        {item.status !== responderStatuses.IGNORED && 
          <Button title = "Ignore" onPress = {() => this.createDelta(item.uid, responderStatuses.IGNORED)}/>}
          <Text>Pending Change: {this.state.responseStatusDeltas[item.uid]}</Text>
      </View>
    )
  }

  buttonThemeChooser = (targetStatus) => {
    return this.state.currentTargetStatus == targetStatus ? styles.selectedTab : styles.dormantTab
  }

  createDelta = (targetUid, newStatus) => {
    let responseStatusDeltas = {...this.state.responseStatusDeltas}
    responseStatusDeltas[targetUid] = newStatus;
    this.setState({responseStatusDeltas})
  }

  confirmChanges = async () => {
    if (Object.keys(this.state.responseStatusDeltas).length === 0) return;
    this.setState({isModalVisible: true})
    try{
      const requestFunction = functions().httpsCallable('setBroadcastResponse');
      const response = await timedPromise(requestFunction({
        broadcasterUid: auth().currentUser.uid,
        broadcastUid: this.broadcastData.uid,
        newStatuses: this.state.responseStatusDeltas
      }), LONG_TIMEOUT);

      if (response.data.status === returnStatuses.OK){
        this.setState({errorMessage: "Success (I know this isn't an error but meh)"})
      }else{
          logError(new Error("Problematic setBroadcastResponse fucntion response: " + response.data.status))
      }
    }catch(err){
      if (err.code == "timeout"){
          this.setState({errorMessage: "Timeout!"})
      }else{
          logError(err)        
      }
    }
    this.setState({isModalVisible: false, responseStatusDeltas: {}})
  }

}

const styles = StyleSheet.create({
  selectedTab: {
    flex: 1,
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: "dodgerblue"
  },
  dormantTab: {
    flex: 1,
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: "grey"
  }
})