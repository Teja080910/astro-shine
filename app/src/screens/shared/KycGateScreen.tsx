import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  GlassCard,
  GradientButton,
  ScreenWrapper,
  colors,
  typography,
} from '../../shared';
import { api } from '../../shared/api-client';

export function KycGateScreen() {
  const { astrologer, updateUser, logout } = useAuth();
  const [docs, setDocs] = useState<string[]>(astrologer?.verificationDoc || []);
  const [status, setStatus] = useState(astrologer?.verificationStatus || 'pending');
  const [note, setNote] = useState(astrologer?.verificationNote || '');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingUploadRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (!astrologer?.userId) return;
    try {
      const fresh = await api.astrologers.get(astrologer.userId);
      if (fresh) {
        // Only sync server docs when there are no pending local uploads,
        // otherwise the poll overwrites files the user just added but hasn't saved yet.
        if (!pendingUploadRef.current) {
          setDocs(fresh.verificationDoc || []);
        }
        setStatus(fresh.verificationStatus || 'pending');
        setNote(fresh.verificationNote || '');
        updateUser({ ...astrologer, ...fresh });
      }
    } catch {}
  }, [astrologer?.userId]);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    pollingRef.current = setInterval(fetchStatus, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchStatus]);

  const pickAndUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      setUploading(true);
      const uploaded = await api.uploadFile(
        { uri: file.uri, name: file.name, mimeType: file.mimeType },
        'supabase',
      );
      const newDocs = [...docs, uploaded.url];
      pendingUploadRef.current = true;
      setDocs(newDocs);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = (index: number) => {
    const remaining = docs.filter((_, i) => i !== index);
    pendingUploadRef.current = remaining.length > 0;
    setDocs(remaining);
  };

  const submitDocuments = async () => {
    if (docs.length === 0) {
      Alert.alert('Required', 'Please upload at least one document before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const updated = await api.astrologers.update(
        (astrologer!.userId || astrologer!.id) as string,
        { verificationDoc: docs, verificationStatus: 'pending' },
      );
      pendingUploadRef.current = false;
      setStatus('pending');
      setNote('');
      updateUser({ ...astrologer!, ...updated });
      Alert.alert('Submitted', 'Your documents have been submitted for verification.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    pending: {
      color: '#F59E0B',
      icon: 'time-outline' as const,
      label: 'Pending Review',
      message: 'Your documents are being reviewed by our team. This usually takes 24-48 hours. You will be notified once the review is complete.',
    },
    approved: {
      color: '#22C55E',
      icon: 'checkmark-circle-outline' as const,
      label: 'Verified',
      message: 'Your profile has been approved! You now have full access to the application.',
    },
    rejected: {
      color: '#EF4444',
      icon: 'close-circle-outline' as const,
      label: 'Rejected',
      message: note || 'Your verification was not approved. Please review the feedback and upload valid documents to resubmit.',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <ScreenWrapper scroll>
      <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 100 }}>

        {(status === 'pending' || status === 'rejected') && (
          <TouchableOpacity
            onPress={async () => {
              try {
                await logout();
              } catch {}
            }}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: colors.surfaceLight,
              borderColor: colors.cardBorder,
              borderWidth: 1,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
              zIndex: 10,
            }}
          >
            <Ionicons name="log-out-outline" size={16} color={colors.textSecondary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>
              Sign In
            </Text>
          </TouchableOpacity>
        )}

        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: config.color + '20',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Ionicons name={config.icon} size={40} color={config.color} />
        </View>

        <Text style={[typography.pageTitle, { marginBottom: 8 }]}>
          {status === 'approved' ? 'Welcome!' : 'KYC Verification'}
        </Text>

        <View style={{
          backgroundColor: config.color + '15',
          borderColor: config.color + '50',
          borderWidth: 1,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          width: '100%',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: config.color, marginRight: 8,
            }} />
            <Text style={[typography.cardTitle, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {config.message}
          </Text>
        </View>

        {status === 'approved' && (
          <View style={{ alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primaryLight} style={{ marginTop: 16 }} />
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 12 }]}>
              Redirecting...
            </Text>
          </View>
        )}

        {(status === 'pending' || status === 'rejected') && (
          <>
            {docs.length > 0 && (
              <View style={{ width: '100%', marginBottom: 20 }}>
                <Text style={[typography.cardTitle, { marginBottom: 8, color: colors.textPrimary }]}>
                  Uploaded Documents ({docs.length})
                </Text>
                {docs.map((doc, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: colors.glassBg,
                    borderColor: colors.cardBorder,
                    borderWidth: 1, borderRadius: 10,
                    padding: 12, marginBottom: 8,
                  }}>
                    <Ionicons name="document-text-outline" size={20} color={colors.primaryLight} style={{ marginRight: 10 }} />
                    <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                      {doc.split('/').pop()?.substring(14) || `Document ${i + 1}`}
                    </Text>
                    <TouchableOpacity onPress={() => removeDoc(i)} style={{ padding: 6 }}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <GlassCard style={{ alignItems: 'center', padding: 24, width: '100%' }}>
              <Ionicons name="cloud-upload-outline" size={48} color={colors.primaryLight} />
              <Text style={[typography.body, { textAlign: 'center', marginTop: 12, color: colors.textSecondary }]}>
                Upload ID proof, certificates, or degree documents
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4, marginBottom: 16 }]}>
                Supported: JPG, PNG, PDF
              </Text>
              <GradientButton
                title={uploading ? 'Uploading...' : 'Upload Document'}
                onPress={pickAndUpload}
                disabled={uploading}
              />
              {docs.length > 0 && (
                <View style={{ marginTop: 16, width: '100%' }}>
                  <GradientButton
                    title={submitting ? 'Submitting...' : status === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}
                    onPress={submitDocuments}
                    disabled={submitting}
                  />
                </View>
              )}
            </GlassCard>

            {status === 'pending' && (
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 20, textAlign: 'center' }]}>
                You will automatically gain access once your documents are approved.
              </Text>
            )}
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}
