import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ScreenWrapper, GlassCard, colors, typography } from '../../shared';
import { api } from '../../shared/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../context/ChatContext';
import type { Blog } from '../../shared/types';

export function BlogDetailScreen({ route }: any) {
  const { blogId } = route.params;
  const { blogVersion } = useChat();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.blogs.get(blogId).then(setBlog).finally(() => setLoading(false));
  }, [blogId, blogVersion]);

  if (loading) return <ScreenWrapper scroll><GlassCard><Text style={typography.body}>Loading...</Text></GlassCard></ScreenWrapper>;
  if (!blog) return <ScreenWrapper scroll><GlassCard><Text style={typography.body}>Blog not found</Text></GlassCard></ScreenWrapper>;

  return (
    <ScreenWrapper scroll>
      <View style={{ padding: 16 }}>
        <GlassCard style={{ padding: 20 }}>
          <Text style={[typography.pageTitle, { color: colors.textPrimary, marginBottom: 8 }]}>{blog.title}</Text>
          {blog.tags?.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {blog.tags.map(t => (
                <View key={t} style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: colors.accentGold + '20' }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: colors.accentGold }}>{t}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>{blog.content}</Text>
        </GlassCard>
      </View>
    </ScreenWrapper>
  );
}
