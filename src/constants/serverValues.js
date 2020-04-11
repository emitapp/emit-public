//This file contains all the values that this cient app uses that mirror
//values used on the server in either Cloud Functions or Security Rules

export const returnStatuses = {
    OK: "successful",
    NOTO: "non existent receiver"
}

export const responderStatuses = {
    CONFIRMED: "Confirmed",
    IGNORED: "Ignored",
    PENDING: "Pending"
}

export const groupRanks = {
    STANDARD: "standard",
    ADMIN: "admin"
}

export const validUsername = (username) => {
    const regexTest = RegExp(/^[a-z0-9_-]+$/)
    const normalizedUsername = username.normalize("NFKC").toLowerCase()
    return regexTest.test(normalizedUsername)
}