const fs = require('fs');
const path = 'src/app/orders.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add state hooks for issues
c = c.replace(
  /const \[loading, setLoading\] = useState\(true\);/,
  `const [loading, setLoading] = useState(true);\n  const [issuesModalVisible, setIssuesModalVisible] = useState(false);\n  const [selectedOrderIssues, setSelectedOrderIssues] = useState<any[]>([]);\n  const [loadingIssues, setLoadingIssues] = useState(false);`
);

// 2. Add fetchIssues function
const fetchIssuesCode = `
  const fetchIssues = async (orderId: number) => {
    try {
      setLoadingIssues(true);
      setIssuesModalVisible(true);
      setSelectedOrderIssues([]);
      const token = await AsyncStorage.getItem('vendorToken');
      const res = await fetch(\`\${process.env.EXPO_PUBLIC_BASE_URL}/api/vendor/orders/\${orderId}/issues\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedOrderIssues(data.issues);
      }
    } catch (e) {
      console.error('Failed to fetch issues', e);
    } finally {
      setLoadingIssues(false);
    }
  };
`;
c = c.replace(
  /const fetchOrders = async \(\) => \{/,
  fetchIssuesCode + '\n  const fetchOrders = async () => {'
);

// 3. Update the Issues button onPress
c = c.replace(
  /onPress=\{\(\) => alert\(order\.issues \|\| 'No issues reported by the customer for this order\.'\)\}/,
  `onPress={() => onFetchIssues(Number(order.id.replace('ORD-', '')))}`
);

// Note: OrderCard is a separate component outside Orders.
// We need to pass onFetchIssues to OrderCard.
c = c.replace(
  /const OrderCard = \(\{ order, onStatusUpdate \}/,
  `const OrderCard = ({ order, onStatusUpdate, onFetchIssues }`
);

c = c.replace(
  /<OrderCard order=\{\{/,
  `<OrderCard onFetchIssues={fetchIssues} order={{`
);

// 4. Add the Modal UI at the end
const modalCode = `
      {/* Issues Modal */}
      <Modal
        visible={issuesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIssuesModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', width: '90%', maxHeight: '80%', borderRadius: 12, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Customer Issues</Text>
              <TouchableOpacity onPress={() => setIssuesModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {loadingIssues ? (
              <ActivityIndicator color="#F59E0B" style={{ marginVertical: 20 }} />
            ) : selectedOrderIssues.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#6B7280', marginVertical: 20 }}>No issues reported by the customer.</Text>
            ) : (
              <FlatList
                data={selectedOrderIssues}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <View style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, color: '#92400E', marginBottom: 4 }}>
                      <Ionicons name="person" size={12} /> {item.customer_name || 'Customer'}
                    </Text>
                    <Text style={{ fontSize: 15, color: '#111827', fontWeight: '500' }}>{item.issue_text}</Text>
                    <Text style={{ fontSize: 12, color: '#B45309', marginTop: 8, textAlign: 'right' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
`;
c = c.replace(/<\/SafeAreaView>/, modalCode);

fs.writeFileSync(path, c);
console.log('Vendor orders patched.');
