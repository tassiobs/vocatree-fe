# Vocatree Frontend

A modern React frontend for Vocatree - An English vocabulary app for busy advanced English learners.

## Features

- **Authentication**: Secure sign-in with email and password
- **Tree Structure**: Hierarchical organization of vocabulary with folders and cards
- **Drag & Drop**: Move items between folders with intuitive drag and drop
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant feedback for all CRUD operations
- **Modern UI**: Clean, accessible interface built with Tailwind CSS

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Beautiful DnD** for drag and drop functionality
- **Axios** for API communication
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Vocatree backend API running (see API documentation)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your API URL:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```

5. Start the development server:
   ```bash
   npm start
   ```

The app will open at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── components/          # React components
│   ├── AddItemInput.tsx # Input component for adding items
│   ├── Layout.tsx       # Main layout wrapper
│   ├── LoginForm.tsx    # Authentication form
│   ├── TreeNode.tsx     # Individual tree node component
│   └── VocabTree.tsx    # Main tree view component
├── hooks/               # Custom React hooks
│   └── useAuth.ts       # Authentication context and logic
├── services/            # API and external services
│   └── api.ts          # API client for backend communication
├── types/               # TypeScript type definitions
│   ├── api.ts          # API response types
│   └── index.ts        # Application types
├── utils/               # Utility functions
│   └── treeUtils.ts    # Tree manipulation utilities
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
└── index.css           # Global styles
```

## Usage

### Authentication

1. Open the app in your browser
2. Enter your email and password to sign in
3. The app will remember your session until you sign out

### Managing Vocabulary

#### Adding Items
- Click "Add Folder" or "Add Card" to create new items
- Type the name and press Enter to save
- Items are automatically organized in the tree structure

#### Organizing Items
- Drag and drop items to move them between folders
- Click the expand/collapse arrow to view folder contents
- Use the context menu (hover over items) to rename or delete

#### Tree Structure
- **Folders**: Can contain other folders or cards (maximum 2 levels deep)
- **Cards**: The smallest unit, contains vocabulary information
- **Hierarchy**: Folders → Subfolders → Cards

### Mobile Usage

The app is fully responsive and works great on mobile devices:
- Touch-friendly drag and drop
- Optimized layout for small screens
- Accessible navigation

## API Integration

The frontend communicates with the Vocatree backend API. Make sure the backend is running and accessible at the URL specified in your `.env` file.

### Required API Endpoints

- `POST /auth/signin` - User authentication
- `GET /cards/hierarchy` - Get vocabulary tree structure
- `POST /cards/` - Create new cards/folders
- `PATCH /cards/{id}` - Update existing items
- `DELETE /cards/{id}` - Delete items
- `PATCH /cards/{id}/move` - Move items between folders

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting (recommended)
- Tailwind CSS for styling

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `build` folder to your hosting service

3. Update the API URL in your production environment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

