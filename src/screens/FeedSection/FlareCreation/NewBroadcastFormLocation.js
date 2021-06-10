import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Button, Divider, Input, Text, ThemeConsumer } from 'react-native-elements';
import Snackbar from 'react-native-snackbar';
import Icon from 'react-native-vector-icons/Entypo';
import ErrorMessageText from 'reusables/ErrorMessageText';
import { ClearHeader } from 'reusables/Header';
import { LocationListElement } from "reusables/ListElements";
import { SmallLoadingComponent } from 'reusables/LoadingComponents';
import MainLinearGradient from 'reusables/MainLinearGradient';
import { BannerButton, MinorActionButton } from 'reusables/ReusableButtons';
import S from 'styling';
import { isOnlyWhitespace, logError, MEDIUM_TIMEOUT, timedPromise } from 'utils/helpers';
import * as recentLocFuncs from 'utils/RecentLocationsFunctions';
import { MAX_LOCATION_NAME_LENGTH } from 'utils/serverValues'
import { v4 as uuidv4 } from 'uuid';
import BulgingButton from 'reusables/BulgingButton'
import MatIcon from "react-native-vector-icons/MaterialIcons"
export default class NewBroadcastFormLocation extends React.Component {

  constructor(props) {
    super(props)
    this.navigationParams = props.navigation.state.params.bundle
    this.isPublicFlare = props.navigation.state.params.isPublicFlare

    this.state = {
      locationName: this.navigationParams.location, //Default: ""
      locationPin: null,
      recentLocations: [],
      errorMessage: null,
      savingLocation: false,
    }

    if (this.navigationParams.geolocation) this.state.locationPin = this.navigationParams.geolocation
  }

  static navigationOptions = ClearHeader("New Flare")

  componentDidMount() {
    const { navigation } = this.props;
    this.focusListener = navigation.addListener('didFocus', () => {
      this.setState({}) //Just call for a rerender (this is used when we come back from the location picker map)
    });
    recentLocFuncs.getRecentLocations()
      .then(recentLocations => this.setState({ recentLocations }))
      .catch(err => {
        logError(err)
        this.setState({ errorMessage: "Couldn't retrieve recent locations" })
      })
  }

  componentWillUnmount() {
    this.focusListener.remove();
  }

