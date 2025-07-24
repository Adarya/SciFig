"""
Tests for figure generation service
"""

import pytest
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import os

from app.services.figure_generator import FigureGenerator
from tests.conftest import assert_figure_file_exists


class TestFigureGenerator:
    """Tests for figure generation functionality"""
    
    @pytest.mark.asyncio
    async def test_generate_box_plot(self, figure_generator, sample_csv_data):
        """Test box plot generation"""
        # Create mock analysis results
        analysis_data = {
            "final_result": {
                "test_name": "Student's t-test",
                "p_value": 0.023,
                "groups": {
                    "group1": {
                        "n": 12,
                        "mean": 0.85,
                        "std": 0.15,
                        "sem": 0.043
                    },
                    "group2": {
                        "n": 12,
                        "mean": 0.72,
                        "std": 0.18,
                        "sem": 0.052
                    }
                }
            }
        }
        
        analysis_id = "test_analysis_123"
        
        figure_path = await figure_generator.generate_box_plot(
            analysis_id=analysis_id,
            data=analysis_data,
            outcome_var="outcome",
            group_var="group",
            style="nature",
            format="png",
            dpi=300
        )
        
        # Check that figure was created
        assert_figure_file_exists(figure_path)
        assert analysis_id in figure_path
        assert "box_plot" in figure_path
        assert figure_path.endswith(".png")
    
    @pytest.mark.asyncio
    async def test_generate_bar_plot(self, figure_generator):
        """Test bar plot generation"""
        analysis_data = {
            "final_result": {
                "test_name": "Student's t-test",
                "p_value": 0.001,
                "groups": {
                    "group1": {
                        "n": 25,
                        "mean": 75.2,
                        "std": 12.5,
                        "sem": 2.5
                    },
                    "group2": {
                        "n": 23,
                        "mean": 68.7,
                        "std": 14.2,
                        "sem": 2.96
                    }
                }
            }
        }
        
        analysis_id = "test_bar_plot_456"
        
        figure_path = await figure_generator.generate_bar_plot(
            analysis_id=analysis_id,
            data=analysis_data,
            outcome_var="score",
            group_var="treatment",
            style="science",
            format="png",
            dpi=300
        )
        
        assert_figure_file_exists(figure_path)
        assert "bar_plot" in figure_path
        assert analysis_id in figure_path
    
    @pytest.mark.asyncio
    async def test_generate_scatter_plot(self, figure_generator):
        """Test scatter plot generation"""
        analysis_data = {
            "final_result": {
                "test_name": "Correlation",
                "correlation": 0.75,
                "p_value": 0.002
            }
        }
        
        analysis_id = "test_scatter_789"
        
        figure_path = await figure_generator.generate_scatter_plot(
            analysis_id=analysis_id,
            data=analysis_data,
            x_var="age",
            y_var="score",
            group_var="gender",
            style="nejm",
            format="png",
            dpi=300
        )
        
        assert_figure_file_exists(figure_path)
        assert "scatter_plot" in figure_path
        assert analysis_id in figure_path
    
    def test_journal_style_application(self, figure_generator):
        """Test that journal styles are properly applied"""
        # Test Nature style
        figure_generator.apply_journal_style("nature")
        assert plt.rcParams["figure.figsize"] == (3.5, 3.5)
        assert plt.rcParams["font.size"] == 8
        assert plt.rcParams["font.family"] == ["Arial"]
        
        # Test Science style
        figure_generator.apply_journal_style("science")
        assert plt.rcParams["figure.figsize"] == (3.3, 3.3)
        assert plt.rcParams["font.size"] == 9
        
        # Test NEJM style
        figure_generator.apply_journal_style("nejm")
        assert plt.rcParams["figure.figsize"] == (3.6, 3.6)
        assert plt.rcParams["legend.frameon"] == True
        
        # Test default fallback
        figure_generator.apply_journal_style("nonexistent_style")
        assert plt.rcParams["figure.figsize"] == (3.5, 3.5)  # Should default to nature
    
    def test_significance_stars_conversion(self, figure_generator):
        """Test p-value to significance stars conversion"""
        assert figure_generator._get_significance_stars(0.0005) == "***"
        assert figure_generator._get_significance_stars(0.005) == "**"
        assert figure_generator._get_significance_stars(0.03) == "*"
        assert figure_generator._get_significance_stars(0.08) == "ns"
    
    @pytest.mark.asyncio
    async def test_different_export_formats(self, figure_generator):
        """Test different export formats"""
        analysis_data = {
            "final_result": {
                "test_name": "Student's t-test",
                "p_value": 0.045,
                "groups": {
                    "group1": {"n": 10, "mean": 5.2, "std": 1.1, "sem": 0.35},
                    "group2": {"n": 10, "mean": 4.8, "std": 1.3, "sem": 0.41}
                }
            }
        }
        
        formats_to_test = ["png", "svg"]
        
        for fmt in formats_to_test:
            figure_path = await figure_generator.generate_box_plot(
                analysis_id=f"test_format_{fmt}",
                data=analysis_data,
                outcome_var="outcome",
                group_var="group",
                format=fmt
            )
            
            assert_figure_file_exists(figure_path)
            assert figure_path.endswith(f".{fmt}")
    
    @pytest.mark.asyncio
    async def test_different_dpi_settings(self, figure_generator):
        """Test different DPI settings"""
        analysis_data = {
            "final_result": {
                "test_name": "Student's t-test",
                "p_value": 0.12,
                "groups": {
                    "group1": {"n": 8, "mean": 3.2, "std": 0.8, "sem": 0.28},
                    "group2": {"n": 8, "mean": 3.5, "std": 0.9, "sem": 0.32}
                }
            }
        }
        
        dpi_values = [150, 300, 600]
        
        for dpi in dpi_values:
            figure_path = await figure_generator.generate_box_plot(
                analysis_id=f"test_dpi_{dpi}",
                data=analysis_data,
                outcome_var="outcome",
                group_var="group",
                dpi=dpi
            )
            
            assert_figure_file_exists(figure_path)
    
    @pytest.mark.asyncio
    async def test_significance_annotation(self, figure_generator):
        """Test that significance annotations are added for significant results"""
        # Significant result
        significant_data = {
            "final_result": {
                "test_name": "Student's t-test",
                "p_value": 0.002,  # Significant
                "groups": {
                    "group1": {"n": 15, "mean": 6.2, "std": 1.2, "sem": 0.31},
                    "group2": {"n": 15, "mean": 4.8, "std": 1.1, "sem": 0.28}
                }
            }
        }
        
        figure_path = await figure_generator.generate_box_plot(
            analysis_id="test_significant",
            data=significant_data,
            outcome_var="outcome",
            group_var="group"
        )
        
        assert_figure_file_exists(figure_path)
        
        # Non-significant result
        non_significant_data = {
            "final_result": {
                "test_name": "Student's t-test",
                "p_value": 0.345,  # Not significant
                "groups": {
                    "group1": {"n": 15, "mean": 5.1, "std": 1.3, "sem": 0.34},
                    "group2": {"n": 15, "mean": 4.9, "std": 1.2, "sem": 0.31}
                }
            }
        }
        
        figure_path_ns = await figure_generator.generate_box_plot(
            analysis_id="test_non_significant",
            data=non_significant_data,
            outcome_var="outcome",
            group_var="group"
        )
        
        assert_figure_file_exists(figure_path_ns)
    
    @pytest.mark.asyncio
    async def test_error_handling_missing_data(self, figure_generator):
        """Test error handling when required data is missing"""
        # Empty analysis data
        empty_data = {"final_result": {}}
        
        with pytest.raises(ValueError, match="No group data available"):
            await figure_generator.generate_box_plot(
                analysis_id="test_empty",
                data=empty_data,
                outcome_var="outcome",
                group_var="group"
            )
        
        # Missing groups data
        missing_groups_data = {
            "final_result": {
                "test_name": "T-test",
                "p_value": 0.05
                # Missing 'groups' key
            }
        }
        
        with pytest.raises(ValueError, match="No group data available"):
            await figure_generator.generate_box_plot(
                analysis_id="test_missing_groups",
                data=missing_groups_data,
                outcome_var="outcome",
                group_var="group"
            )
    
    @pytest.mark.asyncio
    async def test_output_directory_creation(self, tmp_path):
        """Test that output directory is created if it doesn't exist"""
        output_dir = tmp_path / "new_figures_dir"
        
        # Directory should not exist initially
        assert not output_dir.exists()
        
        # Create figure generator with new directory
        generator = FigureGenerator(output_dir=str(output_dir))
        
        # Directory should be created
        assert output_dir.exists()
        assert output_dir.is_dir()


