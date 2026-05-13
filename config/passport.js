const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth2").Strategy
const User = require("../models/User")

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id })
        if (!user) {
            user = await User.create({
                userName: profile.displayName,
                googleId: profile.id
            })
        }
        return done(null, user)
    } catch (err) {
        return done(err, null)
    }
}))

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

module.exports = passport