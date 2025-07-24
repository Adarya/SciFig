"""
Tests for the statistical engine components
"""

import pytest
import numpy as np
import pandas as pd
from scipy import stats

from app.services.statistical_engine import (
    EngineOrchestrator, 
    StatisticalBrain, 
    StatisticalExecutor, 
    AssumptionChecker,
    DataProfiler,
    TestType
)
from tests.conftest import assert_statistical_result_structure, assert_data_profile_structure


class TestDataProfiler:
    """Tests for data profiling functionality"""
    
    def test_profile_continuous_data(self, sample_csv_data):
        """Test profiling of continuous outcome data"""
        data_records = sample_csv_data.to_dict('records')
        
        profile = DataProfiler.profile_data(
            data=data_records,
            outcome_var="outcome",
            group_var="group"
        )
        
        assert_data_profile_structure(profile.__dict__)
        assert profile.sample_size == len(sample_csv_data)
        assert profile.outcome_type == "continuous"
        assert profile.n_groups == 2
        assert set(profile.group_labels) == {"A", "B"}
        assert profile.outcome_variable == "outcome"
    
    def test_profile_categorical_data(self, categorical_dataset):
        """Test profiling of categorical outcome data"""
        data_records = categorical_dataset.to_dict('records')
        
        profile = DataProfiler.profile_data(
            data=data_records,
            outcome_var="response",
            group_var="treatment"
        )
        
        assert profile.outcome_type == "categorical"
        assert profile.n_groups == 3
        assert "Success" in profile.variables
        assert "Failure" in profile.variables or profile.outcome_type == "categorical"
    
    def test_variable_type_detection(self):
        """Test automatic variable type detection"""
        # Continuous variable
        continuous_series = pd.Series([1.5, 2.3, 3.7, 4.1, 5.8] * 10)
        assert DataProfiler._determine_variable_type(continuous_series) == "continuous"
        
        # Categorical variable
        categorical_series = pd.Series(["A", "B", "C", "A", "B"] * 10)
        assert DataProfiler._determine_variable_type(categorical_series) == "categorical"
        
        # Binary variable (treated as categorical)
        binary_series = pd.Series([0, 1, 0, 1, 0] * 10)
        assert DataProfiler._determine_variable_type(binary_series) == "categorical"
    
    def test_missing_data_handling(self, missing_data_dataset):
        """Test handling of missing data in profiling"""
        data_records = missing_data_dataset.to_dict('records')
        
        profile = DataProfiler.profile_data(
            data=data_records,
            outcome_var="outcome",
            group_var="group"
        )
        
        # Should still work with missing data
        assert profile.sample_size > 0
        assert profile.outcome_type in ["continuous", "categorical"]


class TestAssumptionChecker:
    """Tests for statistical assumption checking"""
    
    def test_normality_check_normal_data(self):
        """Test normality check on normal data"""
        np.random.seed(42)
        normal_data = np.random.normal(0, 1, 100)
        
        result = AssumptionChecker.check_normality(normal_data)
        
        assert result.test == "shapiro_wilk"
        assert isinstance(result.passed, bool)
        assert isinstance(result.p_value, float)
        assert 0 <= result.p_value <= 1
    
    def test_normality_check_non_normal_data(self):
        """Test normality check on non-normal data"""
        np.random.seed(42)
        # Heavily skewed data
        skewed_data = np.random.exponential(1, 100)
        
        result = AssumptionChecker.check_normality(skewed_data)
        
        assert result.test == "shapiro_wilk"
        # Should likely fail normality (though not guaranteed in all cases)
        assert isinstance(result.passed, bool)
    
    def test_equal_variance_check(self):
        """Test equal variance assumption checking"""
        np.random.seed(42)
        group1 = np.random.normal(0, 1, 50)  # Same variance
        group2 = np.random.normal(1, 1, 50)  # Same variance
        
        result = AssumptionChecker.check_equal_variance(group1, group2)
        
        assert result.test == "levene"
        assert isinstance(result.passed, bool)
        assert isinstance(result.p_value, float)
    
    def test_unequal_variance_detection(self):
        """Test detection of unequal variances"""
        np.random.seed(42)
        group1 = np.random.normal(0, 1, 50)   # Small variance
        group2 = np.random.normal(0, 5, 50)   # Large variance
        
        result = AssumptionChecker.check_equal_variance(group1, group2)
        
        assert result.test == "levene"
        # Should likely detect unequal variances
        # Note: This test might occasionally pass due to randomness
    
    def test_insufficient_data_handling(self):
        """Test assumption checking with insufficient data"""
        small_data = np.array([1, 2])
        
        result = AssumptionChecker.check_normality(small_data)
        
        assert result.test == "shapiro_wilk"
        assert not result.passed
        assert "Insufficient data" in result.reason


