export interface FigureDimensions {
  width: number;
  height: number;
  margin: {
    l: number;
    r: number;
    t: number;
    b: number;
  };
}

export interface DataCharacteristics {
  nGroups: number;
  nDataPoints: number;
  hasLongLabels: boolean;
  maxLabelLength: number;
  hasMultipleLines: boolean;
  visualizationType: 'box' | 'bar' | 'survival' | 'scatter' | 'heatmap';
  hasLegend: boolean;
  hasAnnotations: boolean;
  titleLength: number;
}

export class DynamicFigureSizer {
  private static readonly BASE_DIMENSIONS = {
    width: 600,
    height: 450,
    margin: { l: 90, r: 40, t: 90, b: 90 }
  };

  private static readonly MIN_DIMENSIONS = {
    width: 400,
    height: 300
  };

  private static readonly MAX_DIMENSIONS = {
    width: 1200,
    height: 900
  };

  static calculateOptimalSize(
    data: any[],
    groupVar: string,
    valueVar: string,
    visualizationType: 'box' | 'bar' | 'survival' | 'scatter' | 'heatmap',
    customLabels?: { x?: string; y?: string; title?: string }
  ): FigureDimensions {
    
    const characteristics = this.analyzeDataCharacteristics(
      data, 
      groupVar, 
      valueVar, 
      visualizationType, 
      customLabels
    );

    return this.calculateDimensions(characteristics);
  }

  private static analyzeDataCharacteristics(
    data: any[],
    groupVar: string,
    valueVar: string,
    visualizationType: 'box' | 'bar' | 'survival' | 'scatter' | 'heatmap',
    customLabels?: { x?: string; y?: string; title?: string }
  ): DataCharacteristics {
    
    const groups = groupVar ? [...new Set(data.map(row => row[groupVar]))] : [];
    const nGroups = groups.length;
    const nDataPoints = data.length;

    // Analyze label lengths
    const groupLabels = groups.map(g => String(g));
    const maxGroupLabelLength = Math.max(...groupLabels.map(label => label.length), 0);
    
    const xLabel = customLabels?.x || this.cleanVariableName(groupVar || '');
    const yLabel = customLabels?.y || this.cleanVariableName(valueVar || '');
    const title = customLabels?.title || '';
    
    const maxLabelLength = Math.max(
      maxGroupLabelLength,
      xLabel.length,
      yLabel.length
    );

    const hasLongLabels = maxLabelLength > 15 || maxGroupLabelLength > 10;
    const hasMultipleLines = visualizationType === 'survival' && nGroups > 1;
    const hasLegend = hasMultipleLines || (visualizationType === 'heatmap' && nGroups > 2);
    const hasAnnotations = visualizationType !== 'heatmap'; // Most plots have statistical annotations

    return {
      nGroups,
      nDataPoints,
      hasLongLabels,
      maxLabelLength,
      hasMultipleLines,
      visualizationType,
      hasLegend,
      hasAnnotations,
      titleLength: title.length
    };
  }

  private static calculateDimensions(characteristics: DataCharacteristics): FigureDimensions {
    let dimensions = { ...this.BASE_DIMENSIONS };

    // Adjust width based on number of groups and visualization type
    dimensions.width = this.calculateOptimalWidth(characteristics);
    
    // Adjust height based on data complexity and annotations
    dimensions.height = this.calculateOptimalHeight(characteristics);
    
    // Adjust margins based on label lengths and legend
    dimensions.margin = this.calculateOptimalMargins(characteristics);

    // Ensure dimensions are within reasonable bounds
    dimensions.width = Math.max(this.MIN_DIMENSIONS.width, 
                               Math.min(this.MAX_DIMENSIONS.width, dimensions.width));
    dimensions.height = Math.max(this.MIN_DIMENSIONS.height, 
                                Math.min(this.MAX_DIMENSIONS.height, dimensions.height));

    return dimensions;
  }

  private static calculateOptimalWidth(characteristics: DataCharacteristics): number {
    const { nGroups, visualizationType, hasLegend, hasLongLabels } = characteristics;
    
    let baseWidth = this.BASE_DIMENSIONS.width;

    switch (visualizationType) {
      case 'box':
      case 'bar':
        // Width scales with number of groups
        if (nGroups <= 2) {
          baseWidth = 500;
        } else if (nGroups <= 4) {
          baseWidth = 650;
        } else if (nGroups <= 6) {
          baseWidth = 800;
        } else {
          baseWidth = 950;
        }
        break;

      case 'survival':
        // Survival curves need more width for time axis
        baseWidth = hasLegend ? 750 : 650;
        break;

      case 'scatter':
        // Scatter plots are typically square-ish
        baseWidth = 600;
        break;

      case 'heatmap':
        // Heatmaps scale with data dimensions
        baseWidth = Math.max(400, Math.min(800, nGroups * 80 + 200));
        break;
    }

    // Adjust for long labels
    if (hasLongLabels) {
      baseWidth += 100;
    }

    // Adjust for legend
    if (hasLegend) {
      baseWidth += 150;
    }

    return baseWidth;
  }

