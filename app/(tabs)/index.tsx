import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, FlatList } from 'react-native';
import { Text, Card, Button, TextInput, IconButton, Avatar, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/AuthProvider';
import { supabase } from '@/src/services/supabase/client';
import { router } from 'expo-router';

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

export default function FeedScreen() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  // Debug log
  console.log('FeedScreen render:', { user, loading });

  // Fallback UI for debugging
  if (loading) {
    return <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading (auth)...</Text></SafeAreaView>;
  }
  if (user === null) {
    return <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>No user found. Please log in.</Text></SafeAreaView>;
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            content: newPost.trim(),
            user_id: user?.id,
          },
        ])
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setPosts(prev => [data, ...prev]);
      setNewPost('');
      setShowCreatePost(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('post_likes')
        .insert([
          {
            post_id: postId,
            user_id: user?.id,
          },
        ]);

      if (error) throw error;

      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, likes_count: post.likes_count + 1 }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const renderPost = ({ item: post }: { item: Post }) => (
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
          <Menu
            visible={menuVisible === post.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(post.id)}
              />
            }
          >
            {post.user_id === user?.id && (
              <>
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    // TODO: Implement edit post
                  }}
                  title="Edit"
                />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    // TODO: Implement delete post
                  }}
                  title="Delete"
                />
                <Divider />
              </>
            )}
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                // TODO: Implement report post
              }}
              title="Report"
            />
          </Menu>
        </View>

        <Text variant="bodyLarge" style={styles.postContent}>
          {post.content}
        </Text>

        <View style={styles.postActions}>
          <Button
            mode="text"
            icon="thumb-up"
            onPress={() => handleLike(post.id)}
          >
            {post.likes_count}
          </Button>
          <Button
            mode="text"
            icon="comment"
            onPress={() => handleComment(post.id)}
          >
            {post.comments_count}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Feed</Text>
        <IconButton
          icon="plus"
          size={24}
          onPress={() => setShowCreatePost(true)}
        />
      </View>

      {showCreatePost && (
        <Card style={styles.createPostCard}>
          <Card.Content>
            <TextInput
              multiline
              numberOfLines={3}
              placeholder="What's on your mind?"
              value={newPost}
              onChangeText={setNewPost}
              style={styles.postInput}
            />
            <View style={styles.createPostActions}>
              <Button
                mode="text"
                onPress={() => setShowCreatePost(false)}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCreatePost}
                disabled={!newPost.trim()}
              >
                Post
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.feed}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        onEndReached={() => {
          // TODO: Implement infinite scroll
        }}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  createPostCard: {
    margin: 16,
  },
  postInput: {
    marginBottom: 8,
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  feed: {
    padding: 16,
  },
  postCard: {
    marginBottom: 16,
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
  postActions: {
    flexDirection: 'row',
    gap: 8,
  },
}); 