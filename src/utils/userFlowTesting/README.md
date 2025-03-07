# User Flow Testing Framework

This framework provides comprehensive testing for the Unified Assistant Prototype, enabling validation of end-to-end conversation flows, assistant transitions, and data accuracy.

## Overview

The User Flow Testing Framework allows for:

1. **Automated conversation testing** - Simulates multi-turn conversations with the assistant
2. **Assistant transition validation** - Verifies correct switching between employee and talent contexts
3. **Data accuracy checking** - Ensures responses contain accurate and expected data
4. **Context preservation testing** - Validates that context is maintained across assistant transitions
5. **Performance metrics** - Measures key performance indicators like response accuracy and timing

## Components

The framework consists of several core components:

### 1. Core Framework (`userFlowTestingFramework.ts`)

The central testing engine that:
- Executes test flows
- Validates responses against expectations
- Calculates performance metrics
- Generates comprehensive reports

### 2. Test Definitions

- **Types** (`types.ts`) - Interfaces and types for test flows and results
- **Scenarios** - Pre-defined test flows for different aspects of the system:
  - Employee flows (`employeeFlows.ts`)
  - Talent flows (`talentFlows.ts`)
  - Transition flows (`transitionFlows.ts`)
  - End-to-end flows (`endToEndFlows.ts`)

### 3. CLI Tool (`testUserFlows.ts`)

Command-line interface for running tests with options for:
- Running specific flows by ID
- Running flows by category or tag
- Viewing test reports
- Configuring test execution parameters

## Test Flow Structure

Each test flow represents a conversation sequence that tests specific functionality:

```typescript
const exampleFlow: TestFlow = {
  id: 'example-flow',
  name: 'Example Flow',
  description: 'Description of what this flow tests',
  category: 'employee',
  tags: ['example', 'happy-path'],
  steps: [
    {
      message: "User message goes here",
      expectedAssistantType: 'employee',
      expectedIntent: 'schedule_management',
      expectedEntities: ['employee', 'date'],
      expectedFunctionCalls: ['getEmployeeSchedule'],
      dataValidation: [
        {
          type: 'contains',
          target: 'text',
          value: 'specific text to check for',
          description: 'Validation description'
        }
      ],
      notes: 'Notes about this test step'
    },
    // Additional steps...
  ]
};
```

## Validation Capabilities

The framework provides several validation mechanisms:

1. **Assistant Type** - Verifies correct assistant selection
2. **Intent Classification** - Checks if intents are correctly identified
3. **Entity Detection** - Confirms entities are properly extracted
4. **Function Calls** - Validates appropriate function calls are made
5. **Response Content** - Checks response content against patterns or expectations
6. **Structured Data** - Validates structured data returned in responses

## Metrics

The framework calculates detailed metrics for analysis:

- **Overall Success Rate** - Percentage of passed steps
- **Assistant Type Accuracy** - Percentage of correctly selected assistants
- **Intent Classification Accuracy** - Percentage of correctly identified intents
- **Entity Detection Accuracy** - Percentage of correctly detected entities
- **Function Call Accuracy** - Percentage of correctly made function calls
- **Response Time** - Average and distribution of response times
- **Transition Success Rate** - Percentage of successful assistant transitions
- **Context Preservation Rate** - Percentage of context correctly preserved across steps

## Usage

### Running Tests

Tests can be run using the CLI tool:

```bash
# Run all tests
ts-node src/scripts/testUserFlows.ts all

# Run specific test flows by ID
ts-node src/scripts/testUserFlows.ts run employee-schedule-flow employee-task-flow

# Run tests by category
ts-node src/scripts/testUserFlows.ts category employee

# Run tests by tag
ts-node src/scripts/testUserFlows.ts tag happy-path
```

### Options

- `--verbose` - Show detailed output for each step
- `--save` - Save test results to disk
- `--stop-on-failure` - Stop execution on first failure
- `--timeout [ms]` - Set timeout for each step (default 30000ms)

### Creating New Test Flows

To create a new test flow:

1. Define a new `TestFlow` object with unique ID, name, and steps
2. Add test steps with expected responses and validations
3. Register the flow with the framework
4. Run the test using the CLI tool

## Test Categories

Tests are organized into several categories:

1. **Employee Flows** - Tests for employee management functionality
2. **Talent Flows** - Tests for talent acquisition functionality
3. **Transition Flows** - Tests for transitions between assistant types
4. **End-to-End Flows** - Complex flows that simulate real user journeys

## Best Practices

When creating test flows:

1. **Start simple** - Begin with basic, single-turn conversations
2. **Build complexity** - Progress to multi-turn conversations with transitions
3. **Cover edge cases** - Include ambiguous queries and error scenarios
4. **Test context preservation** - Verify context is maintained across transitions
5. **Include complete journeys** - Create flows that simulate end-to-end user journeys

## Example Use Cases

The framework is designed to test various aspects of the Unified Assistant:

1. **Basic Information Retrieval** - Employee info, schedules, tasks, candidates, jobs
2. **Action Execution** - Task creation, schedule updates, recognition creation
3. **Assistant Transitions** - Transitions between employee and talent contexts
4. **Context Preservation** - Memory of entities during context switches
5. **Ambiguous Query Handling** - Handling of queries with unclear intent
6. **End-to-End Workflows** - Complete user journeys spanning multiple domains

## Report Analysis

Test reports provide comprehensive metrics and detailed results for each flow:

- Summary statistics for overall performance
- Metrics for specific aspects like intent classification and transitions
- Detailed results for each test flow
- Breakdown of performance by category

Reports can be viewed using the CLI:

```bash
ts-node src/scripts/testUserFlows.ts report
```

## Future Enhancements

Potential enhancements to the framework:

1. Integration with CI/CD pipelines
2. Visual reporting dashboards
3. Automated regression testing
4. A/B testing of different prompt variations
5. Performance benchmarking against previous versions