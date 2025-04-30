import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Alert} from 'react-native';
import DocumentPicker from 'react-native-document-picker';

const FileSelector = ({onFilesSelected}) => {
  const supportedTypes = [
    DocumentPicker.types.plainText,
    DocumentPicker.types.images,
    DocumentPicker.types.video,
    'public.text',
    'public.image',
    'public.movie',
    '.txt',
    '.jpg',
    '.jpeg',
    '.png',
    '.mp4',
    '.mov',
  ];

  const pickFiles = async () => {
    try {
      const results = await DocumentPicker.pickMultiple({
        type: supportedTypes,
        allowMultiSelection: true,
      });

      if (results && results.length > 0) {
        onFilesSelected(results);
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Error picking files:', err);
        Alert.alert('Error', 'Failed to select files: ' + err.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={pickFiles}>
        <Text style={styles.buttonText}>Select Files</Text>
      </TouchableOpacity>
      <Text style={styles.helpText}>
        Select text, images, or videos to index for search
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4A55A2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  helpText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default FileSelector;
