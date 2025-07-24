"""
SciFig AI: Publication-Ready Figure Generator
Creates publication-quality scientific figures with journal-specific styling
"""

import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import seaborn as sns
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, Tuple
from pathlib import Path
import uuid

# Journal-specific style presets
JOURNAL_STYLES = {
    "nature": {
        "figure.figsize": (3.5, 3.5),
        "font.size": 8,
        "font.family": "Arial",
        "axes.linewidth": 0.5,
        "lines.linewidth": 0.5,
        "patch.linewidth": 0.5,
        "xtick.major.width": 0.5,
        "ytick.major.width": 0.5,
        "xtick.minor.width": 0.25,
        "ytick.minor.width": 0.25,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "legend.frameon": False,
        "axes.grid": False
    },
    "science": {
        "figure.figsize": (3.3, 3.3),
        "font.size": 9,
        "font.family": "Arial",
        "axes.linewidth": 0.75,
        "lines.linewidth": 1.0,
        "patch.linewidth": 0.75,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "legend.frameon": False
    },
    "nejm": {
        "figure.figsize": (3.6, 3.6),
        "font.size": 8,
        "font.family": "Arial",
        "axes.linewidth": 0.8,
        "lines.linewidth": 0.8,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "legend.frameon": True,
        "legend.fancybox": False,
        "legend.edgecolor": "black",
        "legend.facecolor": "white"
    }
}

# Color palettes for different group counts
COLOR_PALETTES = {
    2: ["#2E86AB", "#A23B72"],  # Blue and magenta
    3: ["#2E86AB", "#A23B72", "#F18F01"],  # Blue, magenta, orange
    4: ["#2E86AB", "#A23B72", "#F18F01", "#C73E1D"],  # Blue, magenta, orange, red
    "default": sns.color_palette("Set2", 8)
}

