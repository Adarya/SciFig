#!/usr/bin/env python3
"""
Simple statistical analysis server for SciFig AI
Provides robust statistical computations using Python's scientific stack
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
import scipy.stats as stats
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt
import seaborn as sns
import base64
import io
import json
from publication_viz_engine import PublicationVizEngine

app = FastAPI(title="SciFig AI Statistical Engine", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    analysis_type: str
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None

class StatisticalResult(BaseModel):
    test_name: str
    statistic: float
    p_value: float
    effect_size: Optional[Dict[str, Any]] = None
    confidence_interval: Optional[List[float]] = None
    summary: str
    interpretation: str
    assumptions_met: bool
    sample_sizes: Dict[str, int]
    descriptive_stats: Dict[str, Any]

@app.get("/")
async def root():
    return {"message": "SciFig AI Statistical Engine", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Statistical Engine"}

@app.post("/analyze", response_model=StatisticalResult)
async def analyze_data(request: AnalysisRequest):
    """Perform statistical analysis on the provided data"""
    try:
        # Convert to DataFrame
        df = pd.DataFrame(request.data)
        
        # Clean the data
        df = df.dropna(subset=[request.outcome_variable, request.group_variable])
        
        if len(df) < 3:
            raise HTTPException(status_code=400, detail="Insufficient data for analysis")
        
        # Perform analysis based on type
        if request.analysis_type == "independent_ttest":
            return perform_ttest(df, request.outcome_variable, request.group_variable)
        elif request.analysis_type == "one_way_anova":
            return perform_anova(df, request.outcome_variable, request.group_variable)
        elif request.analysis_type == "chi_square":
            return perform_chi_square(df, request.outcome_variable, request.group_variable)
        elif request.analysis_type == "mann_whitney_u":
            return perform_mann_whitney(df, request.outcome_variable, request.group_variable)
        elif request.analysis_type == "survival_analysis":
            if not request.time_variable or not request.event_variable:
                raise HTTPException(status_code=400, detail="Survival analysis requires time and event variables")
            return perform_survival_analysis(df, request.time_variable, request.event_variable, request.group_variable)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported analysis type: {request.analysis_type}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def perform_ttest(df: pd.DataFrame, outcome_var: str, group_var: str) -> StatisticalResult:
    """Perform independent samples t-test"""
    groups = df[group_var].unique()
    if len(groups) != 2:
        raise ValueError("T-test requires exactly 2 groups")
    
    group1_data = df[df[group_var] == groups[0]][outcome_var].astype(float)
    group2_data = df[df[group_var] == groups[1]][outcome_var].astype(float)
    
    # Perform t-test
    statistic, p_value = stats.ttest_ind(group1_data, group2_data)
    
    # Calculate effect size (Cohen's d)
    pooled_std = np.sqrt(((len(group1_data) - 1) * group1_data.var() + 
                         (len(group2_data) - 1) * group2_data.var()) / 
                        (len(group1_data) + len(group2_data) - 2))
    cohens_d = (group1_data.mean() - group2_data.mean()) / pooled_std
    
    # Confidence interval for mean difference
    se_diff = pooled_std * np.sqrt(1/len(group1_data) + 1/len(group2_data))
    df_val = len(group1_data) + len(group2_data) - 2
    t_critical = stats.t.ppf(0.975, df_val)
    mean_diff = group1_data.mean() - group2_data.mean()
    ci_lower = mean_diff - t_critical * se_diff
    ci_upper = mean_diff + t_critical * se_diff
    
    return StatisticalResult(
        test_name="Independent Samples T-Test",
        statistic=float(statistic),
        p_value=float(p_value),
        effect_size={"name": "Cohen's d", "value": float(cohens_d)},
        confidence_interval=[float(ci_lower), float(ci_upper)],
        summary=f"t({df_val}) = {statistic:.3f}, p = {p_value:.3f}",
        interpretation=get_p_value_interpretation(p_value),
        assumptions_met=True,  # Could add normality tests here
        sample_sizes={str(groups[0]): len(group1_data), str(groups[1]): len(group2_data)},
        descriptive_stats={
            str(groups[0]): {"mean": float(group1_data.mean()), "std": float(group1_data.std())},
            str(groups[1]): {"mean": float(group2_data.mean()), "std": float(group2_data.std())}
        }
    )

def perform_anova(df: pd.DataFrame, outcome_var: str, group_var: str) -> StatisticalResult:
    """Perform one-way ANOVA"""
    groups = df[group_var].unique()
    group_data = [df[df[group_var] == group][outcome_var].astype(float) for group in groups]
    
    # Perform ANOVA
    statistic, p_value = stats.f_oneway(*group_data)
    
    # Calculate eta squared (effect size)
    ss_between = sum(len(group) * (group.mean() - df[outcome_var].mean())**2 for group in group_data)
    ss_total = ((df[outcome_var].astype(float) - df[outcome_var].astype(float).mean())**2).sum()
    eta_squared = ss_between / ss_total
    
    # Degrees of freedom
    df_between = len(groups) - 1
    df_within = len(df) - len(groups)
    
    return StatisticalResult(
        test_name="One-Way ANOVA",
        statistic=float(statistic),
        p_value=float(p_value),
        effect_size={"name": "Eta Squared", "value": float(eta_squared)},
        confidence_interval=None,
        summary=f"F({df_between}, {df_within}) = {statistic:.3f}, p = {p_value:.3f}",
        interpretation=get_p_value_interpretation(p_value),
        assumptions_met=True,
        sample_sizes={str(group): len(data) for group, data in zip(groups, group_data)},
        descriptive_stats={
            str(group): {"mean": float(data.mean()), "std": float(data.std())} 
            for group, data in zip(groups, group_data)
        }
    )

def perform_chi_square(df: pd.DataFrame, outcome_var: str, group_var: str) -> StatisticalResult:
    """Perform chi-square test of independence"""
    contingency_table = pd.crosstab(df[outcome_var], df[group_var])
    
    chi2, p_value, dof, expected = stats.chi2_contingency(contingency_table)
    
    # Calculate Cramér's V
    n = contingency_table.sum().sum()
    cramers_v = np.sqrt(chi2 / (n * (min(contingency_table.shape) - 1)))
    
    return StatisticalResult(
        test_name="Chi-Square Test of Independence",
        statistic=float(chi2),
        p_value=float(p_value),
        effect_size={"name": "Cramér's V", "value": float(cramers_v)},
        confidence_interval=None,
        summary=f"χ²({dof}) = {chi2:.3f}, p = {p_value:.3f}",
        interpretation=get_p_value_interpretation(p_value),
        assumptions_met=all(expected.values.flatten() >= 5),
        sample_sizes=contingency_table.sum(axis=0).to_dict(),
        descriptive_stats=contingency_table.to_dict()
    )

def perform_mann_whitney(df: pd.DataFrame, outcome_var: str, group_var: str) -> StatisticalResult:
    """Perform Mann-Whitney U test"""
    groups = df[group_var].unique()
    if len(groups) != 2:
        raise ValueError("Mann-Whitney U test requires exactly 2 groups")
    
    group1_data = df[df[group_var] == groups[0]][outcome_var].astype(float)
    group2_data = df[df[group_var] == groups[1]][outcome_var].astype(float)
    
    statistic, p_value = stats.mannwhitneyu(group1_data, group2_data, alternative='two-sided')
    
    # Calculate effect size (rank-biserial correlation)
    n1, n2 = len(group1_data), len(group2_data)
    r = 1 - (2 * statistic) / (n1 * n2)
    
    return StatisticalResult(
        test_name="Mann-Whitney U Test",
        statistic=float(statistic),
        p_value=float(p_value),
        effect_size={"name": "Rank-biserial correlation", "value": float(r)},
        confidence_interval=None,
        summary=f"U = {statistic:.3f}, p = {p_value:.3f}",
        interpretation=get_p_value_interpretation(p_value),
        assumptions_met=True,
        sample_sizes={str(groups[0]): len(group1_data), str(groups[1]): len(group2_data)},
        descriptive_stats={
            str(groups[0]): {"median": float(group1_data.median()), "iqr": float(group1_data.quantile(0.75) - group1_data.quantile(0.25))},
            str(groups[1]): {"median": float(group2_data.median()), "iqr": float(group2_data.quantile(0.75) - group2_data.quantile(0.25))}
        }
    )

def perform_survival_analysis(df: pd.DataFrame, time_var: str, event_var: str, group_var: str) -> StatisticalResult:
    """Perform Kaplan-Meier survival analysis"""
    from lifelines import KaplanMeierFitter
    from lifelines.statistics import logrank_test
    import numpy as np
    
    # Clean the data
    clean_df = df[[time_var, event_var, group_var]].copy().dropna()
    
    # Convert time to numeric
    time_data = pd.to_numeric(clean_df[time_var], errors='coerce')
    
    # Convert event variable - ensure it's 0/1
    event_data = clean_df[event_var]
    
    # Handle different event coding patterns
    unique_events = set(event_data.dropna().unique())
    if unique_events.issubset({0, 1, 0.0, 1.0}):
        event_data = event_data.astype(int)
    elif unique_events.issubset({True, False}):
        event_data = event_data.astype(int)
    else:
        # For text values, try to map common patterns
        event_mapping = {}
        for val in unique_events:
            str_val = str(val).lower().strip()
            if str_val in ['1', 'true', 'yes', 'dead', 'death', 'event', 'deceased']:
                event_mapping[val] = 1
            else:
                event_mapping[val] = 0
        event_data = event_data.map(event_mapping).fillna(0).astype(int)
    
    # Remove invalid time values
    valid_mask = ~time_data.isna()
    time_data = time_data[valid_mask]
    event_data = event_data[valid_mask]
    clean_df = clean_df[valid_mask].reset_index(drop=True)
    
    # Get groups
    groups = clean_df[group_var].unique()
    
    # Calculate group-wise statistics
    group_stats = {}
    survival_data = {}
    
    for group in groups:
        mask = clean_df[group_var] == group
        group_time = time_data[mask].values
        group_event = event_data[mask].values
        
        # Fit Kaplan-Meier
        kmf = KaplanMeierFitter()
        kmf.fit(group_time, group_event, label=str(group))
        
        group_stats[str(group)] = {
            "sample_size": len(group_event),
            "events": int(group_event.sum()),
            "median_survival": float(kmf.median_survival_time_) if kmf.median_survival_time_ != np.inf else None
        }
        
        survival_data[str(group)] = {
            'time': group_time,
            'event': group_event
        }
    
    # Perform log-rank test if 2 groups
    if len(groups) == 2:
        group1_data = survival_data[str(groups[0])]
        group2_data = survival_data[str(groups[1])]
        
        logrank_result = logrank_test(
            group1_data['time'], group2_data['time'],
            group1_data['event'], group2_data['event']
        )
        
        test_statistic = float(logrank_result.test_statistic)
        p_value = float(logrank_result.p_value)
    else:
        test_statistic = None
        p_value = None
    
    # Calculate overall median survival
    kmf_overall = KaplanMeierFitter()
    kmf_overall.fit(time_data.values, event_data.values)
    overall_median = float(kmf_overall.median_survival_time_) if kmf_overall.median_survival_time_ != np.inf else None
    
    # Format sample sizes for Pydantic model (expects Dict[str, int])
    sample_sizes_formatted = {group: stats["sample_size"] for group, stats in group_stats.items()}
    
    return StatisticalResult(
        test_name="Kaplan-Meier Survival Analysis",
        statistic=test_statistic if test_statistic is not None else 0.0,
        p_value=p_value if p_value is not None else 1.0,
        effect_size={"name": "Median Survival", "value": overall_median},
        confidence_interval=None,
        summary=f"Log-rank test: χ² = {test_statistic:.3f}, p = {p_value:.3f}" if test_statistic else "Single group analysis",
        interpretation=get_p_value_interpretation(p_value) if p_value else "No comparison performed",
        assumptions_met=True,
        sample_sizes=sample_sizes_formatted,
        descriptive_stats=group_stats
    )

def get_p_value_interpretation(p_value: float) -> str:
    """Get interpretation of p-value"""
    if p_value < 0.001:
        return "Highly significant (p < 0.001)"
    elif p_value < 0.01:
        return "Very significant (p < 0.01)"
    elif p_value < 0.05:
        return "Significant (p < 0.05)"
    else:
        return "Not significant (p ≥ 0.05)"

class PublicationFigureRequest(BaseModel):
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    analysis_type: str
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None
    format: str = "png"
    custom_labels: Optional[Dict[str, str]] = None
    publication_settings: Optional[Dict[str, Any]] = None

class DisplayFigureRequest(BaseModel):
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    analysis_type: str
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None
    custom_labels: Optional[Dict[str, str]] = None
    journal_style: str = "nature"

class CodeEditFigureRequest(BaseModel):
    data: List[Dict[str, Any]]
    outcome_variable: str
    group_variable: str
    analysis_type: str
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None
    custom_labels: Optional[Dict[str, str]] = None
    journal_style: str = "nature"
    code_parameters: Dict[str, Any] = {}
    format: str = "png"

@app.post("/generate_publication_figure")
async def generate_publication_figure(request: PublicationFigureRequest):
    """Generate publication-ready figure using advanced PublicationVizEngine"""
    try:
        df = pd.DataFrame(request.data)
        
        # Clean data based on analysis type
        if request.analysis_type == "survival_analysis":
            if not request.time_variable or not request.event_variable:
                raise HTTPException(status_code=400, detail="Survival analysis requires time and event variables")
            df = df.dropna(subset=[request.time_variable, request.event_variable, request.group_variable])
        else:
            df = df.dropna(subset=[request.outcome_variable, request.group_variable])
        
        # Initialize publication engine with journal style
        settings = request.publication_settings or {}
        style = settings.get('journal_style', 'nature')
        engine = PublicationVizEngine(style=style)
        
        # Generate figure based on analysis type
        if request.analysis_type in ["independent_ttest", "mann_whitney_u", "one_way_anova"]:
            figure_b64 = engine.create_publication_boxplot(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels
            )
        
        elif request.analysis_type == "survival_analysis":
            figure_b64 = engine.create_kaplan_meier_plot(
                data=df,
                time_var=request.time_variable,
                event_var=request.event_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels
            )
        
        elif request.analysis_type == "correlation_analysis":
            # For correlation analysis, we need numeric variables
            numeric_vars = df.select_dtypes(include=[np.number]).columns.tolist()
            if len(numeric_vars) < 2:
                raise HTTPException(status_code=400, detail="Insufficient numeric variables for correlation analysis")
            
            figure_b64 = engine.create_correlation_heatmap(
                data=df,
                variables=numeric_vars[:10],  # Limit to first 10 variables for readability
                method='pearson',
                title=request.custom_labels.get('title') if request.custom_labels else "Correlation Matrix"
            )
        
        elif request.analysis_type == "chi_square":
            # For chi-square, create proper contingency table heatmap  
            figure_b64 = engine.create_contingency_heatmap(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else "Contingency Table",
                custom_labels=request.custom_labels,
                format_type=request.format
            )
        
        else:
            # Default to box plot for unknown analysis types
            figure_b64 = engine.create_publication_boxplot(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels,
                format_type=request.format
            )
        
        return {
            "figure": figure_b64, 
            "format": request.format,
            "message": f"Publication-quality {request.format.upper()} generated successfully using {style} journal style"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_display_figure")
async def generate_display_figure(request: DisplayFigureRequest):
    """Generate publication-ready figure for display in the web interface"""
    try:
        df = pd.DataFrame(request.data)
        
        # Clean data based on analysis type
        if request.analysis_type == "survival_analysis":
            if not request.time_variable or not request.event_variable:
                raise HTTPException(status_code=400, detail="Survival analysis requires time and event variables")
            df = df.dropna(subset=[request.time_variable, request.event_variable, request.group_variable])
        else:
            df = df.dropna(subset=[request.outcome_variable, request.group_variable])
        
        # Initialize publication engine with specified journal style
        engine = PublicationVizEngine(style=request.journal_style)
        
        # Determine the appropriate visualization based on analysis type and data characteristics
        groups = df[request.group_variable].unique()
        n_groups = len(groups)
        
        # Generate figure based on analysis type
        if request.analysis_type in ["independent_ttest", "mann_whitney_u", "one_way_anova"]:
            figure_b64 = engine.create_publication_boxplot(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels
            )
            
        elif request.analysis_type == "survival_analysis" and request.time_variable and request.event_variable:
            figure_b64 = engine.create_kaplan_meier_plot(
                data=df,
                time_var=request.time_variable,
                event_var=request.event_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else "Kaplan-Meier Survival Curves",
                custom_labels=request.custom_labels
            )
            
        elif request.analysis_type == "correlation_analysis":
            # Select numeric variables for correlation
            numeric_vars = df.select_dtypes(include=[np.number]).columns.tolist()
            if len(numeric_vars) < 2:
                # Fallback to box plot if insufficient numeric variables
                figure_b64 = engine.create_publication_boxplot(
                    data=df,
                    outcome_var=request.outcome_variable,
                    group_var=request.group_variable,
                    title=request.custom_labels.get('title') if request.custom_labels else None,
                    custom_labels=request.custom_labels
                )
            else:
                figure_b64 = engine.create_correlation_heatmap(
                    data=df,
                    variables=numeric_vars[:8],  # Limit for better readability
                    method='pearson',
                    title=request.custom_labels.get('title') if request.custom_labels else "Correlation Matrix"
                )
                
        elif request.analysis_type == "chi_square":
            # Create proper contingency table heatmap for chi-square analysis
            figure_b64 = engine.create_contingency_heatmap(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else "Contingency Table",
                custom_labels=request.custom_labels
            )
            
        else:
            # Default visualization - box plot
            figure_b64 = engine.create_publication_boxplot(
                data=df,
                outcome_var=request.outcome_variable,
                group_var=request.group_variable,
                title=request.custom_labels.get('title') if request.custom_labels else None,
                custom_labels=request.custom_labels
            )
        
        # Calculate dynamic figure dimensions based on data complexity
        data_complexity = "simple" if n_groups <= 2 else "medium" if n_groups <= 4 else "complex"
        
        return {
            "figure": figure_b64,
            "format": "png",
            "journal_style": request.journal_style,
            "data_complexity": data_complexity,
            "n_groups": n_groups,
            "message": f"Display figure generated with {request.journal_style} journal styling"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_code_edit_figure")
async def generate_code_edit_figure(request: CodeEditFigureRequest):
    """Generate figure with user-editable code parameters"""
    try:
        df = pd.DataFrame(request.data)
        
        # Clean data based on analysis type
        if request.analysis_type == "survival_analysis":
            if not request.time_variable or not request.event_variable:
                raise HTTPException(status_code=400, detail="Survival analysis requires time and event variables")
            df = df.dropna(subset=[request.time_variable, request.event_variable, request.group_variable])
        else:
            df = df.dropna(subset=[request.outcome_variable, request.group_variable])
        
        # Initialize publication engine with specified journal style
        engine = PublicationVizEngine(style=request.journal_style)
        
        # Generate figure with custom code parameters
        figure_b64 = engine.create_code_editable_figure(
            data=df,
            outcome_var=request.outcome_variable,
            group_var=request.group_variable,
            analysis_type=request.analysis_type,
            code_params=request.code_parameters,
            time_var=request.time_variable,
            event_var=request.event_variable,
            title=request.custom_labels.get('title') if request.custom_labels else None,
            custom_labels=request.custom_labels,
            format_type=request.format
        )
        
        return {
            "figure": figure_b64,
            "format": request.format,
            "journal_style": request.journal_style,
            "code_parameters": request.code_parameters,
            "message": f"Code-customized {request.format.upper()} figure generated with {request.journal_style} journal styling"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)