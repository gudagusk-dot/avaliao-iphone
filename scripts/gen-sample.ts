import { generateManualPdf } from "../src/lib/pdf-manual";
import { writeFileSync } from "fs";
const bytes = await generateManualPdf({ storeName: "Loja Teste", accentHex: "#007AFF" });
writeFileSync("/tmp/qa/sample.pdf", bytes);
console.log("ok", bytes.length);
