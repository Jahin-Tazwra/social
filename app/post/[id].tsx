import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, TextInput, Avatar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '../../hooks/AuthProvider';
import { supabase } from '@/lib/supabase';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchPostAndComments();
  }, [id]);

  const fetchPostAndComments = async () => {
    try {
      setLoading(true);
      
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (postError) throw postError;
      setPost(postData);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching post and comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPostAndComments();
    setRefreshing(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            content: newComment.trim(),
            post_id: id,
            user_id: user?.id,
          },
        ])
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setNewComment('');
      
      // Update post's comment count
      setPost(prev => prev ? {
        ...prev,
        comments_count: prev.comments_count + 1,
      } : null);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Post',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <Card style={styles.postCard}>
          <Card.Content>
            <View style={styles.postHeader}>
              <View style={styles.userInfo}>
                {post.user.avatar_url ? (
                  <Avatar.Image
                    size={40}
                    source={{ uri: post.user.avatar_url }}
                  />
                ) : (
                  <Avatar.Text
                    size={40}
                    label={post.user.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                  />
                )}
                <View style={styles.userNameContainer}>
                  <Text variant="titleMedium">{post.user.full_name}</Text>
                  <Text variant="bodySmall" style={styles.timestamp}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            <Text variant="bodyLarge" style={styles.postContent}>
              {post.content}
            </Text>

            <View style={styles.postStats}>
              <Text variant="bodyMedium">
                {post.likes_count} likes
              </Text>
              <Text variant="bodyMedium">
                {post.comments_count} comments
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.commentsSection}>
          <Text variant="titleMedium" style={styles.commentsTitle}>
            Comments
          </Text>

          {comments.map(comment => (
            <Card key={comment.id} style={styles.commentCard}>
              <Card.Content>
                <View style={styles.commentHeader}>
                  <View style={styles.userInfo}>
                    {comment.user.avatar_url ? (
                      <Avatar.Image
                        size={32}
                        source={{ uri: comment.user.avatar_url }}
                      />
                    ) : (
                      <Avatar.Text
                        size={32}
                        label={comment.user.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                      />
                    )}
                    <View style={styles.userNameContainer}>
                      <Text variant="titleSmall">{comment.user.full_name}</Text>
                      <Text variant="bodySmall" style={styles.timestamp}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text variant="bodyMedium" style={styles.commentContent}>
                  {comment.content}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          style={styles.commentInput}
          right={
            <TextInput.Icon
              icon="send"
              disabled={!newComment.trim()}
              onPress={handleAddComment}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCard: {
    margin: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameContainer: {
    marginLeft: 12,
  },
  timestamp: {
    color: '#666',
  },
  postContent: {
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    marginBottom: 16,
  },
  commentCard: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentContent: {
    marginLeft: 44,
  },
  commentInputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  commentInput: {
    backgroundColor: '#fff',
  },
}); 