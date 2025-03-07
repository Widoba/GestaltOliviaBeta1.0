/**
 * Prompt Variation Manager
 * 
 * Service for creating and managing prompt variations for tuning
 */
import {
  baseSystemPrompt,
  employeeAssistantPrompt,
  talentAssistantPrompt
} from '../../prompts';

// Interface for prompt variation
export interface PromptVariation {
  id: string;
  name: string;
  description: string;
  basePrompt: string;
  employeePrompt: string;
  talentPrompt: string;
  changes: string[];
  createdAt: Date;
}

/**
 * Service for managing prompt variations
 */
class PromptVariationManager {
  private variations: Map<string, PromptVariation> = new Map();
  private baselineVariation: PromptVariation;
  
  constructor() {
    // Initialize with baseline (current) prompts
    this.baselineVariation = {
      id: 'baseline',
      name: 'Current Production Prompts',
      description: 'The current production prompts used in the application',
      basePrompt: baseSystemPrompt,
      employeePrompt: employeeAssistantPrompt,
      talentPrompt: talentAssistantPrompt,
      changes: [],
      createdAt: new Date()
    };
    
    // Add baseline to variations
    this.variations.set('baseline', this.baselineVariation);
    
    // Add initial tuned variations
    this.createEnhancedIntentClassificationVariation();
    this.createImprovedTransitionHandlingVariation();
    this.createOptimizedContextPreservationVariation();
  }
  
  /**
   * Get a specific prompt variation by id
   * @param id Variation id
   * @returns The prompt variation or undefined if not found
   */
  getVariation(id: string): PromptVariation | undefined {
    return this.variations.get(id);
  }
  
  /**
   * Get all available prompt variations
   * @returns Array of all prompt variations
   */
  getAllVariations(): PromptVariation[] {
    return Array.from(this.variations.values());
  }
  
  /**
   * Get the baseline (current) variation
   * @returns The baseline prompt variation
   */
  getBaseline(): PromptVariation {
    return this.baselineVariation;
  }
  
