import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    pannellum: any;
  }
}

interface PannellumViewerProps {
  image: string;
  autoLoad?: boolean;
}

export const PannellumViewer: React.FC<PannellumViewerProps> = ({ image, autoLoad = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && window.pannellum) {
      // Destroy previous instance if exists to prevent memory leaks/conflicts
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          // Ignore destruction errors
        }
      }

      viewerRef.current = window.pannellum.viewer(containerRef.current, {
        type: 'equirectangular',
        panorama: image,
        autoLoad: autoLoad,
        compass: false,
        showZoomCtrl: true,
        showFullscreenCtrl: true,
        autoRotate: -2,
      });
    }

    return () => {
       if (viewerRef.current) {
         try {
           viewerRef.current.destroy();
         } catch(e) {}
       }
    }
  }, [image, autoLoad]);

  return <div ref={containerRef} className="w-full h-full min-h-[400px]" />;
};