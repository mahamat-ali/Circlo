import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useUser } from '@clerk/clerk-expo';
import { uploadAvatar } from '@/utils/fileUpload';

const TestUploadScreen = () => {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const client = useClerkSupabaseClient();
  const { user } = useUser();


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant media library permissions to select an image.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only images
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
    });

    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
      setUploadedImageUrl(null); // Clear previous upload result
    }
  };

  const handleUpload = async () => {
    if (!selectedImageUri) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }
    if (!user) {
      Alert.alert('Authentication Error', 'User not authenticated. Please log in.');
      return;
    }


    setIsLoading(true);
    try {
      console.log('Attempting upload with User ID:', user.id);

      // Read the file as a base64 string using FileSystem
      const base64 = await FileSystem.readAsStringAsync(selectedImageUri, { encoding: FileSystem.EncodingType.Base64 });

      // Convert base64 to ArrayBuffer
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const arrayBuffer = new Uint8Array(byteNumbers).buffer;

      // Determine content type from URI or assume based on common image types
      const fileExt = selectedImageUri.split('.').pop()?.toLowerCase() || 'jpeg';
      const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

      const publicUrl = await uploadAvatar(client, user.id, arrayBuffer, contentType);
      setUploadedImageUrl(publicUrl);
      Alert.alert('Success', `Image uploaded successfully! URL: ${publicUrl}`);
      console.log('Uploaded image URL:', publicUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'An unexpected error occurred during upload.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Test Image Upload</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {selectedImageUri ? (
          <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Tap to select image</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleUpload}
        disabled={isLoading || !selectedImageUri}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Upload Image</Text>
        )}
      </TouchableOpacity>

      {uploadedImageUrl && (
        <View style={styles.uploadedUrlContainer}>
          <Text style={styles.uploadedUrlLabel}>Uploaded URL:</Text>
          <Text style={styles.uploadedUrl}>{uploadedImageUrl}</Text>
          <Image source={{ uri: uploadedImageUrl }} style={styles.uploadedImage} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  imagePicker: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 180,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadedUrlContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e6e6fa',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  uploadedUrlLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  uploadedUrl: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 15,
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
});

export default TestUploadScreen;