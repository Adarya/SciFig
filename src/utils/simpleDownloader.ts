// Simple, reliable downloader that works with current Plotly setup

export class SimpleDownloader {
  static async downloadPlotlyFigure(
    plotRef: any, // Reference to the Plot component
    format: 'png' | 'pdf' | 'svg' | 'eps' = 'png',
    filename?: string
  ): Promise<void> {
    try {
      // Import Plotly dynamically
      const Plotly = await import('plotly.js');
      
      // Get the plot element
      const plotElement = plotRef.el || plotRef.plotEl || plotRef._plotlyEl;
      
      if (!plotElement) {
        throw new Error('Could not find plot element for download');
      }

      // Get current date for filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const defaultFilename = `scifig_${format}_${timestamp}`;
      const finalFilename = filename || defaultFilename;

      // Configure download options based on format
      const downloadOptions = this.getDownloadOptions(format, finalFilename);

      // Download the image
      await Plotly.downloadImage(plotElement, downloadOptions);
      
      console.log(`Successfully downloaded ${format.toUpperCase()} figure`);
      
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  private static getDownloadOptions(format: string, filename: string) {
    const baseOptions = {
      format: format,
      filename: filename,
      scale: format === 'png' ? 5 : 3, // 300 DPI for PNG
    };

    switch (format) {
      case 'png':
        return {
          ...baseOptions,
          width: 1200,
          height: 900,
          scale: 5 // 300 DPI
        };
      case 'pdf':
        return {
          ...baseOptions,
          width: 800,
          height: 600,
          scale: 3
        };
      case 'svg':
        return {
          ...baseOptions,
          width: 800,
          height: 600,
          scale: 1
        };
      case 'eps':
        return {
          ...baseOptions,
          width: 800,
          height: 600,
          scale: 3
        };
      default:
        return baseOptions;
    }
  }

  // Alternative method using HTML5 Canvas API for PNG downloads
  static async downloadAsCanvas(
    plotRef: any,
    filename?: string
  ): Promise<void> {
    try {
      const plotElement = plotRef.el || plotRef.plotEl || plotRef._plotlyEl;
      
      if (!plotElement) {
        throw new Error('Could not find plot element');
      }

      // Find the SVG element within the plot
      const svgElement = plotElement.querySelector('svg');
      if (!svgElement) {
        throw new Error('Could not find SVG element in plot');
      }

      // Create a canvas and draw the SVG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set high resolution for publication quality
      const scale = 3; // 300 DPI equivalent
      canvas.width = svgElement.clientWidth * scale;
      canvas.height = svgElement.clientHeight * scale;
      
      ctx.scale(scale, scale);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Convert SVG to data URL and draw on canvas
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        
        // Download the canvas as PNG
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || `scifig_canvas_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        }, 'image/png', 1.0);
        
        URL.revokeObjectURL(svgUrl);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        throw new Error('Failed to load SVG image');
      };
      
      img.src = svgUrl;
      
    } catch (error) {
      console.error('Canvas download failed:', error);
      throw error;
    }
  }

  // Simple method that works with Plotly's built-in download
  static async downloadUsingPlotlyButton(plotRef: any): Promise<void> {
    try {
      const plotElement = plotRef.el || plotRef.plotEl || plotRef._plotlyEl;
      
      if (!plotElement) {
        throw new Error('Could not find plot element');
      }

      // Find and click the download button in the Plotly toolbar
      const downloadButton = plotElement.querySelector('[data-title="Download plot as a png"]');
      
      if (downloadButton) {
        downloadButton.click();
        console.log('Download initiated via Plotly toolbar');
      } else {
        throw new Error('Could not find download button in Plotly toolbar');
      }
      
    } catch (error) {
      console.error('Plotly button download failed:', error);
      throw error;
    }
  }

  // Check if download is supported
  static isDownloadSupported(): boolean {
    return typeof document !== 'undefined' && 
           typeof window !== 'undefined' &&
           'createElement' in document;
  }
}