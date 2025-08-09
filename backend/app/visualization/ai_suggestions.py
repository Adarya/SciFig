"""
AI-Powered Plot Type Suggestions for SciFig
Intelligent analysis of data characteristics to recommend optimal visualization types
"""

from typing import Dict, List, Any, Tuple, Optional
import pandas as pd
import numpy as np
from pydantic import BaseModel
from enum import Enum


class PlotRecommendationScore(BaseModel):
    """Score and rationale for a plot recommendation"""
    plot_type: str
    template_id: Optional[str]
    score: float  # 0-1 confidence score
    rationale: List[str]
    required_variables: List[str]
    optional_variables: List[str]
    suitability_factors: Dict[str, float]


class AnalysisGoal(str, Enum):
    """Different types of analysis goals"""
    COMPARE_GROUPS = "compare_groups"
    SHOW_CORRELATION = "show_correlation"
    SHOW_DISTRIBUTION = "show_distribution"
    TIME_SERIES = "time_series"
    SURVIVAL_ANALYSIS = "survival_analysis"
    DIFFERENTIAL_EXPRESSION = "differential_expression"
    CLASSIFICATION = "classification"
    EXPLORATORY = "exploratory"


class AIPlotSuggestor:
    """
    AI-powered system for suggesting optimal plot types based on data characteristics
    """
    
    def __init__(self):
        self.plot_rules = self._initialize_plot_rules()
    
    def _initialize_plot_rules(self) -> Dict[str, Dict]:
        """
        Initialize rules for plot type recommendations
        Each rule contains conditions and scoring logic
        """
        return {
            'violin_plot': {
                'conditions': {
                    'min_numeric_cols': 1,
                    'min_categorical_cols': 1,
                    'max_groups': 8,
                    'min_samples_per_group': 5
                },
                'score_factors': {
                    'group_balance': 0.3,
                    'normality': 0.2,
                    'sample_size': 0.2,
                    'outliers': 0.15,
                    'effect_size': 0.15
                },
                'best_for': ['group comparison', 'distribution visualization', 'statistical testing']
            },
            
            'boxplot': {
                'conditions': {
                    'min_numeric_cols': 1,
                    'min_categorical_cols': 1,
                    'max_groups': 10
                },
                'score_factors': {
                    'outlier_detection': 0.4,
                    'group_comparison': 0.3,
                    'sample_size': 0.3
                },
                'best_for': ['outlier detection', 'group comparison', 'summary statistics']
            },
            
            'heatmap': {
                'conditions': {
                    'min_numeric_cols': 5,
                    'correlation_suitable': True
                },
                'score_factors': {
                    'correlation_strength': 0.4,
                    'matrix_size': 0.3,
                    'missing_data': 0.3
                },
                'best_for': ['correlation analysis', 'pattern detection', 'gene expression']
            },
            
            'volcano_plot': {
                'conditions': {
                    'has_pvalue_column': True,
                    'has_effect_size_column': True,
                    'min_rows': 100
                },
                'score_factors': {
                    'significance_distribution': 0.4,
                    'effect_size_range': 0.3,
                    'sample_size': 0.3
                },
                'best_for': ['differential expression', 'significance visualization', 'genomics']
            },
            
            'survival_plot': {
                'conditions': {
                    'has_time_column': True,
                    'has_event_column': True,
                    'min_events': 10
                },
                'score_factors': {
                    'event_rate': 0.4,
                    'follow_up_duration': 0.3,
                    'censoring_rate': 0.3
                },
                'best_for': ['survival analysis', 'time-to-event', 'clinical trials']
            },
            
            'scatter_plot': {
                'conditions': {
                    'min_numeric_cols': 2,
                    'max_numeric_cols': 4
                },
                'score_factors': {
                    'correlation_strength': 0.4,
                    'linearity': 0.3,
                    'outliers': 0.3
                },
                'best_for': ['correlation', 'regression', 'continuous relationships']
            },
            
            'roc_curve': {
                'conditions': {
                    'has_binary_outcome': True,
                    'has_predictions': True,
                    'min_positive_cases': 20
                },
                'score_factors': {
                    'class_balance': 0.4,
                    'prediction_quality': 0.3,
                    'sample_size': 0.3
                },
                'best_for': ['classification performance', 'model evaluation', 'diagnostics']
            },
            
            'histogram': {
                'conditions': {
                    'min_numeric_cols': 1,
                    'max_numeric_cols': 1
                },
                'score_factors': {
                    'distribution_shape': 0.5,
                    'bin_optimization': 0.3,
                    'sample_size': 0.2
                },
                'best_for': ['distribution analysis', 'normality checking', 'data exploration']
            },
            
            'line_plot': {
                'conditions': {
                    'has_time_column': True,
                    'min_time_points': 5
                },
                'score_factors': {
                    'temporal_trend': 0.4,
                    'seasonality': 0.3,
                    'continuity': 0.3
                },
                'best_for': ['time series', 'trends', 'longitudinal data']
            },
            
            'bar_plot': {
                'conditions': {
                    'min_categorical_cols': 1,
                    'max_categories': 20
                },
                'score_factors': {
                    'category_balance': 0.4,
                    'count_distribution': 0.3,
                    'readability': 0.3
                },
                'best_for': ['categorical counts', 'frequency analysis', 'summary statistics']
            }
        }
    
    def suggest_plots(self, data_characteristics: Dict[str, Any], 
                     analysis_goal: Optional[AnalysisGoal] = None,
                     top_k: int = 5) -> List[PlotRecommendationScore]:
        """
        Generate plot recommendations based on data characteristics and analysis goal
        """
        recommendations = []
        
        for plot_type, rules in self.plot_rules.items():
            score_result = self._score_plot_type(plot_type, rules, data_characteristics, analysis_goal)
            if score_result and score_result.score > 0.1:  # Only include viable options
                recommendations.append(score_result)
        
        # Sort by score and return top k
        recommendations.sort(key=lambda x: x.score, reverse=True)
        return recommendations[:top_k]
    
    def _score_plot_type(self, plot_type: str, rules: Dict, 
                        data_chars: Dict[str, Any], 
                        analysis_goal: Optional[AnalysisGoal]) -> Optional[PlotRecommendationScore]:
        """
        Score a specific plot type based on data characteristics
        """
        # Check basic conditions
        if not self._check_conditions(rules['conditions'], data_chars):
            return None
        
        # Calculate score based on factors
        score_factors = rules['score_factors']
        factor_scores = {}
        
        # Calculate individual factor scores
        for factor, weight in score_factors.items():
            factor_score = self._calculate_factor_score(factor, data_chars, plot_type)
            factor_scores[factor] = factor_score
        
        # Weighted average score
        overall_score = sum(score * weight for score, weight in 
                          zip(factor_scores.values(), score_factors.values()))
        
        # Adjust score based on analysis goal
        if analysis_goal:
            goal_bonus = self._get_goal_compatibility_bonus(plot_type, analysis_goal)
            overall_score = min(1.0, overall_score * goal_bonus)
        
        # Generate rationale
        rationale = self._generate_rationale(plot_type, rules, factor_scores, data_chars)
        
        # Determine required variables
        required_vars, optional_vars = self._get_variable_requirements(plot_type, data_chars)
        
        return PlotRecommendationScore(
            plot_type=plot_type,
            template_id=self._get_template_id(plot_type),
            score=overall_score,
            rationale=rationale,
            required_variables=required_vars,
            optional_variables=optional_vars,
            suitability_factors=factor_scores
        )
    
    def _check_conditions(self, conditions: Dict, data_chars: Dict[str, Any]) -> bool:
        """Check if basic conditions are met for a plot type"""
        for condition, required_value in conditions.items():
            if condition == 'min_numeric_cols':
                if data_chars.get('num_numeric_cols', 0) < required_value:
                    return False
            elif condition == 'min_categorical_cols':
                if data_chars.get('num_categorical_cols', 0) < required_value:
                    return False
            elif condition == 'max_groups':
                if data_chars.get('num_groups', 0) > required_value:
                    return False
            elif condition == 'has_time_column':
                if not data_chars.get('has_time_column', False):
                    return False
            elif condition == 'has_event_column':
                if not data_chars.get('has_event_column', False):
                    return False
            elif condition == 'has_binary_outcome':
                if not data_chars.get('has_binary_outcome', False):
                    return False
            elif condition == 'min_rows':
                if data_chars.get('total_rows', 0) < required_value:
                    return False
            elif condition == 'correlation_suitable':
                if not data_chars.get('suitable_for_correlation', False):
                    return False
        
        return True
    
    def _calculate_factor_score(self, factor: str, data_chars: Dict[str, Any], plot_type: str) -> float:
        """Calculate score for individual factors"""
        # Sample size factor
        if factor == 'sample_size':
            n = data_chars.get('total_rows', 0)
            if n < 10:
                return 0.2
            elif n < 30:
                return 0.5
            elif n < 100:
                return 0.7
            elif n < 1000:
                return 0.9
            else:
                return 1.0
        
        # Group balance factor
        elif factor == 'group_balance':
            group_cols = data_chars.get('group_columns', {})
            if not group_cols:
                return 0.3
            # Favor balanced groups
            balance_scores = []
            for col, num_groups in group_cols.items():
                if 2 <= num_groups <= 5:
                    balance_scores.append(0.9)
                elif num_groups <= 8:
                    balance_scores.append(0.7)
                else:
                    balance_scores.append(0.4)
            return np.mean(balance_scores) if balance_scores else 0.3
        
        # Correlation strength factor
        elif factor == 'correlation_strength':
            high_corr = data_chars.get('high_correlation_pairs', 0)
            total_pairs = data_chars.get('num_numeric_cols', 1) * (data_chars.get('num_numeric_cols', 1) - 1) / 2
            if total_pairs > 0:
                correlation_ratio = high_corr / total_pairs
                return min(1.0, correlation_ratio * 2)  # Boost correlation plots
            return 0.3
        
        # Missing data penalty
        elif factor == 'missing_data':
            missing_pct = data_chars.get('missing_data_percentage', 0)
            return max(0.1, 1.0 - (missing_pct / 50))  # Penalty for >50% missing
        
        # Event rate for survival analysis
        elif factor == 'event_rate':
            # Estimate event rate (would need actual calculation)
            return 0.7  # Default moderate event rate
        
        # Default moderate score for unknown factors
        else:
            return 0.6
    
    def _get_goal_compatibility_bonus(self, plot_type: str, goal: AnalysisGoal) -> float:
        """Get bonus multiplier based on analysis goal compatibility"""
        compatibility_matrix = {
            'violin_plot': {
                AnalysisGoal.COMPARE_GROUPS: 1.3,
                AnalysisGoal.SHOW_DISTRIBUTION: 1.2,
                AnalysisGoal.EXPLORATORY: 1.1
            },
            'heatmap': {
                AnalysisGoal.SHOW_CORRELATION: 1.4,
                AnalysisGoal.DIFFERENTIAL_EXPRESSION: 1.3,
                AnalysisGoal.EXPLORATORY: 1.2
            },
            'volcano_plot': {
                AnalysisGoal.DIFFERENTIAL_EXPRESSION: 1.5,
                AnalysisGoal.EXPLORATORY: 1.1
            },
            'survival_plot': {
                AnalysisGoal.SURVIVAL_ANALYSIS: 1.5,
                AnalysisGoal.TIME_SERIES: 1.2
            },
            'roc_curve': {
                AnalysisGoal.CLASSIFICATION: 1.5,
                AnalysisGoal.EXPLORATORY: 1.1
            },
            'scatter_plot': {
                AnalysisGoal.SHOW_CORRELATION: 1.3,
                AnalysisGoal.EXPLORATORY: 1.2
            },
            'line_plot': {
                AnalysisGoal.TIME_SERIES: 1.4,
                AnalysisGoal.EXPLORATORY: 1.1
            }
        }
        
        return compatibility_matrix.get(plot_type, {}).get(goal, 1.0)
    
    def _generate_rationale(self, plot_type: str, rules: Dict, 
                          factor_scores: Dict[str, float], data_chars: Dict[str, Any]) -> List[str]:
        """Generate human-readable rationale for recommendation"""
        rationale = []
        
        # Basic suitability
        rationale.append(f"Suitable for {', '.join(rules['best_for'])}")
        
        # Sample size comment
        n = data_chars.get('total_rows', 0)
        if n < 30:
            rationale.append(f"Small sample size (n={n}) may limit statistical power")
        elif n > 1000:
            rationale.append(f"Large sample size (n={n}) provides robust results")
        
        # Data type specific comments
        if plot_type in ['violin_plot', 'boxplot']:
            num_groups = data_chars.get('num_groups', 0)
            if num_groups == 2:
                rationale.append("Ideal for two-group comparison with statistical testing")
            elif num_groups > 2:
                rationale.append(f"Good for comparing {num_groups} groups")
        
        elif plot_type == 'heatmap':
            num_vars = data_chars.get('num_numeric_cols', 0)
            rationale.append(f"Excellent for visualizing relationships among {num_vars} variables")
        
        elif plot_type == 'volcano_plot':
            if data_chars.get('likely_expression_data'):
                rationale.append("Perfect for differential gene expression analysis")
        
        # Factor-specific insights
        for factor, score in factor_scores.items():
            if score > 0.8:
                if factor == 'correlation_strength':
                    rationale.append("Strong correlations detected in data")
                elif factor == 'group_balance':
                    rationale.append("Well-balanced groups for comparison")
        
        return rationale
    
    def _get_variable_requirements(self, plot_type: str, data_chars: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        """Determine required and optional variables for plot type"""
        requirements = {
            'violin_plot': (['outcome_variable', 'group_variable'], ['facet_variable']),
            'boxplot': (['outcome_variable', 'group_variable'], ['facet_variable']),
            'heatmap': (['expression_matrix'], ['row_annotations', 'col_annotations']),
            'volcano_plot': (['log2fc_col', 'pvalue_col'], ['gene_col', 'highlight_genes']),
            'survival_plot': (['time_variable', 'event_variable'], ['group_variable']),
            'scatter_plot': (['x_variable', 'y_variable'], ['color_variable', 'size_variable']),
            'roc_curve': (['y_true', 'y_scores'], ['multi_class']),
            'line_plot': (['time_variable', 'value_variable'], ['group_variable']),
            'bar_plot': (['category_variable'], ['value_variable'])
        }
        
        return requirements.get(plot_type, ([], []))
    
    def _get_template_id(self, plot_type: str) -> Optional[str]:
        """Map plot type to template ID"""
        template_mapping = {
            'violin_plot': 'two_group_comparison',
            'boxplot': 'multi_group_anova',
            'heatmap': 'heatmap_expression',
            'volcano_plot': 'volcano_plot_deg',
            'survival_plot': 'kaplan_meier_survival',
            'scatter_plot': 'pairwise_scatter',
            'roc_curve': 'roc_auc_classifier',
            'line_plot': 'longitudinal_measurements'
        }
        
        return template_mapping.get(plot_type)


# Singleton instance
ai_plot_suggestor = AIPlotSuggestor()