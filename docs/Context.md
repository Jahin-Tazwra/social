# Location-Based Social Network for Bangladeshi Neighborhoods

## Overview
A comprehensive social networking platform designed specifically for Bangladeshi neighborhoods, enabling local community interaction, emergency alerts, and neighborhood-based social connections.

## Core Features

### 1. User Onboarding and Registration

#### Language Selection
- English/Bangla language options
- Seamless language switching throughout the app

#### Registration Process
- Multiple sign-up methods:
  - Email
  - Phone number
  - Social media (Google and Facebook)
- OTP-based verification
- Basic profile setup (Name, Profile Picture)

### 2. Location Setup

#### Location Configuration Options
- **Automatic Detection**
  - GPS-based location detection
  - Permission-based access
- **Manual Entry**
  - Detailed address input:
    - City
    - Area
    - Road/Street
    - Landmark
  - Interactive map confirmation

### 3. Neighborhood Radius Selection

#### Radius Options
- Predefined ranges:
  - 100 meters
  - 500 meters
  - 1 km
  - 5 km
  - 10 km
- Custom radius setting
- Visual map preview of neighborhood boundaries

### 4. Main Feed (Community Interaction)

#### Post Creation
- Multiple content types:
  - Text posts
  - Photo uploads
  - Video sharing
  - Location tagging

#### Feed Features
- Smart algorithm-driven content display
- Filtering options:
  - Recent posts
  - Popular content
  - Emergency alerts
- Interactive features:
  - Like/React
  - Comments
  - Share functionality
  - Direct messaging

#### Friend Suggestions
- Proximity-based recommendations
- Interest matching
- Mutual connection analysis

### 5. SOS & Emergency Alerts

#### Emergency Types
- Theft
- Fire Hazard
- Sexual Harassment
- Custom emergencies

#### Alert System
- Prominent SOS button
- Multi-media support for alerts
- Instant push notifications
- Priority feed placement
- Temporary pinning of emergency posts

### 6. User Profile Management

#### Profile Features
- Personal information management
- Privacy settings
- Activity history
- Friend list management
- Blocking functionality

### 7. Notification System

#### Notification Types
- Feed activity
- Direct messages
- Emergency alerts
- Custom notification preferences

### 8. Moderation and Community Safety

#### Content Moderation
- AI-powered content detection
- Community reporting system
- Manual moderation support

#### Security Features
- User reporting system
- Block functionality
- Community-based safety measures

### 9. Settings and Customization

#### User Preferences
- Language settings
- Notification management
- Radius configuration
- Privacy controls

## Technical Architecture

### Frontend
- Cross-platform development
- React Native with TypeScript, Expo, and Expo Router
- Responsive UI/UX design
- UI Framework: React Native Paper
- Interactive map integration

### Backend
- Server options:
- Express.js
- RESTful API architecture
- Secure authentication system

### Database
- Primary: PostgreSQL (Supabase)
- Real-time: Supabase

### External Integrations
- Google Maps API
- Google Cloud Video Intelligence API (Video moderation)
- Google Cloud Vision API (Image moderation)
- Social media authentication
- Push notification services

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    profile_picture_url TEXT,
    bio TEXT,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE
);
```

### User Locations Table
```sql
CREATE TABLE user_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    area VARCHAR(100),
    road VARCHAR(100),
    landmark TEXT,
    neighborhood_radius INTEGER DEFAULT 1000, -- in meters
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Posts Table
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    media_urls TEXT[],
    location_id UUID REFERENCES user_locations(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_emergency BOOLEAN DEFAULT FALSE,
    emergency_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);
```

### Comments Table
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);
```

### Reactions Table
```sql
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);
```

### Friendships Table
```sql
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    reference_id UUID, -- Can be post_id, comment_id, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Reports Table
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Project Structure

```
social-app/
├── app/                      # Expo Router app directory
│   ├── (auth)/              # Authentication routes
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/              # Main app tabs
│   │   ├── feed/            # Feed related screens
│   │   ├── profile/         # Profile related screens
│   │   ├── messages/        # Messaging related screens
│   │   └── settings/        # Settings related screens
│   ├── emergency/           # Emergency related screens
│   └── _layout.tsx          # Root layout
├── src/
│   ├── components/          # Reusable components
│   │   ├── common/          # Common UI components
│   │   ├── feed/           # Feed specific components
│   │   ├── profile/        # Profile specific components
│   │   └── emergency/      # Emergency specific components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API and external services
│   │   ├── api/           # API client and endpoints
│   │   ├── supabase/      # Supabase client and queries
│   │   └── maps/          # Maps related services
│   ├── store/             # State management
│   │   ├── auth/         # Authentication state
│   │   ├── feed/         # Feed state
│   │   └── emergency/    # Emergency state
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── constants/        # App constants
├── assets/               # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
├── docs/                # Documentation
├── tests/              # Test files
├── .env.example        # Environment variables example
├── app.json           # Expo config
├── babel.config.js    # Babel config
├── tsconfig.json      # TypeScript config
└── package.json       # Dependencies and scripts
```

## Security Considerations
- End-to-end encryption for messages
- Secure data storage
- Regular security audits
- GDPR compliance
- Data privacy protection
