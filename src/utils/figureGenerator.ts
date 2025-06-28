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
}

export interface PlotlyLayout {
  title: string;
  xaxis: {
    title: string;
    showgrid: boolean;
    type?: string;
  };
  yaxis: {
    title: string;
    showgrid: boolean;
    type?: string;
  };
  showlegend: boolean;
  plot_bgcolor: string;
  paper_bgcolor: string;
  font: {
    family: string;
    size: number;
    color: string;
  };
  annotations?: any[];
}

export interface FigureConfig {
  displayModeBar: boolean;
  responsive: boolean;
}

export class FigureGenerator {
  static generateBoxPlot(
    data: any[],
    groupVar: string,
    valueVar: string,
    result: StatisticalResult,
    style: string = 'nature'
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
          color: colors[index % colors.length]
        },
        boxpoints: 'outliers',
        jitter: 0.3,
        pointpos: -1.8
      };
    });

    // Add statistical annotation
    const annotations = [];
    if (result.p_value < 0.05) {
      const maxY = Math.max(...data.map(row => Number(row[valueVar])).filter(val => !isNaN(val)));
      const significance = result.p_value < 0.001 ? '***' : result.p_value < 0.01 ? '**' : '*';
      
      annotations.push({
        x: 0.5,
        y: maxY * 1.1,
        xref: 'paper',
        yref: 'y',
        text: significance,
        showarrow: false,
        font: { size: 16, color: '#000' }
      });

      // Add connecting line for significance
      annotations.push({
        x: 0.2,
        y: maxY * 1.05,
        xref: 'paper',
        yref: 'y',
        text: '',
        showarrow: true,
        arrowhead: 0,
        arrowsize: 1,
        arrowwidth: 2,
        arrowcolor: '#000',
        ax: 0.8,
        ay: 0,
        axref: 'paper',
        ayref: 'y'
      });
    }

    const layout: PlotlyLayout = {
      title: `${valueVar} by ${groupVar}`,
      xaxis: {
        title: groupVar,
        showgrid: false
      },
      yaxis: {
        title: valueVar,
        showgrid: true
      },
      showlegend: false,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.getFontFamily(style),
        size: 12,
        color: '#000'
      },
      annotations
    };

    return {
      data: plotData,
      layout,
      config: {
        displayModeBar: false,
        responsive: true
      }
    };
  }

  static generateBarPlot(
    data: any[],
    groupVar: string,
    valueVar: string,
    result: StatisticalResult,
    style: string = 'nature'
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
        color: colors[0]
      },
      error_y: {
        type: 'data',
        array: groupStats.map(stat => stat.standardError),
        visible: true
      }
    }];

    const layout: PlotlyLayout = {
      title: `Mean ${valueVar} by ${groupVar}`,
      xaxis: {
        title: groupVar,
        showgrid: false
      },
      yaxis: {
        title: `Mean ${valueVar}`,
        showgrid: true
      },
      showlegend: false,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.getFontFamily(style),
        size: 12,
        color: '#000'
      }
    };

    return {
      data: plotData,
      layout,
      config: {
        displayModeBar: false,
        responsive: true
      }
    };
  }

  static generateContingencyHeatmap(
    result: StatisticalResult,
    groupVar: string,
    outcomeVar: string,
    style: string = 'nature'
  ): { data: PlotlyData[]; layout: PlotlyLayout; config: FigureConfig } {
    if (!result.contingency_table) {
      throw new Error('No contingency table data available');
    }

    const contingencyTable = result.contingency_table;
    const colors = this.getColorScheme(style);

    // Create heatmap data
    const plotData: PlotlyData[] = [{
      z: contingencyTable,
      type: 'heatmap',
      colorscale: [
        [0, '#f7f7f7'],
        [1, colors[0]]
      ],
      showscale: true,
      text: contingencyTable.map(row => 
        row.map(cell => cell.toString())
      ),
      texttemplate: '%{text}',
      textfont: { size: 14, color: 'white' },
      hovertemplate: 'Count: %{z}<extra></extra>'
    }];

    const layout: PlotlyLayout = {
      title: `Contingency Table: ${outcomeVar} vs ${groupVar}`,
      xaxis: {
        title: outcomeVar,
        showgrid: false
      },
      yaxis: {
        title: groupVar,
        showgrid: false
      },
      showlegend: false,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.getFontFamily(style),
        size: 12,
        color: '#000'
      }
    };

    return {
      data: plotData,
      layout,
      config: {
        displayModeBar: false,
        responsive: true
      }
    };
  }

  static generateSurvivalCurve(
    result: StatisticalResult,
    style: string = 'nature'
  ): { data: PlotlyData[]; layout: PlotlyLayout; config: FigureConfig } {
    if (!result.survival_data) {
      throw new Error('No survival data available');
    }

    const { times, events, groups } = result.survival_data;
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

    const layout: PlotlyLayout = {
      title: 'Kaplan-Meier Survival Curves',
      xaxis: {
        title: 'Time',
        showgrid: true
      },
      yaxis: {
        title: 'Survival Probability',
        showgrid: true,
        type: 'linear'
      },
      showlegend: uniqueGroups.length > 1,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.getFontFamily(style),
        size: 12,
        color: '#000'
      }
    };

    return {
      data: plotData,
      layout,
      config: {
        displayModeBar: false,
        responsive: true
      }
    };
  }

  static generateScatterPlot(
    data: any[],
    xVar: string,
    yVar: string,
    style: string = 'nature'
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
        opacity: 0.7
      }
    }];

    const layout: PlotlyLayout = {
      title: `${yVar} vs ${xVar}`,
      xaxis: {
        title: xVar,
        showgrid: true
      },
      yaxis: {
        title: yVar,
        showgrid: true
      },
      showlegend: false,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      font: {
        family: this.getFontFamily(style),
        size: 12,
        color: '#000'
      }
    };

    return {
      data: plotData,
      layout,
      config: {
        displayModeBar: false,
        responsive: true
      }
    };
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