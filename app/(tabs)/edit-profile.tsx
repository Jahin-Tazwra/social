import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Avatar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuth } from '../../hooks/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/src/services/supabase/client';
import { storageService } from '@/src/services/storage/storage';
import { router } from 'expo-router';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [bio, setBio] = useState(user?.user_metadata?.bio || '');
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setLoading(true);
      try {
        const file = result.assets[0];
        const { data: publicUrl, error } = await storageService.uploadAvatar(user?.id || '', {
          uri: file.uri,
          type: `image/${file.uri.split('.').pop()}`,
          name: file.uri.split('/').pop() || '',
        });

        if (error) throw error;

        // Update user metadata
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            avatar_url: publicUrl,
          },
        });

        if (updateError) throw updateError;

        setAvatarUrl(publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          bio: bio,
        },
      });

      if (error) throw error;
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          {avatarUrl ? (
            <Avatar.Image
              size={100}
              source={{ uri: avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={100}
              label={user?.email?.[0].toUpperCase() || 'U'}
              style={styles.avatar}
            />
          )}
          <Button
            mode="outlined"
            onPress={pickImage}
            loading={loading}
            style={styles.changePhotoButton}
          >
            Change Photo
          </Button>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />

          <TextInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
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
  header: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    marginBottom: 10,
  },
  changePhotoButton: {
    marginTop: 10,
  },
  form: {
    padding: 20,
  },
  input: {
    marginBottom: 15,
  },
  saveButton: {
    marginTop: 10,
  },
}); 