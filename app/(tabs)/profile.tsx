import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Button, Text, TextInput, Card, Avatar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/AuthProvider';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  email: string;
  created_at: string;
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditedProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const fileExt = file.uri.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        // Upload image to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, {
            uri: file.uri,
            type: `image/${fileExt}`,
            name: fileName,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user?.id);

        if (updateError) throw updateError;

        setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
        setEditedProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to update profile picture');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('profiles')
        .update(editedProfile)
        .eq('id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...editedProfile } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              {profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={100}
                  label={profile.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                />
              )}
              <IconButton
                icon="camera"
                size={20}
                style={styles.editAvatarButton}
                onPress={handleImagePick}
              />
            </View>
            <Text variant="headlineSmall" style={styles.name}>
              {profile.full_name}
            </Text>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleMedium">Profile Information</Text>
                <Button
                  mode="text"
                  onPress={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </View>

              {isEditing ? (
                <>
                  <TextInput
                    label="Full Name"
                    value={editedProfile.full_name || ''}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, full_name: text }))}
                    style={styles.input}
                  />
                  <TextInput
                    label="Bio"
                    value={editedProfile.bio || ''}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, bio: text }))}
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                  />
                  <TextInput
                    label="Phone"
                    value={editedProfile.phone || ''}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, phone: text }))}
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                  <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={loading}
                    style={styles.saveButton}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.label}>Email</Text>
                    <Text variant="bodyMedium">{profile.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.label}>Phone</Text>
                    <Text variant="bodyMedium">{profile.phone || 'Not set'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.label}>Bio</Text>
                    <Text variant="bodyMedium">{profile.bio || 'No bio yet'}</Text>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          {error && (
            <Text style={styles.error} variant="bodyMedium">
              {error}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 2,
  },
  name: {
    marginTop: 10,
  },
  card: {
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    color: '#666',
  },
  saveButton: {
    marginTop: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
}); 