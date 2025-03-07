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

- Node.js (v18 or higher)
- npm or yarn
- Anthropic API key for Claude 3.7

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
Edit the `.env` file and add your Anthropic API key.

4. Start the development server
```
npm run dev
```

## Project Structure

```
/
   public/           # Static assets
   src/              # Application source code
      components/    # React UI components
      contexts/      # React context providers
      data/          # Data management and storage
      examples/      # Example usage for key features
      pages/         # Next.js pages
      prompts/       # System prompts for Claude
      scripts/       # Utility scripts
      services/      # Service layers (API integrations)
      utils/         # Utility functions and helpers
   .env              # Environment variables (git-ignored)
   package.json      # Project dependencies and scripts
   README.md         # Project documentation
   DEVELOPMENT_SUMMARY.md # Comprehensive development summary
```

## Core Features

### System Prompt Engineering
Advanced prompt engineering techniques to create a unified assistant that can intelligently route queries between the Employee Assistant (Olivia) and the Talent Acquisition Assistant.

### Context Window Management
Sophisticated context window management to optimize Claude's context window usage while preserving important conversation history and data.

### Data Injection Framework
Framework for analyzing user queries, extracting entities and intents, and injecting relevant data into prompts to provide context-aware responses.

### Enhanced Responses
Function calling capabilities that enable structured data retrieval and display in a card-based UI format.

### Error Handling
Comprehensive error handling system with fallback responses, recovery mechanisms, and user-friendly error messages.

### Prompt Tuning
Automated framework for testing and optimizing system prompts with metrics for measuring performance across variations.

### Performance Optimization
Advanced performance features including:

- **Sophisticated caching system** with category-based caching, LRU eviction, and detailed metrics
- **Batched data fetching** to reduce redundant API calls and database queries
- **Prompt size optimization** to reduce token usage while preserving functionality

### User Flow Testing
Comprehensive testing framework for validating assistant behavior:

- **End-to-end conversation testing** with multi-turn scenarios
- **Assistant transition validation** to ensure proper switching between contexts
- **Data accuracy verification** to confirm responses contain correct information
- **Context preservation testing** to validate entity memory across transitions
- **Performance metrics collection** for measuring key indicators

## Documentation

### Performance Optimization
See [Performance Optimization Documentation](src/services/README_PERFORMANCE.md) for details on the caching, batched data fetching, and prompt optimization implementations.

### Prompt Tuning
See [Prompt Tuning Documentation](src/services/promptTuning/README.md) for details on the prompt testing and optimization framework.

### User Flow Testing
See [User Flow Testing Documentation](src/utils/userFlowTesting/README.md) for details on the conversation testing framework and test scenarios.

### Development Summary
The [DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md) file contains a comprehensive overview of the project's implementation details, including data structures, system architecture, and technical decisions.

## Running the Prototype

### Starting the Application
```
npm run dev
```

### Prompt Tuning
```
npm run tune-prompts
npm run tune-prompts:all      # Run all prompt tests
npm run tune-prompts:list     # List prompt variations
npm run tune-prompts:optimize # Generate optimized prompts
```

### User Flow Testing
```
npm run test-flows
npm run test-flows:all        # Run all conversation flow tests
npm run test-flows:employee   # Test employee assistant flows
npm run test-flows:talent     # Test talent acquisition flows
npm run test-flows:transition # Test assistant transitions
npm run test-flows:end-to-end # Test complete user journeys
npm run test-flows:list       # List available test flows
npm run test-flows:report     # View latest test report
```

### Viewing Performance Metrics
```
npm run metrics
```

## Contributing

When contributing to this project, please follow these guidelines:

1. Create a feature branch for your changes
2. Follow the established code style
3. Write tests for new functionality
4. Update documentation as needed
5. Submit a pull request with a clear description of changes

## License

[License information to be added]