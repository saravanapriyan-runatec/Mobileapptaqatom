import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { announcementsAPI } from '../utils/api';
import { useTranslation } from 'react-i18next';
import tokens from '@/locales/tokens';

const Announcement = ({ navigation }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const PAGE_SIZE = 10;
   
   const {t,i18n} = useTranslation();
  const isRTL = i18n.language === 'ar';
  async function fetchAnnouncements(pageNum = 1) {
    try {
      setLoading(true);
      setError(null);

      // Use the API utility function from utils/api.js
      const data = await announcementsAPI.getAll(pageNum, PAGE_SIZE);

      setAnnouncements(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / PAGE_SIZE));
    } catch (err) {
      setError(err.message || "Failed to load announcements");
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnnouncements(page);
  }, [page]);

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages && pageNum !== page) {
      setPage(pageNum);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    
    // Show all pages if total pages <= 5
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <TouchableOpacity
            key={i}
            style={[styles.pageButton, page === i && styles.activePageButton]}
            onPress={() => goToPage(i)}
          >
            <Text style={[styles.pageButtonText, page === i && styles.activePageButtonText]}>
              {i}
            </Text>
          </TouchableOpacity>
        );
      }
    } else {
      // For more than 5 pages, show dynamic pagination
      const showFirst = page > 3;
      const showLast = page < totalPages - 2;
      
      if (showFirst) {
        pages.push(
          <TouchableOpacity
            key={1}
            style={styles.pageButton}
            onPress={() => goToPage(1)}
          >
            <Text style={styles.pageButtonText}>1</Text>
          </TouchableOpacity>
        );
        if (page > 4) {
          pages.push(
            <Text key="ellipsis1" style={styles.ellipsis}>...</Text>
          );
        }
      }
      
      // Show pages around current page
      const start = Math.max(1, page - 1);
      const end = Math.min(totalPages, page + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(
          <TouchableOpacity
            key={i}
            style={[styles.pageButton, page === i && styles.activePageButton]}
            onPress={() => goToPage(i)}
          >
            <Text style={[styles.pageButtonText, page === i && styles.activePageButtonText]}>
              {i}
            </Text>
          </TouchableOpacity>
        );
      }
      
      if (showLast) {
        if (page < totalPages - 3) {
          pages.push(
            <Text key="ellipsis2" style={styles.ellipsis}>...</Text>
          );
        }
        pages.push(
          <TouchableOpacity
            key={totalPages}
            style={styles.pageButton}
            onPress={() => goToPage(totalPages)}
          >
            <Text style={styles.pageButtonText}>{totalPages}</Text>
          </TouchableOpacity>
        );
      }
    }

    return pages;
  };
const formatDateToIST = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';

  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    // ⚠️ Explicitly avoid seconds unless needed
  });
};
  const renderItem = ({ item, index }) => (
    
    <View key={item.id || index} style={styles.card}>
      <View style={styles.cartleft}>
        <Text style={styles.titles}>{item.title || "Untitled"}</Text>
        <Text style={styles.content}>
          {item.description || item.content || "No description available."}
        </Text>
       <Text style={styles.dates}>
  {formatDateToIST(item.created_at || item.date || item.updated_at)}
</Text>
      </View>
      <View style={styles.cardright}>
        {item?.Announcement_type === 1 && 
          <Image
          source={require("../assets/images/Assets/birthday.jpg")}
          style={styles.images}
        />
        }
        {item?.Announcement_type === 2 && 
          <Image
          source={require("../assets/images/Assets/custom.jpg")}
          style={styles.images}
        />
        }
        {item?.Announcement_type === 3 && 
          <Image
          source={require("../assets/images/Assets/holidays.jpg")}
          style={styles.images}
        />
        }
        {item?.Announcement_type === 4 && 
          <Image
          source={require("../assets/images/Assets/microphone.jpg")}
          style={styles.images}
        />
        }
       
      </View>
    </View>
  );

  if (loading && announcements.length === 0) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#697ce3" />
          <Text style={styles.loadingText}>{t(tokens.messages.LoadingAnnouncement)}...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={() => fetchAnnouncements(page)} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#697ce3" />
        </View>
      )}

      <FlatList
        data={announcements}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.noData}>
            <Text style={styles.noDataText}>{t(tokens.messages.noAnnouncement)}</Text>
          </View>
        }
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.navButton, page === 1 && styles.navButtonDisabled]}
            onPress={() => goToPage(page - 1)}
            disabled={page === 1}
          >
            <Icon name="chevron-left" size={16} color={page === 1 ? "#ccc" : "#697ce3"} />
            <Text style={[styles.navButtonText, page === 1 && styles.navButtonTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.pageNumbersWrapper}>
            {renderPageNumbers()}
          </View>

          <TouchableOpacity
            style={[styles.navButton, page === totalPages && styles.navButtonDisabled]}
            onPress={() => goToPage(page + 1)}
            disabled={page === totalPages}
          >
            <Text style={[styles.navButtonText, page === totalPages && styles.navButtonTextDisabled]}>
              Next
            </Text>
            <Icon name="chevron-right" size={16} color={page === totalPages ? "#ccc" : "#697ce3"} />
          </TouchableOpacity>
        </View>
      )}

      {/* Page Info */}
      {/* {totalCount > 0 && (
        <View style={styles.pageInfo}>
          <Text style={styles.pageInfoText}>
            Page {page} of {totalPages} • Total: {totalCount} announcements
          </Text>
        </View>
      )} */}
    </View>
  );
};

const Header = ({ navigation }) => {
    const {t,i18n} = useTranslation();
  const isRTL = i18n.language === 'ar';
  return(
 <View style={styles.header}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
      <Icon name="angle-left" size={35} color="#697ce3" />
    </TouchableOpacity>
    <Text style={styles.title}>{t(tokens.messages.Announcements)}</Text>
  </View>
  )
 
};

export default Announcement;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 28,
    paddingLeft: 16,
    position: "relative",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    width: '100%',
    textAlign: 'center',
  },
  backButton: {
    position: "absolute",
    left: 20,
    padding: 10,
    zIndex: 10,
    backgroundColor: "transparent",
  },
  card: {
    width: "100%",
    minHeight: 120,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginVertical: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cartleft: {
    width: "70%",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    flexDirection: "column",
  },
  cardright: {
    width: "30%",
    height: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius:15,
  },
  images: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius:15,

  },
  titles: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  content: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
    lineHeight: 20,
  },
  dates: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#697ce3",
  },
  loadingOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -15,
    marginTop: -15,
    zIndex: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#697ce3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  noData: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    fontWeight:'bold'
  },
  
  // Pagination Styles
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  pageNumbersWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 6,
    gap: 5,
  },
  navButtonDisabled: {
    backgroundColor: "#f9f9f9",
  },
  navButtonText: {
    fontSize: 14,
    color: "#697ce3",
    fontWeight: "600",
  },
  navButtonTextDisabled: {
    color: "#ccc",
  },
  pageButton: {
    minWidth: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
  },
  activePageButton: {
    backgroundColor: "#697ce3",
  },
  pageButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  activePageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  ellipsis: {
    fontSize: 16,
    color: "#999",
    marginHorizontal: 5,
    paddingHorizontal: 3,
  },
  pageInfo: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f9f9f9",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  pageInfoText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
});