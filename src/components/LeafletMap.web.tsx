import { useEffect, useMemo, useRef } from 'react';
import { buildLeafletHtml, type LeafletMapProps } from './leafletHtml';
import { colors, radius } from '@/theme';

export function LeafletMap({ locations, selectedId, onSelect, height = 320 }: LeafletMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);

  const html = useMemo(() => buildLeafletHtml(locations), [locations]);

  useEffect(() => {
    function handler(e: MessageEvent) {
      try {
        const msg = JSON.parse(e.data);
        if (msg?.type === 'select' && msg.id) onSelect(msg.id);
      } catch {
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSelect]);

  useEffect(() => {
    if (!selectedId || !readyRef.current) return;
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ type: 'focus', id: selectedId }),
      '*'
    );
  }, [selectedId]);

  return (
    <iframe
      ref={iframeRef}
      title="Mapa de puntos de acopio"
      srcDoc={html}
      onLoad={() => {
        readyRef.current = true;
      }}
      style={{
        width: '100%',
        height,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        backgroundColor: '#E8F0E6',
      }}
    />
  );
}
