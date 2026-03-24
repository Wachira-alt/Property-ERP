"use client";

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  header: { borderBottom: 2, borderBottomColor: '#000', paddingBottom: 10, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase' },
  section: { marginBottom: 15 },
  label: { fontWeight: 'bold', textTransform: 'uppercase', fontSize: 8, color: '#64748b', marginBottom: 2 },
  value: { fontSize: 11, fontWeight: 'bold' },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', marginTop: 20 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableColHeader: { width: '33.3%', backgroundColor: '#f8fafc', padding: 8 },
  tableCol: { width: '33.3%', padding: 8 },
  footer: { marginTop: 60, flexDirection: 'row', justifyContent: 'space-between' },
  sigLine: { borderTopWidth: 1, borderTopColor: '#000', width: '40%', paddingTop: 5, marginTop: 40 }
});

export const OfferLetterPDF = ({ contact, opportunity, ledgerEntries }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Official Letter of Offer</Text>
        <Text style={{ fontSize: 10 }}>Ref: {opportunity.id.slice(-6).toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Purchaser Details</Text>
        <Text style={styles.value}>{contact.firstName} {contact.lastName}</Text>
        <Text style={{ fontSize: 9 }}>{contact.phone || "No Phone Provided"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Property Description</Text>
        <Text style={styles.value}>Unit {opportunity.unit.unitNumber} - {opportunity.unit.unitType.name}</Text>
        <Text style={{ fontSize: 9 }}>Project: {contact.project.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Financial Consideration</Text>
        <Text style={styles.value}>KES {Number(opportunity.agreedPrice).toLocaleString()}</Text>
        <Text style={{ fontSize: 9 }}>Payment Method: {opportunity.paymentMethod}</Text>
      </View>

      <Text style={{ marginTop: 20, fontWeight: 'bold', fontSize: 9, textTransform: 'uppercase' }}>Payment Schedule</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text style={{ fontWeight: 'bold' }}>Description</Text></View>
          <View style={styles.tableColHeader}><Text style={{ fontWeight: 'bold' }}>Amount (KES)</Text></View>
          <View style={styles.tableColHeader}><Text style={{ fontWeight: 'bold' }}>Due Date</Text></View>
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
        <View>
          <View style={styles.sigLine} />
          <Text style={{ fontSize: 8, fontWeight: 'bold', marginTop: 5 }}>For: Property Pilot Limited</Text>
        </View>
        <View>
          <View style={styles.sigLine} />
          <Text style={{ fontSize: 8, fontWeight: 'bold', marginTop: 5 }}>Accepted by Purchaser</Text>
        </View>
      </View>
    </Page>
  </Document>
);