"use client";

import React, { useEffect, useRef } from 'react';

interface MermaidProps {
  chart: string;
  className?: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (typeof window !== 'undefined' && ref.current) {
        try {
          // Dynamically import mermaid to avoid SSR issues
          const mermaid = (await import('mermaid')).default;
          
          // Configure mermaid
          mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            themeVariables: {
              // Primary colors
              primaryColor: '#3b82f6',
              primaryTextColor: '#ffffff',
              primaryBorderColor: '#1e40af',
              
              // Secondary colors
              secondaryColor: '#7c3aed',
              secondaryTextColor: '#ffffff',
              secondaryBorderColor: '#5b21b6',
              
              // Tertiary colors
              tertiaryColor: '#059669',
              tertiaryTextColor: '#ffffff',
              tertiaryBorderColor: '#047857',
              
              // Background colors
              background: '#0f172a',
              mainBkg: '#1e293b',
              secondBkg: '#334155',
              tertiaryBkg: '#475569',
              
              // Text colors
              textColor: '#ffffff',
              nodeTextColor: '#ffffff',
              
              // Line and border colors
              lineColor: '#64748b',
              edgeLabelBackground: '#1e293b',
              
              // Section colors
              sectionBkgColor: '#1e293b',
              altSectionBkgColor: '#334155',
              gridColor: '#475569',
              
              // Node colors
              nodeBkg: '#334155',
              nodeBorder: '#64748b',
              
              // Cluster colors
              clusterBkg: '#1e293b',
              clusterBorder: '#64748b',
              
              // Actor colors (for sequence diagrams)
              actorBkg: '#334155',
              actorBorder: '#64748b',
              actorTextColor: '#ffffff',
              
              // Note colors
              noteBkgColor: '#1e293b',
              noteBorderColor: '#64748b',
              noteTextColor: '#ffffff',
            },
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis',
            },
            sequence: {
              diagramMarginX: 50,
              diagramMarginY: 10,
              actorMargin: 50,
              width: 150,
              height: 65,
              boxMargin: 10,
              boxTextMargin: 5,
              noteMargin: 10,
              messageMargin: 35,
              mirrorActors: true,
              bottomMarginAdj: 1,
              useMaxWidth: true,
              rightAngles: false,
              showSequenceNumbers: false,
            },
          });

          // Clear previous content
          ref.current.innerHTML = '';
          
          // Generate unique ID for this chart
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          
          // Render the chart
          const { svg } = await mermaid.render(id, chart);
          
          if (ref.current) {
            ref.current.innerHTML = svg;
            
            // Style the SVG
            const svgElement = ref.current.querySelector('svg');
            if (svgElement) {
              svgElement.style.width = '100%';
              svgElement.style.height = 'auto';
              svgElement.style.maxWidth = '100%';
              svgElement.style.background = 'transparent';
              
              // Ensure all text elements are visible
              const textElements = svgElement.querySelectorAll('text');
              textElements.forEach((text) => {
                text.style.fill = '#ffffff';
                text.style.fontSize = '14px';
                text.style.fontFamily = 'Inter, system-ui, sans-serif';
              });
              
              // Style node rectangles
              const rectElements = svgElement.querySelectorAll('rect');
              rectElements.forEach((rect) => {
                const fill = rect.getAttribute('fill');
                if (fill && fill !== 'none') {
                  rect.style.stroke = '#64748b';
                  rect.style.strokeWidth = '1px';
                }
              });
              
              // Style paths (arrows and lines)
              const pathElements = svgElement.querySelectorAll('path');
              pathElements.forEach((path) => {
                if (path.getAttribute('stroke') !== 'none') {
                  path.style.stroke = '#64748b';
                  path.style.strokeWidth = '2px';
                }
              });
            }
          }
        } catch (error) {
          console.error('Error rendering Mermaid chart:', error);
          if (ref.current) {
            ref.current.innerHTML = `
              <div class="flex items-center justify-center h-64 bg-slate-800/50 rounded-lg border border-slate-600/30">
                <div class="text-center">
                  <div class="text-slate-400 mb-2">Failed to render diagram</div>
                  <div class="text-xs text-slate-500">Check console for details</div>
                </div>
              </div>
            `;
          }
        }
      }
    };

    renderChart();
  }, [chart]);

  return (
    <div 
      ref={ref} 
      className={`mermaid-container ${className}`}
      style={{ 
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="flex items-center justify-center h-64 bg-slate-800/50 rounded-lg animate-pulse">
        <div className="text-slate-400">Loading diagram...</div>
      </div>
    </div>
  );
};

export default Mermaid;
