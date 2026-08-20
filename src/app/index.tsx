import { useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { Spacing } from "@/constants/theme";

/** Android エミュレータからホスト機の localhost は 10.0.2.2 で到達する。 */
function resolveUrl(input: string): string {
  if (Platform.OS === "android") {
    return input.replace(
      /(https?:\/\/)(localhost|127\.0\.0\.1)/i,
      "$110.0.2.2",
    );
  }
  return input;
}

// webviewで表示したいURL
const RESOLVED_URL = resolveUrl("https://example.com");

// JS文字列を渡すことで、WebView 内で JS を実行できる
const INJECTED_JS = `
(function () {
})();
true;
`;

export default function WebViewScreen() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  return (
    <View style={styles.root}>
      <WebView
        ref={webViewRef}
        source={{ uri: RESOLVED_URL }}
        style={StyleSheet.absoluteFill}
        originWhitelist={["*"]}
        injectedJavaScript={INJECTED_JS}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        mixedContentMode="always"
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        onError={({ nativeEvent }) =>
          console.warn(
            `[WebView error][${Platform.OS}]`,
            JSON.stringify(nativeEvent),
          )
        }
        onHttpError={({ nativeEvent }) =>
          console.warn(
            `[WebView httpError][${Platform.OS}] ${nativeEvent.statusCode} ${nativeEvent.url}`,
          )
        }
        onShouldStartLoadWithRequest={(req) => {
          console.warn(`[WV shouldStart][${Platform.OS}] ${req.url}`);
          return true;
        }}
        onLoadStart={({ nativeEvent }) =>
          console.warn(`[WV loadStart][${Platform.OS}] ${nativeEvent.url}`)
        }
        onLoadEnd={({ nativeEvent }) => {
          console.warn(
            `[WV loadEnd][${Platform.OS}] loading=${nativeEvent.loading} ${nativeEvent.url}`,
          );
          webViewRef.current?.injectJavaScript(INJECTED_JS);
        }}
        onContentProcessDidTerminate={() =>
          console.warn(`[WV processTerminated][${Platform.OS}]`)
        }
      />

      <View
        pointerEvents="none"
        style={[styles.safeTopLine, { top: insets.top }]}
      >
        <Text style={styles.safeTopLabel}>
          safe top = {Math.round(insets.top)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  safeTopLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,0,80,0.9)",
  },
  safeTopLabel: {
    position: "absolute",
    right: Spacing.two,
    bottom: 2,
    fontSize: 14,
    color: "rgba(255,0,80,0.9)",
  },
  header: {
    position: "absolute",
    width: "90%",
    height: 44,
    backgroundColor: "rgba(170,170,170,0.55)",
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
  },
  headerLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  panel: {
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.half,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  metricKey: {
    fontSize: 11,
  },
  metricVal: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    flexShrink: 1,
  },
});
