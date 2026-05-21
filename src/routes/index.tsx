import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { generateManualPdf, type BrandingInput } from "@/lib/pdf-manual";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gerador de Manual de Avaliação de iPhone" },
      {
        name: "description",
        content:
          "Personalize com o logo e o nome da sua loja e baixe o manual de avaliação de iPhone em PDF.",
      },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "iphone-manual-branding-v1";

function Index() {
  const [storeName, setStoreName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [phone, setPhone] = useState("");
  const [accent, setAccent] = useState("#007AFF");
  const [logoBytes, setLogoBytes] = useState<Uint8Array | undefined>();
  const [logoMime, setLogoMime] = useState<string | undefined>();
  const [logoPreview, setLogoPreview] = useState<string | undefined>();
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>();

  // Load saved branding (text only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setStoreName(v.storeName || "");
        setInstagram(v.instagram || "");
        setPhone(v.phone || "");
        setAccent(v.accent || "#007AFF");
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ storeName, instagram, phone, accent }),
    );
  }, [storeName, instagram, phone, accent]);

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/png|jpeg|jpg/i.test(f.type)) {
      alert("Use PNG ou JPG para o logo.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert("Logo até 5 MB.");
      return;
    }
    const buf = new Uint8Array(await f.arrayBuffer());
    setLogoBytes(buf);
    setLogoMime(f.type);
    setLogoPreview(URL.createObjectURL(f));
  }

  function removeLogo() {
    setLogoBytes(undefined);
    setLogoMime(undefined);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(undefined);
  }

  async function handleGenerate(includeBranding: boolean) {
    setGenerating(true);
    try {
      const input: BrandingInput = includeBranding
        ? {
            storeName: storeName || "Sua Loja",
            instagram: instagram || undefined,
            phone: phone || undefined,
            accentHex: accent,
            logoBytes,
            logoMime,
          }
        : { storeName: "Sua Loja", accentHex: "#007AFF" };

      const bytes = await generateManualPdf(input);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);

      // Trigger download too
      const a = document.createElement("a");
      a.href = url;
      const safe = (storeName || "manual").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.download = `manual-avaliacao-iphone-${safe}.pdf`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.002_247)]">
      {/* Header */}
      <header className="border-b border-[oklch(0.92_0.01_255)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg"
              style={{ background: accent }}
            />
            <div>
              <div className="text-sm font-semibold">Manual de Avaliação</div>
              <div className="text-xs text-[oklch(0.55_0.04_257)]">
                Personalize e baixe em PDF
              </div>
            </div>
          </div>
          <a
            href="https://apps.apple.com/fr/app/jcid-doctor/id6754861928"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[oklch(0.55_0.04_257)] hover:underline"
          >
            App JCID Doctor ↗
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Gerador do Manual de Avaliação de iPhone
        </h1>
        <p className="mt-2 max-w-2xl text-[oklch(0.45_0.04_257)]">
          Coloque o logo e o nome da sua loja e baixe o PDF personalizado.
          Sem cadastro, gerado direto no seu navegador.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* FORM */}
          <section className="rounded-2xl border border-[oklch(0.92_0.01_255)] bg-white p-6">
            <h2 className="text-lg font-semibold">Sua marca</h2>

            <div className="mt-5 space-y-5">
              {/* Logo */}
              <div>
                <label className="text-sm font-medium">Logo (PNG ou JPG)</label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-[oklch(0.85_0.01_255)] bg-[oklch(0.97_0.005_255)]">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="logo"
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-xs text-[oklch(0.55_0.04_257)]">Sem logo</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer rounded-lg bg-[oklch(0.2_0.04_265)] px-3 py-2 text-xs font-medium text-white hover:opacity-90">
                      Escolher arquivo
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={onLogoChange}
                      />
                    </label>
                    {logoPreview && (
                      <button
                        onClick={removeLogo}
                        className="text-xs text-[oklch(0.55_0.04_257)] hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Store name */}
              <Field
                label="Nome da loja"
                value={storeName}
                onChange={setStoreName}
                placeholder="Ex: iStore Curitiba"
              />

              {/* Instagram */}
              <Field
                label="Instagram (opcional)"
                value={instagram}
                onChange={setInstagram}
                placeholder="suaLoja"
              />

              {/* Phone */}
              <Field
                label="Telefone / WhatsApp (opcional)"
                value={phone}
                onChange={setPhone}
                placeholder="(41) 9 9999-9999"
              />

              {/* Accent */}
              <div>
                <label className="text-sm font-medium">Cor de destaque</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-[oklch(0.85_0.01_255)]"
                  />
                  <input
                    type="text"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="rounded-lg border border-[oklch(0.85_0.01_255)] bg-white px-3 py-2 text-sm w-32"
                  />
                  <button
                    onClick={() => setAccent("#007AFF")}
                    className="text-xs text-[oklch(0.55_0.04_257)] hover:underline"
                  >
                    Padrão Apple
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => handleGenerate(true)}
                disabled={generating}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                style={{ background: accent }}
              >
                {generating ? "Gerando…" : "Baixar PDF personalizado"}
              </button>
              <button
                onClick={() => handleGenerate(false)}
                disabled={generating}
                className="text-xs text-[oklch(0.55_0.04_257)] hover:underline disabled:opacity-50"
              >
                Baixar versão padrão sem logo
              </button>
            </div>
          </section>

          {/* PREVIEW */}
          <section className="rounded-2xl border border-[oklch(0.92_0.01_255)] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pré-visualização</h2>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[oklch(0.55_0.04_257)] hover:underline"
                >
                  Abrir em nova aba ↗
                </a>
              )}
            </div>

            {/* Mock cover preview */}
            <div className="mt-4 overflow-hidden rounded-xl border border-[oklch(0.92_0.01_255)] bg-white shadow-sm">
              <div
                className="flex h-28 items-center justify-between px-6"
                style={{ background: accent }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="max-h-14 object-contain" />
                ) : (
                  <div className="rounded border border-white/60 px-4 py-2 text-xs text-white">
                    SEU LOGO
                  </div>
                )}
                <div className="text-right text-white">
                  <div className="text-base font-semibold">
                    {storeName || "Sua Loja"}
                  </div>
                </div>
              </div>
              <div className="px-6 py-8">
                <div className="text-2xl font-semibold">Manual de Avaliação</div>
                <div className="text-2xl font-semibold" style={{ color: accent }}>
                  de iPhone
                </div>
                <p className="mt-2 text-sm text-[oklch(0.55_0.04_257)]">
                  Guia rápido para o cliente gravar o vídeo e rodar os testes.
                </p>
                <div className="mt-6 rounded-lg bg-[oklch(0.97_0.005_255)] p-4 text-xs text-[oklch(0.45_0.04_257)]">
                  <div>Cliente: ___________________________</div>
                  <div className="mt-1">Modelo: ___________________________</div>
                  <div className="mt-1">IMEI: _____________________________</div>
                  <div className="mt-1">Data: _____________________________</div>
                </div>
              </div>
            </div>

            {pdfUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-[oklch(0.92_0.01_255)]">
                <iframe
                  src={pdfUrl}
                  className="h-[500px] w-full"
                  title="Preview PDF"
                />
              </div>
            )}

            <div className="mt-6 text-xs text-[oklch(0.55_0.04_257)]">
              <strong className="text-[oklch(0.2_0.04_265)]">O que tem no PDF:</strong> capa
              personalizada · como usar · roteiro de vídeo com diagramas do iPhone · diagrama
              dos botões físicos · checklist estético · testes via JCID Doctor · desativar o
              Buscar.
            </div>
          </section>
        </div>

        <footer className="mt-12 border-t border-[oklch(0.92_0.01_255)] pt-6 text-center text-xs text-[oklch(0.55_0.04_257)]">
          Gerado no seu navegador. Nada é enviado para servidores.
        </footer>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-[oklch(0.85_0.01_255)] bg-white px-3 py-2 text-sm outline-none focus:border-[oklch(0.55_0.15_250)]"
      />
    </div>
  );
}
