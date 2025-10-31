import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import USE_MOCK_PAYMENT from '../services/paymentConfig';

export default function MockPaymentBanner() {
  if (!USE_MOCK_PAYMENT) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Ionicons name="flask" size={16} color={Colors.warningText} />
      <Text style={styles.text}>
        Chế độ Demo - Thanh toán sẽ tự động thành công sau 10 giây
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.warningBackground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: Colors.warningText,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});