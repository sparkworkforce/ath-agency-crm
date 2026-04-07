import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#6b7280' },
  section: { marginBottom: 16 },
  label: { fontSize: 9, color: '#6b7280', marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 11 },
  table: { marginTop: 16 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: 'row', paddingVertical: 4 },
  colDesc: { flex: 1 },
  colAmount: { width: 80, textAlign: 'right' },
  totals: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  totalLabel: { width: 100, textAlign: 'right', color: '#6b7280', marginRight: 16 },
  totalValue: { width: 80, textAlign: 'right' },
  totalFinal: { fontWeight: 'bold', fontSize: 13 },
})

interface LineItem {
  description: string
  amount: number
}

interface InvoicePDFProps {
  invoiceId: string
  agencyName: string
  clientName: string
  clientEmail: string
  dueDate: string
  lineItems: LineItem[]
  subtotal: number
  tax: number
  total: number
}

export function InvoicePDF({
  invoiceId,
  agencyName,
  clientName,
  clientEmail,
  dueDate,
  lineItems,
  subtotal,
  tax,
  total,
}: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{agencyName}</Text>
          <Text style={styles.subtitle}>Factura #{invoiceId.slice(-8).toUpperCase()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Cliente</Text>
          <Text style={styles.value}>{clientName}</Text>
          <Text style={styles.value}>{clientEmail}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Fecha límite de pago</Text>
          <Text style={styles.value}>{dueDate}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, { color: '#6b7280', fontSize: 9 }]}>DESCRIPCIÓN</Text>
            <Text style={[styles.colAmount, { color: '#6b7280', fontSize: 9 }]}>MONTO</Text>
          </View>
          {lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colAmount}>${item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVU (11.5%)</Text>
            <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.totalFinal]}>Total</Text>
            <Text style={[styles.totalValue, styles.totalFinal]}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
