// Eklenti kaynağını geçici dizine kopyalar ve port.js yazar.
// Kaynak klasör (test-yolu/eklenti-mv2, eklenti-mv3) ASLA kirletilmez.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

export const TEST_YOLU_KOK = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

export async function eklentiHazirla({ manifest, port, aday }) {
  const kaynak = path.join(TEST_YOLU_KOK, `eklenti-${manifest}`);
  const hedef = await fs.mkdtemp(
    path.join(os.tmpdir(), `sayac-ekl-${aday}-${manifest}-`)
  );
  await fs.cp(kaynak, hedef, { recursive: true });
  await fs.writeFile(
    path.join(hedef, "port.js"),
    `var SUNUCU = "http://127.0.0.1:${port}";\n` +
      `var ADAY = "${aday}";\n` +
      `var MANIFEST = "${manifest}";\n`,
    "utf8"
  );
  return hedef;
}

// Her koşu kendi tek kullanımlık profiliyle koşar (Mustafa'nın profiline dokunulmaz).
export async function gecici(etiket) {
  return await fs.mkdtemp(path.join(os.tmpdir(), `sayac-${etiket}-`));
}

export async function sil(dizin) {
  try {
    await fs.rm(dizin, { recursive: true, force: true, maxRetries: 3 });
  } catch {
    /* geçici dizin — silinemezse tur çürümez */
  }
}
