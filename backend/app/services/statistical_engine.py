"""
SciFig AI: Core Statistical Engine (Python Implementation)
Migrated from TypeScript to leverage superior scientific computing libraries
"""

import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import chi2_contingency, fisher_exact
from typing import Dict, Any, List, Optional, Tuple, Union
import warnings
from dataclasses import dataclass
from enum import Enum

warnings.filterwarnings('ignore')

class TestType(Enum):
    T_TEST = "t_test"
    PAIRED_T_TEST = "paired_t_test"
    WELCH_T_TEST = "welch_t_test"
    ONE_WAY_ANOVA = "one_way_anova"
    CHI_SQUARE = "chi_square"
    FISHER_EXACT = "fisher_exact"
    MANN_WHITNEY = "mann_whitney"
    WILCOXON = "wilcoxon"
    KRUSKAL_WALLIS = "kruskal_wallis"
    CORRELATION = "correlation"
    LINEAR_REGRESSION = "linear_regression"
    KAPLAN_MEIER = "kaplan_meier"

@dataclass
class DataProfile:
    sample_size: int
    outcome_variable: str
    outcome_type: str  # 'continuous' | 'categorical'
    group_variable: Optional[str] = None
    time_variable: Optional[str] = None
    event_variable: Optional[str] = None
    is_paired: bool = False
    variables: List[str] = None
    n_groups: Optional[int] = None
    group_labels: Optional[List[str]] = None
    group_sizes: Optional[Dict[str, int]] = None

@dataclass
class AssumptionResult:
    test: str
    passed: bool
    p_value: Optional[float] = None
    statistic: Optional[float] = None
    reason: Optional[str] = None

@dataclass
class StatisticalResult:
    test_name: str
    statistic: Dict[str, float]
    p_value: float
    effect_size: Optional[Dict[str, Any]] = None
    summary: str = ""
    groups: Optional[Dict[str, Dict[str, float]]] = None
    confidence_interval: Optional[Tuple[float, float]] = None
    contingency_table: Optional[List[List[int]]] = None
    group_names: Optional[List[str]] = None
    outcome_names: Optional[List[str]] = None

class AssumptionChecker:
    """Check statistical test assumptions"""
    
    @staticmethod
    def check_normality(data: np.ndarray, alpha: float = 0.05) -> AssumptionResult:
        """Shapiro-Wilk test for normality"""
        if len(data) < 3:
            return AssumptionResult(
                test="shapiro_wilk",
                passed=False,
                reason="Insufficient data for normality test"
            )
        
        try:
            statistic, p_value = stats.shapiro(data)
            passed = p_value > alpha
            return AssumptionResult(
                test="shapiro_wilk",
                passed=passed,
                p_value=p_value,
                statistic=statistic,
                reason=f"p={p_value:.4f}, {'normal' if passed else 'non-normal'}"
            )
        except Exception as e:
            return AssumptionResult(
                test="shapiro_wilk",
                passed=False,
                reason=f"Test failed: {str(e)}"
            )
    
    @staticmethod
    def check_equal_variance(group1: np.ndarray, group2: np.ndarray, alpha: float = 0.05) -> AssumptionResult:
        """Levene's test for equal variances"""
        try:
            statistic, p_value = stats.levene(group1, group2)
            passed = p_value > alpha
            return AssumptionResult(
                test="levene",
                passed=passed,
                p_value=p_value,
                statistic=statistic,
                reason=f"p={p_value:.4f}, {'equal' if passed else 'unequal'} variances"
            )
        except Exception as e:
            return AssumptionResult(
                test="levene",
                passed=False,
                reason=f"Test failed: {str(e)}"
            )

class DataProfiler:
    """Analyze dataset structure and properties"""
    
    @staticmethod
    def profile_data(data: List[Dict], outcome_var: str, group_var: Optional[str] = None,
                    time_var: Optional[str] = None, event_var: Optional[str] = None) -> DataProfile:
        """Create comprehensive data profile"""
        df = pd.DataFrame(data)
        
        # Basic information
        sample_size = len(df)
        variables = list(df.columns)
        
        # Determine outcome type
        outcome_type = DataProfiler._determine_variable_type(df[outcome_var])
        
        # Group analysis
        n_groups = None
        group_labels = None
        group_sizes = None
        is_paired = False
        
        if group_var and group_var in df.columns:
            unique_groups = df[group_var].dropna().unique()
            n_groups = len(unique_groups)
            group_labels = list(unique_groups)
            group_sizes = df[group_var].value_counts().to_dict()
            
            # Simple paired detection (same group sizes)
            if n_groups == 2:
                sizes = list(group_sizes.values())
                is_paired = sizes[0] == sizes[1] and sample_size == sizes[0] * 2
        
        return DataProfile(
            sample_size=sample_size,
            outcome_variable=outcome_var,
            outcome_type=outcome_type,
            group_variable=group_var,
            time_variable=time_var,
            event_variable=event_var,
            is_paired=is_paired,
            variables=variables,
            n_groups=n_groups,
            group_labels=group_labels,
            group_sizes=group_sizes
        )
    
    @staticmethod
    def _determine_variable_type(series: pd.Series) -> str:
        """Determine if variable is continuous or categorical"""
        # Remove missing values
        clean_series = series.dropna()
        
        if len(clean_series) == 0:
            return "categorical"
        
        # Check if numeric
        if pd.api.types.is_numeric_dtype(clean_series):
            unique_count = clean_series.nunique()
            total_count = len(clean_series)
            
            # If less than 10 unique values or less than 5% unique, consider categorical
            if unique_count < 10 or (unique_count / total_count) < 0.05:
                return "categorical"
            else:
                return "continuous"
        else:
            return "categorical"

