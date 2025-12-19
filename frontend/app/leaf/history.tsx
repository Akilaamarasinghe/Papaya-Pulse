import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { LeafPredictionHistory, SeverityLevel } from '../../types';

const HISTORY_KEY = 'leaf_disease_history';

export default function LeafHistoryScreen() {
  const { t, language } = useTheme();
  const [history, setHistory] = useState<LeafPredictionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      if (data) {
        setHistory(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'mild': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'severe': return '#F44336';
      default: return '#999';
    }
  };

  const getDiseaseColor = (disease: string) => {
    if (disease === 'Healthy') return '#4CAF50';
    if (disease === 'NotPapaya') return '#999';
    return '#F44336';
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderHistoryItem = ({ item }: { item: LeafPredictionHistory }) => (
    <TouchableOpacity 
      style={styles.historyItem}
      onPress={() => {
        router.push({
          pathname: '/leaf/result' as any,
          params: {
            data: JSON.stringify({
              disease: item.disease,
              disease_confidence: item.disease_confidence,
              severity: item.severity,
              severity_confidence: item.severity_confidence,
            }),
          },
        });
      }}
    >
      {item.imageUri && (
        <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      )}
      <View style={styles.itemContent}>
        <Text style={[styles.diseaseText, { color: getDiseaseColor(item.disease) }]}>
          {item.disease}
        </Text>
        <Text style={styles.confidenceText}>
          Confidence: {(item.disease_confidence * 100).toFixed(1)}%
        </Text>
        {item.disease !== 'Healthy' && item.disease !== 'NotPapaya' && (
          <Text style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>
            Severity: {item.severity}
          </Text>
        )}
        <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (history.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{t('noScanHistory')}</Text>
          <Text style={styles.emptyText}>
            {t('startByScanning')}
          </Text>
          <PrimaryButton
            title={t('scanLeaf')}
            onPress={() => router.push('/leaf/scan' as any)}
            style={styles.button}
          />
          <PrimaryButton
            title={t('goBack')}
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('scanHistory')}</Text>
          <Text style={styles.headerSubtitle}>{history.length} {t(history.length !== 1 ? 'scans' : 'scan')}</Text>
        </View>

        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.footer}>
          <PrimaryButton
            title={t('clearHistory')}
            onPress={clearHistory}
            variant="outline"
            style={styles.clearButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  diseaseText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  clearButton: {
    marginBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    marginBottom: 16,
    minWidth: 200,
  },
});
