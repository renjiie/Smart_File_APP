import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
  AppState,
} from "react-native";

import FileSelector from "./src/components/FileSelector";
import FolderSelector from "./src/components/FolderSelector";
import SearchBar from "./src/components/SearchBar";
import ResultsList from "./src/components/ResultsList";
import LoadingOverlay from "./src/components/LoadingOverlay";

import { initializeModels } from "./src/services/modelService";
import { initializeDatabase } from "./src/services/databaseService";
import { processFile, processFolderFiles } from "./src/services/fileService";
import { searchFiles } from "./src/services/searchService";

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [results, setResults] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(null);
  const [activeTab, setActiveTab] = useState("files"); // 'files' or 'folder'
  const [appReady, setAppReady] = useState(false);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (!appReady) return; // Skip if app is not ready
    // Handle app state changes here if needed
  };

  // Initialize the app (load models, setup database)
  useEffect(() => {
    const setupApp = async () => {
      try {
        // Request permissions for Android
        if (Platform.OS === "android") {
          await requestPermissions();
        }

        // Initialize database
        setLoadingMessage("Setting up database...");
        await initializeDatabase();

        // Initialize models
        setLoadingMessage("Loading AI models...");
        await initializeModels();

        setInitialized(true);
        setIsLoading(false);
        setAppReady(true); // Mark app as ready for window focus handling
      } catch (error) {
        console.error("Setup error:", error);
        Alert.alert(
          "Setup Failed",
          "Failed to initialize the app: " + error.message
        );
      }
    };

    setupApp();
  }, []);

  const requestPermissions = async () => {
    try {
      const storagePermissions = [
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ];

      // For Android 13+ (API level 33+), request more specific permissions if available
      // This may not be needed for your testing, but it's good for production
      if (PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES) {
        storagePermissions.push(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
      }
      if (PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO) {
        storagePermissions.push(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
        );
      }

      const results = await Promise.all(
        storagePermissions.map((permission) =>
          PermissionsAndroid.request(permission, {
            title: "Storage Permission",
            message:
              "App needs access to your storage to select and scan files.",
            buttonPositive: "OK",
          })
        )
      );

      if (
        results.some((result) => result !== PermissionsAndroid.RESULTS.GRANTED)
      ) {
        throw new Error("One or more storage permissions denied");
      }
    } catch (error) {
      throw new Error("Failed to request permissions: " + error.message);
    }
  };

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setLoadingMessage("Processing files...");
    setProcessingProgress({ current: 0, total: files.length });

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setLoadingMessage(`Processing file ${i + 1}/${files.length}...`);
        setProcessingProgress({ current: i + 1, total: files.length });
        await processFile(file);
      }
      Alert.alert("Success", "Files processed and indexed successfully");
    } catch (error) {
      console.error("File processing error:", error);
      Alert.alert("Error", "Failed to process files: " + error.message);
    } finally {
      setIsLoading(false);
      setProcessingProgress(null);
    }
  };

  const handleFolderScan = async (files, folderPath) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setLoadingMessage(`Processing ${files.length} files from folder...`);
    setProcessingProgress({ current: 0, total: files.length });

    try {
      // Process the files with progress updates
      await processFolderFiles(files, (current, total) => {
        setLoadingMessage(`Processing file ${current}/${total}...`);
        setProcessingProgress({ current, total });
      });

      Alert.alert(
        "Success",
        `${files.length} files from folder processed and indexed successfully`
      );
    } catch (error) {
      console.error("Folder processing error:", error);
      Alert.alert("Error", "Failed to process folder files: " + error.message);
    } finally {
      setIsLoading(false);
      setProcessingProgress(null);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Searching...");

    try {
      const searchResults = await searchFiles(query);
      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Search Failed", "Error searching files: " + error.message);
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
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "files" && styles.activeTab]}
            onPress={() => setActiveTab("files")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "files" && styles.activeTabText,
              ]}
            >
              Select Files
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "folder" && styles.activeTab]}
            onPress={() => setActiveTab("folder")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "folder" && styles.activeTabText,
              ]}
            >
              Scan Folder
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent}>
          {activeTab === "files" ? (
            <FileSelector onFilesSelected={handleFileSelect} />
          ) : (
            <FolderSelector onFolderScanned={handleFolderScan} />
          )}

          <SearchBar onSearch={handleSearch} />

          {processingProgress && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Processing {processingProgress.current} of{" "}
                {processingProgress.total} files...
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        (processingProgress.current /
                          processingProgress.total) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          <ResultsList results={results} />
        </ScrollView>
      </View>
      <LoadingOverlay visible={isLoading} message={loadingMessage} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#4A55A2",
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4A55A2",
  },
  tabText: {
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#4A55A2",
    fontWeight: "bold",
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 1,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },
});

export default App;