class StatisticalBrain:
    """Intelligent test selection and execution"""
    
    def __init__(self):
        self.test_registry = {
            TestType.T_TEST: {
                'assumptions': ['normality', 'equal_variance'],
                'min_sample': 10,
                'groups': 2,
                'outcome_type': 'continuous'
            },
            TestType.MANN_WHITNEY: {
                'assumptions': [],
                'min_sample': 5,
                'groups': 2,
                'outcome_type': 'continuous'
            },
            TestType.ONE_WAY_ANOVA: {
                'assumptions': ['normality', 'equal_variance'],
                'min_sample': 15,
                'groups': '3+',
                'outcome_type': 'continuous'
            },
            TestType.CHI_SQUARE: {
                'assumptions': ['expected_frequency'],
                'min_sample': 20,
                'groups': '2+',
                'outcome_type': 'categorical'
            }
        }
    
    def recommend_test(self, profile: DataProfile) -> Dict[str, Any]:
        """Recommend appropriate statistical test"""
        recommendations = []
        
        if profile.outcome_type == 'continuous':
            if profile.n_groups == 2:
                if profile.sample_size >= 30:
                    recommendations.append({
                        'test': TestType.T_TEST,
                        'confidence': 0.9,
                        'reason': 'Two groups, continuous outcome, adequate sample size'
                    })
                recommendations.append({
                    'test': TestType.MANN_WHITNEY,
                    'confidence': 0.8,
                    'reason': 'Non-parametric alternative for two groups'
                })
            elif profile.n_groups and profile.n_groups > 2:
                recommendations.append({
                    'test': TestType.ONE_WAY_ANOVA,
                    'confidence': 0.9,
                    'reason': f'{profile.n_groups} groups, continuous outcome'
                })
                recommendations.append({
                    'test': TestType.KRUSKAL_WALLIS,
                    'confidence': 0.8,
                    'reason': 'Non-parametric alternative for multiple groups'
                })
        
        elif profile.outcome_type == 'categorical':
            if profile.n_groups and profile.n_groups >= 2:
                recommendations.append({
                    'test': TestType.CHI_SQUARE,
                    'confidence': 0.9,
                    'reason': 'Categorical outcome with groups'
                })
                if profile.n_groups == 2:
                    recommendations.append({
                        'test': TestType.FISHER_EXACT,
                        'confidence': 0.8,
                        'reason': 'Exact test for 2x2 contingency table'
                    })
        
        # Sort by confidence
        recommendations.sort(key=lambda x: x['confidence'], reverse=True)
        
        return {
            'primary': recommendations[0]['test'] if recommendations else TestType.T_TEST,
            'alternatives': recommendations[1:3] if len(recommendations) > 1 else [],
            'reasoning': recommendations[0]['reason'] if recommendations else 'Default test'
        }

