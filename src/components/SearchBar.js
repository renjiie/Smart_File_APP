import React, {useState} from 'react';
import {StyleSheet, View, TextInput, TouchableOpacity} from 'react-native';
import {debounce} from 'lodash';

const SearchBar = ({onSearch}) => {
  const [query, setQuery] = useState('');

  // Debounce search to prevent too many search calls
  const debouncedSearch = React.useCallback(
    debounce(searchQuery => {
      onSearch(searchQuery);
    }, 300),
    [onSearch],
  );

  const handleSearchChange = text => {
    setQuery(text);
    debouncedSearch(text);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search your files..."
        value={query}
        onChangeText={handleSearchChange}
        clearButtonMode="while-editing"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

export default SearchBar;
