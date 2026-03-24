import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { borderBottom: 2, borderBottomColor: '#000', pb: 10, mb: 20, flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase' },
  section: { mb: 15 },
  label: { fontWeight: 'bold', textTransform: 'uppercase', fontSize: 8, color: '#666' },
  value: { fontSize: 12, marginTop: 4 },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', marginTop: 20 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { width: '33.3%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', backgroundColor: '#f0f0f0', padding: 5 },
  tableCol: { width: '33.3%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', padding: 5 },
  footer: { marginTop: 50, flexDirection: 'row', justifyContent: 'space-between' },
  sigLine: { borderTopWidth: 1, borderTopColor: '#000', width: '40%', pt: 5 }
});

export const OfferLetterPDF = ({ contact, opportunity, ledgerEntries }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Letter of Offer</Text>
        <Text>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Client Name</Text>
        <Text style={styles.value}>{contact.firstName} {contact.lastName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Unit Reference</Text>
        <Text style={styles.value}>{opportunity.unit.unitNumber} - {opportunity.paymentMethod}</Text>
      </View>

      <Text style={{ marginTop: 20, fontWeight: 'bold' }}>PAYMENT SCHEDULE</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text>Description</Text></View>
          <View style={styles.tableColHeader}><Text>Amount (KES)</Text></View>
          <View style={styles.tableColHeader}><Text>Due Date</Text></View>
        </View>
        {ledgerEntries.map((entry: any, i: number) => (
          <View style={styles.tableRow} key={i}>
            <View style={styles.tableCol}><Text>{entry.description}</Text></View>
            <View style={styles.tableCol}><Text>{Number(entry.amount).toLocaleString()}</Text></View>
            <View style={styles.tableCol}><Text>{new Date(entry.dueDate).toLocaleDateString()}</Text></View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.sigLine}><Text>Property Pilot Auth. Signatory</Text></View>
        <View style={styles.sigLine}><Text>Client Acceptance Signature</Text></View>
      </View>
    </Page>
  </Document>
);