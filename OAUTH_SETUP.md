# OAuth Setup Guide for PyPilot

This guide explains how to configure social login (Google, GitHub, Twitter/X, and Facebook) for PyPilot.

## Overview

PyPilot supports OAuth authentication through four providers:
- **Google** - Most reliable, requires a Google Cloud project
- **GitHub** - Developer-friendly, great for programmer audience
- **Twitter/X** - Social engagement, useful for announcements
- **Facebook** - Reach broad audience

You can configure all, some, or none of these providers. Users can sign up/login with any configured provider.

---

## Google OAuth Setup

### Prerequisites
- Google Account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

### Steps

1. **Create a new project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click on the project dropdown at the top
   - Click "NEW PROJECT"
   - Enter project name (e.g., "PyPilot")
   - Click "CREATE"

2. **Enable Google+ API**
   - Click the search bar and search for "Google+ API"
   - Click on "Google+ API" from results
   - Click "ENABLE"

3. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials" in the left sidebar
   - Click "Create Credentials" > "OAuth Client ID"
   - Select "Web application"
   - Name it "PyPilot Web App"
   - Add Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (for local development)
     - `https://yourapp.com/auth/callback` (production URL)
   - Click "CREATE"

4. **Get your credentials**
   - Copy the **Client ID** and **Client Secret**
   - Update your `.env` file:
     ```
     GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your-client-secret
     ```

---

## GitHub OAuth Setup

### Prerequisites
- GitHub Account
- GitHub Developer Settings Access

### Steps

1. **Go to OAuth Applications**
   - Visit [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "OAuth Apps" > "New OAuth App"

2. **Register Application**
   - **Application name**: PyPilot
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:3000/auth/callback`
   - Click "Register application"

3. **Get your credentials**
   - Copy **Client ID**
   - Click "Generate a new client secret" (save it immediately, won't be shown again)
   - Update your `.env` file:
     ```
     GITHUB_CLIENT_ID=your-client-id
     GITHUB_CLIENT_SECRET=your-client-secret
     ```

---

## Twitter/X OAuth Setup

### Prerequisites
- Twitter/X Account
- Access to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)

### Steps

1. **Create an App**
   - Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
   - Click "Create App" (may require applying for development access first)
   - Enter app name: "PyPilot"
   - Click "Create"

2. **Configure App Settings**
   - Click on your app
   - Go to "Settings" tab
   - Find "User authentication settings"
   - Toggle on "OAuth 2.0 activated"
   - Set **Callback URL**:
     - `http://localhost:3000/auth/callback` (development)
     - Add production URL when ready
   - The system will auto-generate Client ID and Client Secret

3. **Get your credentials**
   - In "Keys and tokens" tab, copy:
     - **Client ID** (OAuth 2.0 Client ID)
     - **Client Secret** (save securely)
   - Update your `.env` file:
     ```
     TWITTER_CLIENT_ID=your-client-id
     TWITTER_CLIENT_SECRET=your-client-secret
     ```

---

## Facebook OAuth Setup

### Prerequisites
- Facebook Account
- Access to [Facebook Developers](https://developers.facebook.com/)

### Steps

1. **Create a Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Click "My Apps" > "Create App"
   - Choose app type: "Consumer"
   - Fill in app details:
     - **App name**: PyPilot
     - **App contact email**: your-email@example.com
     - **App purpose**: Choose relevant category
   - Click "Create app"

2. **Add Facebook Login Product**
   - On app dashboard, click "Add Product"
   - Find "Facebook Login" and click "Set Up"
   - Choose "Web" as platform
   - Follow the setup wizard

3. **Configure Redirect URLs**
   - Go to "Products" > "Facebook Login" > "Settings"
   - In **Valid OAuth Redirect URIs**, add:
     - `http://localhost:3000/auth/callback` (development)
     - Your production URL when ready
   - Click "Save Changes"

4. **Get your credentials**
   - Go to "Settings" > "Basic"
   - Copy **App ID** (Client ID)
   - Copy **App Secret** (Client Secret)
   - Update your `.env` file:
     ```
     FACEBOOK_CLIENT_ID=your-app-id
     FACEBOOK_CLIENT_SECRET=your-app-secret
     ```

---

## Environment Variables

Update your `.env` file with the credentials from each provider you configured:

```env
# Frontend URL (required for all OAuth)
FRONTEND_URL=http://localhost:3000  # Change to production URL

# Google
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx

# GitHub
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx

# Twitter/X
TWITTER_CLIENT_ID=xxxxx
TWITTER_CLIENT_SECRET=xxxxx

# Facebook
FACEBOOK_CLIENT_ID=xxxxx
FACEBOOK_CLIENT_SECRET=xxxxx
```

---

## Testing OAuth Locally

1. **Start the application**
   ```bash
   docker-compose up -d --build
   ```

2. **Visit signup or login page**
   - Go to `http://localhost:3000/signup` or `http://localhost:3000/login`
   - Click on the OAuth button for a configured provider

3. **You should be redirected to the provider's login**
   - Log in using your provider account
   - Grant permission when asked
   - You'll be redirected back and automatically logged into PyPilot

---

## Production Deployment

### Important: Update Redirect URIs

Before deploying to production, update the redirect URIs for each OAuth provider to match your production domain:

- **Original**: `http://localhost:3000/auth/callback`
- **Production**: `https://your-app-domain.com/auth/callback`

### Update Environment Variables

In your production environment, update:
```env
FRONTEND_URL=https://your-app-domain.com
```

---

## Features

### Account Linking
If a user signs up with email+password and later uses OAuth with the same email:
- The OAuth account is automatically linked to their existing account
- They can use either method to login

### Account Creation
When a user logs in via OAuth:
- Their account is created automatically with:
  - Email from the provider
  - Name from the provider profile
  - Avatar image from the provider
  - No password required (OAuth-only account)

### Troubleshooting

- **"Failed to exchange code for token"**: Check that Client ID and Secret are correct
- **"No access token received"**: Verify redirect URI matches exactly
- **Only one OAuth button appears**: Only configured providers with valid credentials show buttons
- **Email not provided by provider**: Some providers (like Twitter) may not provide email - an auto-generated email is used

---

## Security Considerations

1. **Never commit `.env` file** with real credentials to version control
2. **Use different credentials** for each environment (dev, staging, production)
3. **Rotate secrets regularly** in production
4. **Use HTTPS only** in production (required by all OAuth providers)
5. **Validate state tokens** to prevent CSRF attacks (currently stored in request, use Redis for production)

---

## Disabling Providers

To disable a social login provider, simply leave its environment variables empty:
```env
GOOGLE_CLIENT_ID=  # Empty = disabled
```

---

## Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps)
- [Twitter OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
