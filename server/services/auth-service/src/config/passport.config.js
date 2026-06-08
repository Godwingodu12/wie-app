// D:\projectnew\server\services\auth-service\src\config\passport.config.js

import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as InstagramStrategy } from 'passport-instagram';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';


passport.use(
  'google-link',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const socialData = {
          platform: 'google',
          profileUrl:
            profile._json.link || `https://plus.google.com/${profile.id}`,
          profileId: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value,
          photo: profile.photos?.[0]?.value,
        };
        return done(null, socialData);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.use(
  'facebook-link',
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'displayName', 'photos', 'email', 'link'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const socialData = {
          platform: 'facebook',
          profileUrl:
            profile._json.link || `https://facebook.com/${profile.id}`,
          profileId: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value,
          photo: profile.photos?.[0]?.value,
        };
        return done(null, socialData);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.use(
  'twitter-link',
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK_URL,
      includeEmail: true,
      passReqToCallback: true,
    },
    async (req, token, tokenSecret, profile, done) => {
      try {
        const socialData = {
          platform: 'x',
          profileUrl: `https://twitter.com/${profile.username}`,
          profileId: profile.id,
          displayName: profile.displayName,
          username: profile.username,
          photo: profile.photos?.[0]?.value,
        };
        return done(null, socialData);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.use(
  'instagram-link',
  new InstagramStrategy(
    {
      clientID: process.env.INSTAGRAM_CLIENT_ID,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
      callbackURL: process.env.INSTAGRAM_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const socialData = {
          platform: 'instagram',
          profileUrl: `https://instagram.com/${profile.username}`,
          profileId: profile.id,
          displayName: profile.displayName,
          username: profile.username,
          photo: profile._json.data.profile_picture,
        };
        return done(null, socialData);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.use(
  'linkedin-link',
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: ['r_emailaddress', 'r_liteprofile'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const socialData = {
          platform: 'linkedin',
          profileUrl:
            profile._json.publicProfileUrl ||
            `https://linkedin.com/in/${profile.id}`,
          profileId: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value,
          photo: profile.photos?.[0]?.value,
        };
        return done(null, socialData);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
export default passport;
