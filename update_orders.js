const fs = require('fs');
const filePath = 'e:\\\\Freelance\\\\roameo-project\\\\roameo-vendor\\\\src\\\\app\\\\orders.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

if (!content.includes('AsyncStorage')) {
    content = content.replace(
        "import { useRouter } from 'expo-router';",
        "import { useRouter } from 'expo-router';\nimport AsyncStorage from '@react-native-async-storage/async-storage';"
    );
}

const ordersStart = content.indexOf('const Orders = () => {');
const tabBarStart = content.indexOf('<View style={styles.tabBar}>');
if (ordersStart !== -1 && tabBarStart !== -1) {
    const replacement = `const Orders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('vendorToken');
      const response = await fetch(\`\${process.env.EXPO_PUBLIC_BASE_URL}/api/vendor/orders\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = String(order.id).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Orders</Text>
        <Text style={styles.headerSubtitle}>Manage and track your bookings</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <OrderCard order={{
            id: 'ORD-' + item.id,
            service: item.items && item.items[0] ? item.items[0].title : 'Coupon',
            date: new Date(item.created_at).toLocaleDateString(),
            time: new Date(item.created_at).toLocaleTimeString(),
            customer: 'Customer #' + item.user_id,
            amount: '$' + item.total_amount,
            items: item.total_items,
            status: item.status,
            phone: '',
            notes: ''
          }} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>{loading ? 'Loading...' : 'No orders found'}</Text>
          </View>
        }
      />

      `;
    
    content = content.substring(0, ordersStart) + replacement + content.substring(tabBarStart);
}

const actionBtnsStart = content.indexOf("{order.status !== 'completed'");
const actionBtnsEnd = content.indexOf('</View>\n    </View>\n  );\n};');
if (actionBtnsStart !== -1 && actionBtnsEnd !== -1) {
    const newActions = `
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#FF9800' }]}
              onPress={() => alert('Fetch issues for order ' + order.id)}
            >
              <Ionicons name="warning" size={18} color="#fff" />
              <Text style={styles.btnText}>Issues</Text>
            </TouchableOpacity>
          </View>
        `;
    content = content.substring(0, actionBtnsStart) + newActions + content.substring(actionBtnsEnd);
}

fs.writeFileSync(filePath, content);
console.log('updated successfully');
