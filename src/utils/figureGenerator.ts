import { StatisticalResult, DataProfile } from './statisticalEngine';

export interface PlotlyData {
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

export interface PlotlyLayout {
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
  width?: number;
  height?: number;
}

export interface FigureConfig {
  displayModeBar: boolean;
  responsive: boolean;
  toImageButtonOptions: {
    format: string;
    filename: string;
    height: number;
    width: number;
    scale: number;
  };
}

export class FigureGenerator {
  static generateBoxPlot(
    data: any[],
    groupVar: string,
    valueVar: string,
    result: StatisticalResult,
    style: string = 'nature',
    customLabels?: { x?: string; y?: string; title?: string }
  ): { data: PlotlyData[]; layout: PlotlyLayout; config: FigureConfig } {
    const groups = [...new Set(data.map(row => row[groupVar]))];
    const colors = this.getColorScheme(style);
    
    const plotData: PlotlyData[] = groups.map((group, index) => {
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
          size: 8,
          line: {
            color: '#000',
            width: 1
          }
        },
        boxpoints: 'outliers',
        jitter: 0.3,
        pointpos: -1.8,
        line: {
          color: '#000',
          width: 2
        }
      };
    });

    // Add statistical annotation for significance
    const annotations = [];
    if (result.p_value < 0.05) {
      const maxY = Math.max(...data.map(row => Number(row[valueVar])).filter(val => !isNaN(val)));
      const significance = result.p_value < 0.001 ? '***' : result.p_value < 0.01 ? '**' : '*';
      
      // Add significance line
      annotations.push({
        x: 0.2,
        y: maxY * 1.15,
        xref: 'paper',
        yref: 'y',
        text: '',
        showarrow: true,
        arrowhead: 0,
        arrowsize: 1,
        arrowwidth: 3,
        arrowcolor: '#000',
        ax: 0.8,
        ay: 0,
        axref: 'paper',
        ayref: 'y'
      });

      // Add significance stars
      annotations.push({
        x: 0.5,
        y: maxY * 1.18,
        xref: 'paper',
        yref: 'y',
        text: significance,
        showarrow: false,
        font: { 
          size: 18, 
          color: '#000',
          family: this.getFontFamily(style)
        }
      });

      // Add p-value
      annotations.push({
        x: 0.5,
        y: maxY * 1.25,
        xref: 'paper',
        yref: 'y',
        text: `p = ${result.p_value.toFixed(3)}`,
        showarrow: false,
        font: { 
          size: 14, 
          color: '#000',
          family: this.getFontFamily(style)
        }
      });
    }

