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
    onInitialized?: (figure: Plotly.Figure, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: Plotly.Figure, graphDiv: HTMLElement) => void;
    onPurge?: (figure: Plotly.Figure, graphDiv: HTMLElement) => void;
    onError?: (err: Error) => void;
    onAfterPlot?: () => void;
    onRedraw?: () => void;
    onClick?: (event: Plotly.PlotMouseEvent) => void;
    onClickAnnotation?: (event: Plotly.ClickAnnotationEvent) => void;
    onHover?: (event: Plotly.PlotMouseEvent) => void;
    onUnhover?: (event: Plotly.PlotMouseEvent) => void;
    onSelected?: (event: Plotly.PlotSelectionEvent) => void;
    onDeselect?: () => void;
    onRestyle?: (data: any) => void;
    onRelayout?: (layout: any) => void;
    onRelayouting?: (layout: any) => void;
    onButtonClicked?: (event: Plotly.ButtonClickEvent) => void;
    onLegendClick?: (event: Plotly.LegendClickEvent) => boolean;
    onLegendDoubleClick?: (event: Plotly.LegendClickEvent) => boolean;
    onAnimated?: () => void;
    onAnimatingFrame?: (event: { name: string; frame: Plotly.Frame; animation: any }) => void;
    onSliderChange?: (event: { slider: any; step: number; interaction: boolean }) => void;
    onSliderEnd?: (event: { slider: any; step: number; interaction: boolean }) => void;
    onSliderStart?: (event: { slider: any; step: number; interaction: boolean }) => void;
    onTransitioning?: () => void;
    onTransitionInterrupted?: () => void;
    onAutoSize?: () => void;
    onDoubleClick?: () => void;
    onFramework?: () => void;
    onLegendClick?: (event: Plotly.LegendClickEvent) => void;
    onLegendDoubleClick?: (event: Plotly.LegendClickEvent) => void;
    onLoad?: () => void;
    onModeBarButtonClick?: (event: Plotly.ModeBarButtonClickEvent) => void;
    onResize?: () => void;
    onTooltip?: (event: Plotly.TooltipEvent) => void;
    onWebGlContextLost?: () => void;
    onWebGlContextRestored?: () => void;
    [key: string]: any;
  }

  class Plot extends React.Component<PlotParams> {}
  export default Plot;
}

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

  export interface PlotMouseEvent {
    points: any[];
    event: MouseEvent;
  }

  export interface ClickAnnotationEvent {
    index: number;
    annotation: any;
    fullAnnotation: any;
    event: MouseEvent;
  }

  export interface PlotSelectionEvent {
    points: any[];
  }

  export interface LegendClickEvent {
    event: MouseEvent;
    node: HTMLElement;
    curveNumber: number;
    expandedIndex: number;
    data: Data[];
    layout: Partial<Layout>;
    frames: Frame[];
    config: Partial<Config>;
    fullData: Data[];
    fullLayout: Partial<Layout>;
  }

  export interface ButtonClickEvent {
    event: MouseEvent;
    button: any;
  }

  export interface ModeBarButtonClickEvent {
    event: MouseEvent;
    button: any;
  }

  export interface TooltipEvent {
    event: MouseEvent;
    point: any;
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