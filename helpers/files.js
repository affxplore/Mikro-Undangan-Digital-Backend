import fs from "fs/promises";
import path from "path";

export async function safeUnlink(absPath) {
    try { await fs.unlink(absPath); } catch { /* ignore */ }
}


export function buildPublicUrl(newRel) {
    const app = (process.env.APP_URL || "").replace(/\/+$/, ""); // trim trailing /
    const rel = newRel.startsWith("/") ? newRel : `/${newRel}`;
    const staticPrefix = (process.env.STATIC_PREFIX ?? "/public").replace(/\/+$/, "");
    // kalau STATIC_PREFIX kosong (""), jangan sisipkan slash dobel
    return staticPrefix
      ? `${app}${staticPrefix}${rel}`      // contoh: http://localhost:2222/public/uploads/...
      : `${app}${rel}`;                    // contoh: http://localhost:2222/uploads/...
}
  
// export function relFromPublic(absPath) {
//     const rel = path.relative(path.join(process.cwd(), "public"), absPath);
//     return "/" + rel.replace(/\\/g, "/");
// }

export function relFromPublic(absPath) {
    // Mengecek jika path tidak valid
    if (!absPath || typeof absPath !== 'string') {
        return null;
    }
    const rel = path.relative(path.join(process.cwd(), "public"), absPath);
    // Mengganti backslash (\) dengan slash (/) dan memastikan diawali dengan /
    return "/" + rel.replace(/\\/g, "/");
}




  
  export  function toBool(v) {
    if (typeof v === "boolean") return v;
    if (v === "true" || v === "1" || v === 1) return true;
    if (v === "false" || v === "0" || v === 0 || v === "" || v == null) return false;
    return Boolean(v);
  }