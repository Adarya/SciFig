"""Visualization services"""

import pandas as pd
from typing import Dict, List, Any, Optional
import sys
import os

# Add the parent directory to path to import the original engine
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from publication_viz_engine import PublicationVizEngine


class PublicationVizService:
    """Service for publication-quality visualizations"""
    
    def __init__(self, style: str = 'nature'):
        self.engine = PublicationVizEngine(style=style)
    
    def create_publication_boxplot(self, data: pd.DataFrame, outcome_var: str, 
                                 group_var: str, title: str = None, 
                                 custom_labels: Dict = None, format_type: str = 'png') -> str:
        """Create publication-ready box plot"""
        return self.engine.create_publication_boxplot(
            data=data,
            outcome_var=outcome_var,
            group_var=group_var,
            title=title,
            custom_labels=custom_labels,
            format_type=format_type
        )
    
    def create_kaplan_meier_plot(self, data: pd.DataFrame, time_var: str, 
                               event_var: str, group_var: str = None, 
                               title: str = None, custom_labels: Dict = None,
                               format_type: str = 'png') -> str:
        """Create publication-ready Kaplan-Meier survival curves"""
        return self.engine.create_kaplan_meier_plot(
            data=data,
            time_var=time_var,
            event_var=event_var,
            group_var=group_var,
            title=title,
            custom_labels=custom_labels,
            format_type=format_type
        )
    
    def create_multivariate_forest_plot(self, results_data: List[Dict], 
                                      title: str = None, 
                                      effect_measure: str = "Effect Size") -> str:
        """Create publication-ready forest plot for multivariate analysis"""
        return self.engine.create_multivariate_forest_plot(
            results_data=results_data,
            title=title,
            effect_measure=effect_measure
        )
    
    def create_contingency_heatmap(self, data: pd.DataFrame, outcome_var: str,
                                 group_var: str, title: str = None,
                                 custom_labels: Dict = None, 
                                 format_type: str = 'png') -> str:
        """Create publication-ready contingency table heatmap"""
        return self.engine.create_contingency_heatmap(
            data=data,
            outcome_var=outcome_var,
            group_var=group_var,
            title=title,
            custom_labels=custom_labels,
            format_type=format_type
        )
    
    def create_correlation_heatmap(self, data: pd.DataFrame, variables: List[str],
                                 method: str = 'pearson', title: str = None) -> str:
        """Create publication-ready correlation heatmap"""
        return self.engine.create_correlation_heatmap(
            data=data,
            variables=variables,
            method=method,
            title=title
        )
    
    def create_code_editable_figure(self, data: pd.DataFrame, outcome_var: str,
                                  group_var: str, analysis_type: str,
                                  code_params: Dict[str, Any],
                                  title: str = None, custom_labels: Dict = None,
                                  time_var: str = None, event_var: str = None,
                                  format_type: str = 'png') -> str:
        """Create figure with user-editable code parameters"""
        return self.engine.create_code_editable_figure(
            data=data,
            outcome_var=outcome_var,
            group_var=group_var,
            analysis_type=analysis_type,
            code_params=code_params,
            title=title,
            custom_labels=custom_labels,
            time_var=time_var,
            event_var=event_var,
            format_type=format_type
        ) 