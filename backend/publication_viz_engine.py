#!/usr/bin/env python3
"""
SciFig AI: Publication-Ready Visualization Engine
World-class scientific figures for top-tier research publications
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from matplotlib import rcParams
from matplotlib.patches import Rectangle
import scipy.stats as stats
from lifelines import KaplanMeierFitter
from lifelines.statistics import logrank_test
from scipy.cluster.hierarchy import dendrogram, linkage
from sklearn.metrics import roc_curve, auc
import base64
import io
from typing import Dict, List, Optional, Tuple, Any, Union
import warnings
warnings.filterwarnings('ignore')

class PublicationVizEngine:
    """
    Advanced visualization engine for publication-ready scientific figures
    Following standards of Nature, Science, Cell, and other top-tier journals
    """
    
    # Journal-specific style configurations
    JOURNAL_STYLES = {
        'nature': {
            'font_family': 'Arial',
            'font_sizes': {'title': 18, 'labels': 16, 'ticks': 14, 'legend': 14},
            'colors': ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
            'line_width': 1.5,
            'marker_size': 8,
            'dpi': 300
        },
        'science': {
            'font_family': 'Arial',
            'font_sizes': {'title': 20, 'labels': 18, 'ticks': 16, 'legend': 16},
            'colors': ['#0173B2', '#DE8F05', '#CC78BC', '#029E73', '#D55E00', '#56B4E9'],
            'line_width': 2.0,
            'marker_size': 10,
            'dpi': 300
        },
        'cell': {
            'font_family': 'Arial',
            'font_sizes': {'title': 22, 'labels': 20, 'ticks': 18, 'legend': 18},
            'colors': ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00'],
            'line_width': 2.5,
            'marker_size': 12,
            'dpi': 350
        },
        'nejm': {
            'font_family': 'Arial',
            'font_sizes': {'title': 16, 'labels': 14, 'ticks': 12, 'legend': 12},
            'colors': ['#000080', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'],
            'line_width': 1.2,
            'marker_size': 7,
            'dpi': 300
        }
    }
    
    def __init__(self, style: str = 'nature'):
        """Initialize with journal-specific styling"""
        self.style_config = self.JOURNAL_STYLES.get(style, self.JOURNAL_STYLES['nature'])
        self._setup_matplotlib_defaults()
    
    def _detect_and_convert_event_variable(self, event_series: pd.Series, variable_name: str = "event") -> pd.Series:
        """
        Intelligently detect and convert event variable to proper 0/1 coding
        Returns: pandas Series with 0 (censored) and 1 (event) values
        """
        # Get unique values (excluding NaN)
        unique_values = set(event_series.dropna().unique())
        
        # Convert to strings for easier comparison
        str_values = {str(v).lower().strip() for v in unique_values}
        
        print(f"DEBUG: Original {variable_name} values: {unique_values}")
        print(f"DEBUG: String values for comparison: {str_values}")
        
        # Pattern 1: Already numeric 0/1
        if unique_values.issubset({0, 1, 0.0, 1.0}):
            return event_series.astype(int)
        
        # Pattern 2: Boolean True/False
        if unique_values.issubset({True, False}):
            return event_series.astype(int)
        
        # Pattern 3: Common text patterns
        # Event occurred patterns (should be 1)
        event_patterns = {'yes', 'true', 'dead', 'death', 'deceased', 'event', 'occurred', 'positive', '1'}
        # Censored patterns (should be 0)  
        censored_patterns = {'no', 'false', 'alive', 'living', 'censored', 'no event', 'negative', '0'}
        
        # Pattern 3.5: Handle colon-separated status format (e.g., "1:DECEASED", "0:LIVING")
        colon_separated = any(':' in str(val) for val in unique_values)
        if colon_separated:
            event_mapping = {}
            for val in unique_values:
                str_val = str(val).lower().strip()
                if str_val.startswith('1:') or 'deceased' in str_val or 'dead' in str_val:
                    event_mapping[val] = 1
                elif str_val.startswith('0:') or 'living' in str_val or 'alive' in str_val:
                    event_mapping[val] = 0
                else:
                    # Unknown value - assume censored for safety
                    event_mapping[val] = 0
                    print(f"WARNING: Unknown colon-separated event value '{val}' treated as censored (0)")
            
            return event_series.map(event_mapping).fillna(0).astype(int)
        
        # Check if values match known patterns
        if str_values.issubset(event_patterns | censored_patterns):
            # Create mapping
            event_mapping = {}
            for val in unique_values:
                str_val = str(val).lower().strip()
                if str_val in event_patterns:
                    event_mapping[val] = 1
                elif str_val in censored_patterns:
                    event_mapping[val] = 0
                else:
                    # Unknown value - assume censored for safety
                    event_mapping[val] = 0
                    print(f"WARNING: Unknown event value '{val}' treated as censored (0)")
            
            return event_series.map(event_mapping).fillna(0).astype(int)
        
        # Pattern 4: Try numeric conversion with validation
        try:
            numeric_series = pd.to_numeric(event_series, errors='coerce')
            numeric_unique = set(numeric_series.dropna().unique())
            
            if numeric_unique.issubset({0, 1}):
                return numeric_series.fillna(0).astype(int)
            elif len(numeric_unique) == 2:
                # Assume binary numeric values - map smaller to 0, larger to 1
                sorted_vals = sorted(numeric_unique)
                mapping = {sorted_vals[0]: 0, sorted_vals[1]: 1}
                return numeric_series.map(mapping).fillna(0).astype(int)
        except:
            pass
        
        # Pattern 5: Fallback - if we can't detect pattern, warn and assume all censored
        print(f"ERROR: Cannot interpret event variable '{variable_name}' with values: {unique_values}")
        print(f"Assuming all observations are censored (0). Please check your data format.")
        return pd.Series([0] * len(event_series), index=event_series.index)
    
    def _validate_survival_data(self, time_data: pd.Series, event_data: pd.Series) -> Dict[str, Any]:
        """
        Validate survival data and return summary statistics
        """
        total_obs = len(time_data)
        # Convert to numeric to avoid division errors
        events = float(pd.to_numeric(event_data, errors='coerce').sum())
        censored = total_obs - events
        event_rate = events / total_obs if total_obs > 0 else 0
        
        validation_result = {
            'total_observations': total_obs,
            'events': int(events),
            'censored': int(censored),
            'event_rate': event_rate,
            'warnings': [],
            'valid': True
        }
        
        # Check for unrealistic event rates
        if event_rate == 0:
            validation_result['warnings'].append("WARNING: No events detected - all observations censored")
            validation_result['valid'] = False
        elif event_rate == 1:
            validation_result['warnings'].append("CRITICAL: 100% event rate - no censored observations (check event variable coding)")
            validation_result['valid'] = False
        elif event_rate > 0.95:
            validation_result['warnings'].append(f"WARNING: Very high event rate ({event_rate:.1%}) - unusual for survival data")
        elif event_rate < 0.05:
            validation_result['warnings'].append(f"WARNING: Very low event rate ({event_rate:.1%}) - check if events are coded correctly")
        
        # Check time data
        if time_data.min() < 0:
            validation_result['warnings'].append("ERROR: Negative time values detected")
            validation_result['valid'] = False
        
        if time_data.max() == time_data.min():
            validation_result['warnings'].append("ERROR: All time values are identical")
            validation_result['valid'] = False
        
        return validation_result
    
    def _setup_matplotlib_defaults(self):
        """Configure matplotlib for publication quality"""
        config = self.style_config
        
        rcParams.update({
            'font.family': config['font_family'],
            'font.size': config['font_sizes']['ticks'],
            'axes.titlesize': config['font_sizes']['title'],
            'axes.labelsize': config['font_sizes']['labels'],
            'xtick.labelsize': config['font_sizes']['ticks'],
            'ytick.labelsize': config['font_sizes']['ticks'],
            'legend.fontsize': config['font_sizes']['legend'],
            'figure.titlesize': config['font_sizes']['title'] + 2,
            'lines.linewidth': config['line_width'],
            'lines.markersize': config['marker_size'],
            'axes.linewidth': 1.2,
            'xtick.major.width': 1.2,
            'ytick.major.width': 1.2,
            'xtick.minor.width': 0.8,
            'ytick.minor.width': 0.8,
            'axes.spines.top': False,
            'axes.spines.right': False,
            'axes.edgecolor': '#000000',
            'axes.facecolor': '#FFFFFF',
            'figure.facecolor': '#FFFFFF',
            'savefig.facecolor': '#FFFFFF',
            'savefig.edgecolor': 'none',
            'savefig.dpi': config['dpi'],
            'figure.dpi': config['dpi'],
            'axes.grid': False,
            'grid.alpha': 0.3,
            'grid.linewidth': 0.8
        })
    
    def _calculate_figure_size(self, plot_type: str, n_groups: int, data_complexity: str = 'medium') -> Tuple[float, float]:
        """Dynamically calculate optimal figure size based on content - SMALLER for publication"""
        base_sizes = {
            'box': (4, 3.5),
            'survival': (5, 4),
            'forest': (6, 5),
            'heatmap': (4.5, 3.5),
            'correlation': (6, 5),
            'violin': (4.5, 3.5),
            'roc': (4, 4)
        }
        
        base_w, base_h = base_sizes.get(plot_type, (8, 6))
        
        # Adjust for number of groups/variables
        if plot_type in ['box', 'violin']:
            if n_groups <= 2:
                width_factor = 1.0
            elif n_groups <= 4:
                width_factor = 1.3
            elif n_groups <= 6:
                width_factor = 1.6
            else:
                width_factor = 2.0
            base_w *= width_factor
        
        # Adjust for data complexity
        complexity_factors = {'simple': 0.8, 'medium': 1.0, 'complex': 1.3}
        factor = complexity_factors.get(data_complexity, 1.0)
        
        return (base_w * factor, base_h * factor)
    
    def create_publication_boxplot(self, data: pd.DataFrame, outcome_var: str, group_var: str, 
                                 title: str = None, custom_labels: Dict = None, format_type: str = 'png') -> str:
        """Create publication-ready box plot with individual points"""
        
        groups = data[group_var].unique()
        n_groups = len(groups)
        
        fig_width, fig_height = self._calculate_figure_size('box', n_groups)
        fig, ax = plt.subplots(figsize=(fig_width, fig_height), dpi=self.style_config['dpi'])
        
        # Prepare data for plotting
        group_data = [data[data[group_var] == group][outcome_var].dropna() for group in groups]
        
        # Create box plot with publication styling
        box_plot = ax.boxplot(group_data, labels=groups, patch_artist=True,
                             boxprops=dict(facecolor='lightblue', alpha=0.7, linewidth=1.5),
                             medianprops=dict(color='red', linewidth=2.5),
                             whiskerprops=dict(linewidth=1.5, color='black'),
                             capprops=dict(linewidth=1.5, color='black'),
                             flierprops=dict(marker='o', markerfacecolor='gray', markersize=4, alpha=0.5))
        
        # Add individual data points with jitter
        colors = self.style_config['colors']
        for i, (group, group_values) in enumerate(zip(groups, group_data)):
            y_values = group_values.values
            x_values = np.random.normal(i + 1, 0.04, size=len(y_values))
            ax.scatter(x_values, y_values, alpha=0.7, s=30, 
                      color=colors[i % len(colors)], zorder=3, edgecolor='white', linewidth=0.5)
        
        # Statistical annotations
        self._add_statistical_annotations(ax, group_data, groups)
        
        # Professional styling
        self._apply_professional_styling(ax, custom_labels or {}, outcome_var, group_var, title)
        
        return self._figure_to_base64(fig, format_type)
    
    def create_kaplan_meier_plot(self, data: pd.DataFrame, time_var: str, event_var: str, 
                               group_var: str = None, title: str = None, custom_labels: Dict = None, format_type: str = 'png') -> str:
        """Create publication-ready Kaplan-Meier survival curves"""
        
        fig_width, fig_height = self._calculate_figure_size('survival', 2 if group_var else 1)
        fig, (ax_main, ax_table) = plt.subplots(2, 1, figsize=(fig_width, fig_height), 
                                               height_ratios=[3, 1], dpi=self.style_config['dpi'])
        
        # Prepare survival data with proper type conversion and alignment
        # Ensure we have the same indices for time and event data
        clean_data = data[[time_var, event_var, group_var]].copy() if group_var else data[[time_var, event_var]].copy()
        clean_data = clean_data.dropna()
        
        # Reset index to ensure proper alignment
        clean_data = clean_data.reset_index(drop=True)
        
        # Convert time variable to numeric
        time_data = pd.to_numeric(clean_data[time_var], errors='coerce')
        
        # Intelligently convert event variable
        print(f"DEBUG: Converting event variable '{event_var}'...")
        event_data = self._detect_and_convert_event_variable(clean_data[event_var], event_var)
        
        # Ensure both are proper numeric types for lifelines
        time_data = time_data.astype(float)
        event_data = event_data.astype(int)
        
        print(f"DEBUG: After conversion - time_data dtype: {time_data.dtype}, event_data dtype: {event_data.dtype}")
        print(f"DEBUG: Event data unique values: {event_data.unique()}")
        print(f"DEBUG: Event data value counts: {event_data.value_counts()}")
        
        # Remove rows where time_data is NaN after conversion
        valid_mask = ~time_data.isna()
        time_data = time_data[valid_mask]
        event_data = event_data[valid_mask]
        clean_data = clean_data[valid_mask].reset_index(drop=True)
        
        # Validate survival data
        validation = self._validate_survival_data(time_data, event_data)
        print(f"DEBUG: Survival data validation: {validation}")
        
        # Print warnings
        for warning in validation['warnings']:
            print(warning)
        
        # If validation fails, raise error with details
        if not validation['valid']:
            error_msg = f"Survival data validation failed. Events: {validation['events']}/{validation['total_observations']} ({validation['event_rate']:.1%})"
            raise ValueError(error_msg)
        
        # Ensure we have valid data
        if len(time_data) == 0 or len(event_data) == 0:
            raise ValueError("No valid survival data found after cleaning")
        
        # Additional validation
        if time_data.min() < 0:
            raise ValueError("Time values cannot be negative")
        
        if not set(event_data.unique()).issubset({0, 1}):
            raise ValueError("Event values must be 0 (censored) or 1 (event occurred)")
        
        if group_var:
            groups = clean_data[group_var].unique()
            colors = self.style_config['colors']
            
            survival_data = {}
            for i, group in enumerate(groups):
                mask = clean_data[group_var] == group
                group_time = time_data[mask].values.astype(float)  # Ensure float64
                group_event = event_data[mask].values.astype(int)  # Ensure int
                
                print(f"DEBUG: Group '{group}' - size: {len(group_time)}, events: {group_event.sum()}")
                print(f"DEBUG: Group '{group}' - time_dtype: {group_time.dtype}, event_dtype: {group_event.dtype}")
                
                # Fit Kaplan-Meier with error handling
                try:
                    kmf = KaplanMeierFitter()
                    kmf.fit(group_time, group_event, label=str(group))
                except Exception as e:
                    raise ValueError(f"KaplanMeierFitter failed for group '{group}': {str(e)}")
                
                # Plot survival curve with confidence intervals
                color = colors[i % len(colors)]
                try:
                    kmf.plot_survival_function(ax=ax_main, color=color, linewidth=2.5, alpha=0.8)
                except Exception as e:
                    print(f"DEBUG: Error in plot_survival_function for {group}: {e}")
                    raise ValueError(f"Failed to plot survival curve for group '{group}': {str(e)}")
                
                # Skip confidence intervals completely to avoid division errors
                print(f"DEBUG: Skipping confidence intervals for {group} to avoid potential errors")
                
                survival_data[group] = {
                    'kmf': kmf,
                    'median_survival': kmf.median_survival_time_,
                    'events': int(pd.to_numeric(group_event, errors='coerce').sum()),
                    'total': len(group_event)
                }
            
            # Log-rank test
            if len(groups) == 2:
                group1_mask = clean_data[group_var] == groups[0]
                group2_mask = clean_data[group_var] == groups[1]
                
                group1_time = time_data[group1_mask].values
                group1_event = event_data[group1_mask].values
                group2_time = time_data[group2_mask].values
                group2_event = event_data[group2_mask].values
                
                logrank_result = logrank_test(group1_time, group2_time, group1_event, group2_event)
                
                # Add p-value annotation
                ax_main.text(0.05, 0.05, f'Log-rank p = {logrank_result.p_value:.3f}',
                           transform=ax_main.transAxes, bbox=dict(boxstyle="round,pad=0.3", 
                           facecolor="white", alpha=0.8), fontsize=self.style_config['font_sizes']['legend'])
            
            # Create risk table
            self._create_risk_table(ax_table, survival_data, groups)
            
        else:
            # Single group survival curve
            try:
                kmf = KaplanMeierFitter()
                kmf.fit(time_data.values, event_data.values)
                print(f"DEBUG: Single group KM fit successful, {len(time_data)} observations")
                
                kmf.plot_survival_function(ax=ax_main, color=self.style_config['colors'][0], linewidth=2.5)
                print(f"DEBUG: Single group plotting successful")
            except Exception as e:
                print(f"DEBUG: Single group error: {e}")
                print(f"DEBUG: Time data type: {time_data.dtype}, Event data type: {event_data.dtype}")
                raise ValueError(f"KaplanMeierFitter failed for single group: {str(e)}")
            ax_table.axis('off')  # Hide risk table for single group
        
        # Styling
        ax_main.set_ylabel('Survival Probability', fontsize=self.style_config['font_sizes']['labels'], fontweight='bold')
        ax_main.set_xlabel('Time', fontsize=self.style_config['font_sizes']['labels'], fontweight='bold')
        ax_main.set_ylim(0, 1.05)
        ax_main.grid(True, alpha=0.3)
        ax_main.legend(frameon=False, loc='best')
        
        if title:
            ax_main.set_title(title, fontsize=self.style_config['font_sizes']['title'], fontweight='bold', pad=20)
        
        plt.tight_layout()
        return self._figure_to_base64(fig, format_type)
    
    def create_forest_plot(self, effect_data: List[Dict], title: str = None) -> str:
        """Create publication-ready forest plot for meta-analysis"""
        
        n_studies = len(effect_data)
        fig_width, fig_height = self._calculate_figure_size('forest', n_studies, 'complex')
        fig, ax = plt.subplots(figsize=(fig_width, fig_height), dpi=self.style_config['dpi'])
        
        y_positions = range(len(effect_data))
        
        for i, study in enumerate(effect_data):
            effect = study['effect']
            ci_lower = study['ci_lower']
            ci_upper = study['ci_upper']
            weight = study.get('weight', 1.0)
            study_name = study['name']
            
            # Calculate marker size based on weight
            marker_size = 50 + (weight * 200)
            
            # Plot point estimate
            ax.scatter(effect, i, s=marker_size, color=self.style_config['colors'][0], 
                      alpha=0.7, edgecolor='black', linewidth=1, zorder=3)
            
            # Plot confidence interval
            ax.plot([ci_lower, ci_upper], [i, i], color='black', linewidth=2, alpha=0.8)
            ax.plot([ci_lower, ci_lower], [i-0.1, i+0.1], color='black', linewidth=2)
            ax.plot([ci_upper, ci_upper], [i-0.1, i+0.1], color='black', linewidth=2)
            
            # Add study label
            ax.text(-0.1, i, study_name, ha='right', va='center', 
                   fontsize=self.style_config['font_sizes']['ticks'], transform=ax.get_yaxis_transform())
            
            # Add effect size text
            effect_text = f"{effect:.2f} ({ci_lower:.2f}, {ci_upper:.2f})"
            ax.text(1.02, i, effect_text, ha='left', va='center',
                   fontsize=self.style_config['font_sizes']['ticks'], transform=ax.get_yaxis_transform())
        
        # Add reference line at null effect
        ax.axvline(x=0, color='red', linestyle='--', alpha=0.7, linewidth=1.5)
        
        # Styling
        ax.set_yticks(y_positions)
        ax.set_yticklabels([])
        ax.set_xlabel('Effect Size (95% CI)', fontsize=self.style_config['font_sizes']['labels'], fontweight='bold')
        ax.spines['left'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['top'].set_visible(False)
        ax.set_ylim(-0.5, len(effect_data) - 0.5)
        
        if title:
            ax.set_title(title, fontsize=self.style_config['font_sizes']['title'], fontweight='bold', pad=20)
        
        plt.tight_layout()
        return self._figure_to_base64(fig)
    
    def create_contingency_heatmap(self, data: pd.DataFrame, outcome_var: str, group_var: str,
                                 title: str = None, custom_labels: Dict = None, format_type: str = 'png') -> str:
        """Create publication-ready contingency table heatmap for chi-square analysis"""
        
        # Create contingency table
        contingency_table = pd.crosstab(data[outcome_var], data[group_var])
        
        fig_width, fig_height = self._calculate_figure_size('heatmap', len(contingency_table.columns))
        fig, ax = plt.subplots(figsize=(fig_width, fig_height), dpi=self.style_config['dpi'])
        
        # Create heatmap with count annotations
        im = ax.imshow(contingency_table.values, cmap='Blues', aspect='auto')
        
        # Add count annotations
        for i in range(len(contingency_table.index)):
            for j in range(len(contingency_table.columns)):
                count = contingency_table.values[i, j]
                text_color = 'white' if count > contingency_table.values.max() * 0.6 else 'black'
                ax.text(j, i, str(count), ha='center', va='center', 
                       color=text_color, fontsize=self.style_config['font_sizes']['labels'],
                       fontweight='bold')
        
        # Set labels
        ax.set_xticks(range(len(contingency_table.columns)))
        ax.set_yticks(range(len(contingency_table.index)))
        ax.set_xticklabels(contingency_table.columns, fontsize=self.style_config['font_sizes']['ticks'])
        ax.set_yticklabels(contingency_table.index, fontsize=self.style_config['font_sizes']['ticks'])
        
        # Labels and title
        ax.set_xlabel(custom_labels.get('x', group_var.replace('_', ' ').title()) if custom_labels else group_var.replace('_', ' ').title(),
                     fontsize=self.style_config['font_sizes']['labels'], fontweight='bold')
        ax.set_ylabel(custom_labels.get('y', outcome_var.replace('_', ' ').title()) if custom_labels else outcome_var.replace('_', ' ').title(),
                     fontsize=self.style_config['font_sizes']['labels'], fontweight='bold')
        
        if title or (custom_labels and custom_labels.get('title')):
            plot_title = title or custom_labels.get('title')
            ax.set_title(plot_title, fontsize=self.style_config['font_sizes']['title'], 
                        fontweight='bold', pad=20)
        
        # Add colorbar
        cbar = plt.colorbar(im, ax=ax, shrink=0.8)
        cbar.set_label('Count', rotation=270, labelpad=20,
                      fontsize=self.style_config['font_sizes']['labels'])
        
        plt.tight_layout()
        return self._figure_to_base64(fig, format_type)

    def create_correlation_heatmap(self, data: pd.DataFrame, variables: List[str], 
                                 method: str = 'pearson', title: str = None) -> str:
        """Create publication-ready correlation heatmap with significance stars"""
        
        # Calculate correlations and p-values
        corr_matrix = data[variables].corr(method=method)
        p_values = np.zeros_like(corr_matrix)
        
        for i, var1 in enumerate(variables):
            for j, var2 in enumerate(variables):
                if i != j:
                    if method == 'pearson':
                        _, p_val = stats.pearsonr(data[var1].dropna(), data[var2].dropna())
                    elif method == 'spearman':
                        _, p_val = stats.spearmanr(data[var1].dropna(), data[var2].dropna())
                    p_values[i, j] = p_val
        
        fig_width, fig_height = self._calculate_figure_size('correlation', len(variables))
        fig, ax = plt.subplots(figsize=(fig_width, fig_height), dpi=self.style_config['dpi'])
        
        # Create heatmap
        mask = np.triu(np.ones_like(corr_matrix, dtype=bool))  # Mask upper triangle
        
        im = ax.imshow(corr_matrix, cmap='RdBu_r', vmin=-1, vmax=1, aspect='equal')
        
        # Add correlation values and significance stars
        for i in range(len(variables)):
            for j in range(len(variables)):
                if not mask[i, j]:  # Only show lower triangle
                    corr_val = corr_matrix.iloc[i, j]
                    text = f'{corr_val:.2f}'
                    
                    # Add significance stars
                    if i != j:
                        p_val = p_values[i, j]
                        if p_val < 0.001:
                            text += '***'
                        elif p_val < 0.01:
                            text += '**'
                        elif p_val < 0.05:
                            text += '*'
                    
                    # Color text based on correlation strength
                    text_color = 'white' if abs(corr_val) > 0.5 else 'black'
                    ax.text(j, i, text, ha='center', va='center', 
                           color=text_color, fontsize=self.style_config['font_sizes']['ticks'],
                           fontweight='bold')
        
        # Styling
        ax.set_xticks(range(len(variables)))
        ax.set_yticks(range(len(variables)))
        ax.set_xticklabels(variables, rotation=45, ha='right')
        ax.set_yticklabels(variables)
        
        # Add colorbar
        cbar = plt.colorbar(im, ax=ax, shrink=0.8)
        cbar.set_label(f'{method.title()} Correlation', rotation=270, labelpad=20,
                      fontsize=self.style_config['font_sizes']['labels'])
        
        if title:
            ax.set_title(title, fontsize=self.style_config['font_sizes']['title'], fontweight='bold', pad=20)
        
        plt.tight_layout()
        return self._figure_to_base64(fig)
    
    def _add_statistical_annotations(self, ax, group_data: List, group_names: List):
        """Add statistical significance annotations to plots"""
        if len(group_data) == 2:
            # Perform t-test for two groups
            stat, p_value = stats.ttest_ind(group_data[0], group_data[1])
            
            # Add significance line and annotation
            y_max = max([max(data) for data in group_data])
            y_pos = y_max * 1.05
            
            # Significance line
            ax.plot([1, 2], [y_pos, y_pos], 'k-', linewidth=1.5)
            ax.plot([1, 1], [y_pos - y_max*0.01, y_pos], 'k-', linewidth=1.5)
            ax.plot([2, 2], [y_pos - y_max*0.01, y_pos], 'k-', linewidth=1.5)
            
            # P-value annotation
            if p_value < 0.001:
                sig_text = '***'
            elif p_value < 0.01:
                sig_text = '**'
            elif p_value < 0.05:
                sig_text = '*'
            else:
                sig_text = 'ns'
            
            ax.text(1.5, y_pos + y_max*0.02, sig_text, ha='center', va='bottom',
                   fontsize=self.style_config['font_sizes']['legend'], fontweight='bold')
    
    def _create_risk_table(self, ax, survival_data: Dict, groups: List):
        """Create risk table for Kaplan-Meier plots with proper at-risk calculations"""
        ax.axis('off')
        
        try:
            # Get all unique time points from all groups
            all_times = set()
            for group in groups:
                kmf = survival_data[group]['kmf']
                all_times.update(kmf.timeline)
            
            # Select reasonable time points for display (up to 6 points)
            sorted_times = sorted(all_times)
            if len(sorted_times) > 6:
                # Select evenly spaced time points
                step = len(sorted_times) // 6
                time_points = [sorted_times[i * step] for i in range(6)]
            else:
                time_points = sorted_times[:6]
            
            # Create table data with proper at-risk calculations
            table_data = []
            for group in groups:
                kmf = survival_data[group]['kmf']
                row = [str(group)]
                
                for t in time_points:
                    # Calculate number at risk at time t
                    # Use event table if available, otherwise estimate
                    if hasattr(kmf, 'event_table') and not kmf.event_table.empty:
                        # Find closest time point in event table
                        closest_time_idx = (kmf.event_table.index <= t).sum() - 1
                        if closest_time_idx >= 0:
                            at_risk = kmf.event_table.iloc[closest_time_idx]['at_risk']
                        else:
                            at_risk = survival_data[group]['total']
                    else:
                        # Fallback: estimate based on timeline
                        at_risk = (kmf.timeline >= t).sum()
                    
                    row.append(str(int(at_risk)))
                table_data.append(row)
            
            # Plot table
            table = ax.table(cellText=table_data,
                            colLabels=['Group'] + [f'{t:.1f}' for t in time_points],
                            loc='center',
                            cellLoc='center')
            
            table.auto_set_font_size(False)
            table.set_fontsize(self.style_config['font_sizes']['ticks'])
            table.scale(1, 2)
            
            ax.set_title('Number at Risk', fontsize=self.style_config['font_sizes']['legend'], pad=10)
            
        except Exception as e:
            # If risk table fails, create a simple message instead
            ax.text(0.5, 0.5, f'Risk table unavailable\n({len(groups)} groups analyzed)', 
                   ha='center', va='center', transform=ax.transAxes,
                   fontsize=self.style_config['font_sizes']['ticks'])
    
    def _apply_professional_styling(self, ax, custom_labels: Dict, outcome_var: str, 
                                  group_var: str, title: str = None):
        """Apply consistent professional styling to plots"""
        
        # Labels
        x_label = custom_labels.get('x', group_var.replace('_', ' ').title())
        y_label = custom_labels.get('y', outcome_var.replace('_', ' ').title())
        
        ax.set_xlabel(x_label, fontsize=self.style_config['font_sizes']['labels'], fontweight='bold')
        ax.set_ylabel(y_label, fontsize=self.style_config['font_sizes']['labels'], fontweight='bold')
        
        if title or custom_labels.get('title'):
            plot_title = title or custom_labels.get('title')
            ax.set_title(plot_title, fontsize=self.style_config['font_sizes']['title'], 
                        fontweight='bold', pad=20)
        
        # Remove top and right spines
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        
        # Style remaining spines
        ax.spines['left'].set_linewidth(1.2)
        ax.spines['bottom'].set_linewidth(1.2)
        ax.spines['left'].set_color('#000000')
        ax.spines['bottom'].set_color('#000000')
        
        # Tick styling
        ax.tick_params(axis='both', which='major', labelsize=self.style_config['font_sizes']['ticks'],
                      width=1.2, length=5, color='#000000')
        ax.tick_params(axis='both', which='minor', width=0.8, length=3, color='#000000')
    
    def _figure_to_base64(self, fig, format_type: str = 'png') -> str:
        """Convert matplotlib figure to base64 string"""
        buffer = io.BytesIO()
        
        # Ensure proper format handling
        if format_type.lower() == 'pdf':
            fig.savefig(buffer, format='pdf', dpi=self.style_config['dpi'], 
                       bbox_inches='tight', facecolor='white', edgecolor='none',
                       metadata={'Creator': 'SciFig AI', 'Producer': 'PublicationVizEngine'},
                       transparent=False, pad_inches=0.1)
        elif format_type.lower() == 'svg':
            fig.savefig(buffer, format='svg', dpi=self.style_config['dpi'], 
                       bbox_inches='tight', facecolor='white', edgecolor='none')
        elif format_type.lower() == 'eps':
            fig.savefig(buffer, format='eps', dpi=self.style_config['dpi'], 
                       bbox_inches='tight', facecolor='white', edgecolor='none')
        else:  # Default to PNG
            fig.savefig(buffer, format='png', dpi=self.style_config['dpi'], 
                       bbox_inches='tight', facecolor='white', edgecolor='none')
        
        buffer.seek(0)
        image_data = buffer.getvalue()
        buffer.close()
        plt.close(fig)
        
        return base64.b64encode(image_data).decode('utf-8')
    
    def create_code_editable_figure(self, data: pd.DataFrame, outcome_var: str, group_var: str,
                                  analysis_type: str, code_params: Dict[str, Any],
                                  title: str = None, custom_labels: Dict = None, 
                                  time_var: str = None, event_var: str = None, format_type: str = 'png') -> str:
        """Create figure with user-editable code parameters"""
        
        # Extract code parameters with defaults
        figure_width = code_params.get('figure_width', 4.5)
        figure_height = code_params.get('figure_height', 3.5)
        title_font_size = code_params.get('title_font_size', self.style_config['font_sizes']['title'])
        label_font_size = code_params.get('label_font_size', self.style_config['font_sizes']['labels'])
        tick_font_size = code_params.get('tick_font_size', self.style_config['font_sizes']['ticks'])
        line_width = code_params.get('line_width', self.style_config['line_width'])
        marker_size = code_params.get('marker_size', self.style_config['marker_size'])
        dpi = code_params.get('dpi', self.style_config['dpi'])
        font_weight = code_params.get('font_weight', 'bold')
        grid_alpha = code_params.get('grid_alpha', 0.3)
        colors = code_params.get('colors', self.style_config['colors'])
        
        # Ensure proper matplotlib backend for PDF generation
        if format_type.lower() == 'pdf':
            plt.ioff()  # Turn off interactive mode for PDF
            # Re-apply matplotlib configuration for PDF
            self._setup_matplotlib_defaults()
            
        # Create figure with custom parameters
        fig, ax = plt.subplots(figsize=(figure_width, figure_height), dpi=dpi)
        
        # Ensure proper figure properties for PDF
        if format_type.lower() == 'pdf':
            fig.patch.set_facecolor('white')
            fig.patch.set_alpha(1.0)
            ax.patch.set_facecolor('white')
        
        if analysis_type in ["independent_ttest", "mann_whitney_u", "one_way_anova"]:
            # Custom box plot
            groups = data[group_var].unique()
            group_data = [data[data[group_var] == group][outcome_var].dropna() for group in groups]
            
            box_plot = ax.boxplot(group_data, labels=groups, patch_artist=True,
                                 boxprops=dict(facecolor='lightblue', alpha=0.7, linewidth=line_width),
                                 medianprops=dict(color='red', linewidth=line_width * 1.5),
                                 whiskerprops=dict(linewidth=line_width, color='black'),
                                 capprops=dict(linewidth=line_width, color='black'))
            
            # Add individual points with custom styling
            for i, (group, group_values) in enumerate(zip(groups, group_data)):
                y_values = group_values.values
                x_values = np.random.normal(i + 1, 0.04, size=len(y_values))
                ax.scatter(x_values, y_values, alpha=0.7, s=marker_size * 5, 
                          color=colors[i % len(colors)], zorder=3, edgecolor='white', linewidth=0.5)
        
        elif analysis_type == "survival_analysis" and time_var and event_var:
            # Custom Kaplan-Meier plot (simplified for code editing)
            groups = data[group_var].unique() if group_var else ['All']
            for i, group in enumerate(groups):
                if group_var:
                    mask = data[group_var] == group
                    group_data = data[mask].reset_index(drop=True)
                else:
                    group_data = data.reset_index(drop=True)
                
                # Clean and convert data properly
                group_data = group_data.dropna(subset=[time_var, event_var])
                time_data = pd.to_numeric(group_data[time_var], errors='coerce')
                # Use intelligent event conversion
                event_data = self._detect_and_convert_event_variable(group_data[event_var], f"{event_var}_{group}")
                
                # Remove NaN values after conversion
                valid_mask = ~time_data.isna()
                time_data = time_data[valid_mask].values
                event_data = event_data[valid_mask].values
                
                if len(time_data) > 0:
                    try:
                        # Additional validation for code editor
                        if time_data.min() < 0:
                            raise ValueError("Time values cannot be negative")
                        if not set(event_data).issubset({0, 1}):
                            raise ValueError("Event values must be 0 or 1")
                            
                        kmf = KaplanMeierFitter()
                        kmf.fit(time_data, event_data, label=str(group))
                        kmf.plot_survival_function(ax=ax, color=colors[i % len(colors)], 
                                                 linewidth=line_width, alpha=0.8)
                    except Exception as e:
                        # If KM fails, add error text to plot
                        ax.text(0.5, 0.5, f'Survival analysis failed for {group}:\n{str(e)}', 
                               ha='center', va='center', transform=ax.transAxes,
                               fontsize=label_font_size, color='red')
            
            ax.set_ylim(0, 1.05)
            ax.grid(True, alpha=grid_alpha)
            ax.legend(frameon=False, loc='best')
        
        elif analysis_type == "chi_square":
            # Custom contingency heatmap
            contingency_table = pd.crosstab(data[outcome_var], data[group_var])
            im = ax.imshow(contingency_table.values, cmap='Blues', aspect='auto')
            
            # Add annotations
            for i in range(len(contingency_table.index)):
                for j in range(len(contingency_table.columns)):
                    count = contingency_table.values[i, j]
                    text_color = 'white' if count > contingency_table.values.max() * 0.6 else 'black'
                    ax.text(j, i, str(count), ha='center', va='center', 
                           color=text_color, fontsize=label_font_size, fontweight=font_weight)
            
            ax.set_xticks(range(len(contingency_table.columns)))
            ax.set_yticks(range(len(contingency_table.index)))
            ax.set_xticklabels(contingency_table.columns, fontsize=tick_font_size)
            ax.set_yticklabels(contingency_table.index, fontsize=tick_font_size)
            
            # Add colorbar
            cbar = plt.colorbar(im, ax=ax, shrink=0.8)
            cbar.set_label('Count', rotation=270, labelpad=20, fontsize=label_font_size)
        
        # Apply custom styling
        x_label = custom_labels.get('x', group_var.replace('_', ' ').title()) if custom_labels else group_var.replace('_', ' ').title()
        y_label = custom_labels.get('y', outcome_var.replace('_', ' ').title()) if custom_labels else outcome_var.replace('_', ' ').title()
        
        ax.set_xlabel(x_label, fontsize=label_font_size, fontweight=font_weight)
        ax.set_ylabel(y_label, fontsize=label_font_size, fontweight=font_weight)
        
        if title or (custom_labels and custom_labels.get('title')):
            plot_title = title or custom_labels.get('title')
            ax.set_title(plot_title, fontsize=title_font_size, fontweight=font_weight, pad=20)
        
        # Styling
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_linewidth(line_width)
        ax.spines['bottom'].set_linewidth(line_width)
        ax.tick_params(axis='both', which='major', labelsize=tick_font_size, width=line_width)
        
        plt.tight_layout()
        
        # Additional PDF-specific preparation
        if format_type.lower() == 'pdf':
            # Ensure all elements are properly rendered
            fig.canvas.draw()
            
        result = self._figure_to_base64(fig, format_type)
        
        # Turn interactive mode back on if it was turned off
        if format_type.lower() == 'pdf':
            plt.ion()
            
        return result