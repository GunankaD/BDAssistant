import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  Pressable,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Bottom-sheet style modal with radio list of languages.
 * - shows options from LanguageContext.options
 * - selected option is applied when user presses "Save"
 * - pressing outside or "Cancel" closes modal without applying
 */
const LanguagePicker: React.FC<Props> = ({ visible, onClose }) => {
  const { lang, setLang, options, prefetch } = useLanguage();
  const [selected, setSelected] = useState<string>(lang);

  useEffect(() => {
    if (visible) setSelected(lang);
  }, [visible, lang]);

  const apply = async () => {
    try {
      await setLang(selected);
      // optional: prefetch common strings to reduce perceived lag
      // pick a few common keys you want ready (adjust as needed)
      await prefetch([
        'No devices found',
        'ID: {{id}}',
        'Location: {{loc}}',
        'Version: {{ver}}',
        'Last synced: {{time}}',
        'online',
        'offline',
        'unknown'
        ]);
    } catch {
      // ignore
    } finally {
      onClose();
    }
  };

  const renderItem = ({ item }: { item: { code: string; label: string } }) => {
    const checked = item.code === selected;
    return (
      <Pressable onPress={() => setSelected(item.code)} style={modalStyles.optionRow}>
        <Text style={modalStyles.optionLabel}>{item.label}</Text>
        <View style={[modalStyles.radio, checked && modalStyles.radioChecked]}>
          {checked && <View style={modalStyles.radioDot} />}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.headerTitle}>Choose language</Text>
        </View>

        <FlatList
          data={options}
          keyExtractor={(i) => i.code}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 8 }}
        />

        <View style={modalStyles.actions}>
          <TouchableOpacity style={modalStyles.btnOutline} onPress={onClose}>
            <Text style={modalStyles.btnOutlineText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={modalStyles.btnPrimary} onPress={apply}>
            <Text style={modalStyles.btnPrimaryText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LanguagePicker;

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#0f2b30',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '55%',
  },
  header: {
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  optionLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioChecked: {
    borderColor: '#fff',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginLeft: 12,
  },
  btnPrimaryText: { color: '#0f2b30', fontWeight: '800' },
  btnOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  btnOutlineText: { color: '#fff', fontWeight: '700' },
});
