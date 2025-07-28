export interface DownloadOptions {
  format: 'png' | 'pdf' | 'svg' | 'eps';
  filename: string;
  width: number;
  height: number;
  scale: number;
  quality?: number;
}

export class FigureDownloader {
  private static readonly FORMAT_CONFIGS = {
    png: {
      scale: 5,      // 300 DPI equivalent
      width: 600,
      height: 450,
      quality: 1.0
    },
    pdf: {
      scale: 3,      // Vector format
      width: 800,
      height: 600,
      quality: 1.0
    },
    svg: {
      scale: 1,      // Vector format
      width: 600,
      height: 450,
      quality: 1.0
    },
    eps: {
      scale: 3,      // Vector format
      width: 600,
      height: 450,
      quality: 1.0
    }
  };

  static async downloadFigure(
    figureData: any,
    figureLayout: any,
    figureConfig: any,
    format: 'png' | 'pdf' | 'svg' | 'eps' = 'png',
    customFilename?: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Import Plotly dynamically
        const Plotly = await import('plotly.js');
        
        // Create temporary container
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '1000px';
        tempDiv.style.height = '800px';
        document.body.appendChild(tempDiv);

        // Get format configuration
        const formatConfig = this.FORMAT_CONFIGS[format];
        const timestamp = Date.now();
        const filename = customFilename || `publication_figure_${timestamp}`;

        try {
          // Create plot in temporary container
          await Plotly.newPlot(tempDiv, figureData, figureLayout, {
            ...figureConfig,
            staticPlot: true
          });

          // Download with format-specific settings
          await Plotly.downloadImage(tempDiv, {
            format: format,
            filename: filename,
            width: formatConfig.width,
            height: formatConfig.height,
            scale: formatConfig.scale
          });

          console.log(`Successfully downloaded ${format.toUpperCase()} figure: ${filename}`);
          resolve();

        } catch (plotError) {
          console.error('Plot creation/download error:', plotError);
          reject(plotError);
        } finally {
          // Clean up
          try {
            document.body.removeChild(tempDiv);
          } catch (cleanupError) {
            console.warn('Cleanup error:', cleanupError);
          }
        }

      } catch (error) {
        console.error('Download initialization error:', error);
        reject(error);
      }
    });
  }

  static async downloadMultipleFormats(
    figureData: any,
    figureLayout: any,
    figureConfig: any,
    formats: Array<'png' | 'pdf' | 'svg' | 'eps'> = ['png', 'pdf'],
    baseFilename?: string
  ): Promise<void> {
    const timestamp = Date.now();
    const filename = baseFilename || `publication_figure_${timestamp}`;

    // Download each format sequentially to avoid conflicts
    for (const format of formats) {
      try {
        await this.downloadFigure(
          figureData,
          figureLayout,
          figureConfig,
          format,
          `${filename}_${format}`
        );
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download ${format}:`, error);
      }
    }
  }

  static getRecommendedFormat(purpose: 'manuscript' | 'presentation' | 'print' | 'web'): 'png' | 'pdf' | 'svg' | 'eps' {
    const recommendations = {
      manuscript: 'png',  // High DPI PNG for journal submission
      presentation: 'png', // PNG for PowerPoint/Keynote
      print: 'pdf',       // Vector PDF for high-quality printing
      web: 'svg'          // SVG for web displays
    };
    
    return recommendations[purpose];
  }

  static async downloadWithMetadata(
    figureData: any,
    figureLayout: any,
    figureConfig: any,
    metadata: {
      title: string;
      description: string;
      analysisType: string;
      statisticalResults: string;
      timestamp: Date;
    },
    format: 'png' | 'pdf' | 'svg' | 'eps' = 'png'
  ): Promise<void> {
    // Add metadata as annotations to the figure
    const enhancedLayout = {
      ...figureLayout,
      annotations: [
        ...(figureLayout.annotations || []),
        {
          x: 0.01,
          y: 0.01,
          xref: 'paper',
          yref: 'paper',
          text: `Generated: ${metadata.timestamp.toLocaleDateString()} | ${metadata.analysisType}`,
          showarrow: false,
          font: { 
            size: 8, 
            color: '#666',
            family: 'Arial, sans-serif'
          },
          bgcolor: 'rgba(255,255,255,0.8)'
        }
      ]
    };

    const filename = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    
    return this.downloadFigure(
      figureData,
      enhancedLayout,
      figureConfig,
      format,
      filename
    );
  }

  // Method to check if browser supports different formats
  static getSupportedFormats(): Array<'png' | 'pdf' | 'svg' | 'eps'> {
    const supported: Array<'png' | 'pdf' | 'svg' | 'eps'> = ['png']; // PNG is always supported
    
    // Check for vector format support
    if (typeof SVGElement !== 'undefined') {
      supported.push('svg');
    }
    
    // PDF and EPS support depends on Plotly.js capabilities
    supported.push('pdf', 'eps');
    
    return supported;
  }

  // Method to get format information
  static getFormatInfo(format: 'png' | 'pdf' | 'svg' | 'eps'): {
    name: string;
    description: string;
    useCase: string;
    isVector: boolean;
  } {
    const formatInfo = {
      png: {
        name: 'PNG (300 DPI)',
        description: 'High-resolution bitmap image',
        useCase: 'Best for journal manuscripts and presentations',
        isVector: false
      },
      pdf: {
        name: 'PDF (Vector)',
        description: 'Portable Document Format',
        useCase: 'Best for printing and vector editing',
        isVector: true
      },
      svg: {
        name: 'SVG (Vector)',
        description: 'Scalable Vector Graphics',
        useCase: 'Best for web display and further editing',
        isVector: true
      },
      eps: {
        name: 'EPS (Vector)',
        description: 'Encapsulated PostScript',
        useCase: 'Best for journal submission and LaTeX',
        isVector: true
      }
    };

    return formatInfo[format];
  }

  // Validate figure before download
  static validateFigure(figureData: any, figureLayout: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required data
    if (!figureData || !Array.isArray(figureData) || figureData.length === 0) {
      errors.push('Figure data is missing or empty');
    }

    if (!figureLayout) {
      errors.push('Figure layout is missing');
    }

    // Check for common issues
    if (figureLayout) {
      if (!figureLayout.title || !figureLayout.title.text) {
        warnings.push('Figure title is missing');
      }

      if (!figureLayout.xaxis || !figureLayout.xaxis.title) {
        warnings.push('X-axis title is missing');
      }

      if (!figureLayout.yaxis || !figureLayout.yaxis.title) {
        warnings.push('Y-axis title is missing');
      }

      // Check dimensions
      if (figureLayout.width < 400 || figureLayout.height < 300) {
        warnings.push('Figure dimensions may be too small for publication');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}