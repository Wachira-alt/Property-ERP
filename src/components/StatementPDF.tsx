"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1e293b" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  logoText: { fontSize: 28, fontWeight: "bold", color: "#0f172a", letterSpacing: -0.5 },
  docType: { fontSize: 10, color: "#3b82f6", textTransform: "uppercase", letterSpacing: 1, marginTop: 4, fontWeight: "bold" },
  infoBox: { backgroundColor: "#f8fafc", padding: 15, borderRadius: 8, flexDirection: "row", justifyContent: "space-between", marginBottom: 20, border: "1px solid #e2e8f0" },
  infoLabel: { fontSize: 8, color: "#64748b", textTransform: "uppercase", marginBottom: 4, fontWeight: "bold" },
  infoValue: { fontSize: 12, fontWeight: "bold", color: "#0f172a" },
  progressBox: { backgroundColor: "#0f172a", padding: 20, borderRadius: 8, marginBottom: 30 },
  progressGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  progressLabel: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4, fontWeight: "bold" },
  progressValue: { fontSize: 18, fontWeight: "bold", color: "#ffffff" },
  progressValueGreen: { fontSize: 18, fontWeight: "bold", color: "#34d399" },
  
  // Section Headers
  sectionHeader: { fontSize: 14, fontWeight: "bold", color: "#0f172a", borderBottom: "2px solid #e2e8f0", paddingBottom: 6, marginBottom: 10, marginTop: 10 },
  
  // Table Styles
  row: { flexDirection: "row", borderBottom: "1px solid #f1f5f9", paddingVertical: 8, alignItems: "center" },
  col1: { width: "20%", color: "#64748b", fontSize: 9 },
  col2: { width: "40%", fontWeight: "bold", color: "#0f172a", fontSize: 10 },
  col3: { width: "20%", textAlign: "right", fontWeight: "bold", fontSize: 10 },
  col4: { width: "20%", textAlign: "right", fontSize: 9, fontWeight: "bold" },

  textGreen: { color: "#16a34a" },
  textRed: { color: "#dc2626" },
  textAmber: { color: "#ea580c" },
  textBlue: { color: "#2563eb" },
  
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: 15 }
});

export const StatementPDF = ({ client, entries }: { client: any; entries: any[] }) => {
  const totalBilled = entries.filter(e => e.type === "INVOICE").reduce((s, e) => s + Number(e.amount), 0);
  const totalPayments = entries.filter(e => e.type === "PAYMENT" && e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
  const totalRefunds = entries.filter(e => e.type === "REFUND" && e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
  const netPaid = totalPayments - totalRefunds;
  const currentBalance = totalBilled - netPaid;

  const invoices = entries.filter(e => e.type === "INVOICE").sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());
  const transactions = entries.filter(e => e.type !== "INVOICE").sort((a, b) => new Date(a.paidDate || a.createdAt).getTime() - new Date(b.paidDate || b.createdAt).getTime());

  // Waterfall Math for Invoices
  let remainingCash = netPaid;
  const invoiceStatuses = invoices.map(inv => {
    const amount = Number(inv.amount);
    const filled = Math.min(Math.max(remainingCash, 0), amount);
    remainingCash -= amount;
    if (filled >= amount) return { status: "CLEARED", filled, amount };
    if (filled > 0) return { status: "PARTIAL", filled, amount };
    return { status: "PENDING", filled, amount };
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>Property Pilot</Text>
            <Text style={styles.docType}>Official Account Statement</Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={styles.infoLabel}>Date Printed</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        {/* CLIENT DETAILS */}
        <View style={styles.infoBox}>
          <View>
            <Text style={styles.infoLabel}>Client Name</Text>
            <Text style={styles.infoValue}>{client.name}</Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={styles.infoLabel}>Property Details</Text>
            <Text style={styles.infoValue}>{client.projectName} — Unit {client.unit}</Text>
          </View>
        </View>

        {/* PROGRESS DASHBOARD */}
        <View style={styles.progressBox}>
          <View style={styles.progressGrid}>
            <View>
              <Text style={styles.progressLabel}>Total Property Value</Text>
              <Text style={styles.progressValue}>KSh {totalBilled.toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.progressLabel}>Amount Paid</Text>
              <Text style={styles.progressValueGreen}>KSh {netPaid.toLocaleString()}</Text>
            </View>
            <View style={{ textAlign: "right" }}>
              <Text style={styles.progressLabel}>Remaining Balance</Text>
              <Text style={styles.progressValue}>KSh {currentBalance.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* SECTION 1: PAYMENT SCHEDULE */}
        <Text style={styles.sectionHeader}>Payment Schedule</Text>
        <View style={{ marginBottom: 20 }}>
          {invoices.map((inv, index) => {
            const state = invoiceStatuses[index];
            return (
              <View key={inv.id} style={styles.row}>
                <Text style={styles.col1}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "N/A"}</Text>
                <Text style={styles.col2}>{inv.reference}</Text>
                <Text style={styles.col3}>KSh {Number(inv.amount).toLocaleString()}</Text>
                
                <Text style={[
                  styles.col4, 
                  state.status === "CLEARED" ? styles.textGreen : state.status === "PARTIAL" ? styles.textBlue : styles.textAmber
                ]}>
                  {state.status === "CLEARED" && "CLEARED"}
                  {state.status === "PARTIAL" && `${state.filled.toLocaleString()} / ${state.amount.toLocaleString()} PAID`}
                  {state.status === "PENDING" && "PENDING"}
                </Text>
              </View>
            );
          })}
        </View>

        {/* SECTION 2: RECEIPTS & HISTORY */}
        <Text style={styles.sectionHeader}>Receipts & History</Text>
        <View>
          {transactions.length === 0 && <Text style={{ fontSize: 9, color: "#64748b", marginTop: 10 }}>No payments recorded.</Text>}
          {transactions.map((entry, index) => {
            const isPayment = entry.type === "PAYMENT";
            const displayDate = entry.paidDate || entry.createdAt;
            return (
              <View key={entry.id} style={styles.row}>
                <Text style={styles.col1}>{new Date(displayDate).toLocaleDateString()}</Text>
                <Text style={styles.col2}>{entry.reference || entry.type}</Text>
                <Text style={[styles.col3, isPayment ? styles.textGreen : styles.textRed]}>
                  {isPayment ? "+" : "-"} KSh {Number(entry.amount).toLocaleString()}
                </Text>
                <Text style={[styles.col4, { color: "#64748b" }]}>{entry.status}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.footer}>
          This is an official computer-generated document by Property Pilot ERP. For inquiries, please contact your sales agent.
        </Text>
      </Page>
    </Document>
  );
};