declare module 'plotly.js/dist/plotly-basic' {
  import * as Plotly from 'plotly.js';
  
  export function newPlot(
    graphDiv: HTMLElement,
    data: Plotly.Data[],
    layout?: Partial<Plotly.Layout>,
    config?: Partial<Plotly.Config>
  ): Promise<{ plot: any; graphDiv: HTMLElement }>;

  export function downloadImage(
    graphDiv: HTMLElement,
    opts: {
      format: 'png' | 'svg' | 'jpeg' | 'webp' | 'pdf' | 'eps';
      width?: number;
      height?: number;
      filename?: string;
      scale?: number;
    }
  ): Promise<void>;
  
  export default Plotly;
} 