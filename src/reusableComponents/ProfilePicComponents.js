import storage from '@react-native-firebase/storage';
import React from 'react';
import { Image } from 'react-native';
import FastImage from 'react-native-fast-image';
import { logError } from 'utils/helpers';

/**
 * This is a reusable component that displays profile pictues
 * Required props: `uid` (uid of the user/group to display) and `diameter`
 * Be sure that it is given a proper uid by the time it enters the DOM
 * Optional prop: groupPic (boolean)
 */
export default class ProfilePicCircle extends React.Component {

    render() {
        const { uid, diameter, style, ...otherProps } = this.props
        return (
            <ProfilePicRaw
                style={{ width: diameter, height: diameter, borderRadius: diameter / 2, ...style }}
                uid={uid}
                ref={ref => this.picComponent = ref}
                {...otherProps}
            />
        )
    }

    refresh = () => {
        this.picComponent.refresh()
    }

}

export class ProfilePicRaw extends React.Component {

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
        const { style, ...otherProps } = this.props
        if (!this.state.downloadUrl) {
            return (
                <Image
                    style={style}
                    source={this.props.groupPic ?
                        require('media/DefualtGroupPic.png'):
                        require('media/DefualtProfilePic.png')}
                    {...otherProps}
                />)
        } else {
            return (
                <FastImage
                    style={style}
                    source={{
                        uri: this.state.downloadUrl,
                        priority: FastImage.priority.normal,
                    }}
                    {...otherProps}
                />)
        }
    }

    getURL = async () => {
        try {
            const listResult = this.props.groupPic ?
                await storage().ref(`groupPictures/${this.props.uid}/scaled/`).list():
                await storage().ref(`profilePictures/${this.props.uid}/scaled/`).list()
                

            if (this._isMounted && listResult._items[0]) {
                const downloadUrl = await listResult._items[0].getDownloadURL()
                if (this._isMounted) this.setState({ downloadUrl })
            }
        } catch (err) {
            logError(err)
        }
    }

    refresh = () => {
        this.setState({ downloadUrl: '' }, this.getURL)
    }
}