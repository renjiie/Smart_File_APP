import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { pick, types } from "@react-native-documents/picker";

const FileSelector = ({ onFilesSelected }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const supportedTypes = [
    types.plainText,
    types.images,
    types.video,
    ".txt",
    ".jpg",
    ".jpeg",
    ".png",
    ".mp4",
    ".mov",
  ];

  const pickFiles = async () => {
    setIsSelecting(true);
    try {
      const results = await pick({
        type: supportedTypes,
        allowMultiSelection: true,
      });

      if (results && results.length > 0) {
        setSelectedFiles((prevFiles) => [...prevFiles, ...results]);
        onFilesSelected(results);
      }
    } catch (err) {
      console.error("Error picking files:", err);
      Alert.alert("Error", "Failed to select files: " + err.message);
    } finally {
      setIsSelecting(false);
    }
  };

  const clearFiles = () => {
    setSelectedFiles([]);
  };

  const getFileTypeIcon = (fileType) => {
    if (fileType && fileType.startsWith("image/")) return "🖼️";
    if (fileType && fileType.startsWith("video/")) return "🎬";
    if (fileType && fileType.startsWith("text/")) return "📄";
    return "📁";
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={pickFiles}
          disabled={isSelecting}
        >
          <Text style={styles.buttonText}>
            {isSelecting ? "Selecting..." : "Select Files"}
          </Text>
          {isSelecting && (
            <ActivityIndicator
              size="small"
              color="white"
              style={styles.loader}
            />
          )}
        </TouchableOpacity>

        {selectedFiles.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFiles}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.helpText}>
        Select text, images, or videos to index for search
      </Text>

      {selectedFiles.length > 0 && (
        <View style={styles.fileListContainer}>
          <Text style={styles.fileListHeader}>
            Selected Files ({selectedFiles.length})
          </Text>
          <ScrollView style={styles.fileList}>
            {selectedFiles.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileIcon}>
                  {getFileTypeIcon(file.type)}
                </Text>
                <Text
                  style={styles.fileName}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {file.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#4A55A2",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    flex: 1,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  loader: {
    marginLeft: 8,
  },
  clearButton: {
    backgroundColor: "#f44336",
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  clearButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  helpText: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  fileListContainer: {
    marginTop: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 8,
    maxHeight: 150,
  },
  fileListHeader: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  fileList: {
    maxHeight: 120,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  fileIcon: {
    fontSize: 18,
    marginRight: 8,
    width: 24,
    textAlign: "center",
  },
  fileName: {
    fontSize: 12,
    flex: 1,
  },
});

export default FileSelector;