    const layout: PlotlyLayout = {
      title: {
        text: customLabels?.title || this.cleanVariableName(valueVar),
        font: {
          size: 18,
          family: this.getFontFamily(style),
          color: '#000'
        },
        x: 0.5
      },
      xaxis: {
        title: {
          text: customLabels?.x || this.cleanVariableName(groupVar),
          font: {
            size: 14,
            family: this.getFontFamily(style),
            color: '#000'
          }
        },
        showgrid: false,
        gridcolor: '#E5E5E5',
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: 12,
          family: this.getFontFamily(style),
          color: '#000'
        }
      },
      yaxis: {
        title: {
          text: customLabels?.y || this.cleanVariableName(valueVar),
          font: {
            size: 14,
            family: this.getFontFamily(style),
            color: '#000'
          }
        },
        showgrid: true,
        gridcolor: '#E5E5E5',
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: 12,
          family: this.getFontFamily(style),
          color: '#000'
        }
      },
      showlegend: false,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.getFontFamily(style),
        size: 12,
        color: '#000'
      },
      annotations,
      margin: {
        l: 60,
        r: 20,
        t: 60,
        b: 60
      },
      width: 500,
      height: 400
    };

    return {
      data: plotData,
      layout,
      config: {
        displayModeBar: true,
        responsive: true,
        toImageButtonOptions: {
          format: 'png',
          filename: 'figure',
          height: 400,
          width: 500,
          scale: 3
        }
      }
    };
  }

  static generateBarPlot(
    data: any[],
    groupVar: string,
    valueVar: string,
    result: StatisticalResult,
    style: string = 'nature',
    customLabels?: { x?: string; y?: string; title?: string }
  ): { data: PlotlyData[]; layout: PlotlyLayout; config: FigureConfig } {
    const groups = [...new Set(data.map(row => row[groupVar]))];
    const colors = this.getColorScheme(style);
    
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

    const plotData: PlotlyData[] = [{
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
        thickness: 2,
        width: 8
      }
    }];

    const layout: PlotlyLayout = {
      title: {
        text: customLabels?.title || `Mean ${this.cleanVariableName(valueVar)}`,
        font: {
          size: 18,
          family: this.getFontFamily(style),
          color: '#000'
        },
        x: 0.5
      },
      xaxis: {
        title: {
          text: customLabels?.x || this.cleanVariableName(groupVar),
          font: {
            size: 14,
            family: this.getFontFamily(style),
            color: '#000'
          }
        },
        showgrid: false,
        gridcolor: '#E5E5E5',
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: 12,
          family: this.getFontFamily(style),
          color: '#000'
        }
      },
      yaxis: {
        title: {
          text: customLabels?.y || `Mean ${this.cleanVariableName(valueVar)}`,
          font: {
            size: 14,
            family: this.getFontFamily(style),
            color: '#000'
          }
        },
        showgrid: true,
        gridcolor: '#E5E5E5',
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: 12,
          family: this.getFontFamily(style),
          color: '#000'
        }
      },
      showlegend: false,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.getFontFamily(style),
        size: 12,
        color: '#000'
      },
      margin: {
        l: 60,
        r: 20,
        t: 60,
        b: 60
      },
      width: 500,
      height: 400
    };

    return {
      data: plotData,
      layout,
      config: {
        displayModeBar: true,
        responsive: true,
        toImageButtonOptions: {
          format: 'png',
          filename: 'figure',
          height: 400,
          width: 500,
          scale: 3
        }
      }
    };
  }

  static generateContingencyHeatmap(
    result: StatisticalResult,
    groupVar: string,
    outcomeVar: string,
    style: string = 'nature',
    customLabels?: { x?: string; y?: string; title?: string }
  ): { data: PlotlyData[]; layout: PlotlyLayout; config: FigureConfig } {
    if (!result.contingency_table) {
      throw new Error('No contingency table data available');
    }

    const contingencyTable = result.contingency_table;
    const groupNames = result.group_names || ['Group 1', 'Group 2'];
    const outcomeNames = result.outcome_names || ['Outcome 1', 'Outcome 2'];
    const colors = this.getColorScheme(style);

    // Create heatmap data
    const plotData: PlotlyData[] = [{
      z: contingencyTable,
      type: 'heatmap',
      colorscale: [
        [0, '#ffffff'],
        [0.5, colors[0] + '80'],
        [1, colors[0]]
      ],
      showscale: true,
      text: contingencyTable.map(row => 
        row.map(cell => cell.toString())
      ),
      texttemplate: '%{text}',
      textfont: { 
        size: 16, 
        color: '#000',
        family: this.getFontFamily(style)
      },
      hovertemplate: 'Count: %{z}<extra></extra>',
      x: outcomeNames,
      y: groupNames
    }];

    const layout: PlotlyLayout = {
      title: {
        text: customLabels?.title || `${this.cleanVariableName(outcomeVar)} vs ${this.cleanVariableName(groupVar)}`,
        font: {
          size: 18,
          family: this.getFontFamily(style),
          color: '#000'
        },
        x: 0.5
      },
      xaxis: {
        title: {
          text: customLabels?.x || this.cleanVariableName(outcomeVar),
          font: {
            size: 14,
            family: this.getFontFamily(style),
            color: '#000'
          }
        },
        showgrid: false,
        gridcolor: '#E5E5E5',
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: 12,
          family: this.getFontFamily(style),
          color: '#000'
        },
        tickvals: outcomeNames.map((_, i) => i),
        ticktext: outcomeNames
      },
      yaxis: {
        title: {
          text: customLabels?.y || this.cleanVariableName(groupVar),
          font: {
            size: 14,
            family: this.getFontFamily(style),
            color: '#000'
          }
        },
        showgrid: false,
        gridcolor: '#E5E5E5',
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: 12,
          family: this.getFontFamily(style),
          color: '#000'
        },
        tickvals: groupNames.map((_, i) => i),
        ticktext: groupNames
      },
      showlegend: false,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.getFontFamily(style),
        size: 12,
        color: '#000'
      },
      margin: {
        l: 80,
        r: 20,
        t: 60,
        b: 80
      },
      width: 500,
      height: 400
    };

    return {
      data: plotData,
      layout,
      config: {
        displayModeBar: true,
        responsive: true,
        toImageButtonOptions: {
          format: 'png',
          filename: 'figure',
          height: 400,
          width: 500,
          scale: 3
        }
      }
    };
  }

  static generateSurvivalCurve(
    result: StatisticalResult,
    style: string = 'nature',
    customLabels?: { x?: string; y?: string; title?: string }
  ): { data: PlotlyData[]; layout: PlotlyLayout; config: FigureConfig } {
    if (!result.survival_data) {
      throw new Error('No survival data available');
    }

    const { times, events, groups, group_stats } = result.survival_data;
    const colors = this.getColorScheme(style);

    // Calculate Kaplan-Meier curves
    const uniqueGroups = groups ? [...new Set(groups)] : ['All'];
    const plotData: PlotlyData[] = [];

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
          width: 3,
          shape: 'hv' // Step function
        }
      });
    });

    // Create annotations for statistics
    const annotations = [];
    
    // Add p-value if significant
    if (result.p_value < 0.05) {
      annotations.push({
        x: 0.02,
        y: 0.98,
        xref: 'paper',
        yref: 'paper',
        text: `p = ${result.p_value.toFixed(3)}`,
        showarrow: false,
        font: { 
          size: 12, 
          color: '#000',
          family: this.getFontFamily(style)
        },
        bgcolor: 'rgba(255,255,255,0.8)',
        bordercolor: '#000',
        borderwidth: 1
      });
    }

    // Add risk table information
    if (group_stats) {
      let yPos = 0.15;
      Object.entries(group_stats).forEach(([group, stats], index) => {
        annotations.push({
          x: 0.02,
          y: yPos - (index * 0.05),
          xref: 'paper',
          yref: 'paper',
          text: `${group}: n=${stats.n}, events=${stats.events}, median=${stats.median_survival.toFixed(1)}`,
          showarrow: false,
          font: { 
            size: 10, 
            color: colors[index % colors.length],
            family: this.getFontFamily(style)
          },
          bgcolor: 'rgba(255,255,255,0.8)'
        });
      });
    }

    const layout: PlotlyLayout = {
      title: {
        text: customLabels?.title || 'Kaplan-Meier Survival Curves',
        font: {
          size: 18,
          family: this.getFontFamily(style),
          color: '#000'
        },
        x: 0.5
      },
      xaxis: {
        title: {
          text: customLabels?.x || 'Time',
          font: {
            size: 14,
            family: this.getFontFamily(style),
            color: '#000'
          }
        },
        showgrid: true,
        gridcolor: '#E5E5E5',
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: 12,
          family: this.getFontFamily(style),
          color: '#000'
        }
      },
      yaxis: {
        title: {
          text: customLabels?.y || 'Survival Probability',
          font: {
            size: 14,
            family: this.getFontFamily(style),
            color: '#000'
          }
        },
        showgrid: true,
        gridcolor: '#E5E5E5',
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: 12,
          family: this.getFontFamily(style),
          color: '#000'
        },
        type: 'linear'
      },
      showlegend: uniqueGroups.length > 1,
      legend: uniqueGroups.length > 1 ? {
        x: 0.7,
        y: 0.9,
        bgcolor: 'rgba(255,255,255,0.8)',
        bordercolor: '#000',
        borderwidth: 1,
        font: {
          size: 12,
          family: this.getFontFamily(style),
          color: '#000'
        }
      } : undefined,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.getFontFamily(style),
        size: 12,
        color: '#000'
      },
      annotations,
      margin: {
        l: 60,
        r: 20,
        t: 60,
        b: 60
      },
      width: 500,
      height: 400
    };

    return {
      data: plotData,
      layout,
      config: {
        displayModeBar: true,
        responsive: true,
        toImageButtonOptions: {
          format: 'png',
          filename: 'survival_curve',
          height: 400,
          width: 500,
          scale: 3
        }
      }
    };
  }

  static generateScatterPlot(
    data: any[],
    xVar: string,
    yVar: string,
    style: string = 'nature',
    customLabels?: { x?: string; y?: string; title?: string }
  ): { data: PlotlyData[]; layout: PlotlyLayout; config: FigureConfig } {
    const colors = this.getColorScheme(style);
    
    const plotData: PlotlyData[] = [{
      x: data.map(row => Number(row[xVar])).filter(val => !isNaN(val)),
      y: data.map(row => Number(row[yVar])).filter(val => !isNaN(val)),
      type: 'scatter',
      mode: 'markers',
      marker: {
        color: colors[0],
        size: 8,
        opacity: 0.7,
        line: {
          color: '#000',
          width: 1
        }
      }
    }];

    const layout: PlotlyLayout = {
      title: {
        text: customLabels?.title || `${this.cleanVariableName(yVar)} vs ${this.cleanVariableName(xVar)}`,
        font: {
          size: 18,
          family: this.getFontFamily(style),
          color: '#000'
        },
        x: 0.5
      },
      xaxis: {
        title: {
          text: customLabels?.x || this.cleanVariableName(xVar),
          font: {
            size: 14,
            family: this.getFontFamily(style),
            color: '#000'
          }
        },
        showgrid: true,
        gridcolor: '#E5E5E5',
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: 12,
          family: this.getFontFamily(style),
          color: '#000'
        }
      },
      yaxis: {
        title: {
          text: customLabels?.y || this.cleanVariableName(yVar),
          font: {
            size: 14,
            family: this.getFontFamily(style),
            color: '#000'
          }
        },
        showgrid: true,
        gridcolor: '#E5E5E5',
        linecolor: '#000',
        linewidth: 2,
        tickfont: {
          size: 12,
          family: this.getFontFamily(style),
          color: '#000'
        }
      },
      showlegend: false,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.getFontFamily(style),
        size: 12,
        color: '#000'
      },
      margin: {
        l: 60,
        r: 20,
        t: 60,
        b: 60
      },
      width: 500,
      height: 400
    };

    return {
      data: plotData,
      layout,
      config: {
        displayModeBar: true,
        responsive: true,
        toImageButtonOptions: {
          format: 'png',
          filename: 'scatter_plot',
          height: 400,
          width: 500,
          scale: 3
        }
      }
    };
  }

  private static cleanVariableName(varName: string): string {
    return varName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  private static getColorScheme(style: string): string[] {
    const schemes = {
      nature: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
      science: ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#592E83'],
      nejm: ['#BC3C29', '#0072B5', '#E18727', '#20854E', '#7876B1'],
      jama: ['#374E55', '#DF8F44', '#00A1C9', '#B24745', '#79AF97'],
      plos: ['#1B9E77', '#D95F02', '#7570B3', '#E7298A', '#66A61E']
    };
    
    return schemes[style as keyof typeof schemes] || schemes.nature;
  }

  private static getFontFamily(style: string): string {
    const fonts = {
      nature: 'Arial, sans-serif',
      science: 'Helvetica, Arial, sans-serif',
      nejm: 'Times New Roman, serif',
      jama: 'Arial, sans-serif',
      plos: 'Arial, sans-serif'
    };
    
    return fonts[style as keyof typeof fonts] || fonts.nature;
  }
}