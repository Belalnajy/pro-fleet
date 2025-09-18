# Translation Files Structure

This directory contains organized translation files for the Pro Fleet application, supporting multiple languages with a modular approach.

## Directory Structure

```
src/locales/
├── en/                 # English translations
│   ├── common.json     # Shared translations (buttons, status, etc.)
│   ├── navbar.json     # Navigation bar items
│   ├── auth.json       # Authentication related
│   ├── dashboard.json  # Dashboard and admin panel
│   ├── users.json      # User management
│   ├── vehicles.json   # Vehicle management
│   ├── trips.json      # Trip management
│   ├── home.json       # Homepage content
│   └── about.json      # About page content
├── ar/                 # Arabic translations
│   ├── common.json
│   ├── navbar.json
│   ├── auth.json
│   ├── dashboard.json
│   ├── users.json
│   ├── vehicles.json
│   ├── trips.json
│   ├── home.json
│   └── about.json
└── ur/                 # Urdu translations
    ├── common.json
    ├── navbar.json
    ├── auth.json
    ├── dashboard.json
    ├── users.json
    ├── vehicles.json
    ├── trips.json
    ├── home.json
    └── about.json
```

## File Organization

### common.json
Contains frequently used translations across the application:
- Action buttons (save, cancel, delete, edit, etc.)
- Status messages (success, error, warning)
- Form validation messages
- General UI elements

### navbar.json
Navigation-related translations:
- Menu items
- Settings and profile options
- Language selection

### auth.json
Authentication and user account management:
- Sign in/up forms
- Password reset
- Validation messages
- Account creation

### dashboard.json
Admin dashboard and management interface:
- Statistics and metrics
- Management actions
- Recent activities
- Quick stats

### users.json
User management specific translations:
- User roles (admin, driver, customer)
- User actions and forms
- Search and filtering

### vehicles.json
Vehicle and fleet management:
- Vehicle types and properties
- Fleet operations
- Vehicle status and maintenance

### trips.json
Trip and logistics management:
- Trip statuses and details
- Route information
- Customer and driver interactions
- Tracking and delivery

### home.json
Homepage and marketing content:
- Brand messaging
- Feature descriptions
- Call-to-action buttons

### about.json
Company information and values:
- Mission and vision
- Company values
- Team information

## Usage

The translations are automatically imported and combined in `src/lib/translations.ts`. The system supports:

- **Automatic fallback**: Missing translations fall back to English
- **Type safety**: Full TypeScript support with auto-completion
- **RTL support**: Proper right-to-left layout for Arabic and Urdu
- **Modular loading**: Only load the translations you need

## Adding New Translations

1. Add the new key to the appropriate JSON file in the `en/` directory
2. Add the corresponding translations in `ar/` and `ur/` directories
3. The translation will be automatically available through the `useTranslation` hook

## Key Naming Convention

- Use camelCase for consistency
- Use descriptive names that indicate the context
- Group related keys with common prefixes when appropriate

Examples:
- `userCreatedSuccess` instead of `user_created_success`
- `confirmDeleteUser` instead of `delete_confirm`
- `searchPlaceholder` instead of `search_ph`

## Supported Languages

- **English (en)**: Default language, LTR
- **Arabic (ar)**: RTL support with proper text alignment
- **Urdu (ur)**: RTL support with proper text alignment

## Migration from Old System

The previous monolithic translation file has been split into these modular files for better:
- **Maintainability**: Easier to find and update specific translations
- **Collaboration**: Multiple developers can work on different sections
- **Performance**: Potential for lazy loading in the future
- **Organization**: Logical grouping by feature/page
