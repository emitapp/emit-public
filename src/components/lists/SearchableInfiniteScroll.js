import React from 'react'
import { Alert, FlatList, View } from 'react-native'
import { SearchBar, Text, ThemeConsumer } from 'react-native-elements'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5'
import Chip from 'reusables/ui/Chip'
import EmptyState from 'reusables/ui/EmptyState'
import S from 'styling'
import DynamicInfiniteScroll from './DynamicInfiniteScroll'
import StaticInfiniteScroll from './StaticInfiniteScroll'
import SectionInfiniteScroll from './SectionInfiniteScroll'
import { analyticsLogSearch } from 'utils/analyticsFunctions'

/**
 * This class is a wrapper for either a DynamicInifiteScroll or a StaticInfiniteScroll
 * with additional search capabilities
 */
//REQUIRED PROPS:
//type: either "dynamic" or "static"
//queryTypes: list of objects of the form {name: ..., value: ...} for each value that 
//can be entered into the orderByChild value of a databse ref
//queryValidator: a function that determines whether a querty is valid enough to attempt
//
//OPTIONAL PROPS:
// data: populated in case the parent component needs to use the data pulled from the database
// additionalData: a miscellaneous "catch all" object that probably should be removed
// in the future - currently used to pass the "+ New Group" and "+ Add Friend"
// buttons to SectionInfiniteScroll - of the form [{text: ..., func: ...},]

//OPTIONAL PROPS:
//parentEmptyStateComponent
//searchbarPlaceholder

//Also be sure to give this class all the props necessary for the 
//chosen infinite scrolling component to work, 
//but don't give them a generation, startingPoint or endingPoint
export default class SearchableInfiniteScroll extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      searchBarValue: '',
      query: this.getInitialQueryValue(), // Will be null if the query isn't valid
      searchGeneration: 0,
      currentSorter: this.props.queryTypes[0].value
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.dbref.toString() !== prevProps.dbref.toString()) {
      this.setState({
        query: this.getInitialQueryValue(),
        searchGeneration: this.state.searchGeneration + 1
      })
    }
  }

  

  render() {
    const { type, queryTypes, queryValidator, dbref, style,
      parentEmptyStateComponent, searchbarPlaceholder, onSectionData, additionalData, ...otherProps } = this.props
    const searchBarComponent = () =>
      <SearchBar
        onClear = {() => this.setState({query: null})}
        autoCapitalize="none"
        placeholder={searchbarPlaceholder}
        onChangeText={searchBarValue => this.setState({ searchBarValue })}
        value={this.state.searchBarValue}
        onSubmitEditing={this.search}
      />
    return (
      <ThemeConsumer>
        {({ theme }) => (
          <View style={{ ...S.styles.containerFlexStart, width: "100%", ...style }}>

            {this.props.children}
            {this.props.searchBarBuddy ? 
              <View style={{flexDirection: "row", marginLeft: -12}}>
                {this.props.searchBarBuddy}
                <View style={{width: "85%", marginLeft: 8, justifyContent: "center"}}>
                {searchBarComponent()}
                </View>
              </View> :
              searchBarComponent()
            }
            {(this.state.query == null) ? (
              this.renderEmptyState()
            ) : (
                this.props.type == "static" ? (
                  <StaticInfiniteScroll
                    generation={this.state.searchGeneration}
                    dbref={this.props.dbref}
                    queryTypes={this.props.queryTypes}
                    startingPoint={this.state.query}
                    endingPoint={`${this.state.query}\uf8ff`}
                    {...otherProps}
                  />
                ) : (this.props.type == "section" ? (
                  <SectionInfiniteScroll
                    generation={this.state.searchGeneration}
                    dbref={this.props.dbref}
                    startingPoint={new Array(this.props.dbref.length).fill(this.state.query)}
                    endingPoint={new Array(this.props.dbref.length).fill(`${this.state.query}\uf8ff`)}
                    onSectionData={onSectionData}
                    additionalData={this.props.additionalData}
                    {...otherProps}
                  />) : (
                    <DynamicInfiniteScroll
                      generation={this.state.searchGeneration}
                      dbref={this.props.dbref.orderByChild(this.state.currentSorter)}
                      startingPoint={this.state.query}
                      endingPoint={`${this.state.query}\uf8ff`}
                      {...otherProps}
                    />
                  ))
              )}

          </View>
        )}
      </ThemeConsumer>
    )
  }

  search = () => {
    const cleanedQuery = this.state.searchBarValue.trim()
    analyticsLogSearch(cleanedQuery)
    if (this.props.queryValidator(this.state.searchBarValue)) {
      this.setState({
        query: cleanedQuery.toLowerCase(),
        searchGeneration: this.state.searchGeneration + 1
      })
    } else {
      this.setState({
        query: null,
      })
    }
  }

  queryOptionRenerer = (item, mainColor) => {
    return (
      <Chip
        onPress={() => this.updateSearchOption(item)}
        mainColor={mainColor}
        selected={item.value === this.state.currentSorter}>
        <Text>{item.name}</Text>
      </Chip>
    )
  }

  updateSearchOption = (option) => {
    this.setState({
      searchBarValue: "",
      query: this.getInitialQueryValue(),
      currentSorter: option.value,
      searchGeneration: this.state.searchGeneration + 1
    })
  }

  //This way when we're starting with an empty query, we can
  //decide whether or not to actually query firebase using the provided queryValidator
  getInitialQueryValue = () => {
    return this.props.queryValidator("") ? "" : null
  }

  renderEmptyState = () => {
    if (this.props.parentEmptyStateComponent) {
      return this.props.parentEmptyStateComponent
    } 
    return (
      <EmptyState
        image={<FontAwesomeIcon name="search" size={50} color={theme.colors.grey1} />}
        title="Search for something"
        message="We'll do our best to find it!"
      /> 
    )
  }

}
