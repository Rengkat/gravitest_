export const getMasteryColor = (level: string) => {
  switch (level) {
    case "expert":
      return "text-purple-600 bg-purple-100";
    case "advanced":
      return "text-blue-600 bg-blue-100";
    case "intermediate":
      return "text-green-600 bg-green-100";
    default:
      return "text-orange-600 bg-orange-100";
  }
};

export const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
};

export const exportToPDF = () => {
  // In production, use a library like jsPDF or html2pdf
  console.log("Exporting to PDF...");
  alert("PDF export would be implemented with a library like jsPDF");
};

export const exportToCSV = () => {
  console.log("Exporting to CSV...");
  alert("CSV export would generate downloadable CSV file");
};

export const shareReport = () => {
  console.log("Sharing report...");
  alert("Share functionality would open share dialog");
};

export const printReport = () => {
  window.print();
};
