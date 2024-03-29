import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import AppIntro from 'rn-falcon-app-intro';

export default class SwiperOnboarding extends React.Component {
  render() {
    return (
      <AppIntro
        dotColor="#808080"
        activeDotColor="#000000"
        leftTextColor="#000000"
        rightTextColor="#000000"
        onDoneBtnClick={this.doneBtnHandle}
        onSkipBtnClick={this.onSkipBtnHandle}>

        <View style={[styles.slide, { backgroundColor: '#ffffff' }]}>
          <View level={10}><Text style={styles.headerText}>Welcome to Emit!</Text></View>
          <View level={15}><Text style={styles.smallBlackText}>The app for spontaneous get-togethers</Text></View>
        </View>


        <View style={[styles.slide, { backgroundColor: '#ffffff' }]}>
          <View style={{ alignItems: "center" }} level={9}>
            <Text style={{ fontSize: 50 }}>🔥</Text>
            <Text style={{ fontSize: 30, fontWeight: 'bold', color: "#FA6C13" }}>Why use Emit?</Text>
          </View>
          <View style={{ alignItems: "center" }} level={5}>
            <Text style={[styles.smallBlackText, { marginTop: 8 }]}>Finding times to hang out</Text>
            <Text style={styles.smallBlackText}>with friends can be hard</Text>
            <Text style={[styles.smallBlackText]}>when they aren't all in an </Text>
            <Text style={[styles.smallBlackText, { marginBottom: 16 }]}>active group chat together</Text>
          </View>
        </View>


        <View style={[styles.slide, { backgroundColor: '#ffffff' }]}>
          <View style={{ alignItems: "center" }} level={9}><Text style={styles.smallBlackText}>With a few taps let your friends know</Text></View>
          <View style={{ alignItems: "center" }} level={5}><Text style={styles.smallBlackText}>that you're down to hang out,</Text>
          </View>
          <View style={{ alignItems: "center" }} level={5}><Text style={styles.smallBlackText}>whether that means partying, studying,</Text>
            <View style={{ alignItems: "center" }} level={5}><Text style={[styles.smallBlackText, { marginBottom: 16 }]}>spikeball, or anything else!</Text>
            </View>
          </View>
          <View style={{ justifyContent: "center", alignItems: "center" }}><Image source={require("media/NewFlare.png")} style={{ width: 250, height: 500, borderColor: "black", borderWidth: 1 }} /></View>
        </View>

        <View style={[styles.slide, { backgroundColor: 'white', width: "100%", alignItems: "center" }]}>
          <View style={{ alignItems: "center" }} style={{ marginBottom: 8 }} level={8}><Text style={styles.smallBlackText}>You can join groups or add friends to send flares to!</Text></View>
          <View style={{ justifyContent: "center", alignItems: "center" }}><Image source={require("media/DiscoverPage.png")} style={{ width: 250, height: 500, borderColor: "black", borderWidth: 1 }} /></View>
        </View>

        <View style={[styles.slide, { backgroundColor: 'white', width: "100%", alignItems: "center" }]}>
          <View style={{ alignItems: "center" }} level={9}><Text style={styles.smallBlackText}>You can also send public flares, which are visible to anyone near you!</Text></View>
          <View ><Image source={require("media/Map_Flatline.png")} style={{ width: 250, height: 200 }} resizeMode="contain" /></View>
          <View style={{ alignItems: "center" }} level={3}><Text style={styles.smallGreyText}>PS: Its becuase of this
          <Text style={{ fontWeight: "bold" }}>{" "}we're about to ask for location permissions! </Text>
          </Text></View>

        </View>



      </AppIntro>
    );
  }

  onSkipBtnHandle = (index) => {
    this.props.navigation.navigate("AddProfilePic")
  }
  doneBtnHandle = () => {
    this.props.navigation.navigate("AddProfilePic")
  }
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#9DD6EB',
    padding: 15,
  },

  slideCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9DD6EB',
    padding: 15,
  },

  headerText: {
    color: '#000000',
    fontSize: 30,
    fontWeight: 'bold',
  },

  smallBlackText: {
    color: '#000000',
    fontSize: 20,
  },

  smallGreyText: {
    color: 'grey',
    fontSize: 17,
  },
});