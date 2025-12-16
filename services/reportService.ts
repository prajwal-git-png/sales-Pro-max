import { DailyReport, UserProfile } from "../types";
import { getSales } from "./storageService";

export const generateTextReport = (user: UserProfile, report: DailyReport) => {
  const allSales = getSales();
  
  // Calculate MTD
  const currentMonth = new Date(report.date).getMonth();
  const currentYear = new Date(report.date).getFullYear();
  
  const mtdValue = allSales
    .filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && d <= new Date(report.date);
    })
    .reduce((sum, s) => sum + s.totalValue, 0);

  const dateStr = new Date(report.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });

  let text = `Name: ${user.name}\n`;
  text += `Date: ${dateStr}\n`;
  text += `Store Location: ${user.storeName}\n\n`;
  text += `Today's Sale Value: = ₹${report.totalValue.toLocaleString()}\n`;
  text += `Today's Sale qty = ${report.totalQty}\n\n`;

  // Aggregate items by name to avoid duplicates in list if entered separately
  const aggregatedItems: Record<string, number> = {};
  report.items.forEach(item => {
      aggregatedItems[item.productName] = (aggregatedItems[item.productName] || 0) + item.quantity;
  });

  Object.entries(aggregatedItems).forEach(([name, qty]) => {
    text += `${name} Qty: = ${qty}\n`;
  });

  text += `\nMTD Sale Value = ₹${mtdValue.toLocaleString()}`;
  return text;
};

export const downloadCSV = (sales: DailyReport[]) => {
    const headers = ['Date', 'Product', 'Quantity', 'Unit Price', 'Total Value'];
    const rows: string[] = [];
    
    sales.forEach(report => {
        report.items.forEach(item => {
            rows.push([
                report.date,
                `"${item.productName}"`, // Escape quotes
                item.quantity.toString(),
                item.price.toString(),
                (item.quantity * item.price).toString()
            ].join(','));
        });
    });

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" + rows.join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
