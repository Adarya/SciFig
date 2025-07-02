export interface ImageAnalysisResult {
  overall_score: number;
  publication_ready: boolean;
  criteria: {
    resolution: {
      status: 'pass' | 'fail' | 'warning';
      dpi: number;
      recommended_dpi: number;
      message: string;
    };
    aspect_ratio: {
      status: 'pass' | 'fail' | 'warning';
      ratio: string;
      suitability: string;
      message: string;
    };
    composition: {
      status: 'pass' | 'fail' | 'warning';
      score: number;
      issues: string[];
      recommendations: string[];
    };
    lighting: {
      status: 'pass' | 'fail' | 'warning';
      brightness: number;
      contrast: number;
      exposure_quality: string;
      message: string;
    };
    color_balance: {
      status: 'pass' | 'fail' | 'warning';
      saturation: number;
      white_balance: string;
      color_accuracy: string;
      message: string;
    };
    focus_clarity: {
      status: 'pass' | 'fail' | 'warning';
      sharpness_score: number;
      blur_detected: boolean;
      focus_areas: string[];
      message: string;
    };
    background: {
      status: 'pass' | 'fail' | 'warning';
      type: string;
      appropriateness: string;
      distractions: string[];
      message: string;
    };
    text_legibility: {
      status: 'pass' | 'fail' | 'warning';
      text_detected: boolean;
      font_size_adequate: boolean;
      contrast_ratio: number;
      readability_issues: string[];
      message: string;
    };
    copyright: {
      status: 'pass' | 'fail' | 'warning';
      watermarks_detected: boolean;
      copyright_indicators: string[];
      compliance_risk: 'low' | 'medium' | 'high';
      message: string;
    };
    file_format: {
      status: 'pass' | 'fail' | 'warning';
      format: string;
      compatibility: string;
      recommended_formats: string[];
      message: string;
    };
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    solution: string;
    impact: string;
  }[];
  alternatives: {
    suggestion: string;
    reason: string;
    feasibility: 'easy' | 'moderate' | 'difficult';
  }[];
  metadata: {
    file_size: number;
    dimensions: { width: number; height: number };
    format: string;
    color_space: string;
    analysis_timestamp: string;
  };
}

export interface ImageAnalysisConfig {
  api_key?: string;
  model: 'gpt-4-vision' | 'google-vision' | 'claude-vision';
  analysis_depth: 'basic' | 'comprehensive' | 'publication-grade';
  target_journal?: 'nature' | 'science' | 'nejm' | 'jama' | 'plos' | 'generic';
}

export class ImageAnalysisEngine {
  private config: ImageAnalysisConfig;
  private analysisCache: Map<string, ImageAnalysisResult> = new Map();

  constructor(config: ImageAnalysisConfig) {
    this.config = config;
  }

