import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';

import FileSelector from './src/components/FileSelector';
import SearchBar from './src/components/SearchBar';
import ResultsList from './src/components/ResultsList';
import LoadingOverlay from './src/components/LoadingOverlay';

import {initializeModels} from './src/services/modelService';
import {initializeDatabase} from './src/services/databaseService';
import {processFile} from './src/services/fileService';
import {searchFiles} from './src/services/searchService';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [results, setResults] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize the app (load models, setup database)
  useEffect(() => {
    const setupApp = async () => {
      try {
        // Request permissions for Android
        if (Platform.OS === 'android') {
          await requestPermissions();
        }

        // Initialize database
        setLoadingMessage('Setting up database...');
        await initializeDatabase();

        // Initialize models
        setLoadingMessage('Loading AI models...');
        await initializeModels();

        setInitialized(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Setup error:', error);
        Alert.alert(
          'Setup Failed',
          'Failed to initialize the app: ' + error.message,
        );
      }
    };

    setupApp();
  }, []);

  const requestPermissions = async () => {
    try {
      const storagePermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to your storage to select files.',
          buttonPositive: 'OK',
        },
      );

      if (storagePermission !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Storage permission denied');
      }
    } catch (error) {
      throw new Error('Failed to request permissions: ' + error.message);
    }
  };

  const handleFileSelect = async files => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setLoadingMessage('Processing files...');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setLoadingMessage(`Processing file ${i + 1}/${files.length}...`);
        await processFile(file);
      }
      Alert.alert('Success', 'Files processed and indexed successfully');
    } catch (error) {
      console.error('File processing error:', error);
      Alert.alert('Error', 'Failed to process files: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async query => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Searching...');

    try {
      const searchResults = await searchFiles(query);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Failed', 'Error searching files: ' + error.message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialized && isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <LoadingOverlay visible={true} message={loadingMessage} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Multimodal Search</Text>
      </View>
      <View style={styles.content}>
        <FileSelector onFilesSelected={handleFileSelect} />
        <SearchBar onSearch={handleSearch} />
        <ResultsList results={results} />
      </View>
      <LoadingOverlay visible={isLoading} message={loadingMessage} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4A55A2',
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default App;
