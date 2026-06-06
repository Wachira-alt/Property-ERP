// @ts-nocheck
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    fontFamily:      "Helvetica",
    fontSize:        11,
    color:           "#1a1a1a",
    paddingTop:      60,
    paddingBottom:   60,
    paddingLeft:     72,
    paddingRight:    72,
    lineHeight:      1.6,
  },
  header: {
    marginBottom: 32,
    borderBottom: "2px solid #1f6feb",
    paddingBottom: 16,
  },
  companyName: {
    fontSize:   18,
    fontFamily: "Helvetica-Bold",
    color:      "#1f6feb",
    marginBottom: 2,
  },
  companyTagline: {
    fontSize: 10,
    color:    "#666",
  },
  title: {
    fontSize:     15,
    fontFamily:   "Helvetica-Bold",
    marginBottom: 4,
    marginTop:    24,
    color:        "#1a1a1a",
  },
  refDate: {
    fontSize: 10,
    color:    "#666",
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize:     11,
    fontFamily:   "Helvetica-Bold",
    marginBottom: 8,
    color:        "#1a1a1a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    marginBottom:  5,
  },
  label: {
    width:      140,
    color:      "#555",
    fontSize:   10,
  },
  value: {
    flex:       1,
    fontFamily: "Helvetica-Bold",
    fontSize:   10,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection:   "row",
    backgroundColor: "#f0f6ff",
    borderRadius:    4,
    padding:         "6 8",
    marginBottom:    4,
  },
  tableRow: {
    flexDirection: "row",
    padding:       "5 8",
    borderBottom:  "1px solid #eee",
  },
  tableColDesc:   { flex: 3, fontSize: 10 },
  tableColAmount: { flex: 1.5, fontSize: 10, textAlign: "right" },
  tableColDate:   { flex: 2, fontSize: 10, textAlign: "right" },
  tableColDescH:  { flex: 3, fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1f6feb" },
  tableColAmountH:{ flex: 1.5, fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1f6feb", textAlign: "right" },
  tableColDateH:  { flex: 2, fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1f6feb", textAlign: "right" },
  totalRow: {
    flexDirection:   "row",
    padding:         "7 8",
    backgroundColor: "#f0f6ff",
    borderRadius:    4,
    marginTop:       4,
  },
  totalLabel: {
    flex:       3,
    fontFamily: "Helvetica-Bold",
    fontSize:   11,
    color:      "#1f6feb",
  },
  totalValue: {
    flex:       3.5,
    fontFamily: "Helvetica-Bold",
    fontSize:   11,
    textAlign:  "right",
    color:      "#1f6feb",
  },
  clause: {
    fontSize:     10,
    color:        "#444",
    marginBottom: 8,
    lineHeight:   1.7,
  },
  signatureSection: {
    marginTop:  48,
    flexDirection: "row",
    gap:        48,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLine: {
    borderBottom: "1px solid #1a1a1a",
    marginBottom: 6,
    height:       40,
  },
  signatureLabel: {
    fontSize: 9,
    color:    "#666",
  },
  footer: {
    position:  "absolute",
    bottom:    30,
    left:      72,
    right:     72,
    textAlign: "center",
    fontSize:  8,
    color:     "#999",
    borderTop: "1px solid #eee",
    paddingTop: 8,
  },
})

type LedgerEntry = {
  description: string
  amount:      number
  dueDate:     Date | string
}

type Props = {
  contactName:   string
  contactPhone:  string
  contactEmail:  string | null
  projectName:   string
  unitName:      string
  unitType:      string
  agreedPrice:   number
  paymentMethod: string
  ledgerEntries: LedgerEntry[]
  offerDate:     string
  referenceNo:   string
}

function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`
}

function formatDateStr(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-KE", {
    day: "2-digit", month: "long", year: "numeric",
  })
}

export function OfferLetterPDF({
  contactName,
  contactPhone,
  contactEmail,
  projectName,
  unitName,
  unitType,
  agreedPrice,
  paymentMethod,
  ledgerEntries,
  offerDate,
  referenceNo,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Home Bridge Ltd.</Text>
          <Text style={styles.companyTagline}>
            Premium Real Estate · Nairobi, Kenya
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Letter of Offer</Text>
        <Text style={styles.refDate}>
          Ref: {referenceNo} · Date: {offerDate}
        </Text>

        {/* Client details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{contactName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{contactPhone}</Text>
          </View>
          {contactEmail && (
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{contactEmail}</Text>
            </View>
          )}
        </View>

        {/* Property details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Project</Text>
            <Text style={styles.value}>{projectName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Unit</Text>
            <Text style={styles.value}>{unitName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Unit Type</Text>
            <Text style={styles.value}>{unitType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Agreed Price</Text>
            <Text style={styles.value}>{formatKES(agreedPrice)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{paymentMethod}</Text>
          </View>
        </View>

        {/* Payment schedule */}
        {ledgerEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Schedule</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableColDescH}>Description</Text>
                <Text style={styles.tableColAmountH}>Amount</Text>
                <Text style={styles.tableColDateH}>Due Date</Text>
              </View>
              {ledgerEntries.map((entry, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.tableColDesc}>{entry.description}</Text>
                  <Text style={styles.tableColAmount}>{formatKES(entry.amount)}</Text>
                  <Text style={styles.tableColDate}>{formatDateStr(entry.dueDate)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatKES(ledgerEntries.reduce((s, e) => s + e.amount, 0))}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.clause}>
            1. This offer is valid for seven (7) days from the date of issue. Failure to
            sign and return this letter within the stipulated period shall render this
            offer null and void.
          </Text>
          <Text style={styles.clause}>
            2. The agreed price is exclusive of any applicable government levies, stamp
            duty, and legal fees unless expressly stated otherwise.
          </Text>
          <Text style={styles.clause}>
            3. All payments shall be made strictly in accordance with the payment schedule
            detailed above. Late payment may attract a penalty of 2% per month on the
            outstanding amount.
          </Text>
          <Text style={styles.clause}>
            4. This offer is conditional upon the completion of Know Your Customer (KYC)
            requirements including submission of a valid National ID and KRA PIN.
          </Text>
          <Text style={styles.clause}>
            5. The developer reserves the right to withdraw this offer if any information
            provided by the client is found to be inaccurate or misleading.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Client Signature & Date</Text>
            <Text style={[styles.signatureLabel, { marginTop: 4 }]}>{contactName}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              Authorized Signatory & Date
            </Text>
            <Text style={[styles.signatureLabel, { marginTop: 4 }]}>
              Home Bridge Ltd.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This document is computer generated and constitutes a valid letter of offer.
          Home Bridge Ltd. · P.O Box 00100, Nairobi, Kenya
        </Text>
      </Page>
    </Document>
  )
}