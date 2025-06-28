# SciFig AI: Intelligent Agent Architecture & Development Plan

## 🧠 AI Agent Overview

The SciFig AI agent is a multi-modal system that combines LLMs with specialized statistical models to provide intelligent, accurate, and context-aware analysis recommendations and execution.

---

## 🏗️ Agent Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Orchestration Layer                        │
│  • Intent Recognition                                       │
│  • Context Management                                       │
│  • Task Planning                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┬─────────────────────┐
        │                           │                     │
┌───────▼────────┐      ┌──────────▼──────────┐  ┌──────▼──────┐
│ Language Model │      │ Statistical Engine   │  │ Viz Engine  │
│ (GPT-4/Claude) │      │ (Specialized Models) │  │ (Matplotlib)│
└────────────────┘      └─────────────────────┘  └─────────────┘
        │                           │                     │
        └───────────────────────────┴─────────────────────┘
                                    │
                        ┌───────────▼────────────┐
                        │   Knowledge Base       │
                        │ • Medical guidelines   │
                        │ • Statistical rules    │
                        │ • Journal requirements │
                        └────────────────────────┘
```

---

## 🎯 System Prompts

### 1. Master System Prompt
```python
MASTER_SYSTEM_PROMPT = """
You are SciFig AI, an expert medical statistics assistant. You help medical researchers 
analyze data and create publication-ready figures.

Core Principles:
1. ACCURACY FIRST: Never compromise statistical validity
2. CLARITY: Explain in plain English, then provide technical details
3. SAFETY: Flag potential issues before they become problems
4. EFFICIENCY: Suggest the fastest path to publication-quality results

Your capabilities:
- Analyze data structure and suggest appropriate statistical tests
- Check assumptions before running analyses
- Generate publication-ready figures with proper annotations
- Write methods sections following journal guidelines
- Explain results in both technical and layperson terms

Guidelines:
- Always check test assumptions (normality, homogeneity of variance, etc.)
- Suggest non-parametric alternatives when assumptions are violated
- Use effect sizes alongside p-values
- Follow CONSORT, STROBE, or PRISMA guidelines as appropriate
- Default to conservative statistical approaches

You have access to these tools:
- data_profiler: Analyze dataset structure
- statistical_test_selector: Choose appropriate tests
- assumption_checker: Validate test assumptions
- statistics_calculator: Run statistical analyses
- figure_generator: Create publication-ready figures
- methods_writer: Generate methods text
"""
```

### 2. Data Understanding Prompt
```python
DATA_ANALYSIS_PROMPT = """
Analyze this dataset and provide:

1. DATA STRUCTURE:
   - Number of observations
   - Variable types (continuous, categorical, ordinal)
   - Missing data patterns
   - Potential data quality issues

2. STUDY DESIGN INFERENCE:
   - Likely study type (RCT, observational, case-control, etc.)
   - Independent and dependent variables
   - Grouping variables
   - Repeated measures structure

3. STATISTICAL RECOMMENDATIONS:
   Based on the data structure, recommend:
   - Primary analysis approach
   - Secondary analyses
   - Sensitivity analyses
   - Assumptions to check

4. VISUALIZATION SUGGESTIONS:
   - Most appropriate plot types
   - Key relationships to visualize
   - Publication requirements to consider

Format your response as structured JSON for parsing.
"""
```

### 3. Analysis Selection Prompt
```python
ANALYSIS_SELECTION_PROMPT = """
Given:
- Study Design: {study_type}
- Outcome Variable: {outcome_var} (type: {outcome_type})
- Grouping Variable: {group_var} (levels: {n_groups})
- Sample Size: {n}
- User Goal: "{user_description}"

Recommend the most appropriate statistical test(s):

Consider:
1. Parametric vs non-parametric based on:
   - Sample size
   - Distribution shape
   - Assumption violations

2. Test selection hierarchy:
   - Primary analysis (most appropriate)
   - Alternative if assumptions fail
   - Sensitivity analyses

3. Effect size measures:
   - Appropriate effect size for this test
   - Clinical significance thresholds

4. Post-hoc tests if applicable

Explain your reasoning in medical researcher-friendly language.
"""
```

---

## 🤖 Agent Implementation

### 1. Core Agent Class
```python
# ai_agent/core.py
from typing import Dict, List, Any, Optional
import pandas as pd
from langchain.agents import Tool, AgentExecutor
from langchain.memory import ConversationBufferMemory

