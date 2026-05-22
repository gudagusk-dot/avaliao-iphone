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
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black shadow-lg">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.38 17 4.1 11.2 7 8.3c1.4-1.4 3-1.6 4.3-1.1 1.2.4 2.1.4 3.3 0 1.1-.5 2.8-.8 4 .8-2.6 1.8-2.1 5.4.5 6.4-1.1 2.5-2.2 4.1-2.05 5.88M12.03 7.25c-.1 0-.1 0 0 0 2.22-.27 3.34-1.9 3.14-3.5-1.93.12-3.3 1.6-3.14 3.5" />
              </svg>
            </div>
            <div>
              <div className="text-base font-bold tracking-tight">iPhone Manual Pro</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">
                Avaliação Profissional
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://apps.apple.com/fr/app/jcid-doctor/id6754861928"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-neutral-600 transition hover:text-black"
            >
              JCID Doctor ↗
            </a>
            <div 
              className="h-2 w-2 rounded-full animate-pulse" 
              style={{ background: accent }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-neutral-950 sm:text-6xl">
            O manual de avaliação <br/>
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${accent}, #000)` }}>
              no padrão Apple.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-500">
            Personalize o seu guia de troca com o logo da sua loja. 
            Design minimalista, profissional e focado na conversão de vendas.
          </p>
        </div>

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
            <div className="mt-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl transition-all hover:shadow-3xl">
              <div className="relative flex h-32 items-center justify-center bg-neutral-50 p-6">
                 {logoPreview ? (
                  <img src={logoPreview} alt="" className="max-h-16 object-contain" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-200 text-[10px] font-bold text-neutral-400">
                    LOGO
                  </div>
                )}
                <div className="absolute top-4 right-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  {storeName || "Sua Loja"}
                </div>
              </div>
              <div className="px-8 py-10 text-center">
                <div className="text-3xl font-bold tracking-tight">Manual de Avaliação</div>
                <div className="text-3xl font-bold tracking-tight" style={{ color: accent }}>
                  de iPhone
                </div>
                
                {/* Minimalist iPhone Frame Mock */}
                <div className="mx-auto my-10 flex h-64 w-32 flex-col items-center rounded-[2.5rem] border-4 p-1.5 shadow-xl transition-transform hover:scale-105" style={{ borderColor: accent }}>
                  <div className="h-3 w-12 rounded-full bg-neutral-900 mt-2 mb-1" />
                  <div className="mt-auto h-1 w-10 rounded-full bg-neutral-200 mb-2" />
                </div>

                <p className="text-sm font-medium text-neutral-400">
                  Guia oficial para avaliação e troca
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3 text-left">
                  <div className="rounded-xl bg-neutral-50 p-3">
                    <div className="text-[10px] font-bold text-neutral-300 uppercase">Cliente</div>
                    <div className="h-4 w-full border-b border-neutral-200" />
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-3">
                    <div className="text-[10px] font-bold text-neutral-300 uppercase">Modelo</div>
                    <div className="h-4 w-full border-b border-neutral-200" />
                  </div>
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