  /**
   * Create a new prompt variation
   * @param name Variation name
   * @param description Variation description 
   * @param basePrompt Base system prompt
   * @param employeePrompt Employee assistant prompt
   * @param talentPrompt Talent acquisition prompt
   * @param changes Array of description of changes
   * @returns The created variation
   */
  createVariation(
    name: string,
    description: string,
    basePrompt: string,
    employeePrompt: string,
    talentPrompt: string,
    changes: string[]
  ): PromptVariation {
    // Generate a unique ID
    const id = `var_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the variation
    const variation: PromptVariation = {
      id,
      name,
      description,
      basePrompt,
      employeePrompt,
      talentPrompt,
      changes,
      createdAt: new Date()
    };
    
    // Add to map
    this.variations.set(id, variation);
    
    return variation;
  }
  
  /**
   * Create an enhanced intent classification variation
   * @returns The created variation
   */
  private createEnhancedIntentClassificationVariation(): PromptVariation {
    // Define changes for enhanced intent classification
    const changes = [
      'Added more examples for each intent category',
      'Expanded intent classification heuristics with confidence thresholds',
      'Added handling for overlapping intents',
      'Improved rules for ambiguous queries'
    ];
    
    // Create enhanced base prompt with improved intent classification
    const enhancedBasePrompt = baseSystemPrompt.replace(
      '### Classification Heuristics:',
      `### Classification Heuristics:

- For queries mentioning both employee and candidate/job topics, weigh entities by their significance in the query.
- Prioritize specific named entities over general terms when determining intent.
- For ambiguous queries with low confidence (<0.6) in any category, default to maintaining the current assistant rather than switching.
- Consider the centrality of terms in the query - terms mentioned in the beginning or as the subject carry more weight.
- When confidence scores for competing intents are within 0.2 of each other, consider it a mixed intent and maintain current context.`
    );
    
    // Create variation
    return this.createVariation(
      'Enhanced Intent Classification',
      'Improved intent classification rules and handling of ambiguous queries',
      enhancedBasePrompt,
      employeeAssistantPrompt, // Keep employee prompt unchanged for this variation
      talentAssistantPrompt, // Keep talent prompt unchanged for this variation
      changes
    );
  }
  
  /**
   * Create an improved transition handling variation
   * @returns The created variation
   */
  private createImprovedTransitionHandlingVariation(): PromptVariation {
    // Define changes for improved transition handling
    const changes = [
      'Added more natural transition phrases',
      'Expanded transition detection rules',
      'Added context preservation guidelines during transitions',
      'Optimized transition threshold to reduce unnecessary switching'
    ];
    
    // Create enhanced base prompt with improved transition handling
    const enhancedBasePrompt = baseSystemPrompt.replace(
      '## TRANSITION HANDLING',
      `## TRANSITION HANDLING

When transitioning between assistant personalities, follow these enhanced guidelines:

### Detecting Transitions:
- Only transition when the intent confidence for the new domain exceeds 0.7
- If a query contains mixed intents from both domains, default to keeping the current context
- For follow-up queries with pronouns or references to previous context, maintain the current assistant
- Require 2+ strong signals (entities, keywords, intent markers) for a transition

### Transition Messages:
- When switching from Employee Assistant to Talent Acquisition:
  - "Switching to recruitment assistance for that question."
  - "I can help with that recruitment question."
  - "Let me access the talent acquisition system for you."

- When switching from Talent Acquisition to Employee Assistant:
  - "Switching to employee management for that question."
  - "I'll help with that team management question."
  - "Let me check the employee system for you."

### Smooth Transition Guidelines:
1. NEVER announce the transition with "I'm switching to [assistant]..." - just make the switch naturally
2. Keep transition language minimal and subtle - the user shouldn't explicitly notice
3. Maintain relevant context from the previous assistant when applicable
4. Reference information from previous exchanges if it remains relevant
5. Use language that bridges the two domains when possible
6. Never reset the conversation or discard relevant context when switching`
    );
    
    // Create variation
    return this.createVariation(
      'Improved Transition Handling',
      'More natural and context-preserving transitions between assistants',
      enhancedBasePrompt,
      employeeAssistantPrompt, // Keep employee prompt unchanged for this variation
      talentAssistantPrompt, // Keep talent prompt unchanged for this variation
      changes
    );
  }
  
  /**
   * Create an optimized context preservation variation
   * @returns The created variation
   */
  private createOptimizedContextPreservationVariation(): PromptVariation {
    // Define changes for optimized context preservation
    const changes = [
      'Added comprehensive context preservation guidelines',
      'Enhanced entity tracking across transitions',
      'Improved handling of conversation history during switching',
      'Added multi-turn conversation awareness'
    ];
    
    // Create enhanced base prompt with optimized context preservation
    const enhancedBasePrompt = baseSystemPrompt + `

## CONVERSATION CONTEXT PRESERVATION

When handling multi-turn conversations, follow these guidelines to maintain context:

### Entity Tracking:
- Track all named entities (employees, candidates, jobs) mentioned in the conversation
- Maintain awareness of which entities have been discussed recently
- When an entity is referenced by pronoun, resolve it to the most recently mentioned compatible entity

### Conversation Memory:
- Remember key data points from previous turns, especially:
  - Employee names, roles, and schedules discussed
  - Candidate names and statuses mentioned
  - Job positions and requirements referenced
  - Dates, locations, and time periods specified
  - Tasks, actions, and decisions made

### Context Bridging:
- When switching assistants, carry over relevant entities and information
- If a user refers to "they/them/their" after a switch, infer the reference based on previous context
- For follow-up questions, maintain awareness of the topic being discussed
- When an ambiguous term could have different meanings between assistant domains, prefer the interpretation that maintains continuity

### Conversation Coherence:
- Avoid asking for information the user has already provided
- Reference previous parts of the conversation to show continuity
- Acknowledge topic shifts explicitly to help the user track the conversation
- Provide smooth transitions when the topic evolves from one domain to the other`;
    
    // Create variation
    return this.createVariation(
      'Optimized Context Preservation',
      'Improved context tracking and conversation memory across assistant transitions',
      enhancedBasePrompt,
      employeeAssistantPrompt, // Keep employee prompt unchanged for this variation
      talentAssistantPrompt, // Keep talent prompt unchanged for this variation
      changes
    );
  }
}

// Export a singleton instance
const promptVariationManager = new PromptVariationManager();
export default promptVariationManager;