class SciFigAgent:
    def __init__(self, llm_model: str = "gpt-4-turbo"):
        self.llm = self._initialize_llm(llm_model)
        self.memory = ConversationBufferMemory()
        self.tools = self._initialize_tools()
        self.executor = self._create_executor()

    def _initialize_tools(self) -> List[Tool]:
        return [
            Tool(
                name="analyze_data_structure",
                func=self.analyze_data_structure,
                description="Analyze dataset structure, variable types, and quality"
            ),
            Tool(
                name="recommend_statistical_test",
                func=self.recommend_test,
                description="Recommend appropriate statistical test based on data"
            ),
            Tool(
                name="check_assumptions",
                func=self.check_assumptions,
                description="Check statistical test assumptions"
            ),
            Tool(
                name="run_analysis",
                func=self.run_analysis,
                description="Execute statistical analysis"
            ),
            Tool(
                name="generate_figure",
                func=self.generate_figure,
                description="Create publication-ready figure"
            ),
            Tool(
                name="write_methods",
                func=self.write_methods,
                description="Generate methods section text"
            )
        ]

    async def process_request(self, 
                            data: pd.DataFrame, 
                            user_query: str,
                            context: Dict[str, Any]) -> Dict[str, Any]:
        """Main entry point for processing user requests"""

        # Step 1: Understand the data
        data_profile = await self.analyze_data_structure(data)

        # Step 2: Parse user intent
        intent = await self._parse_intent(user_query, data_profile)

        # Step 3: Create execution plan
        plan = await self._create_plan(intent, data_profile)

        # Step 4: Execute plan
        results = await self._execute_plan(plan, data)

        # Step 5: Generate outputs
        outputs = await self._generate_outputs(results, intent)

        return outputs
```

### 2. Statistical Intelligence Layer
```python
# ai_agent/statistical_brain.py
import numpy as np
from scipy import stats
from typing import Dict, Tuple, List

class StatisticalBrain:
    """Specialized statistical intelligence component"""

    def __init__(self):
        self.test_hierarchy = self._build_test_hierarchy()
        self.assumption_rules = self._build_assumption_rules()

    def recommend_test(self, 
                      data_profile: Dict,
                      user_goal: str) -> List[Dict[str, Any]]:
        """Recommend statistical tests based on data and goal"""

        recommendations = []

        # Extract key features
        outcome_type = data_profile['outcome_type']
        n_groups = data_profile['n_groups']
        sample_size = data_profile['sample_size']
        is_paired = data_profile.get('is_paired', False)

        # Apply decision tree logic
        if outcome_type == 'continuous':
            if n_groups == 2:
                if sample_size >= 30:
                    primary = 'independent_ttest' if not is_paired else 'paired_ttest'
                    alternative = 'mann_whitney' if not is_paired else 'wilcoxon'
                else:
                    primary = 'mann_whitney' if not is_paired else 'wilcoxon'
                    alternative = 'independent_ttest' if not is_paired else 'paired_ttest'

                recommendations.append({
                    'test': primary,
                    'reason': f"Comparing 2 groups with {outcome_type} outcome",
                    'assumptions_to_check': ['normality', 'equal_variance'],
                    'alternative': alternative,
                    'effect_size': 'cohens_d'
                })

            elif n_groups > 2:
                if sample_size >= 20 * n_groups:
                    primary = 'one_way_anova'
                    alternative = 'kruskal_wallis'
                else:
                    primary = 'kruskal_wallis'
                    alternative = 'one_way_anova'

                recommendations.append({
                    'test': primary,
                    'reason': f"Comparing {n_groups} groups with {outcome_type} outcome",
                    'assumptions_to_check': ['normality', 'equal_variance'],
                    'alternative': alternative,
                    'effect_size': 'eta_squared',
                    'post_hoc': 'tukey_hsd' if primary == 'one_way_anova' else 'dunn'
                })

        return recommendations

    def check_assumptions(self, 
                         data: pd.DataFrame,
                         test_type: str,
                         config: Dict) -> Dict[str, Any]:
        """Check statistical assumptions for a given test"""

        results = {
            'test_type': test_type,
            'assumptions_met': True,
            'details': {}
        }

        if test_type in ['independent_ttest', 'paired_ttest', 'one_way_anova']:
            # Check normality
            normality_results = self._check_normality(data, config)
            results['details']['normality'] = normality_results

            # Check homogeneity of variance
            if test_type in ['independent_ttest', 'one_way_anova']:
                variance_results = self._check_equal_variance(data, config)
                results['details']['equal_variance'] = variance_results

            # Overall assessment
            results['assumptions_met'] = all([
                normality_results['passed'],
                variance_results.get('passed', True)
            ])

        return results
```

### 3. Natural Language Interface
```python
# ai_agent/nlp_interface.py
from transformers import pipeline
import re

