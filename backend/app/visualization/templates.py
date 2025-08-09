"""
Figure Templates Library for SciFig AI
Provides pre-configured templates for common scientific visualizations
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from enum import Enum


class TemplateCategory(str, Enum):
    """Categories of figure templates"""
    BASIC_STATISTICS = "basic_statistics"
    CLINICAL_TRIALS = "clinical_trials"
    GENOMICS = "genomics"
    PROTEOMICS = "proteomics"
    TIME_SERIES = "time_series"
    CORRELATIONS = "correlations"
    DISTRIBUTIONS = "distributions"
    SURVIVAL = "survival"
    MACHINE_LEARNING = "machine_learning"


class FigureTemplate(BaseModel):
    """Figure template model"""
    id: str
    name: str
    description: str
    category: TemplateCategory
    plot_type: str
    required_variables: List[str]
    optional_variables: List[str]
    default_settings: Dict[str, Any]
    journal_style: str
    example_data_shape: str
    tags: List[str]
    thumbnail: Optional[str] = None


class FigureTemplateLibrary:
    """
    Library of pre-configured figure templates for common scientific visualizations
    """
    
    def __init__(self):
        self.templates = self._initialize_templates()
    
    def _initialize_templates(self) -> Dict[str, FigureTemplate]:
        """Initialize the template library with pre-configured templates"""
        
        templates = [
            # Basic Statistics Templates
            FigureTemplate(
                id="two_group_comparison",
                name="Two-Group Comparison",
                description="Compare two groups with statistical significance",
                category=TemplateCategory.BASIC_STATISTICS,
                plot_type="violin",
                required_variables=["outcome_variable", "group_variable"],
                optional_variables=["covariates"],
                default_settings={
                    "show_box": True,
                    "show_points": True,
                    "show_stats": True,
                    "journal_style": "nature",
                    "title": "Group Comparison",
                    "custom_labels": {
                        "x": "Groups",
                        "y": "Measurement"
                    }
                },
                journal_style="nature",
                example_data_shape="Rows: samples, Columns: group (binary), outcome (numeric)",
                tags=["t-test", "mann-whitney", "comparison", "statistics"]
            ),
            
            FigureTemplate(
                id="multi_group_anova",
                name="Multi-Group ANOVA",
                description="Compare multiple groups with ANOVA and post-hoc tests",
                category=TemplateCategory.BASIC_STATISTICS,
                plot_type="boxplot",
                required_variables=["outcome_variable", "group_variable"],
                optional_variables=["facet_variable"],
                default_settings={
                    "show_outliers": True,
                    "show_means": True,
                    "journal_style": "science",
                    "add_jitter": True,
                    "title": "Multi-Group Comparison"
                },
                journal_style="science",
                example_data_shape="Rows: samples, Columns: group (categorical), outcome (numeric)",
                tags=["anova", "multiple-groups", "post-hoc", "statistics"]
            ),
            
            # Clinical Trials Templates
            FigureTemplate(
                id="kaplan_meier_survival",
                name="Kaplan-Meier Survival Curves",
                description="Survival analysis with log-rank test",
                category=TemplateCategory.CLINICAL_TRIALS,
                plot_type="survival",
                required_variables=["time_variable", "event_variable", "group_variable"],
                optional_variables=["stratification_variable"],
                default_settings={
                    "show_confidence_intervals": True,
                    "show_risk_table": True,
                    "show_p_value": True,
                    "journal_style": "nejm",
                    "title": "Overall Survival"
                },
                journal_style="nejm",
                example_data_shape="Rows: patients, Columns: time, event (0/1), treatment group",
                tags=["survival", "kaplan-meier", "log-rank", "clinical"]
            ),
            
            FigureTemplate(
                id="forest_plot_hazard",
                name="Forest Plot - Hazard Ratios",
                description="Multivariate Cox regression results",
                category=TemplateCategory.CLINICAL_TRIALS,
                plot_type="forest",
                required_variables=["variables", "hazard_ratios", "confidence_intervals"],
                optional_variables=["p_values", "subgroups"],
                default_settings={
                    "show_null_line": True,
                    "log_scale": True,
                    "journal_style": "nejm",
                    "title": "Multivariate Analysis"
                },
                journal_style="nejm",
                example_data_shape="Rows: variables, Columns: HR, CI_lower, CI_upper, p_value",
                tags=["forest-plot", "hazard-ratio", "cox-regression", "multivariate"]
            ),
            
            # Genomics Templates
            FigureTemplate(
                id="volcano_plot_deg",
                name="Volcano Plot - DEG Analysis",
                description="Differential gene expression visualization",
                category=TemplateCategory.GENOMICS,
                plot_type="volcano",
                required_variables=["log2fc_col", "pvalue_col"],
                optional_variables=["gene_col", "highlight_genes"],
                default_settings={
                    "fc_threshold": 1.0,
                    "pvalue_threshold": 0.05,
                    "journal_style": "nature",
                    "title": "Differential Expression Analysis",
                    "highlight_top_genes": 10
                },
                journal_style="nature",
                example_data_shape="Rows: genes, Columns: log2FC, p-value, gene_name",
                tags=["volcano", "differential-expression", "genomics", "RNA-seq"]
            ),
            
            FigureTemplate(
                id="heatmap_expression",
                name="Expression Heatmap",
                description="Gene expression heatmap with clustering",
                category=TemplateCategory.GENOMICS,
                plot_type="heatmap",
                required_variables=["expression_matrix"],
                optional_variables=["row_annotations", "col_annotations"],
                default_settings={
                    "cluster_rows": True,
                    "cluster_cols": True,
                    "cmap": "RdBu_r",
                    "show_values": False,
                    "journal_style": "cell",
                    "title": "Gene Expression Profile"
                },
                journal_style="cell",
                example_data_shape="Matrix: genes x samples with expression values",
                tags=["heatmap", "clustering", "expression", "genomics"]
            ),
            
            # Proteomics Templates
            FigureTemplate(
                id="ma_plot_proteomics",
                name="MA Plot",
                description="Mean-Average plot for proteomics data",
                category=TemplateCategory.PROTEOMICS,
                plot_type="scatter",
                required_variables=["mean_intensity", "log_ratio"],
                optional_variables=["protein_names", "significance"],
                default_settings={
                    "highlight_significant": True,
                    "significance_threshold": 0.05,
                    "journal_style": "nature",
                    "title": "MA Plot - Protein Abundance"
                },
                journal_style="nature",
                example_data_shape="Rows: proteins, Columns: mean_intensity, log2_ratio, p_value",
                tags=["MA-plot", "proteomics", "differential-abundance"]
            ),
            
            # Correlations Templates
            FigureTemplate(
                id="correlation_matrix",
                name="Correlation Matrix",
                description="Correlation heatmap with significance",
                category=TemplateCategory.CORRELATIONS,
                plot_type="correlation_heatmap",
                required_variables=["numeric_variables"],
                optional_variables=["method", "show_significance"],
                default_settings={
                    "method": "pearson",
                    "cmap": "coolwarm",
                    "show_values": True,
                    "journal_style": "nature",
                    "title": "Correlation Analysis"
                },
                journal_style="nature",
                example_data_shape="Rows: samples, Columns: numeric variables",
                tags=["correlation", "heatmap", "pearson", "spearman"]
            ),
            
            FigureTemplate(
                id="pairwise_scatter",
                name="Pairwise Scatter Matrix",
                description="Multiple scatter plots with regression lines",
                category=TemplateCategory.CORRELATIONS,
                plot_type="scatter_matrix",
                required_variables=["variables"],
                optional_variables=["group_variable", "show_regression"],
                default_settings={
                    "show_regression": True,
                    "show_confidence": True,
                    "journal_style": "science",
                    "title": "Pairwise Relationships"
                },
                journal_style="science",
                example_data_shape="Rows: samples, Columns: multiple numeric variables",
                tags=["scatter", "regression", "pairwise", "correlation"]
            ),
            
            # Machine Learning Templates
            FigureTemplate(
                id="roc_auc_classifier",
                name="ROC Curve - Binary Classifier",
                description="ROC curve with AUC for model evaluation",
                category=TemplateCategory.MACHINE_LEARNING,
                plot_type="roc_curve",
                required_variables=["y_true", "y_scores"],
                optional_variables=["model_names"],
                default_settings={
                    "show_diagonal": True,
                    "show_auc": True,
                    "journal_style": "nature",
                    "title": "Classifier Performance"
                },
                journal_style="nature",
                example_data_shape="Arrays: true labels (0/1), predicted probabilities",
                tags=["ROC", "AUC", "classification", "machine-learning"]
            ),
            
            FigureTemplate(
                id="confusion_matrix_ml",
                name="Confusion Matrix",
                description="Classification results visualization",
                category=TemplateCategory.MACHINE_LEARNING,
                plot_type="heatmap",
                required_variables=["y_true", "y_pred"],
                optional_variables=["class_names"],
                default_settings={
                    "cmap": "Blues",
                    "show_values": True,
                    "normalize": True,
                    "journal_style": "nature",
                    "title": "Classification Results"
                },
                journal_style="nature",
                example_data_shape="Arrays: true labels, predicted labels",
                tags=["confusion-matrix", "classification", "accuracy"]
            ),
            
            # Time Series Templates
            FigureTemplate(
                id="longitudinal_measurements",
                name="Longitudinal Data Plot",
                description="Repeated measurements over time",
                category=TemplateCategory.TIME_SERIES,
                plot_type="line",
                required_variables=["time_variable", "measurement_variable", "subject_id"],
                optional_variables=["group_variable"],
                default_settings={
                    "show_individual_trajectories": True,
                    "show_mean_trajectory": True,
                    "show_confidence_band": True,
                    "journal_style": "nature",
                    "title": "Longitudinal Analysis"
                },
                journal_style="nature",
                example_data_shape="Rows: observations, Columns: time, value, subject_id",
                tags=["longitudinal", "time-series", "repeated-measures"]
            )
        ]
        
        return {template.id: template for template in templates}
    
    def get_template(self, template_id: str) -> Optional[FigureTemplate]:
        """Get a specific template by ID"""
        return self.templates.get(template_id)
    
    def get_templates_by_category(self, category: TemplateCategory) -> List[FigureTemplate]:
        """Get all templates in a specific category"""
        return [t for t in self.templates.values() if t.category == category]
    
    def get_templates_by_plot_type(self, plot_type: str) -> List[FigureTemplate]:
        """Get all templates for a specific plot type"""
        return [t for t in self.templates.values() if t.plot_type == plot_type]
    
    def search_templates(self, query: str) -> List[FigureTemplate]:
        """Search templates by name, description, or tags"""
        query_lower = query.lower()
        results = []
        for template in self.templates.values():
            if (query_lower in template.name.lower() or
                query_lower in template.description.lower() or
                any(query_lower in tag.lower() for tag in template.tags)):
                results.append(template)
        return results
    
    def get_recommended_templates(self, data_shape: Dict[str, Any]) -> List[FigureTemplate]:
        """
        Recommend templates based on data characteristics
        data_shape should contain info like:
        - num_numeric_cols
        - num_categorical_cols
        - has_time_column
        - has_binary_outcome
        - num_groups
        """
        recommendations = []
        
        # Check for survival analysis
        if data_shape.get('has_time_column') and data_shape.get('has_event_column'):
            recommendations.append(self.templates.get('kaplan_meier_survival'))
        
        # Check for group comparisons
        if data_shape.get('num_groups') == 2 and data_shape.get('num_numeric_cols') > 0:
            recommendations.append(self.templates.get('two_group_comparison'))
        elif data_shape.get('num_groups') > 2 and data_shape.get('num_numeric_cols') > 0:
            recommendations.append(self.templates.get('multi_group_anova'))
        
        # Check for correlation analysis
        if data_shape.get('num_numeric_cols', 0) >= 3:
            recommendations.append(self.templates.get('correlation_matrix'))
        
        # Check for classification
        if data_shape.get('has_binary_outcome') and data_shape.get('has_predictions'):
            recommendations.append(self.templates.get('roc_auc_classifier'))
        
        # Filter out None values
        return [t for t in recommendations if t is not None]


# Singleton instance
template_library = FigureTemplateLibrary()