  private static calculateOptimalHeight(characteristics: DataCharacteristics): number {
    const { 
      visualizationType, 
      hasAnnotations, 
      hasLongLabels, 
      nGroups,
      titleLength 
    } = characteristics;
    
    let baseHeight = this.BASE_DIMENSIONS.height;

    switch (visualizationType) {
      case 'box':
        // Box plots need height for outliers and annotations
        baseHeight = hasAnnotations ? 500 : 450;
        break;

      case 'bar':
        // Bar plots need height for error bars and annotations
        baseHeight = hasAnnotations ? 480 : 430;
        break;

      case 'survival':
        // Survival curves need height for curves and risk table
        baseHeight = 550;
        break;

      case 'scatter':
        // Scatter plots are typically square-ish
        baseHeight = 500;
        break;

      case 'heatmap':
        // Heatmaps scale with number of outcome categories
        baseHeight = Math.max(350, Math.min(600, nGroups * 60 + 250));
        break;
    }

    // Adjust for annotations space
    if (hasAnnotations) {
      baseHeight += 50;
    }

    // Adjust for long title
    if (titleLength > 50) {
      baseHeight += 30;
    }

    // Adjust for long labels (might need more vertical space)
    if (hasLongLabels && (visualizationType === 'bar' || visualizationType === 'box')) {
      baseHeight += 40;
    }

    return baseHeight;
  }

  private static calculateOptimalMargins(characteristics: DataCharacteristics): {
    l: number; r: number; t: number; b: number;
  } {
    const { hasLongLabels, hasLegend, hasAnnotations, maxLabelLength, titleLength } = characteristics;
    
    let margins = { ...this.BASE_DIMENSIONS.margin };

    // Left margin - depends on y-axis label length and tick labels
    margins.l = 90;
    if (hasLongLabels) {
      margins.l += Math.min(50, maxLabelLength * 3);
    }

    // Right margin - depends on legend
    margins.r = hasLegend ? 180 : 50;

    // Top margin - depends on title length and annotations
    margins.t = 90;
    if (titleLength > 40) {
      margins.t += 25;
    }
    if (hasAnnotations) {
      margins.t += 40;
    }

    // Bottom margin - depends on x-axis label length
    margins.b = 90;
    if (hasLongLabels) {
      margins.b += Math.min(40, maxLabelLength * 2);
    }

    return margins;
  }

  // Utility function for responsive sizing based on container
  static getResponsiveDimensions(
    containerWidth: number,
    containerHeight: number,
    optimalDimensions: FigureDimensions
  ): FigureDimensions {
    const availableWidth = containerWidth - 40; // Account for padding
    const availableHeight = containerHeight - 40;

    // Scale down if optimal size exceeds container
    let scaleFactor = 1;
    
    if (optimalDimensions.width > availableWidth) {
      scaleFactor = Math.min(scaleFactor, availableWidth / optimalDimensions.width);
    }
    
    if (optimalDimensions.height > availableHeight) {
      scaleFactor = Math.min(scaleFactor, availableHeight / optimalDimensions.height);
    }

    // Don't scale below minimum readable size
    scaleFactor = Math.max(0.7, scaleFactor);

    return {
      width: Math.round(optimalDimensions.width * scaleFactor),
      height: Math.round(optimalDimensions.height * scaleFactor),
      margin: {
        l: Math.round(optimalDimensions.margin.l * scaleFactor),
        r: Math.round(optimalDimensions.margin.r * scaleFactor),
        t: Math.round(optimalDimensions.margin.t * scaleFactor),
        b: Math.round(optimalDimensions.margin.b * scaleFactor)
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

  // Get recommended aspect ratio for different chart types
  static getOptimalAspectRatio(visualizationType: 'box' | 'bar' | 'survival' | 'scatter' | 'heatmap'): number {
    const aspectRatios = {
      box: 4/3,      // Slightly wider than tall
      bar: 4/3,      // Good for comparing groups
      survival: 3/2, // Wider for time series
      scatter: 1,    // Square for correlations
      heatmap: 1.2   // Slightly wider
    };

    return aspectRatios[visualizationType];
  }
}