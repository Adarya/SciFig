import { StatisticalResult } from './statisticalEngine';

export interface PublicationPlotlyData {
  x?: any[];
  y?: any[];
  z?: any[];
  type: string;
  mode?: string;
  name?: string;
  marker?: any;
  line?: any;
  boxpoints?: string;
  jitter?: number;
  pointpos?: number;
  text?: string[];
  hovertemplate?: string;
  error_y?: any;
}

export interface PublicationPlotlyLayout {
  title: {
    text: string;
    font: {
      size: number;
      family: string;
      color: string;
    };
    x: number;
  };
  xaxis: {
    title: {
      text: string;
      font: {
        size: number;
        family: string;
        color: string;
      };
    };
    showgrid: boolean;
    gridcolor: string;
    linecolor: string;
    linewidth: number;
    tickfont: {
      size: number;
      family: string;
      color: string;
    };
    type?: string;
    tickvals?: any[];
    ticktext?: string[];
  };
  yaxis: {
    title: {
      text: string;
      font: {
        size: number;
        family: string;
        color: string;
      };
    };
    showgrid: boolean;
    gridcolor: string;
    linecolor: string;
    linewidth: number;
    tickfont: {
      size: number;
      family: string;
      color: string;
    };
    type?: string;
    tickvals?: any[];
    ticktext?: string[];
  };
  showlegend: boolean;
  legend?: {
    x: number;
    y: number;
    bgcolor: string;
    bordercolor: string;
    borderwidth: number;
    font: {
      size: number;
      family: string;
      color: string;
    };
  };
  plot_bgcolor: string;
  paper_bgcolor: string;
  font: {
    family: string;
    size: number;
    color: string;
  };
  annotations?: any[];
  margin: {
    l: number;
    r: number;
    t: number;
    b: number;
  };
  width: number;
  height: number;
}

export interface PublicationFigureConfig {
  displayModeBar: boolean;
  responsive: boolean;
  displaylogo: boolean;
  modeBarButtonsToRemove: string[];
  toImageButtonOptions: {
    format: string;
    filename: string;
    height: number;
    width: number;
    scale: number;
  };
}

export class PublicationFigureGenerator {
  // Publication-ready settings
  private static readonly PUBLICATION_SETTINGS = {
    WIDTH: 600,
    HEIGHT: 450,
    DPI_SCALE: 5, // 300 DPI equivalent
    FONT_FAMILY: 'Arial, sans-serif',
    TITLE_SIZE: 24,
    AXIS_TITLE_SIZE: 20,
    TICK_SIZE: 18,
    LEGEND_SIZE: 16,
    ANNOTATION_SIZE: 18,
    LINE_WIDTH: 3,
    MARKER_SIZE: 10,
    GRID_COLOR: '#E8E8E8',
    MARGIN: { l: 90, r: 40, t: 90, b: 90 }
  };

