import React, {useState} from 'react';
import {
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import RNFS from 'react-native-fs';
import {scanFolderForFiles} from '../services/fileService';

const FolderSelector = ({onFolderScanned}) => {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [fileCount, setFileCount] = useState(0);

  const selectAndScanFolder = async () => {
    // In React Native, we need to use different approaches for directory selection
    // based on the platform
    try {
      let folderPath;
      
      if (Platform.OS === 'android') {
        // For Android, use a predefined location like Downloads or Documents folder
        // This is a limitation in React Native as it doesn't have a standard folder picker
        folderPath = Platform.OS === 'android' 
          ? `${RNFS.ExternalStorageDirectoryPath}/Download` 
          : `${RNFS.DocumentDirectoryPath}`;
          
        Alert.alert(
          'Scan Folder',
          `We'll scan the ${Platform.OS === 'android' ? 'Downloads' : 'Documents'} folder for searchable files. Continue?`,
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Scan', onPress: () => processFolderScan(folderPath)},
          ]
        );
      } else {
        // For iOS, use document picker to select a folder
        // This is a simplified example and may need additional logic for iOS
        folderPath = RNFS.DocumentDirectoryPath;
        Alert.alert(
          'Scan Folder',
          `We'll scan the Documents folder for searchable files. Continue?`,
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Scan', onPress: () => processFolderScan(folderPath)},
          ]
        );
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      Alert.alert('Error', 'Failed to select folder: ' + error.message);
    }
  };

  const processFolderScan = async (folderPath) => {
    setIsScanning(true);
    setFileCount(0);
    
    try {
      setSelectedFolder(folderPath);
      
      // Scan the folder recursively for files
      const files = await scanFolderForFiles(folderPath, (count) => {
        setFileCount(count);
      });
      
      if (files.length === 0) {
        Alert.alert('No Files Found', 'No supported files were found in the selected folder.');
      } else {
        // Notify parent component about the scanned files
        onFolderScanned(files, folderPath);
        Alert.alert('Scan Complete', `Found ${files.length} files that can be indexed for search.`);
      }
    } catch (error) {
      console.error('Error scanning folder:', error);
      Alert.alert('Error', 'Failed to scan folder: ' + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={selectAndScanFolder}
        disabled={isScanning}
      >
        <Text style={styles.buttonText}>
          {isScanning ? 'Scanning...' : 'Scan Folder for Files'}
        </Text>
        {isScanning && (
          <ActivityIndicator size="small" color="white" style={styles.loader} />
        )}
      </TouchableOpacity>
      
      {isScanning && (
        <Text style={styles.scanningText}>
          Scanning folder... Found {fileCount} files so far
        </Text>
      )}
      
      {selectedFolder && !isScanning && (
        <Text style={styles.folderText} numberOfLines={1} ellipsizeMode="middle">
          Selected: {selectedFolder}
        </Text>
      )}
      
      <Text style={styles.helpText}>
        Scan a folder to find and index all supported files (text, images, videos)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#7e57c2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loader: {
    marginLeft: 8,
  },
  helpText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  scanningText: {
    marginTop: 8,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  folderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
});

export default FolderSelector;