const fs = require('fs');
let c = fs.readFileSync('src/app/orders.tsx', 'utf8');
const startTag = "{order.status === 'pending' && (";
const endTag = "Cancel</Text>\r\n            </TouchableOpacity>";
const endTag2 = "Cancel</Text>\n            </TouchableOpacity>";

const start = c.indexOf(startTag);
const end = c.indexOf(endTag) !== -1 ? c.indexOf(endTag) + endTag.length : (c.indexOf(endTag2) !== -1 ? c.indexOf(endTag2) + endTag2.length : -1);

if (start !== -1 && end !== -1) {
    const replacement = `<TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}
              onPress={() => alert(order.issues || 'No issues reported by the customer for this order.')}
            >
              <Ionicons name="warning-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Issues</Text>
            </TouchableOpacity>`;
    c = c.substring(0, start) + replacement + c.substring(end);
    fs.writeFileSync('src/app/orders.tsx', c);
    console.log('Patched');
} else {
    console.log('Not found', start, end);
}
