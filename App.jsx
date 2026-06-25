/* ================= IMPORTS ================= */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

/* ================= CONSTANTS ================= */
const Tab = createBottomTabNavigator();

const COLORS = {
  bg: '#0F172A',
  card: '#FFFFFF',
  primary: '#14B8A6',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  gray: '#6B7280',
  textLight: '#E5E7EB',
  textDark: '#111827',
};

/* ================= HOME ================= */
function HomeScreen({ products, customers }) {
  const totalStock = products.reduce((a, b) => a + b.stock, 0);
  const totalUdhar = customers.reduce((a, b) => a + b.due, 0);

  return (
    <View style={styles.screen}>
      <Text style={styles.dashboardTitle}>📊 Dashboard</Text>

      <View style={styles.topRow}>
        <DashCard title="Products" value={products.length} icon="cube-outline" color="#38BDF8" />
        <DashCard title="Customers" value={customers.length} icon="people-outline" color="#A78BFA" />
      </View>

      <View style={styles.bigCard}>
        <Icon name="layers-outline" size={26} color={COLORS.primary} />
        <Text style={styles.bigLabel}>Total Stock</Text>
        <Text style={styles.bigValue}>{totalStock}</Text>
      </View>

      <View style={[styles.bigCard, { borderLeftColor: COLORS.danger }]}>
        <Icon name="cash-outline" size={26} color={COLORS.danger} />
        <Text style={styles.bigLabel}>Total Udhar</Text>
        <Text style={[styles.bigValue, { color: COLORS.danger }]}>
          ₹ {totalUdhar}
        </Text>
      </View>
    </View>
  );
}

const DashCard = ({ title, value, icon, color }) => (
  <View style={[styles.dashCard, { borderTopColor: color }]}>
    <Icon name={icon} size={24} color={color} />
    <Text style={styles.dashTitle}>{title}</Text>
    <Text style={[styles.dashValue, { color }]}>{value}</Text>
  </View>
);