class StatisticalExecutor:
    """Execute statistical tests with proper error handling"""
    
    @staticmethod
    def execute_t_test(group1: np.ndarray, group2: np.ndarray, equal_var: bool = True) -> StatisticalResult:
        """Independent samples t-test"""
        # Clean data
        group1 = group1[~np.isnan(group1)]
        group2 = group2[~np.isnan(group2)]
        
        # Calculate test
        t_stat, p_value = stats.ttest_ind(group1, group2, equal_var=equal_var)
        
        # Effect size (Cohen's d)
        pooled_std = np.sqrt(((len(group1) - 1) * np.var(group1, ddof=1) + 
                             (len(group2) - 1) * np.var(group2, ddof=1)) / 
                            (len(group1) + len(group2) - 2))
        cohens_d = (np.mean(group1) - np.mean(group2)) / pooled_std
        
        # Group statistics
        groups = {
            'group1': {
                'n': len(group1),
                'mean': float(np.mean(group1)),
                'std': float(np.std(group1, ddof=1)),
                'sem': float(stats.sem(group1))
            },
            'group2': {
                'n': len(group2),
                'mean': float(np.mean(group2)),
                'std': float(np.std(group2, ddof=1)),
                'sem': float(stats.sem(group2))
            }
        }
        
        # Summary
        test_name = "Welch's t-test" if not equal_var else "Student's t-test"
        significance = "***" if p_value < 0.001 else "**" if p_value < 0.01 else "*" if p_value < 0.05 else "ns"
        
        summary = f"{test_name}: t({len(group1) + len(group2) - 2}) = {t_stat:.3f}, p = {p_value:.4f} {significance}"
        
        return StatisticalResult(
            test_name=test_name,
            statistic={'t': float(t_stat), 'df': len(group1) + len(group2) - 2},
            p_value=float(p_value),
            effect_size={'cohens_d': float(cohens_d), 'interpretation': StatisticalExecutor._interpret_cohens_d(cohens_d)},
            summary=summary,
            groups=groups
        )
    
    @staticmethod
    def execute_chi_square(contingency_table: np.ndarray) -> StatisticalResult:
        """Chi-square test of independence"""
        chi2_stat, p_value, dof, expected = chi2_contingency(contingency_table)
        
        # Effect size (Cramér's V)
        n = np.sum(contingency_table)
        cramers_v = np.sqrt(chi2_stat / (n * (min(contingency_table.shape) - 1)))
        
        summary = f"Chi-square test: χ²({dof}) = {chi2_stat:.3f}, p = {p_value:.4f}"
        
        return StatisticalResult(
            test_name="Chi-square test of independence",
            statistic={'chi2': float(chi2_stat), 'df': int(dof)},
            p_value=float(p_value),
            effect_size={'cramers_v': float(cramers_v)},
            summary=summary,
            contingency_table=contingency_table.tolist()
        )
    
    @staticmethod
    def _interpret_cohens_d(d: float) -> str:
        """Interpret Cohen's d effect size"""
        abs_d = abs(d)
        if abs_d < 0.2:
            return "negligible"
        elif abs_d < 0.5:
            return "small"
        elif abs_d < 0.8:
            return "medium"
        else:
            return "large"

class EngineOrchestrator:
    """Main orchestrator for statistical analysis workflow"""
    
    def __init__(self):
        self.brain = StatisticalBrain()
        self.executor = StatisticalExecutor()
        self.assumption_checker = AssumptionChecker()
    
    def run_analysis(self, data: List[Dict], outcome_var: str, 
                    group_var: Optional[str] = None, time_var: Optional[str] = None,
                    event_var: Optional[str] = None) -> Dict[str, Any]:
        """Run complete statistical analysis workflow"""
        
        try:
            # Step 1: Profile the data
            profile = DataProfiler.profile_data(data, outcome_var, group_var, time_var, event_var)
            
            # Step 2: Get test recommendation
            recommendation = self.brain.recommend_test(profile)
            
            # Step 3: Prepare data for analysis
            df = pd.DataFrame(data)
            
            # Step 4: Execute analysis based on test type
            if recommendation['primary'] == TestType.T_TEST:
                result = self._execute_t_test_workflow(df, outcome_var, group_var)
            elif recommendation['primary'] == TestType.CHI_SQUARE:
                result = self._execute_chi_square_workflow(df, outcome_var, group_var)
            else:
                # Default to t-test for now
                result = self._execute_t_test_workflow(df, outcome_var, group_var)
            
            return {
                'data_profile': profile.__dict__,
                'recommendation': recommendation,
                'assumptions_checked': getattr(result, 'assumptions', {}),
                'final_result': result.__dict__,
                'status': 'completed'
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'status': 'failed'
            }
    
    def _execute_t_test_workflow(self, df: pd.DataFrame, outcome_var: str, group_var: str) -> StatisticalResult:
        """Execute t-test with assumption checking"""
        groups = df[group_var].unique()
        if len(groups) != 2:
            raise ValueError("T-test requires exactly 2 groups")
        
        group1_data = df[df[group_var] == groups[0]][outcome_var].dropna().values
        group2_data = df[df[group_var] == groups[1]][outcome_var].dropna().values
        
        # Check assumptions
        norm1 = self.assumption_checker.check_normality(group1_data)
        norm2 = self.assumption_checker.check_normality(group2_data)
        equal_var = self.assumption_checker.check_equal_variance(group1_data, group2_data)
        
        # Use Welch's t-test if equal variance assumption violated
        use_equal_var = equal_var.passed
        
        result = self.executor.execute_t_test(group1_data, group2_data, equal_var=use_equal_var)
        result.assumptions = {
            'normality_group1': norm1.__dict__,
            'normality_group2': norm2.__dict__,
            'equal_variance': equal_var.__dict__
        }
        
        return result
    
    def _execute_chi_square_workflow(self, df: pd.DataFrame, outcome_var: str, group_var: str) -> StatisticalResult:
        """Execute chi-square test"""
        contingency_table = pd.crosstab(df[group_var], df[outcome_var]).values
        
        # Check minimum expected frequency
        chi2_stat, p_value, dof, expected = chi2_contingency(contingency_table)
        min_expected = np.min(expected)
        
        if min_expected < 5:
            # Could suggest Fisher's exact test here
            pass
        
        result = self.executor.execute_chi_square(contingency_table)
        result.assumptions = {
            'min_expected_frequency': {'value': float(min_expected), 'passed': min_expected >= 5}
        }
        
        return result 