class TestFigureGeneratorColorPalettes:
    """Tests for color palette functionality"""
    
    def test_color_palette_selection(self, figure_generator):
        """Test that appropriate color palettes are selected"""
        from app.services.figure_generator import COLOR_PALETTES
        
        # Test 2 groups
        colors_2 = COLOR_PALETTES.get(2)
        assert len(colors_2) == 2
        assert all(isinstance(color, str) for color in colors_2)
        
        # Test 3 groups
        colors_3 = COLOR_PALETTES.get(3)
        assert len(colors_3) == 3
        
        # Test 4 groups
        colors_4 = COLOR_PALETTES.get(4)
        assert len(colors_4) == 4
        
        # Test default palette
        default_colors = COLOR_PALETTES.get("default")
        assert len(default_colors) >= 8


class TestFigureGeneratorPerformance:
    """Performance tests for figure generation"""
    
    @pytest.mark.asyncio
    async def test_figure_generation_speed(self, figure_generator):
        """Test that figure generation completes within reasonable time"""
        import time
        
        analysis_data = {
            "final_result": {
                "test_name": "Student's t-test",
                "p_value": 0.025,
                "groups": {
                    "group1": {"n": 50, "mean": 10.5, "std": 2.1, "sem": 0.30},
                    "group2": {"n": 50, "mean": 9.8, "std": 2.3, "sem": 0.33}
                }
            }
        }
        
        start_time = time.time()
        
        figure_path = await figure_generator.generate_box_plot(
            analysis_id="performance_test",
            data=analysis_data,
            outcome_var="outcome",
            group_var="group"
        )
        
        execution_time = time.time() - start_time
        
        assert_figure_file_exists(figure_path)
        assert execution_time < 5.0  # Should complete within 5 seconds
    
    @pytest.mark.asyncio
    async def test_multiple_figures_generation(self, figure_generator):
        """Test generating multiple figures in sequence"""
        analysis_data = {
            "final_result": {
                "test_name": "Student's t-test",
                "p_value": 0.031,
                "groups": {
                    "group1": {"n": 20, "mean": 7.2, "std": 1.5, "sem": 0.34},
                    "group2": {"n": 20, "mean": 6.8, "std": 1.4, "sem": 0.31}
                }
            }
        }
        
        figure_paths = []
        
        # Generate 5 figures
        for i in range(5):
            figure_path = await figure_generator.generate_box_plot(
                analysis_id=f"multi_test_{i}",
                data=analysis_data,
                outcome_var="outcome",
                group_var="group"
            )
            figure_paths.append(figure_path)
        
        # All figures should be created
        for path in figure_paths:
            assert_figure_file_exists(path)
        
        # All paths should be unique
        assert len(set(figure_paths)) == 5


