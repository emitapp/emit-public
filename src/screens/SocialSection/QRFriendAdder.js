import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { ThemeConsumer, Text } from 'react-native-elements';
import QRCodeScanner from 'react-native-qrcode-scanner';
import FriendReqModal from './FriendReqModal';

export default class ScanScreen extends Component {

    state = { QRData: "" }

    setQRData = (e) => {
        this.setState({ QRData: e.data })
        this.modal.open(e.data)
    }

    render() {
        return (
            <ThemeConsumer>
            {({ theme }) => (
            <View style = {styles.container}>
                
                {this.state.QRData == "" &&
                <>
                    <Text style={styles.centerText}>
                        Scan a Bitecode to send a friend request!
                    </Text>
                    <View style = {{width: "100%", flex: 1}}>
                        <QRCodeScanner
                            onRead={this.setQRData}
                            flashMode={RNCamera.Constants.FlashMode.off}
                            checkAndroid6Permissions={true}
                            showMarker={true}
                            markerStyle={{...styles.cameraBorder, color: theme.colors.primary}}
                        />
                    </View>
                </>
                }

                <FriendReqModal 
                    ref={modal => this.modal = modal} 
                    onClosed = {() => this.setState({ QRData: "" })}/>
            </View>
            )}
            </ThemeConsumer>
        )
    }
}

const styles = StyleSheet.create({
    centerText: {
        fontSize: 18,
        textAlign: "center"
    },
    cameraBorder: {
        borderRadius: 20
    },
    container: {
        flex: 1,
        marginTop: 16,
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
});