"""Statistical analysis services"""

import pandas as pd
import numpy as np
import scipy.stats as stats
import statsmodels.api as sm
import statsmodels.formula.api as smf
from lifelines import KaplanMeierFitter, CoxPHFitter
from lifelines.statistics import logrank_test
from typing import Dict, List, Any, Optional
import warnings

from .models import StatisticalResult, MultivariateResult
from ..visualization.services import PublicationVizService

warnings.filterwarnings('ignore')


class StatisticalAnalysisService:
    """Service for statistical analysis operations"""
    
    def __init__(self):
        self.viz_service = PublicationVizService()
    
    def perform_analysis(self, df: pd.DataFrame, analysis_type: str, 
                        outcome_var: str, group_var: str, 
                        time_var: Optional[str] = None, 
                        event_var: Optional[str] = None) -> StatisticalResult:
        """Perform statistical analysis based on type"""
        
        # Clean the data
        if analysis_type == "survival_analysis":
            if not time_var or not event_var:
                raise ValueError("Survival analysis requires time and event variables")
            df = df.dropna(subset=[time_var, event_var, group_var])
        else:
            df = df.dropna(subset=[outcome_var, group_var])
        
        if len(df) < 3:
            raise ValueError("Insufficient data for analysis")
        
        # Route to appropriate analysis function
        if analysis_type == "independent_ttest":
            return self._perform_ttest(df, outcome_var, group_var)
        elif analysis_type == "one_way_anova":
            return self._perform_anova(df, outcome_var, group_var)
        elif analysis_type == "chi_square":
            return self._perform_chi_square(df, outcome_var, group_var)
        elif analysis_type == "mann_whitney_u":
            return self._perform_mann_whitney(df, outcome_var, group_var)
        elif analysis_type == "survival_analysis":
            return self._perform_survival_analysis(df, time_var, event_var, group_var)
        else:
            raise ValueError(f"Unsupported analysis type: {analysis_type}")
    
    def perform_multivariate_analysis(
        self, df: pd.DataFrame, outcome_var: str, predictor_vars: List[str],
        model_type: Optional[str] = None, time_var: Optional[str] = None,
        event_var: Optional[str] = None
    ) -> MultivariateResult:
        """Perform multivariate statistical analysis"""
        
        # Clean the data
        required_vars = [outcome_var] + predictor_vars
        if time_var:
            required_vars.append(time_var)
        if event_var:
            required_vars.append(event_var)
        
        # Remove duplicates while preserving order
        required_vars = list(dict.fromkeys(required_vars))
        df = df[required_vars].dropna()
        
        if len(df) < 10:
            raise ValueError("Insufficient data for multivariate analysis (minimum 10 observations)")
        
        # Auto-detect model type if not specified
        if not model_type:
            model_type = self._auto_detect_model_type(df, outcome_var, time_var, event_var)
        
        # Perform appropriate multivariate analysis
        if model_type == 'logistic':
            analysis_results = self._perform_logistic_regression(df, outcome_var, predictor_vars)
        elif model_type == 'linear':
            analysis_results = self._perform_linear_regression(df, outcome_var, predictor_vars)
        elif model_type == 'cox':
            if not time_var or not event_var:
                raise ValueError("Cox regression requires time and event variables")
            analysis_results = self._perform_cox_regression(df, event_var, time_var, predictor_vars)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
        
        # Prepare forest plot data
        forest_data = []
        for result in analysis_results['results']:
            forest_data.append({
                'name': result['variable'],
                'effect': result['odds_ratio'],
                'ci_lower': result['ci_lower'],
                'ci_upper': result['ci_upper'],
                'p_value': result['p_value'],
                'effect_measure': result['effect_measure']
            })
        
        # Generate forest plot
        forest_plot_b64 = self.viz_service.create_multivariate_forest_plot(
            forest_data,
            title=f"Multivariate {analysis_results['model_type'].replace('_', ' ').title()}",
            effect_measure=forest_data[0]['effect_measure'] if forest_data else 'Effect Size'
        )
        
        return MultivariateResult(
            analysis_type="multivariate_analysis",
            model_type=analysis_results['model_type'],
            results=analysis_results['results'],
            model_summary=analysis_results['model_summary'],
            forest_plot=forest_plot_b64,
            sample_size=len(df),
            formula=analysis_results.get('formula', ''),
            message=f"Multivariate analysis completed using {model_type} regression"
        )
    
    def _perform_ttest(self, df: pd.DataFrame, outcome_var: str, group_var: str) -> StatisticalResult:
        """Perform independent samples t-test"""
        groups = df[group_var].unique()
        if len(groups) != 2:
            raise ValueError("T-test requires exactly 2 groups")
        
        # Convert outcome variable to numeric, handling string data
        try:
            outcome_numeric = pd.to_numeric(df[outcome_var], errors='coerce')
            df_clean = df.copy()
            df_clean[outcome_var] = outcome_numeric
            df_clean = df_clean.dropna(subset=[outcome_var])
            
            if len(df_clean) == 0:
                raise ValueError(f"No valid numeric data found in outcome variable '{outcome_var}'")
                
        except Exception as e:
            raise ValueError(f"Cannot convert outcome variable '{outcome_var}' to numeric: {str(e)}")
        
        group1_data = df_clean[df_clean[group_var] == groups[0]][outcome_var].astype(float)
        group2_data = df_clean[df_clean[group_var] == groups[1]][outcome_var].astype(float)
        
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
            interpretation=self._get_p_value_interpretation(p_value),
            assumptions_met=True,
            sample_sizes={str(groups[0]): len(group1_data), str(groups[1]): len(group2_data)},
            descriptive_stats={
                str(groups[0]): {"mean": float(group1_data.mean()), "std": float(group1_data.std())},
                str(groups[1]): {"mean": float(group2_data.mean()), "std": float(group2_data.std())}
            }
        )
    
    def _perform_anova(self, df: pd.DataFrame, outcome_var: str, group_var: str) -> StatisticalResult:
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
            interpretation=self._get_p_value_interpretation(p_value),
            assumptions_met=True,
            sample_sizes={str(group): len(data) for group, data in zip(groups, group_data)},
            descriptive_stats={
                str(group): {"mean": float(data.mean()), "std": float(data.std())} 
                for group, data in zip(groups, group_data)
            }
        )
    
    def _perform_chi_square(self, df: pd.DataFrame, outcome_var: str, group_var: str) -> StatisticalResult:
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
            interpretation=self._get_p_value_interpretation(p_value),
            assumptions_met=all(expected.values.flatten() >= 5),
            sample_sizes=contingency_table.sum(axis=0).to_dict(),
            descriptive_stats=contingency_table.to_dict()
        )
    
    def _perform_mann_whitney(self, df: pd.DataFrame, outcome_var: str, group_var: str) -> StatisticalResult:
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
            interpretation=self._get_p_value_interpretation(p_value),
            assumptions_met=True,
            sample_sizes={str(groups[0]): len(group1_data), str(groups[1]): len(group2_data)},
            descriptive_stats={
                str(groups[0]): {"median": float(group1_data.median()), "iqr": float(group1_data.quantile(0.75) - group1_data.quantile(0.25))},
                str(groups[1]): {"median": float(group2_data.median()), "iqr": float(group2_data.quantile(0.75) - group2_data.quantile(0.25))}
            }
        )
    
    def _perform_survival_analysis(self, df: pd.DataFrame, time_var: str, event_var: str, group_var: str) -> StatisticalResult:
        """Perform Kaplan-Meier survival analysis"""
        # Implementation similar to the original function but with better error handling
        clean_df = df[[time_var, event_var, group_var]].copy().dropna()
        
        # Convert time to numeric
        time_data = pd.to_numeric(clean_df[time_var], errors='coerce')
        
        # Convert event variable
        event_data = clean_df[event_var]
        unique_events = set(event_data.dropna().unique())
        
        if unique_events.issubset({0, 1, 0.0, 1.0}):
            event_data = event_data.astype(int)
        elif unique_events.issubset({True, False}):
            event_data = event_data.astype(int)
        else:
            # Handle text patterns
            event_mapping = {}
            for val in unique_events:
                str_val = str(val).lower().strip()
                if str_val in ['1', 'true', 'yes', 'dead', 'death', 'event', 'deceased']:
                    event_mapping[val] = 1
                else:
                    event_mapping[val] = 0
            event_data = event_data.map(event_mapping).fillna(0).astype(int)
        
        # Remove invalid values
        valid_mask = ~time_data.isna()
        time_data = time_data[valid_mask]
        event_data = event_data[valid_mask]
        clean_df = clean_df[valid_mask].reset_index(drop=True)
        
        groups = clean_df[group_var].unique()
        group_stats = {}
        survival_data = {}
        
        for group in groups:
            mask = clean_df[group_var] == group
            group_time = time_data[mask].values
            group_event = event_data[mask].values
            
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
            test_statistic = 0.0
            p_value = 1.0
        
        # Format sample sizes
        sample_sizes_formatted = {group: stats["sample_size"] for group, stats in group_stats.items()}
        
        return StatisticalResult(
            test_name="Kaplan-Meier Survival Analysis",
            statistic=test_statistic,
            p_value=p_value,
            effect_size={"name": "Median Survival", "value": None},
            confidence_interval=None,
            summary=f"Log-rank test: χ² = {test_statistic:.3f}, p = {p_value:.3f}" if test_statistic else "Single group analysis",
            interpretation=self._get_p_value_interpretation(p_value) if p_value else "No comparison performed",
            assumptions_met=True,
            sample_sizes=sample_sizes_formatted,
            descriptive_stats=group_stats
        )
    
    def _perform_logistic_regression(self, df: pd.DataFrame, outcome_var: str, predictor_vars: List[str]) -> Dict[str, Any]:
        """Perform logistic regression analysis"""
        # Implementation from original file
        clean_df = df[predictor_vars + [outcome_var]].dropna().copy()
        
        unique_outcomes = clean_df[outcome_var].unique()
        if len(unique_outcomes) != 2:
            raise ValueError(f"Logistic regression requires binary outcome. Found {len(unique_outcomes)} unique values.")
        
        outcome_mapping = {unique_outcomes[0]: 0, unique_outcomes[1]: 1}
        clean_df[outcome_var + '_binary'] = clean_df[outcome_var].map(outcome_mapping)
        
        # Handle categorical and numeric variables
        categorical_vars = []
        numeric_vars = []
        
        for var in predictor_vars:
            if pd.api.types.is_numeric_dtype(clean_df[var]):
                numeric_vars.append(var)
            else:
                categorical_vars.append(var)
        
        if categorical_vars:
            dummy_df = pd.get_dummies(clean_df[categorical_vars], prefix=categorical_vars, drop_first=True)
            clean_df = pd.concat([clean_df[numeric_vars + [outcome_var + '_binary']], dummy_df], axis=1)
            predictor_vars_expanded = numeric_vars + list(dummy_df.columns)
        else:
            predictor_vars_expanded = numeric_vars
        
        formula = f"{outcome_var}_binary ~ " + " + ".join(predictor_vars_expanded)
        
        try:
            model = smf.logit(formula, data=clean_df).fit(disp=0)
            
            results = []
            for var in predictor_vars_expanded:
                if var in model.params.index:
                    coef = model.params[var]
                    odds_ratio = np.exp(coef)
                    ci_lower, ci_upper = np.exp(model.conf_int().loc[var])
                    p_value = model.pvalues[var]
                    
                    results.append({
                        'variable': var,
                        'coefficient': coef,
                        'odds_ratio': odds_ratio,
                        'ci_lower': ci_lower,
                        'ci_upper': ci_upper,
                        'p_value': p_value,
                        'effect_measure': 'Odds Ratio'
                    })
            
            return {
                'model_type': 'logistic_regression',
                'results': results,
                'model_summary': {
                    'n_obs': int(model.nobs),
                    'aic': float(model.aic),
                    'bic': float(model.bic),
                    'pseudo_r2': float(model.prsquared)
                },
                'formula': formula
            }
            
        except Exception as e:
            raise ValueError(f"Logistic regression failed: {str(e)}")
    
    def _perform_linear_regression(self, df: pd.DataFrame, outcome_var: str, predictor_vars: List[str]) -> Dict[str, Any]:
        """Perform linear regression analysis"""
        # Similar implementation to logistic regression but for linear models
        clean_df = df[predictor_vars + [outcome_var]].dropna().copy()
        
        categorical_vars = []
        numeric_vars = []
        
        for var in predictor_vars:
            if pd.api.types.is_numeric_dtype(clean_df[var]):
                numeric_vars.append(var)
            else:
                categorical_vars.append(var)
        
        if categorical_vars:
            dummy_df = pd.get_dummies(clean_df[categorical_vars], prefix=categorical_vars, drop_first=True)
            clean_df = pd.concat([clean_df[numeric_vars + [outcome_var]], dummy_df], axis=1)
            predictor_vars_expanded = numeric_vars + list(dummy_df.columns)
        else:
            predictor_vars_expanded = numeric_vars
        
        formula = f"{outcome_var} ~ " + " + ".join(predictor_vars_expanded)
        
        try:
            model = smf.ols(formula, data=clean_df).fit()
            
            results = []
            for var in predictor_vars_expanded:
                if var in model.params.index:
                    coef = model.params[var]
                    ci_lower, ci_upper = model.conf_int().loc[var]
                    p_value = model.pvalues[var]
                    
                    results.append({
                        'variable': var,
                        'coefficient': coef,
                        'odds_ratio': coef,
                        'ci_lower': ci_lower,
                        'ci_upper': ci_upper,
                        'p_value': p_value,
                        'effect_measure': 'Beta Coefficient'
                    })
            
            return {
                'model_type': 'linear_regression',
                'results': results,
                'model_summary': {
                    'n_obs': int(model.nobs),
                    'r_squared': float(model.rsquared),
                    'adj_r_squared': float(model.rsquared_adj),
                    'f_statistic': float(model.fvalue),
                    'f_pvalue': float(model.f_pvalue)
                },
                'formula': formula
            }
            
        except Exception as e:
            raise ValueError(f"Linear regression failed: {str(e)}")
    
    def _perform_cox_regression(self, df: pd.DataFrame, outcome_var: str, time_var: str, predictor_vars: List[str]) -> Dict[str, Any]:
        """Perform Cox proportional hazards regression"""
        # Implementation from original file with better error handling
        filtered_predictors = [var for var in predictor_vars if var not in [outcome_var, time_var]]
        
        if len(filtered_predictors) == 0:
            raise ValueError("No valid predictors remaining after filtering time/event variables")
        
        required_vars = filtered_predictors + [outcome_var, time_var]
        clean_df = df[required_vars].dropna().copy()
        
        categorical_vars = []
        numeric_vars = []
        
        for var in filtered_predictors:
            if pd.api.types.is_numeric_dtype(clean_df[var]):
                numeric_vars.append(var)
            else:
                categorical_vars.append(var)
        
        if categorical_vars:
            dummy_df = pd.get_dummies(clean_df[categorical_vars], prefix=categorical_vars, drop_first=True)
            model_df = pd.concat([clean_df[numeric_vars], dummy_df, clean_df[[outcome_var, time_var]]], axis=1)
            predictor_vars_expanded = numeric_vars + list(dummy_df.columns)
        else:
            model_df = clean_df[numeric_vars + [outcome_var, time_var]].copy()
            predictor_vars_expanded = numeric_vars
        
        try:
            cph = CoxPHFitter()
            cph.fit(model_df, duration_col=time_var, event_col=outcome_var)
            
            results = []
            for var in predictor_vars_expanded:
                if var in cph.params_.index:
                    coef = cph.params_[var]
                    hazard_ratio = np.exp(coef)
                    
                    ci_cols = cph.confidence_intervals_.columns
                    
                    if 'coef lower 95%' in ci_cols:
                        ci_lower = np.exp(cph.confidence_intervals_.loc[var, 'coef lower 95%'])
                        ci_upper = np.exp(cph.confidence_intervals_.loc[var, 'coef upper 95%'])
                    elif 'lower 0.95' in ci_cols:
                        ci_lower = np.exp(cph.confidence_intervals_.loc[var, 'lower 0.95'])
                        ci_upper = np.exp(cph.confidence_intervals_.loc[var, 'upper 0.95'])
                    else:
                        ci_lower = np.exp(cph.confidence_intervals_.loc[var].iloc[0])
                        ci_upper = np.exp(cph.confidence_intervals_.loc[var].iloc[1])
                    
                    p_value = cph.summary.loc[var, 'p']
                    
                    results.append({
                        'variable': var,
                        'coefficient': coef,
                        'odds_ratio': hazard_ratio,
                        'ci_lower': ci_lower,
                        'ci_upper': ci_upper,
                        'p_value': p_value,
                        'effect_measure': 'Hazard Ratio'
                    })
            
            return {
                'model_type': 'cox_regression',
                'results': results,
                'model_summary': {
                    'n_obs': int(cph.event_observed.sum()),
                    'n_events': int(cph.event_observed.sum()),
                    'concordance': float(cph.concordance_index_),
                    'log_likelihood': float(cph.log_likelihood_)
                },
                'duration_col': time_var,
                'event_col': outcome_var
            }
            
        except Exception as e:
            raise ValueError(f"Cox regression failed: {str(e)}")
    
    def _auto_detect_model_type(self, df: pd.DataFrame, outcome_var: str, 
                               time_var: Optional[str] = None, 
                               event_var: Optional[str] = None) -> str:
        """Automatically detect the appropriate model type"""
        if time_var and event_var:
            return 'cox'
        
        outcome_data = df[outcome_var].dropna()
        unique_values = outcome_data.nunique()
        
        if unique_values == 2:
            return 'logistic'
        
        if pd.api.types.is_numeric_dtype(outcome_data):
            return 'linear'
        
        return 'logistic'
    
    def _get_p_value_interpretation(self, p_value: float) -> str:
        """Get interpretation of p-value"""
        if p_value < 0.001:
            return "Highly significant (p < 0.001)"
        elif p_value < 0.01:
            return "Very significant (p < 0.01)"
        elif p_value < 0.05:
            return "Significant (p < 0.05)"
        else:
            return "Not significant (p ≥ 0.05)" 