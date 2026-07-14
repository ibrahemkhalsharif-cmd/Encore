import { useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, ApiError } from '../api';
import { colors } from '../theme';

type Result =
  | { kind: 'ok'; attendee: string; tier: string; event: string }
  | { kind: 'error'; message: string };

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const lastScan = useRef(0);

  const checkIn = async (code: string) => {
    if (!code || busy) return;
    setBusy(true);
    try {
      const data = await api.post<{
        checkedIn: { attendee: string; tier: string; event: string };
      }>('/api/tickets/checkin', { code });
      setResult({ kind: 'ok', ...data.checkedIn });
      setManual('');
    } catch (err) {
      setResult({
        kind: 'error',
        message: err instanceof ApiError ? err.message : 'Could not reach the server',
      });
    } finally {
      setBusy(false);
    }
  };

  const onScanned = ({ data }: { data: string }) => {
    // the camera fires several times per second — throttle it
    const now = Date.now();
    if (now - lastScan.current < 2000) return;
    lastScan.current = now;
    checkIn(data.trim().toUpperCase());
  };

  const cameraSupported = Platform.OS !== 'web';

  return (
    <View style={styles.screen}>
      {cameraSupported && permission?.granted ? (
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScanned}
        />
      ) : (
        <View style={[styles.camera, styles.cameraFallback]}>
          {cameraSupported ? (
            <Pressable style={styles.button} onPress={requestPermission}>
              <Text style={styles.buttonText}>Allow camera access</Text>
            </Pressable>
          ) : (
            <Text style={styles.mutedText}>
              Camera scanning works on a phone — type the code below to test
              on web.
            </Text>
          )}
        </View>
      )}

      {result && (
        <View
          style={[
            styles.banner,
            result.kind === 'ok' ? styles.bannerOk : styles.bannerBad,
          ]}
        >
          {result.kind === 'ok' ? (
            <>
              <Text style={styles.bannerTitle}>✓ {result.attendee}</Text>
              <Text style={styles.bannerBody}>
                {result.tier} — {result.event}
              </Text>
            </>
          ) : (
            <Text style={styles.bannerTitle}>{result.message}</Text>
          )}
        </View>
      )}

      <View style={styles.manualRow}>
        <TextInput
          style={styles.input}
          placeholder="Or type a ticket code"
          placeholderTextColor={colors.muted}
          value={manual}
          onChangeText={(v) => setManual(v.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Pressable
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={() => checkIn(manual.trim())}
          disabled={busy}
        >
          <Text style={styles.buttonText}>{busy ? '…' : 'Check in'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
    gap: 16,
  },
  camera: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cameraFallback: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mutedText: {
    color: colors.muted,
    textAlign: 'center',
  },
  banner: {
    borderRadius: 12,
    padding: 16,
  },
  bannerOk: {
    backgroundColor: '#e5f0e2',
    borderColor: colors.good,
    borderWidth: 1,
  },
  bannerBad: {
    backgroundColor: '#fbe9e2',
    borderColor: colors.accentDark,
    borderWidth: 1,
  },
  bannerTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.ink,
  },
  bannerBody: {
    color: colors.muted,
    marginTop: 2,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