class NLPInterface:
    """Natural language understanding for user queries"""

    def __init__(self):
        self.classifier = pipeline("zero-shot-classification")
        self.ner = pipeline("ner", aggregation_strategy="simple")

    def parse_user_intent(self, query: str, data_context: Dict) -> Dict:
        """Parse user natural language query into structured intent"""

        # Classify intent type
        intent_labels = [
            "compare_groups",
            "find_relationship",
            "describe_data",
            "predict_outcome",
            "test_hypothesis"
        ]

        classification = self.classifier(
            query,
            candidate_labels=intent_labels
        )

        intent_type = classification['labels'][0]

        # Extract entities
        entities = self._extract_entities(query, data_context)

        # Parse specific requirements
        requirements = self._parse_requirements(query)

        return {
            'type': intent_type,
            'entities': entities,
            'requirements': requirements,
            'original_query': query
        }

    def _extract_entities(self, query: str, data_context: Dict) -> Dict:
        """Extract relevant entities from query"""

        # Match column names
        columns = data_context.get('columns', [])
        mentioned_columns = []

        for col in columns:
            if col.lower() in query.lower():
                mentioned_columns.append(col)

        # Extract statistical terms
        stat_terms = re.findall(
            r'(p-value|significance|correlation|difference|effect|relationship)',
            query.lower()
        )

        return {
            'columns': mentioned_columns,
            'statistical_concepts': stat_terms
        }
```

### 4. Figure Generation Intelligence
```python
# ai_agent/figure_intelligence.py
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, Any

class FigureIntelligence:
    """Intelligent figure generation based on data and context"""

    def __init__(self):
        self.style_rules = self._load_journal_styles()
        self.color_schemes = self._load_color_schemes()

    def generate_figure(self,
                       data: pd.DataFrame,
                       analysis_results: Dict,
                       style: str = "nature") -> Dict[str, Any]:
        """Generate publication-ready figure"""

        # Determine best visualization
        viz_type = self._select_visualization(data, analysis_results)

        # Apply journal style
        self._apply_style(style)

        # Create figure
        fig, ax = plt.subplots(figsize=self._get_figure_size(viz_type, style))

        # Generate visualization
        if viz_type == 'box_plot':
            self._create_box_plot(data, analysis_results, ax)
        elif viz_type == 'forest_plot':
            self._create_forest_plot(data, analysis_results, ax)
        elif viz_type == 'survival_curve':
            self._create_survival_curve(data, analysis_results, ax)

        # Add statistical annotations
        self._add_statistical_annotations(ax, analysis_results)

        # Format for publication
        self._format_for_publication(fig, ax, style)

        return {
            'figure': fig,
            'type': viz_type,
            'dpi': 300,
            'format_options': ['png', 'svg', 'pdf', 'eps']
        }

    def _select_visualization(self, data: pd.DataFrame, results: Dict) -> str:
        """Intelligently select best visualization type"""

        test_type = results.get('test_type')

        # Decision logic
        if test_type in ['independent_ttest', 'mann_whitney']:
            return 'box_plot'
        elif test_type in ['one_way_anova', 'kruskal_wallis']:
            return 'box_plot' if results['n_groups'] <= 5 else 'bar_plot'
        elif test_type == 'linear_regression':
            return 'scatter_plot'
        elif test_type == 'survival_analysis':
            return 'survival_curve'
        elif test_type == 'meta_analysis':
            return 'forest_plot'
        else:
            return 'bar_plot'  # Default
```

### 5. Agentic Workflow Orchestrator
```python
# ai_agent/orchestrator.py
from typing import List, Dict, Any
import asyncio

class AgentOrchestrator:
    """Orchestrates complex multi-step analyses"""

    def __init__(self, agent: SciFigAgent):
        self.agent = agent
        self.workflow_templates = self._load_workflow_templates()

    async def execute_workflow(self,
                             workflow_type: str,
                             data: pd.DataFrame,
                             config: Dict) -> Dict[str, Any]:
        """Execute a complete analysis workflow"""

        workflow = self.workflow_templates.get(workflow_type)
        if not workflow:
            workflow = await self._create_custom_workflow(data, config)

        results = {
            'workflow_type': workflow_type,
            'steps': [],
            'outputs': {}
        }

        for step in workflow['steps']:
            step_result = await self._execute_step(step, data, results)
            results['steps'].append(step_result)

            # Check if we should continue
            if step_result.get('stop_workflow'):
                break

        # Generate final outputs
        results['outputs'] = await self._compile_outputs(results)

        return results

    def _load_workflow_templates(self) -> Dict[str, Dict]:
        """Load predefined workflow templates"""

        return {
            'clinical_trial': {
                'name': 'Clinical Trial Analysis',
                'steps': [
                    {'action': 'check_randomization', 'required': True},
                    {'action': 'descriptive_stats', 'by_group': True},
                    {'action': 'primary_analysis', 'itt': True},
                    {'action': 'sensitivity_analysis', 'per_protocol': True},
                    {'action': 'subgroup_analysis', 'predefined': True},
                    {'action': 'generate_consort_figures', 'required': True}
                ]
            },
            'observational_study': {
                'name': 'Observational Study Analysis',
                'steps': [
                    {'action': 'descriptive_stats', 'stratified': True},
                    {'action': 'check_confounders', 'required': True},
                    {'action': 'univariate_analysis', 'all_variables': True},
                    {'action': 'multivariate_analysis', 'model_selection': True},
                    {'action': 'generate_figures', 'publication_ready': True}
                ]
            }
        }