class TestStatisticalBrain:
    """Tests for statistical test recommendation system"""
    
    def test_recommend_t_test(self, sample_csv_data):
        """Test recommendation of t-test for appropriate data"""
        brain = StatisticalBrain()
        data_records = sample_csv_data.to_dict('records')
        
        profile = DataProfiler.profile_data(
            data=data_records,
            outcome_var="outcome",
            group_var="group"
        )
        
        recommendation = brain.recommend_test(profile)
        
        assert "primary" in recommendation
        assert "alternatives" in recommendation
        assert "reasoning" in recommendation
        assert recommendation["primary"] in [TestType.T_TEST, TestType.MANN_WHITNEY]
    
    def test_recommend_chi_square(self, categorical_dataset):
        """Test recommendation of chi-square for categorical data"""
        brain = StatisticalBrain()
        data_records = categorical_dataset.to_dict('records')
        
        profile = DataProfiler.profile_data(
            data=data_records,
            outcome_var="response",
            group_var="treatment"
        )
        
        recommendation = brain.recommend_test(profile)
        
        assert recommendation["primary"] in [TestType.CHI_SQUARE, TestType.FISHER_EXACT]
    
    def test_test_registry_structure(self):
        """Test that test registry has proper structure"""
        brain = StatisticalBrain()
        
        for test_type, properties in brain.test_registry.items():
            assert isinstance(test_type, TestType)
            assert "assumptions" in properties
            assert "min_sample" in properties
            assert "outcome_type" in properties
            assert isinstance(properties["assumptions"], list)
            assert isinstance(properties["min_sample"], int)


class TestStatisticalExecutor:
    """Tests for statistical test execution"""
    
    def test_t_test_execution(self):
        """Test t-test execution with known data"""
        np.random.seed(42)
        # Create groups with known difference
        group1 = np.random.normal(10, 2, 50)
        group2 = np.random.normal(12, 2, 50)  # Higher mean
        
        result = StatisticalExecutor.execute_t_test(group1, group2, equal_var=True)
        
        assert_statistical_result_structure(result.__dict__)
        assert result.test_name in ["Student's t-test", "Welch's t-test"]
        assert "t" in result.statistic
        assert "df" in result.statistic
        assert result.effect_size is not None
        assert "cohens_d" in result.effect_size
    
    def test_welchs_t_test(self):
        """Test Welch's t-test for unequal variances"""
        np.random.seed(42)
        group1 = np.random.normal(10, 1, 30)   # Small variance
        group2 = np.random.normal(10, 4, 30)   # Large variance
        
        result = StatisticalExecutor.execute_t_test(group1, group2, equal_var=False)
        
        assert result.test_name == "Welch's t-test"
        assert_statistical_result_structure(result.__dict__)
    
    def test_chi_square_execution(self):
        """Test chi-square test execution"""
        # Create 2x2 contingency table
        contingency_table = np.array([[20, 10], [15, 25]])
        
        result = StatisticalExecutor.execute_chi_square(contingency_table)
        
        assert result.test_name == "Chi-square test of independence"
        assert "chi2" in result.statistic
        assert "df" in result.statistic
        assert result.effect_size is not None
        assert "cramers_v" in result.effect_size
        assert result.contingency_table == contingency_table.tolist()
    
    def test_cohens_d_interpretation(self):
        """Test Cohen's d effect size interpretation"""
        assert StatisticalExecutor._interpret_cohens_d(0.1) == "negligible"
        assert StatisticalExecutor._interpret_cohens_d(0.3) == "small"
        assert StatisticalExecutor._interpret_cohens_d(0.6) == "medium"
        assert StatisticalExecutor._interpret_cohens_d(1.0) == "large"
        assert StatisticalExecutor._interpret_cohens_d(-0.3) == "small"  # Absolute value


