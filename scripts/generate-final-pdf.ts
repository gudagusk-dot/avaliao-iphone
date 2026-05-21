
import { PDFDocument, StandardFonts } from "pdf-lib";
import { generateManualPdf } from "../src/lib/pdf-manual";
import { writeFileSync } from "fs";

async function main() {
  const bytes = await generateManualPdf({
    storeName: "Sua Loja",
    accentHex: "#007AFF"
  });
  writeFileSync("public/manual-avaliacao-iphone.pdf", bytes);
  console.log("PDF gerado em public/manual-avaliacao-iphone.pdf");
}

main().catch(console.error);