class FigureGenerator:
    """Generate publication-ready scientific figures"""
    
    def __init__(self, output_dir: str = "static/figures"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def apply_journal_style(self, style: str = "nature") -> None:
        """Apply journal-specific styling"""
        if style in JOURNAL_STYLES:
            plt.rcParams.update(JOURNAL_STYLES[style])
        else:
            plt.rcParams.update(JOURNAL_STYLES["nature"])  # Default to Nature
    
    async def generate_box_plot(self, 
                               analysis_id: str,
                               data: Dict[str, Any],
                               outcome_var: str,
                               group_var: str,
                               style: str = "nature",
                               format: str = "png",
                               dpi: int = 300) -> str:
        """Generate a box plot for group comparison"""
        
        # Apply styling
        self.apply_journal_style(style)
        
        # Extract data and results
        results = data.get("final_result", {})
        groups_data = results.get("groups", {})
        
        if not groups_data:
            raise ValueError("No group data available for plotting")
        
        # Create mock data for plotting (in production, use actual dataset)
        plot_data = []
        group_names = list(groups_data.keys())
        
        # Generate data points based on group statistics
        for group_name, stats in groups_data.items():
            n = stats.get("n", 10)
            mean = stats.get("mean", 0)
            std = stats.get("std", 1)
            
            # Generate synthetic data points that match the statistics
            values = np.random.normal(mean, std, n)
            for value in values:
                plot_data.append({group_var: group_name.replace("group", "Group"), outcome_var: value})
        
        df = pd.DataFrame(plot_data)
        
        # Create figure
        fig, ax = plt.subplots(figsize=plt.rcParams["figure.figsize"])
        
        # Choose colors
        n_groups = len(group_names)
        colors = COLOR_PALETTES.get(n_groups, COLOR_PALETTES["default"])[:n_groups]
        
        # Create box plot
        box_plot = sns.boxplot(
            data=df, 
            x=group_var, 
            y=outcome_var, 
            ax=ax,
            palette=colors,
            linewidth=plt.rcParams["lines.linewidth"]
        )
        
        # Add statistical annotation if significant
        p_value = results.get("p_value", 1.0)
        if p_value < 0.05:
            self._add_significance_annotation(ax, df, group_var, outcome_var, p_value)
        
        # Styling
        ax.set_xlabel(group_var.replace("_", " ").title())
        ax.set_ylabel(outcome_var.replace("_", " ").title())
        ax.set_title("")  # Remove title for publication style
        
        # Remove top and right spines (already set in style)
        sns.despine()
        
        # Adjust layout
        plt.tight_layout()
        
        # Save figure
        filename = f"{analysis_id}_box_plot.{format}"
        output_path = self.output_dir / filename
        
        plt.savefig(
            output_path,
            dpi=dpi,
            format=format,
            bbox_inches="tight",
            facecolor="white",
            edgecolor="none"
        )
        
        plt.close()
        
        return str(output_path)
    
    async def generate_bar_plot(self,
                               analysis_id: str,
                               data: Dict[str, Any],
                               outcome_var: str,
                               group_var: str,
                               style: str = "nature",
                               format: str = "png",
                               dpi: int = 300) -> str:
        """Generate a bar plot with error bars"""
        
        self.apply_journal_style(style)
        
        results = data.get("final_result", {})
        groups_data = results.get("groups", {})
        
        if not groups_data:
            raise ValueError("No group data available for plotting")
        
        # Extract group statistics
        group_names = []
        means = []
        errors = []
        
        for group_name, stats in groups_data.items():
            group_names.append(group_name.replace("group", "Group"))
            means.append(stats.get("mean", 0))
            errors.append(stats.get("sem", 0))  # Standard error of mean
        
        # Create figure
        fig, ax = plt.subplots(figsize=plt.rcParams["figure.figsize"])
        
        # Choose colors
        n_groups = len(group_names)
        colors = COLOR_PALETTES.get(n_groups, COLOR_PALETTES["default"])[:n_groups]
        
        # Create bar plot
        bars = ax.bar(group_names, means, yerr=errors, 
                     capsize=3, color=colors, 
                     linewidth=plt.rcParams["lines.linewidth"],
                     edgecolor="black")
        
        # Add statistical annotation if significant
        p_value = results.get("p_value", 1.0)
        if p_value < 0.05:
            max_height = max([m + e for m, e in zip(means, errors)])
            y_pos = max_height * 1.1
            
            # Add significance bar
            ax.plot([0, len(group_names)-1], [y_pos, y_pos], 'k-', linewidth=1)
            ax.plot([0, 0], [y_pos-max_height*0.02, y_pos], 'k-', linewidth=1)
            ax.plot([len(group_names)-1, len(group_names)-1], [y_pos-max_height*0.02, y_pos], 'k-', linewidth=1)
            
            # Add significance stars
            significance = self._get_significance_stars(p_value)
            ax.text(len(group_names)/2 - 0.5, y_pos + max_height*0.02, significance, 
                   ha='center', va='bottom', fontweight='bold')
        
        # Styling
        ax.set_xlabel(group_var.replace("_", " ").title())
        ax.set_ylabel(outcome_var.replace("_", " ").title())
        ax.set_title("")
        
        sns.despine()
        plt.tight_layout()
        
        # Save figure
        filename = f"{analysis_id}_bar_plot.{format}"
        output_path = self.output_dir / filename
        
        plt.savefig(
            output_path,
            dpi=dpi,
            format=format,
            bbox_inches="tight",
            facecolor="white",
            edgecolor="none"
        )
        
        plt.close()
        
        return str(output_path)
    
    async def generate_scatter_plot(self,
                                   analysis_id: str,
                                   data: Dict[str, Any],
                                   x_var: str,
                                   y_var: str,
                                   group_var: Optional[str] = None,
                                   style: str = "nature",
                                   format: str = "png",
                                   dpi: int = 300) -> str:
        """Generate a scatter plot for correlation analysis"""
        
        self.apply_journal_style(style)
        
        # This would use actual data in production
        # For now, create mock data
        np.random.seed(42)
        n_points = 50
        
        if group_var:
            # Grouped scatter plot
            groups = ["Group A", "Group B"]
            plot_data = []
            
            for i, group in enumerate(groups):
                x_vals = np.random.normal(5 + i*2, 1.5, n_points//2)
                y_vals = 2 * x_vals + np.random.normal(0, 1, n_points//2)
                
                for x, y in zip(x_vals, y_vals):
                    plot_data.append({x_var: x, y_var: y, group_var: group})
        else:
            # Simple scatter plot
            x_vals = np.random.normal(5, 2, n_points)
            y_vals = 2 * x_vals + np.random.normal(0, 2, n_points)
            plot_data = [{x_var: x, y_var: y} for x, y in zip(x_vals, y_vals)]
        
        df = pd.DataFrame(plot_data)
        
        # Create figure
        fig, ax = plt.subplots(figsize=plt.rcParams["figure.figsize"])
        
        if group_var and group_var in df.columns:
            # Grouped scatter
            colors = COLOR_PALETTES.get(2, COLOR_PALETTES["default"])
            sns.scatterplot(data=df, x=x_var, y=y_var, hue=group_var, 
                          palette=colors, ax=ax, s=30)
            ax.legend(frameon=plt.rcParams.get("legend.frameon", False))
        else:
            # Simple scatter
            ax.scatter(df[x_var], df[y_var], 
                      color=COLOR_PALETTES[2][0], s=30, alpha=0.7)
        
        # Add regression line if correlation data available
        results = data.get("final_result", {})
        if "correlation" in results:
            sns.regplot(data=df, x=x_var, y=y_var, scatter=False, 
                       color="red", ax=ax, line_kws={"linewidth": 1})
        
        # Styling
        ax.set_xlabel(x_var.replace("_", " ").title())
        ax.set_ylabel(y_var.replace("_", " ").title())
        ax.set_title("")
        
        sns.despine()
        plt.tight_layout()
        
        # Save figure
        filename = f"{analysis_id}_scatter_plot.{format}"
        output_path = self.output_dir / filename
        
        plt.savefig(
            output_path,
            dpi=dpi,
            format=format,
            bbox_inches="tight",
            facecolor="white",
            edgecolor="none"
        )
        
        plt.close()
        
        return str(output_path)
    
    def _add_significance_annotation(self, ax, df, group_var, outcome_var, p_value):
        """Add significance annotation to plot"""
        groups = df[group_var].unique()
        if len(groups) != 2:
            return
        
        # Get y-positions for annotation
        y_max = df[outcome_var].max()
        y_range = df[outcome_var].max() - df[outcome_var].min()
        y_pos = y_max + y_range * 0.1
        
        # Draw significance bar
        ax.plot([0, 1], [y_pos, y_pos], 'k-', linewidth=1)
        ax.plot([0, 0], [y_pos - y_range*0.02, y_pos], 'k-', linewidth=1)
        ax.plot([1, 1], [y_pos - y_range*0.02, y_pos], 'k-', linewidth=1)
        
        # Add significance stars
        significance = self._get_significance_stars(p_value)
        ax.text(0.5, y_pos + y_range*0.02, significance, 
               ha='center', va='bottom', fontweight='bold', fontsize=12)
    
    def _get_significance_stars(self, p_value: float) -> str:
        """Convert p-value to significance stars"""
        if p_value < 0.001:
            return "***"
        elif p_value < 0.01:
            return "**"
        elif p_value < 0.05:
            return "*"
        else:
            return "ns" 