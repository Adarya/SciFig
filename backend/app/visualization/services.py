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
    
    def create_heatmap(self, data: pd.DataFrame, 
                      x_var: str = None, y_var: str = None, value_var: str = None,
                      title: str = None, custom_labels: Dict[str, str] = None,
                      cmap: str = 'RdBu_r', show_values: bool = True,
                      cluster_rows: bool = False, cluster_cols: bool = False,
                      format_type: str = 'png') -> str:
        """Create publication-quality heatmap with optional clustering"""
        return self.engine.create_heatmap(
            data=data,
            x_var=x_var,
            y_var=y_var,
            value_var=value_var,
            title=title,
            custom_labels=custom_labels,
            cmap=cmap,
            show_values=show_values,
            cluster_rows=cluster_rows,
            cluster_cols=cluster_cols,
            format_type=format_type
        )
    
    def create_volcano_plot(self, data: pd.DataFrame,
                           log2fc_col: str, pvalue_col: str,
                           gene_col: str = None, 
                           fc_threshold: float = 1.0,
                           pvalue_threshold: float = 0.05,
                           title: str = None,
                           highlight_genes: List[str] = None,
                           format_type: str = 'png') -> str:
        """Create volcano plot for differential expression analysis"""
        return self.engine.create_volcano_plot(
            data=data,
            log2fc_col=log2fc_col,
            pvalue_col=pvalue_col,
            gene_col=gene_col,
            fc_threshold=fc_threshold,
            pvalue_threshold=pvalue_threshold,
            title=title,
            highlight_genes=highlight_genes,
            format_type=format_type
        )
    
    def create_violin_plot(self, data: pd.DataFrame,
                          outcome_var: str, group_var: str,
                          title: str = None, custom_labels: Dict[str, str] = None,
                          show_box: bool = True, show_points: bool = True,
                          show_stats: bool = True, format_type: str = 'png') -> str:
        """Create violin plot with optional box plot overlay and statistical annotations"""
        return self.engine.create_violin_plot(
            data=data,
            outcome_var=outcome_var,
            group_var=group_var,
            title=title,
            custom_labels=custom_labels,
            show_box=show_box,
            show_points=show_points,
            show_stats=show_stats,
            format_type=format_type
        )
    
    def create_roc_curve(self, y_true: Any = None, y_scores: Any = None,
                        title: str = None, multi_class: Dict[str, tuple] = None,
                        format_type: str = 'png') -> str:
        """Create ROC curve with AUC calculation"""
        return self.engine.create_roc_curve(
            y_true=y_true,
            y_scores=y_scores,
            title=title,
            multi_class=multi_class,
            format_type=format_type
        ) 