# Unified Assistant Prototype

A prototype application that creates a seamless experience for managers who need to interact with both employee assistance and talent acquisition systems. This unified chat interface intelligently routes queries to the appropriate underlying assistant based on the context of the conversation.

## Project Overview

### Purpose

Managers in our organization currently need to switch between two separate assistant systems:
- **Employee Assistant (Olivia)**: Handles general employee-related inquiries and tasks
- **Talent Acquisition Assistant**: Specializes in recruitment and hiring processes

This prototype aims to:
- Reduce context switching for managers
- Maintain the specialized capabilities of each assistant system
- Create a seamless, intuitive user experience with a single chat interface

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Anthropic API key (for future implementation)

### Installation

1. Clone the repository
```
git clone [repository-url]
cd unified-assistant-prototype
```

2. Install dependencies
```
npm install
```

3. Configure environment variables
```
cp .env.example .env
```
Edit the `.env` file and add your Anthropic API key (for future implementation).

4. Start the development server
```
npm run dev
```

## Project Structure

```
/
   public/           # Static assets
   src/              # Application source code
      components/   # React UI components
      contexts/     # React context providers
      data/         # Data management and storage
      services/     # Service layers (API integrations)
      utils/        # Utility functions and helpers
   .env              # Environment variables (git-ignored)
   package.json      # Project dependencies and scripts
   README.md         # Project documentation
```

### Directory Purposes

- **components/**: Contains all React UI components for the chat interface
- **contexts/**: React context providers for state management across components
- **data/**: Manages data storage, retrieval, and manipulation
- **services/**: Houses service layer code, including Anthropic API integration
- **utils/**: Helper functions, formatters, validators, and other utilities

## Future Documentation

### API Integration
*To be implemented in a future phase*

### Assistant Switching Logic
*To be implemented in a future phase*

### Context Preservation
*To be implemented in a future phase*

### Deployment
*To be documented in a future phase*

## Contributing

*Guidelines to be added*

## License

*License information to be added*