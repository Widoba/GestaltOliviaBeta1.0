# Prompt Tuning Framework

## Overview

The Prompt Tuning Framework is a comprehensive toolkit for evaluating, comparing, and optimizing system prompts for the Unified Assistant Prototype. It allows for systematic testing of prompt variations to improve intent classification, assistant transitions, and context preservation.

## Key Components

1. **Testing Framework** (`promptTestingFramework.ts`):
   - Defines interfaces for test cases, metrics, and results
   - Provides methods for running tests and comparing variations
   - Calculates performance metrics for variations

2. **Test Cases** (`testCases.ts`):
   - Contains standardized test cases for evaluation
   - Organized by category (basic, edge, ambiguous, context-dependent)
   - Each test case has expected outcomes for assistant type and intent

3. **Prompt Variation Manager** (`promptVariationManager.ts`):
   - Maintains different prompt variations
   - Creates initial variations focused on specific improvements
   - Provides access to prompt content

4. **Prompt Tuning Service** (`promptTuningService.ts`):
   - Runs tests for prompt variations
   - Compares performance across variations
   - Creates optimized prompts by combining best aspects

5. **CLI Tool** (`tunePrompts.ts`):
   - Command-line interface for prompt tuning
   - Provides commands for testing, comparing, and optimizing
   - Outputs results in user-friendly formats

## How It Works

The framework uses a simple workflow:

1. **Define Variations**: Create different variations of the system prompt, each focusing on specific improvements.
2. **Run Tests**: Execute standardized test cases against each variation.
3. **Analyze Results**: Compare performance metrics across variations.
4. **Optimize**: Combine the best aspects of different variations into an optimized prompt.
5. **Validate**: Test the optimized prompt to ensure it performs better than the baseline.

## Metrics

The framework measures several performance metrics:

- **Intent Accuracy**: How accurately the variation classifies user intents.
- **Assistant Type Accuracy**: How accurately it determines the appropriate assistant.
- **Response Quality**: A combined score based on intent and assistant type accuracy.
- **Transition Smoothness**: How well it handles transitions between assistants.
- **Context Preservation**: How well it preserves context during transitions.
- **Overall Score**: A weighted combination of all metrics.

## Usage

### Command-Line Interface

The CLI provides several commands for working with the framework:

```bash
# List all available prompt variations
npm run tune-prompts:list

# Run tests for all variations and optimize
npm run tune-prompts:all

# Create an optimized prompt
npm run tune-prompts:optimize

# Test a specific variation
npm run tune-prompts -- test --variation [variation-id]

# Compare all variations to baseline
npm run tune-prompts -- compare

# Run tests for a specific category
npm run tune-prompts -- test --variation [variation-id] --category basic

# Save results to files
npm run tune-prompts -- all --save --output-dir ./results
```

### Custom Variations

To create a custom prompt variation:

1. Use the `promptVariationManager.createVariation()` method:

```typescript
import promptVariationManager from '../services/promptTuning/promptVariationManager';

const customVariation = promptVariationManager.createVariation(
  'My Custom Variation',
  'Description of improvements',
  customBasePrompt,
  customEmployeePrompt,
  customTalentPrompt,
  ['Change 1', 'Change 2']
);
```

2. Test the custom variation:

```typescript
import promptTuningService from '../services/promptTuning/promptTuningService';

const results = await promptTuningService.runTests(customVariation.id);
console.log(results.metrics);
```

## Test Case Categories

The framework includes test cases in several categories:

1. **Basic**: Simple, straightforward queries with clear intents.
2. **Edge**: Complex queries that test the boundaries of the system.
3. **Ambiguous**: Queries that could be interpreted in multiple ways.
4. **Context-Dependent**: Queries that require previous context to interpret correctly.

## Output Files

When saving results (using the `--save` flag), the framework generates:

- JSON files with detailed test results
- Text files with formatted comparison tables
- Text files containing optimized prompt content

## Extending the Framework

To extend the framework:

1. **Add New Test Cases**: Add to the test case collections in `testCases.ts`.
2. **Create New Metrics**: Modify the `calculateMetrics()` function in `promptTestingFramework.ts`.
3. **Add New Variations**: Use the `createVariation()` method to add new prompt variations.

## Best Practices

- **Incremental Changes**: Make small, focused changes to each variation.
- **Test Thoroughly**: Run tests against all categories to ensure balanced performance.
- **Compare Carefully**: Look beyond the overall score to understand specific improvements.
- **Review Generated Content**: Always review optimized prompts for coherence and completeness.