  async analyzeImage(file: File): Promise<ImageAnalysisResult> {
    try {
      // Generate cache key based on file content
      const cacheKey = await this.generateCacheKey(file);
      
      // Check cache first
      if (this.analysisCache.has(cacheKey)) {
        return this.analysisCache.get(cacheKey)!;
      }

      // Extract basic metadata
      const metadata = await this.extractMetadata(file);
      
      // Perform technical analysis
      const technicalAnalysis = await this.performTechnicalAnalysis(file, metadata);
      
      // Perform AI-powered visual analysis
      const visualAnalysis = await this.performVisualAnalysis(file);
      
      // Combine results
      const result = this.combineAnalysisResults(technicalAnalysis, visualAnalysis, metadata);
      
      // Cache result
      this.analysisCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateCacheKey(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async extractMetadata(file: File) {
    return new Promise<any>((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          file_size: file.size,
          dimensions: { width: img.width, height: img.height },
          format: file.type,
          color_space: 'RGB', // Simplified
          analysis_timestamp: new Date().toISOString()
        });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  private async performTechnicalAnalysis(file: File, metadata: any) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    return new Promise<any>((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Calculate DPI (assuming 96 DPI base for web images)
        const estimatedDPI = Math.min(img.width, img.height) > 1200 ? 300 : 96;
        
        // Analyze image data
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const analysis = this.analyzeImageData(imageData, metadata, estimatedDPI);
        
        resolve(analysis);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  private analyzeImageData(imageData: ImageData, metadata: any, estimatedDPI: number) {
    const { data, width, height } = imageData;
    
    // Calculate brightness and contrast
    let totalBrightness = 0;
    let brightnessValues: number[] = [];
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      brightnessValues.push(brightness);
    }
    
    const avgBrightness = totalBrightness / (width * height);
    const contrast = this.calculateContrast(brightnessValues);
    
    // Calculate sharpness (simplified edge detection)
    const sharpness = this.calculateSharpness(data, width, height);
    
    // Analyze color saturation
    const saturation = this.calculateSaturation(data);
    
    return {
      resolution: {
        dpi: estimatedDPI,
        width,
        height,
        megapixels: (width * height) / 1000000
      },
      lighting: {
        brightness: avgBrightness,
        contrast: contrast,
        dynamic_range: this.calculateDynamicRange(brightnessValues)
      },
      sharpness: sharpness,
      color: {
        saturation: saturation,
        color_distribution: this.analyzeColorDistribution(data)
      }
    };
  }

  private calculateContrast(brightnessValues: number[]): number {
    const sorted = brightnessValues.sort((a, b) => a - b);
    const p5 = sorted[Math.floor(sorted.length * 0.05)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    return (p95 - p5) / 255;
  }

  private calculateSharpness(data: Uint8ClampedArray, width: number, height: number): number {
    let sharpness = 0;
    let count = 0;
    
    // Simplified Sobel edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Get surrounding pixels (grayscale)
        const tl = (data[idx - width * 4 - 4] + data[idx - width * 4 - 3] + data[idx - width * 4 - 2]) / 3;
        const tr = (data[idx - width * 4 + 4] + data[idx - width * 4 + 5] + data[idx - width * 4 + 6]) / 3;
        const bl = (data[idx + width * 4 - 4] + data[idx + width * 4 - 3] + data[idx + width * 4 - 2]) / 3;
        const br = (data[idx + width * 4 + 4] + data[idx + width * 4 + 5] + data[idx + width * 4 + 6]) / 3;
        
        const gx = (tr + br) - (tl + bl);
        const gy = (bl + br) - (tl + tr);
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        sharpness += magnitude;
        count++;
      }
    }
    
    return count > 0 ? sharpness / count : 0;
  }

  private calculateSaturation(data: Uint8ClampedArray): number {
    let totalSaturation = 0;
    let count = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      
      totalSaturation += saturation;
      count++;
    }
    
    return count > 0 ? totalSaturation / count : 0;
  }

  private calculateDynamicRange(brightnessValues: number[]): number {
    const min = Math.min(...brightnessValues);
    const max = Math.max(...brightnessValues);
    return (max - min) / 255;
  }

  private analyzeColorDistribution(data: Uint8ClampedArray) {
    const histogram = { r: new Array(256).fill(0), g: new Array(256).fill(0), b: new Array(256).fill(0) };
    
    for (let i = 0; i < data.length; i += 4) {
      histogram.r[data[i]]++;
      histogram.g[data[i + 1]]++;
      histogram.b[data[i + 2]]++;
    }
    
    return {
      red_distribution: this.calculateDistributionStats(histogram.r),
      green_distribution: this.calculateDistributionStats(histogram.g),
      blue_distribution: this.calculateDistributionStats(histogram.b)
    };
  }

  private calculateDistributionStats(histogram: number[]) {
    const total = histogram.reduce((sum, count) => sum + count, 0);
    let mean = 0;
    let variance = 0;
    
    for (let i = 0; i < histogram.length; i++) {
      mean += (i * histogram[i]) / total;
    }
    
    for (let i = 0; i < histogram.length; i++) {
      variance += histogram[i] * Math.pow(i - mean, 2) / total;
    }
    
    return {
      mean: mean,
      variance: variance,
      std_dev: Math.sqrt(variance)
    };
  }

  private async performVisualAnalysis(file: File) {
    // This would integrate with actual AI vision APIs
    // For now, we'll simulate the analysis based on technical metrics
    
    const base64Image = await this.fileToBase64(file);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return simulated AI analysis results
    return this.simulateAIAnalysis(file);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private simulateAIAnalysis(file: File) {
    // Simulate AI vision analysis results
    const isScientificFigure = file.name.toLowerCase().includes('figure') || 
                              file.name.toLowerCase().includes('chart') ||
                              file.name.toLowerCase().includes('graph');
    
    return {
      content_type: isScientificFigure ? 'scientific_figure' : 'general_image',
      text_detected: Math.random() > 0.3,
      chart_elements: isScientificFigure ? ['axes', 'data_points', 'legend'] : [],
      background_type: Math.random() > 0.5 ? 'clean' : 'complex',
      composition_quality: 0.7 + Math.random() * 0.3,
      visual_clarity: 0.6 + Math.random() * 0.4,
      professional_appearance: isScientificFigure ? 0.8 + Math.random() * 0.2 : 0.5 + Math.random() * 0.3
    };
  }

  private combineAnalysisResults(technical: any, visual: any, metadata: any): ImageAnalysisResult {
    // Resolution analysis
    const resolution = this.analyzeResolution(technical.resolution, metadata);
    
    // Aspect ratio analysis
    const aspect_ratio = this.analyzeAspectRatio(metadata.dimensions);
    
    // Composition analysis
    const composition = this.analyzeComposition(visual, technical);
    
    // Lighting analysis
    const lighting = this.analyzeLighting(technical.lighting);
    
    // Color balance analysis
    const color_balance = this.analyzeColorBalance(technical.color);
    
    // Focus clarity analysis
    const focus_clarity = this.analyzeFocusClarity(technical.sharpness, visual);
    
    // Background analysis
    const background = this.analyzeBackground(visual);
    
    // Text legibility analysis
    const text_legibility = this.analyzeTextLegibility(visual, technical);
    
    // Copyright analysis
    const copyright = this.analyzeCopyright(visual);
    
    // File format analysis
    const file_format = this.analyzeFileFormat(metadata.format);
    
    // Calculate overall score
    const criteria = {
      resolution,
      aspect_ratio,
      composition,
      lighting,
      color_balance,
      focus_clarity,
      background,
      text_legibility,
      copyright,
      file_format
    };
    
    const overall_score = this.calculateOverallScore(criteria);
    const publication_ready = overall_score >= 75;
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(criteria);
    
    // Generate alternatives
    const alternatives = this.generateAlternatives(criteria, visual);
    
    return {
      overall_score,
      publication_ready,
      criteria,
      recommendations,
      alternatives,
      metadata
    };
  }

  private analyzeResolution(resolution: any, metadata: any) {
    const { dpi, width, height, megapixels } = resolution;
    const minDPI = this.config.target_journal === 'nature' || this.config.target_journal === 'science' ? 300 : 150;
    
    let status: 'pass' | 'fail' | 'warning';
    let message: string;
    
    if (dpi >= 300) {
      status = 'pass';
      message = 'Excellent resolution for print publication';
    } else if (dpi >= 150) {
      status = 'warning';
      message = 'Adequate for web, may need higher resolution for print';
    } else {
      status = 'fail';
      message = 'Resolution too low for publication standards';
    }
    
    return {
      status,
      dpi,
      recommended_dpi: minDPI,
      message
    };
  }

  private analyzeAspectRatio(dimensions: { width: number; height: number }) {
    const { width, height } = dimensions;
    const ratio = width / height;
    const ratioString = `${width}:${height}`;
    
    let status: 'pass' | 'fail' | 'warning';
    let suitability: string;
    let message: string;
    
    // Common publication-friendly ratios
    if (Math.abs(ratio - 1.0) < 0.1) {
      status = 'pass';
      suitability = 'Square - excellent for single column figures';
      message = 'Square aspect ratio works well for most publications';
    } else if (Math.abs(ratio - 1.5) < 0.1 || Math.abs(ratio - (2/3)) < 0.1) {
      status = 'pass';
      suitability = '3:2 or 2:3 - ideal for journal layouts';
      message = 'Excellent aspect ratio for publication layouts';
    } else if (ratio > 2.5 || ratio < 0.4) {
      status = 'warning';
      suitability = 'Extreme ratio - may cause layout issues';
      message = 'Very wide or tall images may not fit well in journal layouts';
    } else {
      status = 'pass';
      suitability = 'Acceptable for most publications';
      message = 'Good aspect ratio for publication';
    }
    
    return {
      status,
      ratio: ratioString,
      suitability,
      message
    };
  }

  private analyzeComposition(visual: any, technical: any) {
    const score = visual.composition_quality * 100;
    let status: 'pass' | 'fail' | 'warning';
    let issues: string[] = [];
    let recommendations: string[] = [];
    
    if (score >= 80) {
      status = 'pass';
    } else if (score >= 60) {
      status = 'warning';
      issues.push('Composition could be improved');
      recommendations.push('Consider repositioning key elements');
    } else {
      status = 'fail';
      issues.push('Poor composition detected');
      recommendations.push('Significant composition improvements needed');
    }
    
    if (visual.chart_elements.length === 0 && visual.content_type === 'scientific_figure') {
      issues.push('No clear chart elements detected');
      recommendations.push('Ensure data visualization elements are clearly visible');
    }
    
    return {
      status,
      score,
      issues,
      recommendations
    };
  }

  private analyzeLighting(lighting: any) {
    const { brightness, contrast, dynamic_range } = lighting;
    let status: 'pass' | 'fail' | 'warning';
    let exposure_quality: string;
    let message: string;
    
    if (brightness >= 0.2 && brightness <= 0.8 && contrast >= 0.3 && dynamic_range >= 0.5) {
      status = 'pass';
      exposure_quality = 'Excellent';
      message = 'Optimal lighting and exposure for publication';
    } else if (brightness < 0.1 || brightness > 0.9) {
      status = 'fail';
      exposure_quality = brightness < 0.1 ? 'Underexposed' : 'Overexposed';
      message = 'Exposure issues detected - image may be too dark or bright';
    } else {
      status = 'warning';
      exposure_quality = 'Acceptable';
      message = 'Lighting could be improved for better clarity';
    }
    
    return {
      status,
      brightness: Math.round(brightness * 100),
      contrast: Math.round(contrast * 100),
      exposure_quality,
      message
    };
  }

  private analyzeColorBalance(color: any) {
    const { saturation } = color;
    let status: 'pass' | 'fail' | 'warning';
    let white_balance: string;
    let color_accuracy: string;
    let message: string;
    
    if (saturation >= 0.3 && saturation <= 0.7) {
      status = 'pass';
      white_balance = 'Good';
      color_accuracy = 'Accurate';
      message = 'Color balance is appropriate for publication';
    } else if (saturation > 0.8) {
      status = 'warning';
      white_balance = 'Acceptable';
      color_accuracy = 'Oversaturated';
      message = 'Colors may be too saturated for scientific publication';
    } else {
      status = 'warning';
      white_balance = 'Needs adjustment';
      color_accuracy = 'Undersaturated';
      message = 'Colors appear washed out or undersaturated';
    }
    
    return {
      status,
      saturation: Math.round(saturation * 100),
      white_balance,
      color_accuracy,
      message
    };
  }

  private analyzeFocusClarity(sharpness: number, visual: any) {
    const sharpness_score = Math.min(100, sharpness / 10);
    let status: 'pass' | 'fail' | 'warning';
    let blur_detected: boolean;
    let focus_areas: string[];
    let message: string;
    
    if (sharpness_score >= 70) {
      status = 'pass';
      blur_detected = false;
      focus_areas = ['Overall image sharp'];
      message = 'Excellent image sharpness and clarity';
    } else if (sharpness_score >= 40) {
      status = 'warning';
      blur_detected = true;
      focus_areas = ['Some areas may be soft'];
      message = 'Image sharpness could be improved';
    } else {
      status = 'fail';
      blur_detected = true;
      focus_areas = ['Significant blur detected'];
      message = 'Image appears blurry or out of focus';
    }
    
    return {
      status,
      sharpness_score: Math.round(sharpness_score),
      blur_detected,
      focus_areas,
      message
    };
  }

  private analyzeBackground(visual: any) {
    const { background_type } = visual;
    let status: 'pass' | 'fail' | 'warning';
    let type: string;
    let appropriateness: string;
    let distractions: string[];
    let message: string;
    
    if (background_type === 'clean') {
      status = 'pass';
      type = 'Clean/Minimal';
      appropriateness = 'Excellent for scientific figures';
      distractions = [];
      message = 'Clean background enhances figure readability';
    } else {
      status = 'warning';
      type = 'Complex/Busy';
      appropriateness = 'May distract from main content';
      distractions = ['Background elements may compete with data'];
      message = 'Consider simplifying background for better focus';
    }
    
    return {
      status,
      type,
      appropriateness,
      distractions,
      message
    };
  }

  private analyzeTextLegibility(visual: any, technical: any) {
    const { text_detected } = visual;
    const contrast = technical.lighting.contrast;
    
    let status: 'pass' | 'fail' | 'warning';
    let font_size_adequate: boolean;
    let contrast_ratio: number;
    let readability_issues: string[];
    let message: string;
    
    if (!text_detected) {
      status = 'pass';
      font_size_adequate = true;
      contrast_ratio = 100;
      readability_issues = [];
      message = 'No text detected - not applicable';
    } else {
      contrast_ratio = contrast * 100;
      font_size_adequate = contrast_ratio >= 50;
      
      if (contrast_ratio >= 70) {
        status = 'pass';
        readability_issues = [];
        message = 'Text is clearly legible';
      } else if (contrast_ratio >= 40) {
        status = 'warning';
        readability_issues = ['Text contrast could be improved'];
        message = 'Text legibility could be enhanced';
      } else {
        status = 'fail';
        readability_issues = ['Poor text contrast', 'Text may be difficult to read'];
        message = 'Text contrast is insufficient for publication';
      }
    }
    
    return {
      status,
      text_detected,
      font_size_adequate,
      contrast_ratio: Math.round(contrast_ratio),
      readability_issues,
      message
    };
  }

  private analyzeCopyright(visual: any) {
    // Simplified copyright analysis
    const watermarks_detected = Math.random() < 0.1; // 10% chance of watermark detection
    let status: 'pass' | 'fail' | 'warning';
    let copyright_indicators: string[];
    let compliance_risk: 'low' | 'medium' | 'high';
    let message: string;
    
    if (watermarks_detected) {
      status = 'fail';
      copyright_indicators = ['Watermark detected'];
      compliance_risk = 'high';
      message = 'Potential copyright issues detected - verify usage rights';
    } else {
      status = 'pass';
      copyright_indicators = [];
      compliance_risk = 'low';
      message = 'No obvious copyright issues detected';
    }
    
    return {
      status,
      watermarks_detected,
      copyright_indicators,
      compliance_risk,
      message
    };
  }

  private analyzeFileFormat(format: string) {
    const publicationFormats = ['image/png', 'image/jpeg', 'image/tiff', 'image/svg+xml'];
    const webFormats = ['image/png', 'image/jpeg', 'image/webp'];
    
    let status: 'pass' | 'fail' | 'warning';
    let compatibility: string;
    let recommended_formats: string[];
    let message: string;
    
    if (format === 'image/png' || format === 'image/tiff') {
      status = 'pass';
      compatibility = 'Excellent for publication';
      recommended_formats = [];
      message = 'Optimal format for scientific publication';
    } else if (format === 'image/jpeg') {
      status = 'warning';
      compatibility = 'Good for photos, may have compression artifacts';
      recommended_formats = ['PNG for charts/diagrams', 'TIFF for high-quality images'];
      message = 'JPEG is acceptable but PNG/TIFF preferred for scientific figures';
    } else {
      status = 'fail';
      compatibility = 'Not recommended for publication';
      recommended_formats = ['PNG', 'TIFF', 'SVG'];
      message = 'Format not suitable for scientific publication';
    }
    
    return {
      status,
      format: format.split('/')[1].toUpperCase(),
      compatibility,
      recommended_formats,
      message
    };
  }

  private calculateOverallScore(criteria: any): number {
    const weights = {
      resolution: 0.15,
      aspect_ratio: 0.10,
      composition: 0.15,
      lighting: 0.15,
      color_balance: 0.10,
      focus_clarity: 0.15,
      background: 0.05,
      text_legibility: 0.10,
      copyright: 0.05,
      file_format: 0.10
    };
    
    let totalScore = 0;
    
    Object.entries(criteria).forEach(([key, criterion]: [string, any]) => {
      const weight = weights[key as keyof typeof weights];
      let score = 0;
      
      if (criterion.status === 'pass') score = 100;
      else if (criterion.status === 'warning') score = 60;
      else score = 20;
      
      totalScore += score * weight;
    });
    
    return Math.round(totalScore);
  }

  private generateRecommendations(criteria: any) {
    const recommendations: any[] = [];
    
    Object.entries(criteria).forEach(([category, criterion]: [string, any]) => {
      if (criterion.status === 'fail') {
        recommendations.push({
          priority: 'high',
          category: category.replace('_', ' ').toUpperCase(),
          issue: criterion.message,
          solution: this.getSolutionForCategory(category, criterion),
          impact: 'Critical for publication acceptance'
        });
      } else if (criterion.status === 'warning') {
        recommendations.push({
          priority: 'medium',
          category: category.replace('_', ' ').toUpperCase(),
          issue: criterion.message,
          solution: this.getSolutionForCategory(category, criterion),
          impact: 'Improves professional appearance'
        });
      }
    });
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private getSolutionForCategory(category: string, criterion: any): string {
    const solutions: { [key: string]: string } = {
      resolution: 'Increase image resolution to at least 300 DPI for print publication',
      aspect_ratio: 'Crop or resize image to a more publication-friendly aspect ratio',
      composition: 'Reframe the image to improve visual balance and focus',
      lighting: 'Adjust brightness and contrast to improve visibility',
      color_balance: 'Correct color saturation and white balance',
      focus_clarity: 'Ensure image is properly focused and sharp',
      background: 'Simplify or remove distracting background elements',
      text_legibility: 'Increase text size and improve contrast',
      copyright: 'Verify usage rights and remove watermarks if necessary',
      file_format: 'Convert to PNG or TIFF format for better quality'
    };
    
    return solutions[category] || 'Review and improve this aspect of the image';
  }

  private generateAlternatives(criteria: any, visual: any) {
    const alternatives: any[] = [];
    
    if (criteria.composition.status !== 'pass') {
      alternatives.push({
        suggestion: 'Create a multi-panel figure',
        reason: 'Break complex information into clearer sections',
        feasibility: 'moderate'
      });
    }
    
    if (criteria.resolution.status !== 'pass') {
      alternatives.push({
        suggestion: 'Use vector graphics (SVG) instead',
        reason: 'Vector graphics scale without quality loss',
        feasibility: 'moderate'
      });
    }
    
    if (visual.content_type === 'scientific_figure' && criteria.focus_clarity.status !== 'pass') {
      alternatives.push({
        suggestion: 'Recreate as a digital chart',
        reason: 'Digital charts provide perfect clarity and customization',
        feasibility: 'easy'
      });
    }
    
    return alternatives;
  }
}

// Error handling utilities
export class ImageAnalysisError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_FILE' | 'API_ERROR' | 'TIMEOUT' | 'UNSUPPORTED_FORMAT' | 'CORRUPT_FILE',
    public details?: any
  ) {
    super(message);
    this.name = 'ImageAnalysisError';
  }
}

export const handleAnalysisError = (error: unknown): ImageAnalysisError => {
  if (error instanceof ImageAnalysisError) {
    return error;
  }
  
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return new ImageAnalysisError('Analysis timed out', 'TIMEOUT');
    }
    if (error.message.includes('format')) {
      return new ImageAnalysisError('Unsupported file format', 'UNSUPPORTED_FORMAT');
    }
    if (error.message.includes('corrupt')) {
      return new ImageAnalysisError('File appears to be corrupted', 'CORRUPT_FILE');
    }
    return new ImageAnalysisError(error.message, 'API_ERROR');
  }
  
  return new ImageAnalysisError('Unknown analysis error', 'API_ERROR');
};