// Gemini Flash 2.5 API Integration for AI-powered analysis recommendations

export interface AnalysisRecommendation {
  recommendedTest: string;
  reasoning: string;
  confidence: number;
  alternatives: string[];
}

export class GeminiAnalysisAI {
  private static readonly API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
  
  // You'll need to get a free API key from Google AI Studio: https://aistudio.google.com/
  private static readonly API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'your-gemini-api-key-here';

  static async getAnalysisRecommendation(
    naturalLanguageQuery: string,
    dataCharacteristics: {
      outcomeVariable: string;
      groupVariable: string;
      outcomeType: 'continuous' | 'categorical';
      groupType: 'continuous' | 'categorical';
      nGroups: number;
      groups: string[];
      sampleSize: number;
      timeVariable?: string;
      eventVariable?: string;
    }
  ): Promise<AnalysisRecommendation> {
    
    if (!this.API_KEY || this.API_KEY === 'your-gemini-api-key-here') {
      console.warn('❌ GEMINI NOT USED: No API key configured');
      console.warn('📝 To enable Gemini AI: Add VITE_GEMINI_API_KEY to your .env file');
      return this.getFallbackRecommendation(naturalLanguageQuery, dataCharacteristics);
    }

    console.log('🚀 GEMINI AI ACTIVATED: Making real API call to Google Gemini Flash 2.5');

    try {
      const prompt = this.buildAnalysisPrompt(naturalLanguageQuery, dataCharacteristics);
      
      const response = await fetch(`${this.API_ENDPOINT}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1, // Low temperature for consistent statistical recommendations
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 500,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        })
      });

      if (!response.ok) {
        console.error('❌ GEMINI API FAILED:', response.status);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ GEMINI API SUCCESS: Received response from Google AI');
      console.log('📋 RAW API RESPONSE:', JSON.stringify(data, null, 2));
      
      // Handle different response structures
      let aiResponse = null;
      
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        
        // Try different response paths
        if (candidate.content?.parts?.[0]?.text) {
          aiResponse = candidate.content.parts[0].text;
        } else if (candidate.text) {
          aiResponse = candidate.text;
        } else if (candidate.output) {
          aiResponse = candidate.output;
        }
      }
      
      if (!aiResponse) {
        console.error('❌ GEMINI API ERROR: Empty or invalid response structure');
        console.error('📋 Response candidates:', data.candidates);
        
        // Check if there was content filtering
        if (data.candidates?.[0]?.finishReason === 'SAFETY') {
          throw new Error('Content was filtered by Gemini safety systems');
        }
        
        throw new Error('No valid response from Gemini API');
      }

      console.log('🎯 GEMINI AI ANALYSIS COMPLETE: Using real AI recommendation');
      return this.parseAIResponse(aiResponse);
      
    } catch (error) {
      console.error('❌ GEMINI API FAILED:', error.message);
      console.warn('🔄 FALLING BACK: Using rule-based analysis instead of AI');
      return this.getFallbackRecommendation(naturalLanguageQuery, dataCharacteristics);
    }
  }

  private static buildAnalysisPrompt(
    query: string, 
    data: {
      outcomeVariable: string;
      groupVariable: string;
      outcomeType: 'continuous' | 'categorical';
      groupType: 'continuous' | 'categorical';
      nGroups: number;
      groups: string[];
      sampleSize: number;
      timeVariable?: string;
      eventVariable?: string;
    }
  ): string {
    return `You are an expert biostatistician helping researchers choose the most appropriate statistical test.

RESEARCH QUESTION: "${query}"

DATA CHARACTERISTICS:
- Outcome variable: ${data.outcomeVariable} (${data.outcomeType})
- Group variable: ${data.groupVariable} (${data.groupType})
- Number of groups: ${data.nGroups}
- Groups: ${data.groups.join(', ')}
- Sample size: ${data.sampleSize}
${data.timeVariable ? `- Time variable: ${data.timeVariable}` : ''}
${data.eventVariable ? `- Event variable: ${data.eventVariable}` : ''}

AVAILABLE TESTS:
1. independent_ttest - Independent samples t-test for comparing 2 groups (continuous outcome)
2. mann_whitney_u - Mann-Whitney U test for comparing 2 groups (non-parametric)
3. one_way_anova - One-way ANOVA for comparing 3+ groups (continuous outcome)
4. kruskal_wallis - Kruskal-Wallis test for comparing 3+ groups (non-parametric)
5. chi_square - Chi-square test for categorical associations
6. fisher_exact - Fisher's exact test for 2x2 categorical tables
7. kaplan_meier - Kaplan-Meier survival analysis for time-to-event data

INSTRUCTIONS:
Analyze the research question and data characteristics to recommend the most appropriate statistical test.
Consider the user's specific request (multivariate, forest plot, effect sizes, etc.).

Respond in this EXACT JSON format:
{
  "recommendedTest": "test_name",
  "reasoning": "Brief explanation of why this test is most appropriate for this research question and data",
  "confidence": 0.95,
  "alternatives": ["alternative_test1", "alternative_test2"]
}

Focus on the research question intent and match it to the appropriate statistical approach.`;
  }

  private static parseAIResponse(response: string): AnalysisRecommendation {
    try {
      // Extract JSON from the response (handle cases where AI adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!parsed.recommendedTest || !parsed.reasoning) {
        throw new Error('Invalid response structure');
      }
      
      return {
        recommendedTest: parsed.recommendedTest,
        reasoning: parsed.reasoning,
        confidence: parsed.confidence || 0.8,
        alternatives: parsed.alternatives || []
      };
      
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return a safe fallback
      return {
        recommendedTest: 'independent_ttest',
        reasoning: 'Could not parse AI recommendation, defaulting to t-test',
        confidence: 0.5,
        alternatives: ['mann_whitney_u']
      };
    }
  }

  private static getFallbackRecommendation(
    query: string, 
    data: {
      outcomeVariable: string;
      groupVariable: string;
      outcomeType: 'continuous' | 'categorical';
      groupType: 'continuous' | 'categorical';
      nGroups: number;
      groups: string[];
      sampleSize: number;
      timeVariable?: string;
      eventVariable?: string;
    }
  ): AnalysisRecommendation {
    
    console.log('🤖 FALLBACK ANALYSIS: Using rule-based system (not AI)');
    const lowerQuery = query.toLowerCase();
    
    // Enhanced rule-based recommendations
    if (data.timeVariable && data.eventVariable) {
      return {
        recommendedTest: 'kaplan_meier',
        reasoning: 'Time-to-event data detected with both time and event variables',
        confidence: 0.9,
        alternatives: []
      };
    }
    
    if (lowerQuery.includes('multivariate') || lowerQuery.includes('forest plot')) {
      if (data.outcomeType === 'categorical') {
        return {
          recommendedTest: 'fisher_exact',
          reasoning: 'Forest plots typically show odds ratios from categorical analyses',
          confidence: 0.8,
          alternatives: ['chi_square']
        };
      } else {
        return {
          recommendedTest: data.nGroups === 2 ? 'independent_ttest' : 'one_way_anova',
          reasoning: 'Multivariate analysis with effect sizes for continuous outcomes',
          confidence: 0.8,
          alternatives: ['mann_whitney_u', 'kruskal_wallis']
        };
      }
    }
    
    if (lowerQuery.includes('survival') || lowerQuery.includes('hazard')) {
      return {
        recommendedTest: 'kaplan_meier',
        reasoning: 'Survival analysis requested',
        confidence: 0.9,
        alternatives: []
      };
    }
    
    if (lowerQuery.includes('correlation') || lowerQuery.includes('association')) {
      if (data.outcomeType === 'categorical' && data.groupType === 'categorical') {
        return {
          recommendedTest: 'chi_square',
          reasoning: 'Testing association between categorical variables',
          confidence: 0.85,
          alternatives: ['fisher_exact']
        };
      }
    }
    
    if (lowerQuery.includes('non-parametric') || lowerQuery.includes('mann-whitney')) {
      return {
        recommendedTest: data.nGroups === 2 ? 'mann_whitney_u' : 'kruskal_wallis',
        reasoning: 'Non-parametric test requested',
        confidence: 0.9,
        alternatives: []
      };
    }
    
    // Default recommendations based on data structure
    if (data.outcomeType === 'continuous' && data.groupType === 'categorical') {
      if (data.nGroups === 2) {
        return {
          recommendedTest: 'independent_ttest',
          reasoning: `Comparing continuous outcome (${data.outcomeVariable}) between 2 groups`,
          confidence: 0.85,
          alternatives: ['mann_whitney_u']
        };
      } else {
        return {
          recommendedTest: 'one_way_anova',
          reasoning: `Comparing continuous outcome (${data.outcomeVariable}) across ${data.nGroups} groups`,
          confidence: 0.85,
          alternatives: ['kruskal_wallis']
        };
      }
    }
    
    if (data.outcomeType === 'categorical' && data.groupType === 'categorical') {
      return {
        recommendedTest: data.nGroups === 2 ? 'fisher_exact' : 'chi_square',
        reasoning: `Testing association between categorical variables`,
        confidence: 0.8,
        alternatives: data.nGroups === 2 ? ['chi_square'] : ['fisher_exact']
      };
    }
    
    // Ultimate fallback
    return {
      recommendedTest: 'independent_ttest',
      reasoning: 'Standard comparison test selected as fallback',
      confidence: 0.6,
      alternatives: ['mann_whitney_u', 'chi_square']
    };
  }

  // Method to check if API key is configured
  static isConfigured(): boolean {
    return !!(this.API_KEY && this.API_KEY !== 'your-gemini-api-key-here');
  }
  
  // Method to get API key setup instructions
  static getSetupInstructions(): string {
    return `
To enable AI-powered analysis recommendations:

1. Go to https://aistudio.google.com/
2. Sign in with your Google account
3. Click "Get API Key" 
4. Create a new API key (it's free!)
5. Add VITE_GEMINI_API_KEY=your_api_key to your .env file

The AI will provide more intelligent analysis recommendations based on your research questions.
    `.trim();
  }
}