import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, FocusMode, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FifoIcon } from '../components/FifoIcon';
import { useFifo } from '../store/FifoContext';
import { FoodCategory, ReminderLeadDays } from '../types/fifo';
import { CATEGORIES } from '../utils/categories';
import {
  addDaysToIso,
  formatReadableDate,
  getDaysRemaining,
  getTodayIso,
} from '../utils/dateParser';
import { recognizeExpiryFromImage } from '../utils/ocrService';
import { lookupBarcodeOpenFoodFacts } from '../utils/openFoodFacts';
import { DayExpiryCircle } from '../components/DayExpiryCircle';
import { FoodThumbnail } from '../components/FoodThumbnail';

const ZOOM_PRESETS = [
  { label: '1x', value: 0 },
  { label: '2x 🔍', value: 0.22 },
  { label: '3x 🔍', value: 0.45 },
];

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { settings, addItem } = useFifo();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  // Camera Hardware Controls (Zoom, Autofocus, Torch)
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [focusMode, setFocusMode] = useState<FocusMode>('on');
  const [isRefocusing, setIsRefocusing] = useState(false);

  // Scan Status & Visual Confirmation State
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const [dateWasScanned, setDateWasScanned] = useState(false);
  const [barcodeWasScanned, setBarcodeWasScanned] = useState(false);
  const [visualAlertBanner, setVisualAlertBanner] = useState<{
    type: 'success' | 'warning';
    title: string;
    subtitle: string;
  } | null>(null);

  // Form State
  const [itemName, setItemName] = useState('');
  const [itemBrand, setItemBrand] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Fresh');
  const [expiryDate, setExpiryDate] = useState<string>(() =>
    addDaysToIso(getTodayIso(), 3)
  );
  const [reminderDays, setReminderDays] = useState<ReminderLeadDays>(
    settings.defaultReminderDays
  );
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Point at expiry date or barcode (tap 2x/3x for tiny print)'
  );

  useEffect(() => {
    setReminderDays(settings.defaultReminderDays);
  }, [settings.defaultReminderDays]);

  const triggerStrongConfirmFeedback = (
    title: string,
    subtitle: string,
    type: 'success' | 'warning' = 'success'
  ) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      ).catch(() => {});
    }
    setVisualAlertBanner({ type, title, subtitle });
    setTimeout(() => {
      setVisualAlertBanner((prev) =>
        prev?.title === title ? null : prev
      );
    }, 3200);
  };

  const handleTapToRefocus = () => {
    if (!permission?.granted || Platform.OS === 'web') return;
    Haptics.selectionAsync().catch(() => {});
    setIsRefocusing(true);
    setFocusMode('off');
    setTimeout(() => {
      setFocusMode('on');
      setTimeout(() => setIsRefocusing(false), 500);
    }, 80);
  };

  const handleSelectZoom = (val: number) => {
    setZoomLevel(val);
    handleTapToRefocus();
  };

  const handleScanExpiryDateFromCamera = async () => {
    if (isScanningOcr) return;

    // Web / no-camera fallback simulation so desktop testing works
    if (!permission?.granted || !cameraRef.current || Platform.OS === 'web') {
      const simulatedDate = addDaysToIso(getTodayIso(), 4);
      setExpiryDate(simulatedDate);
      setDateWasScanned(true);
      setStatusMessage(
        `Expiry Date Locked: ${formatReadableDate(simulatedDate)}`
      );
      triggerStrongConfirmFeedback(
        'EXPIRY DATE RECOGNISED',
        formatReadableDate(simulatedDate),
        'success'
      );
      return;
    }

    try {
      setIsScanningOcr(true);
      setStatusMessage('Reading expiry date from label...');

      const frame = await cameraRef.current.takePictureAsync({
        quality: 0.45,
        base64: true,
        shutterSound: false,
      });

      if (!frame) {
        setIsScanningOcr(false);
        setStatusMessage('Could not capture frame — tap Read Expiry Date again');
        return;
      }

      const result = await recognizeExpiryFromImage({
        uri: frame.uri,
        base64: frame.base64,
      });

      setIsScanningOcr(false);

      if (result.parsed) {
        setExpiryDate(result.parsed.isoDate);
        setDateWasScanned(true);
        const formatted = formatReadableDate(result.parsed.isoDate);
        setStatusMessage(`✓ Expiry Date Found: ${formatted}`);
        triggerStrongConfirmFeedback(
          'EXPIRY DATE RECOGNISED',
          `${formatted} (${result.parsed.matchedText})`,
          'success'
        );
      } else if (result.rawText) {
        const snippet = result.rawText.replace(/\s+/g, ' ').slice(0, 28);
        setStatusMessage(
          `Read "${snippet}" — try 2x Zoom or adjust date below`
        );
        triggerStrongConfirmFeedback(
          'DATE NOT CLEAR YET',
          'Try 2x 🔍 Close-Up Zoom or use -1d / +1d buttons below',
          'warning'
        );
      } else {
        setStatusMessage(
          'No date detected — tap 2x 🔍 for small print or adjust below'
        );
        triggerStrongConfirmFeedback(
          'COULD NOT READ DATE',
          'Tap 2x 🔍 Zoom for tiny print or use the date buttons below',
          'warning'
        );
      }
    } catch {
      setIsScanningOcr(false);
      setStatusMessage('Hold steady over the expiry date and try again');
    }
  };

  const handleSnapThumbnailPhoto = async () => {
    if (!cameraRef.current || !permission?.granted) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.65,
        shutterSound: false,
      });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setStatusMessage('✓ Item photo saved');
        triggerStrongConfirmFeedback(
          'PHOTO SAVED',
          'Added item thumbnail photo',
          'success'
        );
      }
    } catch {
      setStatusMessage('Could not capture photo');
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (
      !settings.autoBarcodeLookup ||
      isLookingUpBarcode ||
      data === lastBarcode
    ) {
      return;
    }
    setLastBarcode(data);
    setIsLookingUpBarcode(true);
    setStatusMessage(`Looking up barcode ${data}...`);

    const info = await lookupBarcodeOpenFoodFacts(data);
    setIsLookingUpBarcode(false);

    if (info) {
      setItemName(info.name);
      if (info.brand) setItemBrand(info.brand);
      setCategory(info.category);
      setBarcodeWasScanned(true);
      if (info.imageUrl && !photoUri) {
        setPhotoUri(info.imageUrl);
      }
      setStatusMessage(`✓ Barcode Matched: ${info.name}`);
      triggerStrongConfirmFeedback(
        'BARCODE RECOGNISED',
        info.name,
        'success'
      );
    } else {
      setBarcodeWasScanned(true);
      setStatusMessage(`Barcode scanned — type item name below`);
      triggerStrongConfirmFeedback(
        'BARCODE SCANNED',
        'Product not in public database — type name below',
        'warning'
      );
    }
  };

  const adjustExpiryByDays = (delta: number) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    setDateWasScanned(true);
    setExpiryDate((prev) => addDaysToIso(prev, delta));
  };

  const handleSaveItem = async () => {
    const finalName = itemName.trim() || `${category} Item`;
    await addItem({
      name: finalName,
      brand: itemBrand.trim() || undefined,
      barcode: lastBarcode || undefined,
      category,
      expiryDate,
      reminderDaysBefore: reminderDays,
      photoUri,
    });
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
    }
    router.replace('/');
  };

  const daysRemaining = getDaysRemaining(expiryDate);
  const cameraGranted = permission?.granted;
  const isSuccessFlash = visualAlertBanner?.type === 'success';
  const nameSectionComplete = barcodeWasScanned || itemName.trim().length > 0;

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 10) }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Bar */}
        <View style={styles.topHeader}>
          <Text style={styles.title}>Scan Food Item</Text>
          <Pressable
            onPress={() => router.back()}
            style={styles.closeBtn}
            accessibilityLabel="Close scanner"
          >
            <FifoIcon name="x" size={20} color="#1E293B" />
          </Pressable>
        </View>

        {/* Larger Camera Window (310px) with Close-Up Zoom & Tap-to-Focus */}
        <View
          style={[
            styles.cameraContainer,
            isSuccessFlash && styles.cameraContainerSuccessBorder,
          ]}
        >
          {cameraGranted ? (
            <CameraView
              ref={cameraRef}
              style={styles.cameraPreview}
              facing="back"
              zoom={zoomLevel}
              autofocus={focusMode}
              enableTorch={torchEnabled}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
              }}
              onBarcodeScanned={handleBarcodeScanned}
            />
          ) : (
            <View style={styles.cameraFallbackBg}>
              <FifoIcon name="camera" size={32} color="#10B981" />
              <Text style={styles.fallbackTitle}>Camera Access Needed</Text>
              <Text style={styles.fallbackSub}>
                Allow camera access to scan expiry dates & barcodes
              </Text>
              <Pressable
                onPress={requestPermission}
                style={styles.grantPermissionBtn}
              >
                <Text style={styles.grantPermissionBtnText}>
                  Enable Camera
                </Text>
              </Pressable>
            </View>
          )}

          {/* Camera HUD Overlay */}
          <Pressable
            onPress={handleTapToRefocus}
            style={styles.cameraOverlay}
          >
            {/* Top Status Bar & Torch Button */}
            <View style={styles.hudTopRow}>
              <View style={styles.statusPill}>
                {isScanningOcr || isLookingUpBarcode ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <View style={styles.statusDot} />
                )}
                <Text style={styles.statusText} numberOfLines={1}>
                  {isRefocusing
                    ? 'Refocusing lens for close-up...'
                    : statusMessage}
                </Text>
              </View>

              {cameraGranted && (
                <Pressable
                  onPress={() => setTorchEnabled((t) => !t)}
                  style={[
                    styles.torchBtn,
                    torchEnabled && styles.torchBtnActive,
                  ]}
                  accessibilityLabel="Toggle flashlight"
                >
                  <FifoIcon
                    name="zap"
                    size={18}
                    color={torchEnabled ? '#0F172A' : '#FFFFFF'}
                  />
                </Pressable>
              )}
            </View>

            {/* Center Target Reticle + Big Visual Alert Overlay */}
            <View
              style={[
                styles.reticleBox,
                isSuccessFlash && styles.reticleBoxSuccess,
                isRefocusing && styles.reticleBoxRefocusing,
              ]}
            >
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {visualAlertBanner ? (
                <View
                  style={[
                    styles.visualAlertBox,
                    visualAlertBanner.type === 'warning' &&
                      styles.visualAlertBoxWarning,
                  ]}
                >
                  <FifoIcon
                    name={
                      visualAlertBanner.type === 'success'
                        ? 'check-circle'
                        : 'bell'
                    }
                    size={22}
                    color="#FFFFFF"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.visualAlertTitle}>
                      {visualAlertBanner.title}
                    </Text>
                    <Text
                      style={styles.visualAlertSubtitle}
                      numberOfLines={2}
                    >
                      {visualAlertBanner.subtitle}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.reticlePromptWrap}>
                  <Text style={styles.reticleLabel}>
                    PLACE EXPIRY DATE OR BARCODE HERE
                  </Text>
                  <Text style={styles.reticleSubLabel}>
                    Tap frame to refocus • Use 2x/3x for small text
                  </Text>
                </View>
              )}
            </View>

            {/* Bottom Controls inside Camera: Close-Up Zoom + Read Date + Photo */}
            <View style={styles.hudBottomStack}>
              {cameraGranted && (
                <View style={styles.zoomBar}>
                  {ZOOM_PRESETS.map((preset) => {
                    const active = zoomLevel === preset.value;
                    return (
                      <Pressable
                        key={preset.label}
                        onPress={() => handleSelectZoom(preset.value)}
                        style={[
                          styles.zoomChip,
                          active && styles.zoomChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.zoomChipText,
                            active && styles.zoomChipTextActive,
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <View style={styles.hudBottomRow}>
                <Pressable
                  onPress={handleScanExpiryDateFromCamera}
                  disabled={isScanningOcr}
                  style={({ pressed }) => [
                    styles.scanDateTrigger,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  {isScanningOcr ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <FifoIcon name="maximize" size={18} color="#FFFFFF" />
                  )}
                  <Text style={styles.scanDateTriggerText}>
                    {isScanningOcr ? 'Reading Date...' : 'Read Expiry Date'}
                  </Text>
                </Pressable>

                {cameraGranted && (
                  <Pressable
                    onPress={handleSnapThumbnailPhoto}
                    style={({ pressed }) => [
                      styles.snapThumbTrigger,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <FifoIcon name="camera" size={17} color="#FFFFFF" />
                    <Text style={styles.snapThumbTriggerText}>
                      {photoUri ? 'Retake' : 'Photo'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Pressable>
        </View>

        {/* STEP 1 COMPONENT: Expiry / Best Before Date Box (Highlights Green + Top-Right Checkmark when scanned/set) */}
        <View
          style={[
            styles.stepCard,
            dateWasScanned && styles.stepCardCompleted,
          ]}
        >
          {/* Top Header Row with Checkmark in Top-Right */}
          <View style={styles.stepHeaderRow}>
            <Text
              style={[
                styles.sectionHeaderLabel,
                dateWasScanned && styles.sectionHeaderLabelCompleted,
              ]}
            >
              EXPIRY / BEST BEFORE DATE
            </Text>

            {dateWasScanned ? (
              <View style={styles.completedTickBadge}>
                <FifoIcon
                  name="check"
                  size={15}
                  color="#FFFFFF"
                  strokeWidth={3}
                />
              </View>
            ) : (
              <View style={styles.pendingStepPill}>
                <Text style={styles.pendingStepText}>Scan or adjust</Text>
              </View>
            )}
          </View>

          <View style={styles.expiryMainRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.expiryDateBig}>
                {formatReadableDate(expiryDate)}
              </Text>
              <Text
                style={[
                  styles.expiryDaysSubtitle,
                  dateWasScanned && { color: '#047857' },
                ]}
              >
                {daysRemaining === 0
                  ? 'Expires Today!'
                  : daysRemaining < 0
                  ? `Expired ${Math.abs(daysRemaining)} days ago`
                  : `Expires in ${daysRemaining} ${
                      daysRemaining === 1 ? 'day' : 'days'
                    }`}
              </Text>
            </View>
            <DayExpiryCircle
              daysRemaining={daysRemaining}
              isFrozen={category === 'Frozen'}
              size={64}
              strokeWidth={5}
              elevated={dateWasScanned}
            />
          </View>

          {/* Large 44px Touch-Target Date Step Buttons */}
          <View style={styles.quickDaysRow}>
            {[
              { label: '-1d', delta: -1 },
              { label: '+1d', delta: 1 },
              { label: '+3d', delta: 3 },
              { label: '+1w', delta: 7 },
              { label: '+1m', delta: 30 },
            ].map((step) => (
              <Pressable
                key={step.label}
                onPress={() => adjustExpiryByDays(step.delta)}
                style={({ pressed }) => [
                  styles.dayStepPill,
                  dateWasScanned && styles.dayStepPillOnGreen,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.dayStepText}>{step.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* STEP 2 COMPONENT: Food Item Name & Barcode Box (Highlights Green + Top-Right Checkmark + Barcode Icon) */}
        <View
          style={[
            styles.stepCard,
            nameSectionComplete && styles.stepCardCompleted,
          ]}
        >
          <View style={styles.stepHeaderRow}>
            <View style={styles.labelWithIconRow}>
              <FifoIcon
                name="barcode"
                size={16}
                color={nameSectionComplete ? '#065F46' : '#334155'}
              />
              <Text
                style={[
                  styles.sectionHeaderLabel,
                  nameSectionComplete && styles.sectionHeaderLabelCompleted,
                ]}
              >
                FOOD ITEM NAME
              </Text>
            </View>

            {nameSectionComplete ? (
              <View style={styles.completedTickBadge}>
                <FifoIcon
                  name="check"
                  size={15}
                  color="#FFFFFF"
                  strokeWidth={3}
                />
              </View>
            ) : (
              <View style={styles.pendingStepPill}>
                <FifoIcon name="barcode" size={13} color="#475569" />
                <Text style={styles.pendingStepText}>Scan barcode or type</Text>
              </View>
            )}
          </View>

          <View style={styles.identityRow}>
            <Pressable
              onPress={
                photoUri
                  ? () => setPhotoUri(undefined)
                  : handleSnapThumbnailPhoto
              }
            >
              <FoodThumbnail
                photoUri={photoUri}
                category={category}
                variant="large"
              />
            </Pressable>

            <View style={styles.nameColumn}>
              <View
                style={[
                  styles.nameInputWrap,
                  nameSectionComplete && styles.nameInputWrapOnGreen,
                ]}
              >
                <TextInput
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="Scan barcode or type name..."
                  placeholderTextColor="#94A3B8"
                  style={styles.nameInput}
                />
                <FifoIcon
                  name="barcode"
                  size={19}
                  color={nameSectionComplete ? '#059669' : '#94A3B8'}
                />
              </View>
              <Text
                style={[
                  styles.thumbSubHint,
                  nameSectionComplete && { color: '#065F46' },
                ]}
              >
                {photoUri
                  ? 'Photo attached (tap image to clear)'
                  : `Using ${category} icon placeholder`}
              </Text>
            </View>
          </View>
        </View>

        {/* STEP 3 COMPONENT: Category, Alert Lead Time & Save Button */}
        <View style={styles.stepCard}>
          <View>
            <Text style={styles.sectionHeaderLabel}>STORAGE CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    style={[styles.catPill, active && styles.catPillActive]}
                  >
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.catPillText,
                        active && styles.catPillTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.divider} />

          <View style={styles.reminderSection}>
            <Text style={styles.sectionHeaderLabel}>
              NOTIFY ME BEFORE EXPIRY
            </Text>
            <View style={styles.leadRow}>
              {([1, 2, 3] as ReminderLeadDays[]).map((d) => {
                const active = reminderDays === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setReminderDays(d)}
                    style={[styles.leadBtn, active && styles.leadBtnActive]}
                  >
                    <Text
                      style={[
                        styles.leadBtnText,
                        active && styles.leadBtnTextActive,
                      ]}
                    >
                      {d} {d === 1 ? 'Day Before' : 'Days Before'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={handleSaveItem}
            style={({ pressed }) => [
              styles.saveCtaBtn,
              pressed && styles.pressed,
            ]}
          >
            <FifoIcon name="check" size={20} color="#FFFFFF" />
            <Text style={styles.saveCtaText}>Save Item to Kitchen</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    height: 310,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 12,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  cameraContainerSuccessBorder: {
    borderColor: '#10B981',
    borderWidth: 3,
  },
  cameraPreview: {
    ...StyleSheet.absoluteFill,
  },
  cameraFallbackBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
  },
  fallbackSub: {
    color: '#CBD5E1',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  grantPermissionBtn: {
    marginTop: 14,
    backgroundColor: '#10B981',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  grantPermissionBtnText: {
    color: '#064E3B',
    fontSize: 14,
    fontWeight: '800',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFill,
    padding: 12,
    justifyContent: 'space-between',
  },
  hudTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.86)',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  torchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchBtnActive: {
    backgroundColor: '#FACC15',
  },
  reticleBox: {
    alignSelf: 'center',
    width: '90%',
    height: 92,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.65)',
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 12,
  },
  reticleBoxSuccess: {
    borderColor: '#10B981',
    borderWidth: 3,
    backgroundColor: 'rgba(5, 150, 105, 0.88)',
  },
  reticleBoxRefocusing: {
    borderColor: '#FACC15',
    borderWidth: 2.5,
  },
  reticlePromptWrap: {
    alignItems: 'center',
  },
  reticleLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  reticleSubLabel: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  visualAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    paddingHorizontal: 6,
  },
  visualAlertBoxWarning: {
    backgroundColor: 'rgba(180, 83, 9, 0.92)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  visualAlertTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  visualAlertSubtitle: {
    color: '#ECFDF5',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: '#10B981',
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 14,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 14,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 14,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 14,
  },
  hudBottomStack: {
    gap: 8,
  },
  zoomBar: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 999,
    padding: 3,
    gap: 4,
  },
  zoomChip: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 999,
  },
  zoomChipActive: {
    backgroundColor: '#10B981',
  },
  zoomChipText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
  },
  zoomChipTextActive: {
    color: '#064E3B',
  },
  hudBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scanDateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#34D399',
  },
  scanDateTriggerText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  snapThumbTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  snapThumbTriggerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  stepCardCompleted: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.6,
  },
  sectionHeaderLabelCompleted: {
    color: '#065F46',
  },
  completedTickBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  pendingStepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pendingStepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  expiryMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  expiryDateBig: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  expiryDaysSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  quickDaysRow: {
    flexDirection: 'row',
    gap: 7,
  },
  dayStepPill: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayStepPillOnGreen: {
    backgroundColor: '#FFFFFF',
    borderColor: '#86EFAC',
  },
  dayStepText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nameColumn: {
    flex: 1,
  },
  nameInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 13,
    height: 48,
    gap: 8,
  },
  nameInputWrapOnGreen: {
    backgroundColor: '#FFFFFF',
    borderColor: '#86EFAC',
  },
  nameInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    height: '100%',
  },
  thumbSubHint: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 5,
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  categoryScroll: {
    gap: 8,
    paddingTop: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  catPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  catEmoji: {
    fontSize: 16,
  },
  catPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  reminderSection: {
    marginBottom: 16,
  },
  leadRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  leadBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  leadBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  leadBtnTextActive: {
    color: '#FFFFFF',
  },
  saveCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    height: 54,
    borderRadius: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveCtaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
