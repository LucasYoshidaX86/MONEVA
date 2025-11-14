const admin = require("firebase-admin");
const fs = require("fs");
const csv = require("fast-csv");

// 🔥 1) ATUALIZE ESTE CAMINHO PARA SUA PASTA DO ONEDRIVE
const OUTPUT_DIR = "C:/Users/breno/OneDrive/MONEVA-ETL/";

// Caminhos finais dos CSVs
const pathUser = `${OUTPUT_DIR}DimUsuario.csv`;
const pathFato = `${OUTPUT_DIR}FatoTransacoes.csv`;

admin.initializeApp({
  credential: admin.credential.cert("./firebase-key.json")
});

const db = admin.firestore();

// Utilitários
function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate();
  return d.toISOString().slice(0, 10);
}

function year(ts) { return ts?.toDate().getFullYear() || ""; }
function month(ts) { return (ts?.toDate().getMonth() + 1) || ""; }
function yearMonth(ts) { return `${year(ts)}-${String(month(ts)).padStart(2, '0')}`; }

async function exportAll() {
  console.log("🔄 Lendo usuários...");
  const usersSnap = await db.collection("users").get();

  const users = [];
  const transactions = [];

  for (const u of usersSnap.docs) {
    const uid = u.id;
    const data = u.data();

    users.push({
      Uid: uid,
      Nome: data.displayName || "",
      PrimeiroNome: (data.displayName || "").split(" ")[0] || ""
    });

    console.log(`📌 Lendo transações de ${uid}...`);

    const txSnap = await db.collection(`users/${uid}/transactions`).get();

    txSnap.forEach(doc => {
      const t = doc.data();

      transactions.push({
        TransactionId: doc.id,
        Uid: uid,
        Data: formatDate(t.date),
        Ano: year(t.date),
        Mes: month(t.date),
        AnoMes: yearMonth(t.date),
        Tipo: t.tipo,
        Categoria: t.categoria,
        Meio: t.meio,
        Valor: String(t.valor).replace(",", "."),
        Deletada: t.deletedAt ? 1 : 0
      });
    });
  }

  console.log("📤 Gravando CSVs no OneDrive...");

  // 2) Garante que o diretório do OneDrive existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log("📁 Criando pasta MONEVA-ETL no OneDrive...");
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 3) Exporta DimUsuario.csv
  const usersCSV = fs.createWriteStream(pathUser);
  csv.write(users, { headers: true, delimiter: ";" }).pipe(usersCSV);

  // 4) Exporta FatoTransacoes.csv
  const txCSV = fs.createWriteStream(pathFato);
  csv.write(transactions, { headers: true, delimiter: ";" }).pipe(txCSV);

  console.log("✅ FINALIZADO! Arquivos enviados para OneDrive:");
  console.log(" → " + pathUser);
  console.log(" → " + pathFato);
}

exportAll();
