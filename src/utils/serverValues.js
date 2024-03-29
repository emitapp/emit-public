//This file contains all the values and functions that this client app uses that mirror
//values used on the server in either Cloud Functions or Security Rules

export const cloudFunctionStatuses = {
    OK: "successful",
    INVALID: "invalid state",
    LEASE_TAKEN: "lease taken"
}

export const responderStatuses = {
    CANCELLED: "cancelled",
    CONFIRMED: "confirmed",
}

export const groupRanks = {
    STANDARD: "standard",
    ADMIN: "admin"
}

import { isOnlyWhitespace } from 'utils/helpers'
export const validUsername = (username, considerLength = true) => {
    const regexTest = RegExp(/^[a-z0-9_-]+$/) //This also takes care of strings that are just whitespace
    const normalizedUsername = username.normalize("NFKC").toLowerCase()
    if (considerLength) {
        if (normalizedUsername.length > MAX_USERNAME_LENGTH) return false
    }
    return regexTest.test(normalizedUsername)
}

export const validDisplayName = (displayName, considerLength = true) => {
    if (!considerLength) return !isOnlyWhitespace(displayName)
    return !isOnlyWhitespace(displayName) && displayName.length <= MAX_DISPLAY_NAME_LENGTH
}

export const isValidDBPath = (path) => {
    if (path === "") return false
    const forbiddenChars = [".", "#", "$", "[", "]"]
    let valid = true
    forbiddenChars.forEach(char => {
        if (path.includes(char)) valid = false
    });
    return valid
}

export const MAX_BROADCAST_WINDOW = 2879 //48 hours - 1 minute

export const MAX_USERNAME_LENGTH = 30
export const MAX_DISPLAY_NAME_LENGTH = 35
export const MAX_LOCATION_NAME_LENGTH = 200
export const MAX_BROADCAST_NOTE_LENGTH = 500
export const MAX_GROUP_NAME_LENGTH = 40

export const NotificationTypes = {
    NEW_FLARE: "newBroadcast",
    FLARE_RESPONSE: "broadcastResponse",
    NEW_FRIEND: "newFriend",
    FRIEND_REQUEST: "friendRequest",
    MANDATORY: "mandatory",
    NEW_GROUP: "newGroup",
    UNKOWN: "unset",
    CHAT: "chatMessage"
}


export const recommentationDocName = (user1Uid, user2Uid) => {
    const first = user1Uid > user2Uid ? user1Uid : user2Uid
    const second = first == user1Uid ? user2Uid : user1Uid
    return first + "&&" + second
}

export const DEFAULT_DOMAIN_HASH = "_open_"
export const SHORT_PUBLIC_FLARE_COL_GROUP = "public_flares_short"
export const PUBLIC_FLARE_COL_GROUP = "public_flares"