  render() {
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <MainLinearGradient theme={theme}>
            <View style={{ flex: 1, backgroundColor: "white", width: "100%", borderTopEndRadius: 50, borderTopStartRadius: 50 }}>
              <Text h4 h4Style={{ marginVertical: 8, fontWeight: "bold" }}>
                Where will you be?
              </Text>
              <ErrorMessageText message={this.state.errorMessage} />
              <Input
                containerStyle={{ marginBottom: 0 }}
                label="Location Name"
                placeholder="That Super Awesome Place"
                onChangeText={locationName => this.setState({ locationName })}
                value={this.state.locationName}
                errorMessage={this.state.locationName.length > MAX_LOCATION_NAME_LENGTH ? "Too long" : undefined}
              />

              {this.state.locationPin == null &&
                <View style={{ alignItems: "center", justifyContent: "center" }}>
                  <BulgingButton
                    height={50}
                    width={170}
                    icon={<Icon name="location-pin" size={30} color="white" />}
                    title="Add a Map Pin"
                    onPress={() => this.props.navigation.navigate("LocationSelector",
                      {
                        callback: (geo) => this.setState({ locationPin: geo }),
                        pin: this.state.locationPin
                      })}
                  />
                </View>

              }

              {this.state.locationPin != null &&
                <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
                  <Icon name="location-pin" size={30} color="black" style={{ marginHorizontal: 8 }} />
                  <Text style={{ flex: 1 }}>Map Pin Added</Text>
                  <Button
                    titleStyle={{ color: "black" }}
                    type="clear"
                    title="Edit"
                    onPress={() => this.props.navigation.navigate("LocationSelector",
                      {
                        callback: (geo) => this.setState({ locationPin: geo }),
                        pin: this.state.locationPin

                      })}
                  />
                  <Button
                    titleStyle={{ color: "red" }}
                    type="clear"
                    title="Clear"
                    onPress={() => this.setState({ locationPin: null })}
                  />
                </View>
              }

              {!this.state.savingLocation ? (
                <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
                  <Button title="Save to Saved Locations"
                    onPress={this.saveLocation}
                    titleStyle={{ fontSize: 14 }}
                    type="outline" />
                  <Button title="See all Saved Locations"
                    onPress={() => this.props.navigation.navigate("SavedLocations", this.props.navigation.state.params.bundle)}
                    titleStyle={{ fontSize: 14 }}
                    type="outline" />
                </View>
              ) : (
                <View style={{ alignSelf: "center" }}>
                  <SmallLoadingComponent />
                </View>
              )}

              <FlatList
                data={this.state.recentLocations}
                renderItem={({ item, index }) => this.renderRecentLocation(item, index)}
                ListHeaderComponent={() => this.renderHeader(this.state.recentLocations, theme)}
                style={{ marginHorizontal: 8 }}
                keyExtractor={item => item.uid}
              />
            </View>
            <BannerButton
              iconName={S.strings.confirm}
              onPress={this.confirmLocation}
              title="CONFIRM"
            />
          </MainLinearGradient>
        )}
      </ThemeConsumer>
    )
  }

  confirmLocation = (addToRecents = true) => {
    if (!this.isValidLocation()) {
      Snackbar.show({ text: 'Enter location name or map pin, or both', duration: Snackbar.LENGTH_SHORT });
      return
    }

    let { locationName } = this.state
    if (isOnlyWhitespace(locationName)) locationName = "Unnamed location"

    if (locationName.length > MAX_LOCATION_NAME_LENGTH) {
      Snackbar.show({ text: 'Your location name is too long', duration: Snackbar.LENGTH_SHORT });
      return
    }

    if (this.state.locationPin == null && this.isPublicFlare) {
      Snackbar.show({ text: 'Public flares need map pins!', duration: Snackbar.LENGTH_SHORT });
      return
    }

    this.navigationParams.location = locationName.trim()
    const locationToSaveToRecents = { name: locationName, uid: uuidv4() }

    if (this.state.locationPin != null) {
      this.navigationParams.geolocation = this.state.locationPin
      locationToSaveToRecents.geolocation = this.state.locationPin
    } else {
      this.navigationParams.geolocation = null
    }

    if (addToRecents) recentLocFuncs.addNewLocation(locationToSaveToRecents)
    this.props.navigation.goBack()
  }

  saveLocation = async () => {
    if (!this.isValidLocation()) {
      Snackbar.show({ text: 'Enter location name or map pin, or both', duration: Snackbar.LENGTH_SHORT });
      return
    }

    let { locationName } = this.state
    if (isOnlyWhitespace(locationName)) locationName = "Unnamed location"

    if (locationName.length > MAX_LOCATION_NAME_LENGTH) {
      Snackbar.show({ text: 'Your location name is too long', duration: Snackbar.LENGTH_SHORT });
      return
    }
    this.setState({ savingLocation: true, errorMessage: null })
    let location = { name: locationName.trim() }
    if (this.state.locationPin !== null) location.geolocation = this.state.locationPin

    try {
      await timedPromise(
        database().ref(`/savedLocations/${auth().currentUser.uid}`).push(location),
        MEDIUM_TIMEOUT
      )
      Snackbar.show({ text: 'Saved location', duration: Snackbar.LENGTH_SHORT });
    } catch (err) {
      if (err.name == "timeout") {
        Snackbar.show({ text: 'Timeout', duration: Snackbar.LENGTH_SHORT });
      } else {
        this.setState({ errorMessage: "Something went wrong." })
        logError(err)
      }
    }
    this.setState({ savingLocation: false })
  }

  renderHeader = (recentLocations, theme) => {
    if (recentLocations.length == 0) return null
    return (
      <>
        <Divider style={{ marginTop: 16 }} />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 18, textAlign: "center", flex: 1 }}> Recent Locations </Text>
          <Button
            icon={<MatIcon name="cancel" size={20} color={theme.colors.grey3} />}
            onPress={this.clearRecentLocations} 
            type = "clear"/>
        </View>
      </>
    )
  }

  renderRecentLocation = (item, index) => {
    return (
      <LocationListElement
        locationInfo={item}
        onPress={() => {
          const newState = { locationName: item.name }
          if (item.geolocation) newState.locationPin = item.geolocation
          recentLocFuncs.bubbleToTop(index)
          this.setState(newState, () => this.confirmLocation(false))
        }}
      />
    )
  }

  clearRecentLocations = () => {
    recentLocFuncs.clearRecentLocations()
      .then(() => this.setState({ recentLocations: [] }))
      .catch(err => {
        logError(err)
        this.setState({ errorMessage: "Couldn't clear recent locations" })
      })
  }

  isValidLocation = () => {
    let { locationName, locationPin } = this.state
    if (isOnlyWhitespace(locationName) && !locationPin) return false
    return true
  }
}