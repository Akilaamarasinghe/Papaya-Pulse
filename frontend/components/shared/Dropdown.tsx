import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

interface DropdownProps<T> {
  label: string;
  value: T | null;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string;
}

export function Dropdown<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  error,
}: DropdownProps<T>) {
  const [visible, setVisible] = useState(false);
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: visible ? colors.primary : colors.subtext }]}>
        {label.toUpperCase()}
      </Text>
      <TouchableOpacity
        style={[
          styles.selector,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : visible ? colors.primary : colors.inputBorder,
          },
        ]}
        onPress={() => setVisible(true)}
        activeOpacity={0.75}
      >
        <Text style={[styles.selectedText, { color: value ? colors.text : colors.placeholder }]}>
          {selectedLabel}
        </Text>
        <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={18} color={colors.subtext} />
      </TouchableOpacity>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={22} color={colors.subtext} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.option,
                    { borderBottomColor: colors.border },
                    option.value === value && { backgroundColor: `${colors.primary}15` },
                  ]}
                  onPress={() => {
                    onChange(option.value);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: option.value === value ? colors.primary : colors.text },
                      option.value === value && { fontWeight: '700' },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.value === value && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 7,
  },
  selector: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  selectedText: {
    fontSize: 15,
    fontWeight: '500',
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 22,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 15,
  },
});
