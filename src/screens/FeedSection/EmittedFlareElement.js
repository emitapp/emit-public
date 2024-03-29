import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicon from 'react-native-vector-icons/Ionicons';
import FlareTimeStatus from 'reusables/flares/FlareTimeStatus';
import S from 'styling';
import NavigationService from 'utils/NavigationService';
import PublicFlareNotice from 'reusables/flares/PublicFlareNotice';
import Emoji from 'reusables/ui/Emoji'

export default class EmittedFlareElement extends React.PureComponent {
  render() {
    const { item, isPublicFlare } = this.props
    return (
      <TouchableOpacity
        style={{ ...S.styles.listElement, paddingVertical: 4 }}
        onPress={() => NavigationService.push("FlareViewer", { broadcast: item, isPublicFlare })}>
        <View style={{ flexDirection: "column", flex: 1 }}>

          <View style={{ flexDirection: "row" }}>
            <View style={{ flexDirection: "row", flex: 1, alignItems: "center" }}>
              <Emoji size={40} style={{ marginHorizontal: 8 }} emoji={item.emoji} />
              {/* flexShrink important to prevent flare activity from bleeding out of parent  */}
              <View style={{ justifyContent: "center", flexShrink: 1 }}>
                <Text style={{ fontSize: 20 }}>{item.activity} </Text>
                {isPublicFlare && <PublicFlareNotice flareInfo={item} />}
                {item.recurringDays?.length > 0 &&
                  <Text>Recurring: {item.recurringDays.join("/")} </Text>
                }

                {item.totalConfirmations != 0 ?
                  <Text style={{ fontSize: 14 }}>{item.totalConfirmations} people are in</Text> :
                  <Text style={{ fontSize: 14 }}>No responders yet</Text>
                }
              </View>
            </View>

            <View>
              <FlareTimeStatus item={item} />
              <Pressable onPress={() => NavigationService.navigate("ChatScreen", { broadcast: item, isPublicFlare })}>
                <Ionicon name="md-chatbubbles" color="grey" size={35} style={{ marginHorizontal: 8 }} />
              </Pressable>
            </View>
          </View>

          {(item.locked || item.location) &&
            <View style={{ marginHorizontal: 8 }}>
              <Text style={{ fontSize: 16 }} numberOfLines={2}>{item.location}</Text>
              {item.locked &&
                <View style={{
                  flexDirection: "row", alignItems: "center", borderColor: "grey",
                  borderWidth: 1, alignSelf: "flex-start", padding: 6, borderRadius: 8
                }}>
                  <Icon name="lock" color="grey" size={24} style={{ marginHorizontal: 8 }} />
                  <Text>Max responders reached</Text>
                </View>
              }
            </View>
          }

        </View>
      </TouchableOpacity>
    )
  }
}