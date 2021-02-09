import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import React from 'react';
import { Image, View } from 'react-native';
import { Button } from 'react-native-elements';
import DynamicInfiniteScroll from 'reusables/DynamicInfiniteScroll';
import EmptyState from 'reusables/EmptyState';
import ErrorMessageText from 'reusables/ErrorMessageText';
import FeedElement from "./FeedElement"; 
import { responderStatuses } from 'utils/serverValues';
import S from 'styling';

export default class Feed extends React.Component {

  state = { 
    errorMessage: null, 
  }

  render() {
    return (
      <View style={S.styles.container}>

          <ErrorMessageText message = {this.state.errorMessage} />
          <DynamicInfiniteScroll
            renderItem = {this.itemRenderer}
            generation = {0}
            filter = {item => item.status != responderStatuses.CONFIRMED}
            dbref = {database().ref(`/feeds/${auth().currentUser.uid}`)}
            emptyStateComponent = {
              <EmptyState 
                image =  { 
                  <Image source={require('media/EmptyFeed.png')} 
                  style = {{height: 80, marginBottom: 8}} 
                  resizeMode = 'contain' />
                }
                title = "Looks pretty quiet here" 
                message = "Flares your friends or groups send will show up here!" 
              >
                <Button
                title="Add friends"
                onPress={() => this.props.navigation.navigate('UserFriendSearch')}
                buttonStyle={{ borderWidth: 2, width: 150, height: 36, marginTop: 22 }}
                titleStyle={{ fontSize: 13 }} />
              </EmptyState>
            }
            
          />
      </View>
    )
  }

  itemRenderer = ({item}) => {
    return (
     <FeedElement
       navigation={this.props.navigation}
       item={item}/>
    );
  }
}