/* ================= PRODUCTS ================= */
function ProductsScreen({ products, setProducts }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');

  const addProduct = () => {
    if (!name || !qty || !price) return Alert.alert('Incomplete Details');
    const q = Number(qty);
    const p = Number(price);
    if (q <= 0 || p <= 0) return Alert.alert('Invalid Input');

    setProducts([...products, { id: Date.now(), name, stock: q, sp: p, cp: p }]);
    setName('');
    setQty('');
    setPrice('');
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Products</Text>

      <InputRow icon="search-outline" placeholder="Search product" value={search} setValue={setSearch} />

      <View style={styles.addCard}>
        <Text style={styles.addTitle}>Add Product</Text>
        <InputRow icon="pricetag-outline" placeholder="Product Name" value={name} setValue={setName} />
        <InputRow icon="cube-outline" placeholder="Quantity" value={qty} setValue={setQty} numeric />
        <InputRow icon="cash-outline" placeholder="Price (₹)" value={price} setValue={setPrice} numeric />

        <TouchableOpacity style={styles.addBtn} onPress={addProduct}>
          <Text style={styles.addBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={i => i.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.bold}>{item.name}</Text>
            <Text>₹ {item.sp}</Text>
            <Text>Stock: {item.stock}</Text>

            <View style={styles.row}>
              <Btn text="Edit" color={COLORS.primary} onPress={() => setEditItem(item)} />
              <Btn
                text="Delete"
                color={COLORS.danger}
                onPress={() =>
                  Alert.alert('Delete Product?', item.name, [
                    { text: 'Cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () =>
                        setProducts(products.filter(p => p.id !== item.id)),
                    },
                  ])
                }
              />
            </View>
          </View>
        )}
      />

      {/* EDIT PRODUCT */}
      <Modal visible={!!editItem} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.editModalCard}>
            <Text style={styles.modalTitle}>Edit Product</Text>

            <Text style={styles.label}>Product Name</Text>
            <Input value={editItem?.name} onChange={v => setEditItem({ ...editItem, name: v })} />

            <Text style={styles.label}>Quantity</Text>
            <Input numeric value={String(editItem?.stock)} onChange={v => setEditItem({ ...editItem, stock: Number(v) })} />

            <Text style={styles.label}>Price</Text>
            <Input numeric value={String(editItem?.sp)} onChange={v => setEditItem({ ...editItem, sp: Number(v), cp: Number(v) })} />

            <View style={styles.modalBtnRow}>
              <Btn text="Cancel" color={COLORS.gray} onPress={() => setEditItem(null)} />
              <Btn
                text="Save"
                color={COLORS.success}
                onPress={() => {
                  setProducts(products.map(p => (p.id === editItem.id ? editItem : p)));
                  setEditItem(null);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= CUSTOMERS ================= */
function CustomersScreen({ customers, setCustomers }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [due, setDue] = useState('');
  const [search, setSearch] = useState('');
  const [editCustomer, setEditCustomer] = useState(null);

  const handlePhoneChange = (text) => {
    const onlyNum = text.replace(/[^0-9]/g, '');
    if (onlyNum.length <= 10) setPhone(onlyNum);
  };

  const addCustomer = () => {
    const d = Number(due);
    if (!name) return Alert.alert('Customer name required');
    if (phone.length !== 10) return Alert.alert('Phone number must be exactly 10 digits');
    if (d <= 0) return Alert.alert('Invalid Due Amount');

    setCustomers([...customers, { id: Date.now(), name, phone, due: d }]);
    setName('');
    setPhone('');
    setDue('');
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Customers</Text>

      <InputRow icon="search-outline" placeholder="Search customer" value={search} setValue={setSearch} />

      <View style={styles.addCard}>
        <Text style={styles.addTitle}>Add Customer</Text>

        <InputRow icon="person-outline" placeholder="Customer Name" value={name} setValue={setName} />

        <InputRow
          icon="call-outline"
          placeholder="Phone"
          value={phone}
          setValue={handlePhoneChange}
          numeric
          maxLength={10}
        />

        <InputRow icon="cash-outline" placeholder="Due Amount (₹)" value={due} setValue={setDue} numeric />

        <TouchableOpacity style={styles.addBtn} onPress={addCustomer}>
          <Text style={styles.addBtnText}>Add Customer</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.bold}>{item.name}</Text>
            <Text>📞 {item.phone}</Text>
            <Text style={{ color: COLORS.danger, fontWeight: '700' }}>
              Due: ₹ {item.due}
            </Text>

            <View style={styles.row}>
              <Btn text="Edit" color={COLORS.primary} onPress={() => setEditCustomer(item)} />
              <Btn
                text="Delete"
                color={COLORS.danger}
                onPress={() =>
                  Alert.alert('Delete Customer?', item.name, [
                    { text: 'Cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () =>
                        setCustomers(customers.filter(c => c.id !== item.id)),
                    },
                  ])
                }
              />
            </View>
          </View>
        )}
      />

      {/* EDIT CUSTOMER */}
      <Modal visible={!!editCustomer} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.editModalCard}>
            <Text style={styles.modalTitle}>Edit Customer</Text>

            <Text style={styles.label}>Customer Name</Text>
            <Input value={editCustomer?.name} onChange={v => setEditCustomer({ ...editCustomer, name: v })} />

            <Text style={styles.label}>Phone</Text>
            <Input
              numeric
              maxLength={10}
              value={editCustomer?.phone}
              onChange={v =>
                setEditCustomer({
                  ...editCustomer,
                  phone: v.replace(/[^0-9]/g, '').slice(0, 10),
                })
              }
            />

            <Text style={styles.label}>Due</Text>
            <Input numeric value={String(editCustomer?.due)} onChange={v => setEditCustomer({ ...editCustomer, due: Number(v) })} />

            <View style={styles.modalBtnRow}>
              <Btn text="Cancel" color={COLORS.gray} onPress={() => setEditCustomer(null)} />
              <Btn
                text="Save"
                color={COLORS.success}
                onPress={() => {
                  if (editCustomer.phone.length !== 10) {
                    return Alert.alert('Phone number must be exactly 10 digits');
                  }
                  setCustomers(customers.map(c => (c.id === editCustomer.id ? editCustomer : c)));
                  setEditCustomer(null);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= SMALL COMPONENTS ================= */
const Btn = ({ text, color, onPress }) => (
  <TouchableOpacity style={[styles.btn, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.btnText}>{text}</Text>
  </TouchableOpacity>
);

const Input = ({ value, onChange, numeric, maxLength }) => (
  <TextInput
    style={styles.input}
    value={value}
    keyboardType={numeric ? 'numeric' : 'default'}
    maxLength={maxLength}
    onChangeText={onChange}
  />
);

const InputRow = ({ icon, placeholder, value, setValue, numeric, maxLength }) => (
  <View style={styles.inputRow}>
    <Icon name={icon} size={18} color={COLORS.gray} />
    <TextInput
      style={styles.modernInput}
      placeholder={placeholder}
      placeholderTextColor={COLORS.gray}
      keyboardType={numeric ? 'numeric' : 'default'}
      value={value}
      maxLength={maxLength}
      onChangeText={setValue}
    />
  </View>
);

/* ================= APP ROOT ================= */
export default function App() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem('STORE_DATA').then(d => {
      if (d) {
        const data = JSON.parse(d);
        setProducts(data.products || []);
        setCustomers(data.customers || []);
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('STORE_DATA', JSON.stringify({ products, customers }));
  }, [products, customers]);

  return (
    <NavigationContainer>
      <StatusBar backgroundColor={COLORS.bg} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarStyle: { backgroundColor: '#020617' },
          tabBarIcon: ({ color, size }) => {
            const icons = { Home: 'home', Products: 'cube', Customers: 'people' };
            return <Icon name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home">
          {() => <HomeScreen products={products} customers={customers} />}
        </Tab.Screen>
        <Tab.Screen name="Products">
          {() => <ProductsScreen products={products} setProducts={setProducts} />}
        </Tab.Screen>
        <Tab.Screen name="Customers">
          {() => <CustomersScreen customers={customers} setCustomers={setCustomers} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: COLORS.bg },

  title: { color: COLORS.textLight, fontSize: 22, fontWeight: '800', marginBottom: 10 },
  
  dashboardTitle: { color: COLORS.textLight, fontSize: 26, fontWeight: '900', marginBottom: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  dashCard: { backgroundColor: '#fff', width: '48%', borderRadius: 18, padding: 16, borderTopWidth: 4 },
  dashTitle: { marginTop: 8, fontWeight: '700', color: COLORS.gray },
  dashValue: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  bigCard: { backgroundColor: '#fff', borderRadius: 22, padding: 20, marginBottom: 14, borderLeftWidth: 6 },
  bigLabel: { marginTop: 6, color: COLORS.gray, fontWeight: '700' },
  bigValue: { fontSize: 30, fontWeight: '900' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 10 },
  bold: { fontWeight: '700', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  addCard: { backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 14 },
  addTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  btn: { padding: 10, borderRadius: 10, alignItems: 'center', width: '48%' },
  btnText: { color: '#fff', fontWeight: '700' },
  input: { backgroundColor: '#F1F5F9', padding: 14, borderRadius: 14, marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 14, paddingHorizontal: 12, marginBottom: 10 },
  modernInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10 },
  modalBg: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  editModalCard: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 22 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  addBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 18, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '800' },
  label: { fontWeight: '700', marginBottom: 4, color: COLORS.textDark },
});
