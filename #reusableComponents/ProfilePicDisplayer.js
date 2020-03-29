import storage from '@react-native-firebase/storage';
import React from 'react';
import { Image } from 'react-native';
import FastImage from 'react-native-fast-image';
import { logError } from 'utils/helpers';

/**
 * This is a reusable component that displays profile pictues
 * Required props: `uid` (uid of the user to display) and `diameter`
 * Be sure that it is given a proper uid by the time it enters the DOM
 */
export default class ProfilePicDisplayer extends React.Component {

    constructor(props) {
        super(props);
        this.state = { downloadUrl: '' };
        this._isMounted = false; //Using this is an antipattern, but simple enough for now
    }

    componentDidMount() {
        if (!this.props.uid) return;
        this._isMounted = true;
        this.getURL();
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    render() {
        const { diameter, style, ...otherProps } = this.props
        if (!this.state.downloadUrl) {
            return (
                <Image
                    style={{ width: diameter, height: diameter, borderRadius: diameter / 2, ...style }}
                    source={require('media/ProfilePicPlaceholder.png')}
                    {...otherProps}
                />)
        } else {
            return (
                <FastImage
                    style={{ width: diameter, height: diameter, borderRadius: diameter / 2, ...style }}
                    source={{
                        uri: this.state.downloadUrl,
                        priority: FastImage.priority.normal,
                    }}
                    {...otherProps}
                />)
        }
    }

    getURL = async () => {
        try{
            const listResult = 
                await storage().ref(`profilePictures/${this.props.uid}/scaled/`).list()
            if (this._isMounted && listResult._items[0]){
                const downloadUrl = await listResult._items[0].getDownloadURL()
                if (this._isMounted) this.setState({ downloadUrl })
            }
        }catch(err){
            logError(err)
        }
    }
}