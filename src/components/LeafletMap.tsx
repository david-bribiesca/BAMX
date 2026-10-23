import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { buildLeafletHtml, type LeafletMapProps } from './leafletHtml';
import { colors, radius } from '@/theme';

export function LeafletMap({ locations, selectedId, onSelect, height = 320 }: LeafletMapProps) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  const html = useMemo(() => buildLeafletHtml(locations), [locations]);

  function onMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg?.type === 'select' && msg.id) onSelect(msg.id);
    } catch {
    }
  }

  useEffect(() => {
    if (!selectedId || !readyRef.current) return;
    webRef.current?.injectJavaScript(
      `window.focusLocation(${JSON.stringify(selectedId)}); true;`
    );
  }, [selectedId]);

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        onLoadEnd={() => {
          readyRef.current = true;
        }}
        style={styles.web}
        scrollEnabled={false}
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#E8F0E6',
  },
  web: { flex: 1, backgroundColor: 'transparent' },
});
