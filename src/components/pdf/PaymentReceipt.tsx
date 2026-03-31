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
  },
  header: {
    borderBottom:  "2px solid #1f6feb",
    paddingBottom: 14,
    marginBottom:  24,
    flexDirection: "row",
    justifyContent:"space-between",
    alignItems:    "flex-end",
  },
  companyName: {
    fontSize:   16,
    fontFamily: "Helvetica-Bold",
    color:      "#1f6feb",
  },
  tagline: { fontSize: 9, color: "#666", marginTop: 2 },
  receiptTitle: {
    fontSize:   18,
    fontFamily: "Helvetica-Bold",
    color:      "#1a1a1a",
  },
  refLine: { fontSize: 10, color: "#666", marginTop: 2 },
  stamp: {
    textAlign:       "center",
    border:          "2px solid #2ea043",
    borderRadius:    4,
    padding:         "10 20",
    marginVertical:  24,
    backgroundColor: "#f0fdf4",
  },
  stampText: {
    fontSize:   20,
    fontFamily: "Helvetica-Bold",
    color:      "#2ea043",
  },
  stampSub: { fontSize: 9, color: "#2ea043", marginTop: 2 },
  section:  { marginBottom: 20 },
  sectionTitle: {
    fontSize:      9,
    fontFamily:    "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color:         "#555",
    marginBottom:  8,
    borderBottom:  "1px solid #eee",
    paddingBottom: 4,
  },
  row:   { flexDirection: "row", marginBottom: 5 },
  label: { width: 140, fontSize: 10, color: "#555" },
  value: { flex: 1, fontSize: 10, fontFamily: "Helvetica-Bold" },
  amountBox: {
    backgroundColor: "#f0f6ff",
    borderRadius:    4,
    padding:         "12 16",
    marginTop:       8,
    flexDirection:   "row",
    justifyContent:  "space-between",
    alignItems:      "center",
  },
  amountLabel: { fontSize: 12, color: "#1f6feb" },
  amountValue: {
    fontSize:   20,
    fontFamily: "Helvetica-Bold",
    color:      "#1f6feb",
  },
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

type Props = {
  contactName:  string
  contactPhone: string
  unitName:     string
  projectName:  string
  description:  string
  amount:       number
  paidAt:       Date | string
  paymentRef:   string
  receiptNo:    string
}

function formatKES(n: number): string {
  return `KES ${n.toLocaleString("en-KE")}`
}

function fmt(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-KE", {
    day: "2-digit", month: "long", year: "numeric",
  })
}

export function PaymentReceiptPDF({
  contactName,
  contactPhone,
  unitName,
  projectName,
  description,
  amount,
  paidAt,
  paymentRef,
  receiptNo,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Lifestyle Properties Ltd.</Text>
            <Text style={styles.tagline}>Premium Real Estate · Nairobi, Kenya</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.receiptTitle}>Payment Receipt</Text>
            <Text style={styles.refLine}>Receipt No: {receiptNo}</Text>
            <Text style={styles.refLine}>Date: {fmt(paidAt)}</Text>
          </View>
        </View>

        {/* PAID stamp */}
        <View style={styles.stamp}>
          <Text style={styles.stampText}>PAYMENT RECEIVED</Text>
          <Text style={styles.stampSub}>This receipt confirms payment has been received</Text>
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Received From</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{contactName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{contactPhone}</Text>
          </View>
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
        </View>

        {/* Payment details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{description}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Reference</Text>
            <Text style={styles.value}>{paymentRef}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date</Text>
            <Text style={styles.value}>{fmt(paidAt)}</Text>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount Paid</Text>
            <Text style={styles.amountValue}>{formatKES(amount)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          This is a computer-generated receipt and requires no signature.
          Lifestyle Properties Ltd. · P.O Box 00100, Nairobi, Kenya
        </Text>
      </Page>
    </Document>
  )
}