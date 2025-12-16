import { DailyReport, UserProfile, SaleItem } from "../types";
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

  // Format date DD/MM/YY
  const dateObj = new Date(report.date);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = String(dateObj.getFullYear()).slice(-2);
  const dateStr = `${day}/${month}/${year}`;

  let text = `Name:${user.name}\n`;
  text += `Date: ${dateStr}\n`;
  text += `Store Location :${user.storeName}\n`;
  text += `Today’s Sale Value:= ${report.totalValue.toLocaleString()}\n`;
  text += `Today’s Sale qty=${report.totalQty}\n`;

  // Categorization Logic Helper
  const getQty = (keywords: string[]) => {
      return report.items.reduce((acc, item) => {
          const name = item.productName.toLowerCase();
          const matches = keywords.every(k => name.includes(k.toLowerCase()));
          return matches ? acc + item.quantity : acc;
      }, 0);
  };

  // Specific Categories Mapping based on PRODUCT_LIST
  const bajajMixerQty = getQty(['bajaj', 'mixer']) + getQty(['bajaj', 'mg']) + getQty(['bajaj', 'food processor']);
  const morphyMixerQty = getQty(['mr', 'mixer']) + getQty(['mr', 'mg']) + getQty(['mr', 'grind']) + getQty(['mr', 'food processor']);
  const storageGeyserQty = getQty(['storage', 'geyser']) + getQty(['water heater']);
  const instantGeyserQty = getQty(['instant', 'geyser']);
  const mrAirFryerQty = getQty(['air fryer']);
  const mrOtg60Qty = getQty(['otg', '60']);
  const mrOtg29Qty = getQty(['otg', '29']);
  const mrMicrowaveQty = getQty(['microwave']) + getQty(['20mws']); // 20MWS is a model code
  const bajajSteamIronQty = getQty(['bajaj', 'steam', 'iron']);
  const bajajDryIronQty = getQty(['bajaj', 'dry', 'iron']);
  const bajajInductionQty = getQty(['bajaj', 'induction']);
  const bajajSandwichQty = getQty(['bajaj', 'sandwich']);
  const bajajCoolerQty = getQty(['bajaj', 'cooler']) + getQty(['bajaj', 'air cooler']); // Adding cooler just in case, though not in list

  // Formatting Function to ensure 2 digits (e.g., 01, 05)
  const fmt = (num: number) => String(num).padStart(2, '0');

  text += `Bajaj Mixer Qty: =${fmt(bajajMixerQty)}\n`;
  text += `Morphy Mixer Qty: =${fmt(morphyMixerQty)}\n`;
  text += `Storage geyser Qty: ${fmt(storageGeyserQty)}\n`;
  text += `Instant geyser Qty: ${fmt(instantGeyserQty)}\n`;
  text += `MR Air fiyar=${fmt(mrAirFryerQty)}\n`;
  text += `MR. OTG 60ltr =${fmt(mrOtg60Qty)}\n`;
  text += `MR. OTG 29ltr = ${fmt(mrOtg29Qty)}\n`;
  text += `MR 20MWS = ${fmt(mrMicrowaveQty)}\n`;
  text += `Bajaj  setma  iron =${fmt(bajajSteamIronQty)}\n`;
  text += `Bajaj dry iron=${fmt(bajajDryIronQty)}\n`;
  text += `Bajaj induction${fmt(bajajInductionQty)}\n`;
  text += `Bajaj sandwich maker=${fmt(bajajSandwichQty)}\n`;
  text += `Bajaj collar=${fmt(bajajCoolerQty)}\n`;
  
  text += `MTD Sale Value = ${mtdValue.toLocaleString()}`;
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