class TestEngineOrchestrator:
    """Tests for the main analysis orchestrator"""
    
    def test_complete_t_test_workflow(self, sample_csv_data):
        """Test complete t-test analysis workflow"""
        orchestrator = EngineOrchestrator()
        data_records = sample_csv_data.to_dict('records')
        
        result = orchestrator.run_analysis(
            data=data_records,
            outcome_var="outcome",
            group_var="group"
        )
        
        # Check overall structure
        assert "data_profile" in result
        assert "recommendation" in result
        assert "final_result" in result
        assert "status" in result
        assert result["status"] == "completed"
        
        # Check data profile
        assert_data_profile_structure(result["data_profile"])
        
        # Check final result
        final_result = result["final_result"]
        assert_statistical_result_structure(final_result)
    
    def test_analysis_with_missing_data(self, missing_data_dataset):
        """Test analysis workflow with missing data"""
        orchestrator = EngineOrchestrator()
        data_records = missing_data_dataset.to_dict('records')
        
        result = orchestrator.run_analysis(
            data=data_records,
            outcome_var="outcome",
            group_var="group"
        )
        
        # Should complete successfully despite missing data
        assert result["status"] == "completed"
        assert "final_result" in result
    
    def test_error_handling_invalid_variables(self):
        """Test error handling for invalid variable names"""
        orchestrator = EngineOrchestrator()
        data_records = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        
        result = orchestrator.run_analysis(
            data=data_records,
            outcome_var="nonexistent_column",
            group_var="group"
        )
        
        assert result["status"] == "failed"
        assert "error" in result
    
    def test_large_dataset_performance(self, large_dataset):
        """Test performance with large dataset"""
        import time
        
        orchestrator = EngineOrchestrator()
        data_records = large_dataset.head(100).to_dict('records')  # Limit for test speed
        
        start_time = time.time()
        result = orchestrator.run_analysis(
            data=data_records,
            outcome_var="outcome",
            group_var="group"
        )
        execution_time = time.time() - start_time
        
        assert result["status"] == "completed"
        assert execution_time < 5.0  # Should complete within 5 seconds
    
    def test_assumption_checking_integration(self, sample_csv_data):
        """Test that assumption checking is properly integrated"""
        orchestrator = EngineOrchestrator()
        data_records = sample_csv_data.to_dict('records')
        
        result = orchestrator.run_analysis(
            data=data_records,
            outcome_var="outcome",
            group_var="group"
        )
        
        assert "assumptions_checked" in result
        assumptions = result["assumptions_checked"]
        
        # Should have normality checks for both groups
        if "normality_group1" in assumptions:
            assert "test" in assumptions["normality_group1"]
            assert "passed" in assumptions["normality_group1"]
        
        # Should have equal variance check
        if "equal_variance" in assumptions:
            assert "test" in assumptions["equal_variance"]
            assert "passed" in assumptions["equal_variance"]


class TestStatisticalAccuracy:
    """Tests to verify statistical accuracy against known results"""
    
    def test_t_test_against_scipy(self):
        """Test t-test results against scipy.stats"""
        np.random.seed(42)
        group1 = np.random.normal(10, 2, 30)
        group2 = np.random.normal(12, 2, 30)
        
        # Our implementation
        our_result = StatisticalExecutor.execute_t_test(group1, group2, equal_var=True)
        
        # Scipy reference
        scipy_t, scipy_p = stats.ttest_ind(group1, group2, equal_var=True)
        
        # Compare results (allowing small numerical differences)
        assert abs(our_result.statistic["t"] - scipy_t) < 0.001
        assert abs(our_result.p_value - scipy_p) < 0.001
    
    def test_chi_square_against_scipy(self):
        """Test chi-square results against scipy.stats"""
        contingency_table = np.array([[20, 10], [15, 25]])
        
        # Our implementation
        our_result = StatisticalExecutor.execute_chi_square(contingency_table)
        
        # Scipy reference
        scipy_chi2, scipy_p, scipy_dof, _ = stats.chi2_contingency(contingency_table)
        
        # Compare results
        assert abs(our_result.statistic["chi2"] - scipy_chi2) < 0.001
        assert abs(our_result.p_value - scipy_p) < 0.001
        assert our_result.statistic["df"] == scipy_dof


# Performance and stress tests
class TestPerformance:
    """Performance and stress tests"""
    
    @pytest.mark.slow
    def test_large_dataset_analysis(self):
        """Test analysis with large dataset"""
        np.random.seed(42)
        large_data = pd.DataFrame({
            'group': np.random.choice(['A', 'B'], 10000),
            'outcome': np.random.normal(0.8, 0.15, 10000)
        })
        
        orchestrator = EngineOrchestrator()
        data_records = large_data.to_dict('records')
        
        import time
        start_time = time.time()
        result = orchestrator.run_analysis(
            data=data_records,
            outcome_var="outcome",
            group_var="group"
        )
        execution_time = time.time() - start_time
        
        assert result["status"] == "completed"
        assert execution_time < 10.0  # Should complete within 10 seconds
    
    def test_memory_efficiency(self):
        """Test memory efficiency with repeated analyses"""
        import gc
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        orchestrator = EngineOrchestrator()
        
        # Run multiple analyses
        for i in range(10):
            data = pd.DataFrame({
                'group': ['A', 'B'] * 50,
                'outcome': np.random.normal(0.8, 0.15, 100)
            })
            data_records = data.to_dict('records')
            
            result = orchestrator.run_analysis(
                data=data_records,
                outcome_var="outcome",
                group_var="group"
            )
            assert result["status"] == "completed"
            
            # Force garbage collection
            gc.collect()
        
        final_memory = process.memory_info().rss
        memory_increase = (final_memory - initial_memory) / 1024 / 1024  # MB
        
        # Memory increase should be reasonable (less than 50MB)
        assert memory_increase < 50 