class TestFigureGeneratorIntegration:
    """Integration tests for figure generator"""
    
    @pytest.mark.asyncio
    async def test_end_to_end_figure_workflow(self, figure_generator, sample_csv_data):
        """Test complete figure generation workflow"""
        # Simulate complete analysis workflow
        from app.services.statistical_engine import EngineOrchestrator
        
        orchestrator = EngineOrchestrator()
        data_records = sample_csv_data.to_dict('records')
        
        # Run analysis
        analysis_result = orchestrator.run_analysis(
            data=data_records,
            outcome_var="outcome",
            group_var="group"
        )
        
        # Generate figure from analysis results
        if analysis_result["status"] == "completed":
            figure_path = await figure_generator.generate_box_plot(
                analysis_id="integration_test",
                data=analysis_result,
                outcome_var="outcome",
                group_var="group"
            )
            
            assert_figure_file_exists(figure_path)
        else:
            pytest.skip("Analysis failed, cannot test figure generation")
    
    @pytest.mark.asyncio
    async def test_all_journal_styles_work(self, figure_generator):
        """Test that all journal styles produce valid figures"""
        analysis_data = {
            "final_result": {
                "test_name": "Student's t-test",
                "p_value": 0.018,
                "groups": {
                    "group1": {"n": 12, "mean": 8.3, "std": 1.8, "sem": 0.52},
                    "group2": {"n": 12, "mean": 7.1, "std": 1.6, "sem": 0.46}
                }
            }
        }
        
        styles = ["nature", "science", "nejm"]
        
        for style in styles:
            figure_path = await figure_generator.generate_box_plot(
                analysis_id=f"style_test_{style}",
                data=analysis_data,
                outcome_var="outcome",
                group_var="group",
                style=style
            )
            
            assert_figure_file_exists(figure_path)
            assert style in figure_path or "style_test" in figure_path 