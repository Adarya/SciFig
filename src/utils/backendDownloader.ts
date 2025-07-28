// Backend-powered download system for publication-quality figures

export interface DownloadRequest {
  data: any[];
  analysisType: string;
  outcomeVariable: string;
  groupVariable: string;
  timeVariable?: string;
  eventVariable?: string;
  format: 'png' | 'pdf' | 'svg' | 'eps';
  filename?: string;
  customLabels?: {
    title?: string;
    x?: string;
    y?: string;
  };
}

export class BackendDownloader {
  private static readonly BACKEND_URL = 'http://localhost:8000';

  static async downloadPublicationFigure(request: DownloadRequest): Promise<void> {
    try {
      console.log('🎨 Generating publication-quality figure via Python backend...');
      
      const response = await fetch(`${this.BACKEND_URL}/generate_publication_figure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: request.data,
          outcome_variable: request.outcomeVariable,
          group_variable: request.groupVariable,
          analysis_type: request.analysisType,
          time_variable: request.timeVariable,
          event_variable: request.eventVariable,
          format: request.format,
          custom_labels: request.customLabels,
          publication_settings: {
            dpi: 300,
            font_family: 'Arial',
            font_size: 12,
            figure_width: 8,
            figure_height: 6,
            style: 'publication'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      
      if (request.format === 'pdf') {
        // For PDF, we get base64 encoded data
        this.downloadBase64File(result.figure, request.filename || 'scifig_figure.pdf', 'application/pdf');
      } else {
        // For images, we get base64 encoded data
        const mimeType = request.format === 'svg' ? 'image/svg+xml' : `image/${request.format}`;
        this.downloadBase64File(result.figure, request.filename || `scifig_figure.${request.format}`, mimeType);
      }
      
      console.log('✅ Publication-quality figure downloaded successfully!');
      
    } catch (error) {
      console.error('❌ Backend download failed:', error);
      throw new Error(`Failed to generate publication figure: ${error.message}`);
    }
  }

  private static downloadBase64File(base64Data: string, filename: string, mimeType: string): void {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  static async testBackendConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Enhanced analysis with backend
  static async getBackendAnalysis(request: {
    data: any[];
    outcome_variable: string;
    group_variable: string;
    analysis_type: string;
    time_variable?: string;
    event_variable?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Backend analysis failed:', error);
      throw error;
    }
  }
}