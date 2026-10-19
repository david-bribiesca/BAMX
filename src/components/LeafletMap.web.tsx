// Web interactive map: a real <iframe> (Expo web renders via react-dom, so DOM
// elements work here) running the Leaflet page. Draggable/zoomable.
import { useEffect, useMemo, useRef } from 'react';
import { buildLeafletHtml, type LeafletMapProps } from './leafletHtml';
import { colors, radius } from '@/theme';

export function LeafletMap({ locations, selectedId, onSelect, height = 320 }: LeafletMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);

  // Build the map HTML only from locations so selecting a marker never reloads
  // the iframe (which would reset the zoom and swallow the first-tap popup).
  const html = useMemo(() => buildLeafletHtml(locations), [locations]);

  // Receive marker taps from inside the iframe.
  useEffect(() => {
    function handler(e: MessageEvent) {
      try {
        const msg = JSON.parse(e.data);
        if (msg?.type === 'select' && msg.id) onSelect(msg.id);
      } catch {
        // ignore messages that aren't ours
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSelect]);

  // When the selection changes (e.g. tapping the list below), pan the map to it.
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
        // Ready for focus commands; don't auto-jump — keep the initial
        // fit-all-markers view until the user picks a point.
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