```

### 6. Error Handling and Validation
```python
# ai_agent/validation.py
class StatisticalValidator:
    """Ensures statistical validity and catches common errors"""

    def __init__(self):
        self.error_patterns = self._load_error_patterns()

    def validate_analysis_plan(self, 
                              plan: Dict,
                              data_profile: Dict) -> Dict[str, Any]:
        """Validate that planned analysis is appropriate"""

        issues = []
        warnings = []

        # Check sample size requirements
        min_sample = self._get_min_sample_size(plan['test_type'])
        if data_profile['sample_size'] < min_sample:
            issues.append({
                'type': 'sample_size',
                'message': f"Sample size ({data_profile['sample_size']}) too small for {plan['test_type']}. Minimum recommended: {min_sample}",
                'suggestion': 'Consider non-parametric alternative'
            })

        # Check multiple comparisons
        if plan.get('n_comparisons', 1) > 1:
            warnings.append({
                'type': 'multiple_comparisons',
                'message': f"Multiple comparisons ({plan['n_comparisons']}) detected",
                'suggestion': 'Consider Bonferroni or FDR correction'
            })

        # Check data requirements
        required_vars = self._get_required_variables(plan['test_type'])
        missing_vars = set(required_vars) - set(data_profile['variables'])
        if missing_vars:
            issues.append({
                'type': 'missing_variables',
                'message': f"Missing required variables: {missing_vars}",
                'suggestion': 'Check data completeness'
            })

        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings
        }
```

---

## 🚀 Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
1. Set up LLM integration (OpenAI/Anthropic API)
2. Create basic agent structure
3. Implement data profiling tools
4. Build test recommendation engine

### Phase 2: Statistical Core (Weeks 3-4)
1. Implement assumption checking
2. Build statistical test library
3. Create figure generation system
4. Add methods text generation

### Phase 3: Intelligence Layer (Weeks 5-6)
1. Train test selection model
2. Implement NLP interface
3. Build workflow orchestrator
4. Add validation system

### Phase 4: Production Hardening (Weeks 7-8)
1. Add comprehensive error handling
2. Implement caching and optimization
3. Build monitoring and logging
4. Create feedback loop for improvement

---

## 💡 Key Design Decisions

### 1. Hybrid Architecture
Combine LLM intelligence with deterministic statistical code:
- LLM for understanding intent and explaining results
- Specialized code for actual calculations
- Best of both worlds: intelligence + accuracy

### 2. Multi-Stage Validation
Every analysis goes through:
1. Data validation
2. Assumption checking
3. Result validation
4. Output verification

### 3. Explainable AI
Always provide:
- Why this test was chosen
- What assumptions were checked
- What the results mean
- What to do next

### 4. Fail-Safe Design
- Conservative defaults
- Clear warnings
- Alternative suggestions
- Never hide uncertainty

---

## 🔧 Implementation Example

```python
# Example usage
async def analyze_clinical_trial():
    # Initialize agent
    agent = SciFigAgent()

    # Load data
    data = pd.read_csv("trial_data.csv")

    # Natural language request
    request = "Compare treatment efficacy between drug A and placebo"

    # Process request
    results = await agent.process_request(
        data=data,
        user_query=request,
        context={
            'study_type': 'rct',
            'primary_outcome': 'efficacy_score'
        }
    )

    # Results include:
    # - Statistical test results
    # - Publication-ready figures
    # - Methods section text
    # - Interpretation guide

    return results
```

---

## 🎯 Success Metrics

1. **Accuracy**: 100% match with R/SPSS results
2. **Speed**: < 5 seconds for standard analyses
3. **Explainability**: Users understand why each decision was made
4. **Error Rate**: < 0.1% statistical errors
5. **User Satisfaction**: > 90% would recommend

This comprehensive AI agent will make SciFig AI truly intelligent while maintaining statistical rigor.
