// Type definitions for SciFig application

// Define AppState type for navigation
declare type AppState = 'landing' | 'dashboard' | 'analysis' | 'figure-analyzer' | 'pricing' | 'admin' | 'kaplan-meier' | 'projects';

// Define navigation function type that accepts AppState
declare type NavigateFunction = (view: AppState) => void;

// Extend Window interface to include global variables
interface Window {
  // Add any global variables here if needed
  __SCIFIG_VERSION__?: string;
}

// Fix for Plotly.js and react-plotly.js
declare module 'plotly.js' {
  export interface PlotData {
    [key: string]: any;
  }

  export interface Layout {
    [key: string]: any;
  }

  export interface Config {
    [key: string]: any;
  }

  export interface Frame {
    [key: string]: any;
  }

  export interface Figure {
    data: Data[];
    layout: Partial<Layout>;
    frames?: Frame[];
  }

  export type Data = any;

  export function newPlot(
    graphDiv: HTMLElement,
    data: Data[],
    layout?: Partial<Layout>,
    config?: Partial<Config>
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
}

declare module 'react-plotly.js' {
  import * as Plotly from 'plotly.js';
  import * as React from 'react';

  interface PlotParams {
    data: Plotly.Data[];
    layout?: Partial<Plotly.Layout>;
    config?: Partial<Plotly.Config>;
    frames?: Plotly.Frame[];
    style?: React.CSSProperties;
    className?: string;
    [key: string]: any;
  }

  class Plot extends React.Component<PlotParams> {}
  export default Plot;
} 