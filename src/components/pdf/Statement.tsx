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
    fontFamily:   "Helvetica",
    fontSize:     11,
    color:        "#1a1a1a",
    paddingTop:   56,
    paddingBottom: 56,
    paddingLeft:  64,
    paddingRight: 64,
    lineHeight:   1.6,
  },
  header: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginBottom:   28,
    borderBottom:   "2px solid #1f6feb",
    paddingBottom:  14,
  },
  companyName: {
    fontSize:   16,
    fontFamily: "Helvetica-Bold",
    color:      "#1f6feb",
  },
  companyTagline: { fontSize: 9, color: "#666", marginTop: 2 },
  docTitle:       { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  docSub:         { fontSize: 10, color: "#666" },
  section:        { marginBottom: 18 },
  sectionTitle: {
    fontSize:     9,
    fontFamily:   "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color:        "#555",
    marginBottom: 8,
    borderBottom: "1px solid #eee",
    paddingBottom: 4,
  },
  row:   { flexDirection: "row", marginBottom: 4 },
  label: { width: 130, fontSize: 10, color: "#555" },
  value: { flex: 1, fontSize: 10, fontFamily: "Helvetica-Bold" },
  tableHeader: {
    flexDirection:   "row",
    backgroundColor: "#f0f6ff",
    padding:         "5 6",
    borderRadius:    3,
    marginBottom:    3,
  },
  tableRow: {
    flexDirection: "row",
    padding:       "5 6",
    borderBottom:  "1px solid #f0f0f0",
  },
  tableRowAlt: {
    flexDirection:   "row",
    padding:         "5 6",
    borderBottom:    "1px solid #f0f0f0",
    backgroundColor: "#fafafa",
  },
  colNo:     { width: 24,   fontSize: 9 },
  colDesc:   { flex: 3,     fontSize: 9 },
  colDue:    { flex: 2,     fontSize: 9 },
  colAmount: { flex: 1.5,   fontSize: 9, textAlign: "right" },
  colStatus: { width: 55,   fontSize: 9, textAlign: "center" },
  colPaidAt: { flex: 2,     fontSize: 9, textAlign: "right" },
  colRef:    { flex: 2,     fontSize: 9, textAlign: "right" },
  colNoH:    { width: 24,   fontSize: 9,  fontFamily: "Helvetica-Bold", color: "#1f6feb" },
  colDescH:  { flex: 3,     fontSize: 9,  fontFamily: "Helvetica-Bold", color: "#1f6feb" },
  colDueH:   { flex: 2,     fontSize: 9,  fontFamily: "Helvetica-Bold", color: "#1f6feb" },
  colAmountH:{ flex: 1.5,   fontSize: 9,  fontFamily: "Helvetica-Bold", color: "#1f6feb", textAlign: "right" },
  colStatusH:{ width: 55,   fontSize: 9,  fontFamily: "Helvetica-Bold", color: "#1f6feb", textAlign: "center" },
  colPaidAtH:{ flex: 2,     fontSize: 9,  fontFamily: "Helvetica-Bold", color: "#1f6feb", textAlign: "right" },
  colRefH:   { flex: 2,     fontSize: 9,  fontFamily: "Helvetica-Bold", color: "#1f6feb", textAlign: "right" },
  summaryBox: {
    flexDirection:   "row",
    justifyContent:  "flex-end",
    gap:             24,
    marginTop:       12,
    padding:         "10 12",
    backgroundColor: "#f0f6ff",
    borderRadius:    4,
  },
  summaryItem: { alignItems: "flex-end" },
  summaryLabel:{ fontSize: 9,  color: "#555" },
  summaryValue:{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1f6feb" },
  footer: {
    position:   "absolute",
    bottom:     24,
    left:       64,
    right:      64,
    textAlign:  "center",
    fontSize:   8,
    color:      "#aaa",
    borderTop:  "1px solid #eee",
    paddingTop: 6,
  },
})

type Entry = {
  description: string
  amount:      number
  dueDate:     Date | string
  paidAt:      Date | string | null
  paymentRef:  string | null
  status:      string
}

type Props = {
  contactName:  string
  contactPhone: string
  contactEmail: string | null
  unitName:     string
  projectName:  string
  agreedPrice:  number
  entries:      Entry[]
  generatedAt:  string
  referenceNo:  string
}

function formatKES(n: number): string {
  return `KES ${n.toLocaleString("en-KE")}`
}

function fmt(d: Date | string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-KE", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

export function StatementPDF({
  contactName,
  contactPhone,
  contactEmail,
  unitName,
  projectName,
  agreedPrice,
  entries,
  generatedAt,
  referenceNo,
}: Props) {
  const totalScheduled = entries.reduce((s, e) => s + e.amount, 0)
  const totalPaid      = entries.filter((e) => e.status === "PAID").reduce((s, e) => s + e.amount, 0)
  const outstanding    = totalScheduled - totalPaid

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Home Bridge Ltd.</Text>
            <Text style={styles.companyTagline}>Premium Real Estate · Nairobi, Kenya</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.docTitle}>Statement of Account</Text>
            <Text style={styles.docSub}>Ref: {referenceNo}</Text>
            <Text style={styles.docSub}>Generated: {generatedAt}</Text>
          </View>
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
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

        {/* Property */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Project</Text>
            <Text style={styles.value}>{projectName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Unit</Text>
            <Text style={styles.value}>{unitName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Agreed Price</Text>
            <Text style={styles.value}>{formatKES(agreedPrice)}</Text>
          </View>
        </View>

        {/* Ledger */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Ledger</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colNoH}>#</Text>
            <Text style={styles.colDescH}>Description</Text>
            <Text style={styles.colDueH}>Due Date</Text>
            <Text style={styles.colAmountH}>Amount</Text>
            <Text style={styles.colStatusH}>Status</Text>
            <Text style={styles.colPaidAtH}>Paid On</Text>
            <Text style={styles.colRefH}>Reference</Text>
          </View>

          {entries.map((entry, idx) => (
            <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.colNo}>{idx + 1}</Text>
              <Text style={styles.colDesc}>{entry.description}</Text>
              <Text style={styles.colDue}>{fmt(entry.dueDate)}</Text>
              <Text style={styles.colAmount}>{formatKES(entry.amount)}</Text>
              <Text style={styles.colStatus}>{entry.status}</Text>
              <Text style={styles.colPaidAt}>{fmt(entry.paidAt)}</Text>
              <Text style={styles.colRef}>{entry.paymentRef ?? "—"}</Text>
            </View>
          ))}

          {/* Summary */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Scheduled</Text>
              <Text style={styles.summaryValue}>{formatKES(totalScheduled)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={styles.summaryValue}>{formatKES(totalPaid)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Outstanding</Text>
              <Text style={[styles.summaryValue, { color: outstanding > 0 ? "#da3633" : "#2ea043" }]}>
                {formatKES(outstanding)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          This is a computer-generated statement. Home Bridge Ltd. · P.O Box 00100, Nairobi, Kenya
        </Text>
      </Page>
    </Document>
  )
}