  static generateBoxPlot(
    data: any[],
    groupVar: string,
    valueVar: string,
    result: StatisticalResult,
    style: string = 'nature',
    customLabels?: { x?: string; y?: string; title?: string }
  ): { data: PublicationPlotlyData[]; layout: PublicationPlotlyLayout; config: PublicationFigureConfig } {
    const groups = [...new Set(data.map(row => row[groupVar]))];
    const colors = this.getPublicationColors();
    
    const plotData: PublicationPlotlyData[] = groups.map((group, index) => {
      const groupData = data
        .filter(row => row[groupVar] === group)
        .map(row => Number(row[valueVar]))
        .filter(val => !isNaN(val));

      return {
        y: groupData,
        type: 'box',
        name: String(group),
        marker: {
          color: colors[index % colors.length],
          size: this.PUBLICATION_SETTINGS.MARKER_SIZE,
          line: {
            color: '#000',
            width: 2
          }
        },
        boxpoints: 'outliers',
        jitter: 0.3,
        pointpos: -1.8,
        line: {
          color: '#000',
          width: this.PUBLICATION_SETTINGS.LINE_WIDTH
        }
      };
    });

    // Enhanced statistical annotations
    const annotations = [];
    if (result.p_value < 0.05) {
      const maxY = Math.max(...data.map(row => Number(row[valueVar])).filter(val => !isNaN(val)));
      const significance = result.p_value < 0.001 ? '***' : result.p_value < 0.01 ? '**' : '*';
      
      // Significance line
      annotations.push({
        x: 0.2,
        y: maxY * 1.15,
        xref: 'paper',
        yref: 'y',
        text: '',
        showarrow: true,
        arrowhead: 0,
        arrowsize: 1,
        arrowwidth: 4,
        arrowcolor: '#000',
        ax: 0.8,
        ay: 0,
        axref: 'paper',
        ayref: 'y'
      });

      // Significance stars
      annotations.push({
        x: 0.5,
        y: maxY * 1.18,
        xref: 'paper',
        yref: 'y',
        text: significance,
        showarrow: false,
        font: { 
          size: this.PUBLICATION_SETTINGS.ANNOTATION_SIZE + 6, 
          color: '#000',
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY
        }
      });

      // P-value with effect size
      const effectSizeText = result.effect_size ? 
        `, ${result.effect_size.name} = ${result.effect_size.value.toFixed(2)}` : '';
      
      annotations.push({
        x: 0.5,
        y: maxY * 1.25,
        xref: 'paper',
        yref: 'y',
        text: `p = ${result.p_value < 0.001 ? '<0.001' : result.p_value.toFixed(3)}${effectSizeText}`,
        showarrow: false,
        font: { 
          size: this.PUBLICATION_SETTINGS.ANNOTATION_SIZE, 
          color: '#000',
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY
        }
      });
    }

    const layout: PublicationPlotlyLayout = {
      title: {
        text: customLabels?.title || this.cleanVariableName(valueVar),
        font: {
          size: this.PUBLICATION_SETTINGS.TITLE_SIZE,
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
          color: '#000'
        },
        x: 0.5
      },
      xaxis: {
        title: {
          text: customLabels?.x || this.cleanVariableName(groupVar),
          font: {
            size: this.PUBLICATION_SETTINGS.AXIS_TITLE_SIZE,
            family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
            color: '#000'
          }
        },
        showgrid: false,
        gridcolor: this.PUBLICATION_SETTINGS.GRID_COLOR,
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: this.PUBLICATION_SETTINGS.TICK_SIZE,
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
          color: '#000'
        }
      },
      yaxis: {
        title: {
          text: customLabels?.y || this.cleanVariableName(valueVar),
          font: {
            size: this.PUBLICATION_SETTINGS.AXIS_TITLE_SIZE,
            family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
            color: '#000'
          }
        },
        showgrid: true,
        gridcolor: this.PUBLICATION_SETTINGS.GRID_COLOR,
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: this.PUBLICATION_SETTINGS.TICK_SIZE,
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
          color: '#000'
        }
      },
      showlegend: false,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
        size: this.PUBLICATION_SETTINGS.LEGEND_SIZE,
        color: '#000'
      },
      annotations,
      margin: this.PUBLICATION_SETTINGS.MARGIN,
      width: this.PUBLICATION_SETTINGS.WIDTH,
      height: this.PUBLICATION_SETTINGS.HEIGHT
    };

    return {
      data: plotData,
      layout,
      config: this.getPublicationConfig('boxplot')
    };
  }

  static generateBarPlot(
    data: any[],
    groupVar: string,
    valueVar: string,
    result: StatisticalResult,
    style: string = 'nature',
    customLabels?: { x?: string; y?: string; title?: string }
  ): { data: PublicationPlotlyData[]; layout: PublicationPlotlyLayout; config: PublicationFigureConfig } {
    const groups = [...new Set(data.map(row => row[groupVar]))];
    const colors = this.getPublicationColors();
    
    // Calculate means and standard errors for each group
    const groupStats = groups.map(group => {
      const groupData = data
        .filter(row => row[groupVar] === group)
        .map(row => Number(row[valueVar]))
        .filter(val => !isNaN(val));
      
      const mean = groupData.reduce((sum, val) => sum + val, 0) / groupData.length;
      const variance = groupData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (groupData.length - 1);
      const standardError = Math.sqrt(variance / groupData.length);
      
      return { group, mean, standardError, n: groupData.length };
    });

    const plotData: PublicationPlotlyData[] = [{
      x: groupStats.map(stat => stat.group),
      y: groupStats.map(stat => stat.mean),
      type: 'bar',
      marker: {
        color: colors[0],
        line: {
          color: '#000',
          width: 2
        }
      },
      error_y: {
        type: 'data',
        array: groupStats.map(stat => stat.standardError),
        visible: true,
        color: '#000',
        thickness: 3,
        width: 10
      }
    }];

    // Add statistical annotations for ANOVA
    const annotations = [];
    if (result.p_value < 0.05) {
      const maxY = Math.max(...groupStats.map(stat => stat.mean + stat.standardError));
      
      annotations.push({
        x: 0.5,
        y: maxY * 1.15,
        xref: 'paper',
        yref: 'y',
        text: `F = ${result.statistic.F_statistic?.toFixed(2) || 'N/A'}, p = ${result.p_value < 0.001 ? '<0.001' : result.p_value.toFixed(3)}`,
        showarrow: false,
        font: { 
          size: this.PUBLICATION_SETTINGS.ANNOTATION_SIZE, 
          color: '#000',
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY
        },
        bgcolor: 'rgba(255,255,255,0.8)',
        bordercolor: '#000',
        borderwidth: 1
      });

      if (result.effect_size) {
        annotations.push({
          x: 0.5,
          y: maxY * 1.22,
          xref: 'paper',
          yref: 'y',
          text: `${result.effect_size.name} = ${result.effect_size.value.toFixed(3)}`,
          showarrow: false,
          font: { 
            size: this.PUBLICATION_SETTINGS.ANNOTATION_SIZE - 2, 
            color: '#000',
            family: this.PUBLICATION_SETTINGS.FONT_FAMILY
          }
        });
      }
    }

    const layout: PublicationPlotlyLayout = {
      title: {
        text: customLabels?.title || `Mean ± SEM ${this.cleanVariableName(valueVar)}`,
        font: {
          size: this.PUBLICATION_SETTINGS.TITLE_SIZE,
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
          color: '#000'
        },
        x: 0.5
      },
      xaxis: {
        title: {
          text: customLabels?.x || this.cleanVariableName(groupVar),
          font: {
            size: this.PUBLICATION_SETTINGS.AXIS_TITLE_SIZE,
            family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
            color: '#000'
          }
        },
        showgrid: false,
        gridcolor: this.PUBLICATION_SETTINGS.GRID_COLOR,
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: this.PUBLICATION_SETTINGS.TICK_SIZE,
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
          color: '#000'
        }
      },
      yaxis: {
        title: {
          text: customLabels?.y || `Mean ${this.cleanVariableName(valueVar)}`,
          font: {
            size: this.PUBLICATION_SETTINGS.AXIS_TITLE_SIZE,
            family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
            color: '#000'
          }
        },
        showgrid: true,
        gridcolor: this.PUBLICATION_SETTINGS.GRID_COLOR,
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: this.PUBLICATION_SETTINGS.TICK_SIZE,
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
          color: '#000'
        }
      },
      showlegend: false,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
        size: this.PUBLICATION_SETTINGS.LEGEND_SIZE,
        color: '#000'
      },
      annotations,
      margin: this.PUBLICATION_SETTINGS.MARGIN,
      width: this.PUBLICATION_SETTINGS.WIDTH,
      height: this.PUBLICATION_SETTINGS.HEIGHT
    };

    return {
      data: plotData,
      layout,
      config: this.getPublicationConfig('barplot')
    };
  }

  static generateSurvivalCurve(
    result: StatisticalResult,
    style: string = 'nature',
    customLabels?: { x?: string; y?: string; title?: string }
  ): { data: PublicationPlotlyData[]; layout: PublicationPlotlyLayout; config: PublicationFigureConfig } {
    if (!result.survival_data) {
      throw new Error('No survival data available');
    }

    const { times, events, groups, group_stats } = result.survival_data;
    const colors = this.getPublicationColors();

    // Calculate Kaplan-Meier curves
    const uniqueGroups = groups ? [...new Set(groups)] : ['All'];
    const plotData: PublicationPlotlyData[] = [];

    uniqueGroups.forEach((group, groupIndex) => {
      // Filter data for this group
      const groupIndices = groups ? 
        groups.map((g, i) => g === group ? i : -1).filter(i => i !== -1) :
        times.map((_, i) => i);

      const groupTimes = groupIndices.map(i => times[i]);
      const groupEvents = groupIndices.map(i => events[i]);

      // Sort by time
      const sortedData = groupTimes.map((time, i) => ({
        time,
        event: groupEvents[i]
      })).sort((a, b) => a.time - b.time);

      // Calculate survival probabilities
      let atRisk = sortedData.length;
      let survivalProb = 1.0;
      const survivalCurve: { time: number; survival: number }[] = [{ time: 0, survival: 1.0 }];

      const uniqueTimes = [...new Set(sortedData.map(d => d.time))];
      
      for (const time of uniqueTimes) {
        const eventsAtTime = sortedData.filter(d => d.time === time && d.event).length;
        const atRiskAtTime = sortedData.filter(d => d.time >= time).length;
        
        if (eventsAtTime > 0 && atRiskAtTime > 0) {
          survivalProb *= (atRiskAtTime - eventsAtTime) / atRiskAtTime;
        }
        
        survivalCurve.push({ time, survival: survivalProb });
      }

      plotData.push({
        x: survivalCurve.map(point => point.time),
        y: survivalCurve.map(point => point.survival),
        type: 'scatter',
        mode: 'lines',
        name: group,
        line: {
          color: colors[groupIndex % colors.length],
          width: this.PUBLICATION_SETTINGS.LINE_WIDTH + 1,
          shape: 'hv' // Step function
        }
      });
    });

    // Enhanced annotations for survival analysis
    const annotations = [];
    
    // Add p-value and risk table
    if (result.p_value < 0.05) {
      annotations.push({
        x: 0.02,
        y: 0.98,
        xref: 'paper',
        yref: 'paper',
        text: `Log-rank p = ${result.p_value < 0.001 ? '<0.001' : result.p_value.toFixed(3)}`,
        showarrow: false,
        font: { 
          size: this.PUBLICATION_SETTINGS.ANNOTATION_SIZE, 
          color: '#000',
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY
        },
        bgcolor: 'rgba(255,255,255,0.9)',
        bordercolor: '#000',
        borderwidth: 1
      });
    }

    // Add risk table information
    if (group_stats) {
      let yPos = 0.25;
      Object.entries(group_stats).forEach(([group, stats], index) => {
        annotations.push({
          x: 0.02,
          y: yPos - (index * 0.06),
          xref: 'paper',
          yref: 'paper',
          text: `${group}: n=${stats.n}, events=${stats.events}, median=${stats.median_survival.toFixed(1)}`,
          showarrow: false,
          font: { 
            size: this.PUBLICATION_SETTINGS.ANNOTATION_SIZE - 2, 
            color: colors[index % colors.length],
            family: this.PUBLICATION_SETTINGS.FONT_FAMILY
          },
          bgcolor: 'rgba(255,255,255,0.8)'
        });
      });
    }

    const layout: PublicationPlotlyLayout = {
      title: {
        text: customLabels?.title || 'Kaplan-Meier Survival Analysis',
        font: {
          size: this.PUBLICATION_SETTINGS.TITLE_SIZE,
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
          color: '#000'
        },
        x: 0.5
      },
      xaxis: {
        title: {
          text: customLabels?.x || 'Time',
          font: {
            size: this.PUBLICATION_SETTINGS.AXIS_TITLE_SIZE,
            family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
            color: '#000'
          }
        },
        showgrid: true,
        gridcolor: this.PUBLICATION_SETTINGS.GRID_COLOR,
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: this.PUBLICATION_SETTINGS.TICK_SIZE,
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
          color: '#000'
        }
      },
      yaxis: {
        title: {
          text: customLabels?.y || 'Survival Probability',
          font: {
            size: this.PUBLICATION_SETTINGS.AXIS_TITLE_SIZE,
            family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
            color: '#000'
          }
        },
        showgrid: true,
        gridcolor: this.PUBLICATION_SETTINGS.GRID_COLOR,
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: this.PUBLICATION_SETTINGS.TICK_SIZE,
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
          color: '#000'
        },
        type: 'linear'
      },
      showlegend: uniqueGroups.length > 1,
      legend: uniqueGroups.length > 1 ? {
        x: 0.7,
        y: 0.9,
        bgcolor: 'rgba(255,255,255,0.9)',
        bordercolor: '#000',
        borderwidth: 1,
        font: {
          size: this.PUBLICATION_SETTINGS.LEGEND_SIZE,
          family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
          color: '#000'
        }
      } : undefined,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.PUBLICATION_SETTINGS.FONT_FAMILY,
        size: this.PUBLICATION_SETTINGS.LEGEND_SIZE,
        color: '#000'
      },
      annotations,
      margin: this.PUBLICATION_SETTINGS.MARGIN,
      width: this.PUBLICATION_SETTINGS.WIDTH,
      height: this.PUBLICATION_SETTINGS.HEIGHT
    };

    return {
      data: plotData,
      layout,
      config: this.getPublicationConfig('survival')
    };
  }

  private static getPublicationConfig(figureType: string): PublicationFigureConfig {
    return {
      displayModeBar: true,
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: [
        'select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines',
        'hoverCompareCartesian', 'hoverClosestCartesian'
      ],
      toImageButtonOptions: {
        format: 'png',
        filename: `publication_${figureType}_${Date.now()}`,
        height: this.PUBLICATION_SETTINGS.HEIGHT,
        width: this.PUBLICATION_SETTINGS.WIDTH,
        scale: this.PUBLICATION_SETTINGS.DPI_SCALE
      }
    };
  }

  private static getPublicationColors(): string[] {
    // High-contrast, publication-ready color scheme
    return [
      '#2E86AB',  // Blue
      '#A23B72',  // Pink/Red
      '#F18F01',  // Orange
      '#C73E1D',  // Red
      '#20854E',  // Green
      '#7876B1',  // Purple
      '#8B4513',  // Brown
      '#2F4F4F'   // Dark Slate Gray
    ];
  }

  private static cleanVariableName(varName: string): string {
    return varName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }
}