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
  const [showPromo, setShowPromo] = useState(false);

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
      
      // Show promo popup
      setShowPromo(true);
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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-6xl">
            <span className="sm:hidden">Manual de Avaliação</span>
            <span className="hidden sm:inline">O manual de avaliação <br/></span>
            <span className="block bg-clip-text text-transparent sm:inline" style={{ backgroundImage: `linear-gradient(to right, ${accent}, #000)` }}>
              no padrão Apple.
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-500 sm:mt-6 sm:text-lg">
            <span className="sm:hidden">Personalize e baixe seu PDF.</span>
            <span className="hidden sm:inline">Personalize o seu guia de troca com o logo da sua loja. Design minimalista, profissional e focado na conversão de vendas.</span>
          </p>
        </div>


        <div className="mt-6 grid gap-6 sm:mt-10 sm:gap-8 lg:grid-cols-[1fr_1fr]">
          {/* FORM */}
          <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold">Sua marca</h2>
            <p className="mt-1 text-sm text-neutral-400">Personalize a identidade do seu manual.</p>

            <div className="mt-8 space-y-6">
              {/* Logo */}
              <div>
                <label className="text-sm font-semibold text-neutral-700">Logo da Loja</label>
                <div className="mt-3 flex items-center gap-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-neutral-100 bg-neutral-50 shadow-inner">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="logo"
                        className="max-h-full max-w-full object-contain p-3"
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-8 w-8 fill-neutral-200">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="group relative flex cursor-pointer items-center justify-center rounded-xl bg-black px-4 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800">
                      <span>Trocar Logo</span>
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
                        className="text-xs font-semibold text-red-500 hover:text-red-600"
                      >
                        Remover Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Store name */}
              <Field
                label="Nome da Empresa"
                value={storeName}
                onChange={setStoreName}
                placeholder="Ex: Apple Curitiba"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Instagram"
                  value={instagram}
                  onChange={setInstagram}
                  placeholder="@sualoja"
                />
                <Field
                  label="WhatsApp"
                  value={phone}
                  onChange={setPhone}
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* Accent */}
              <div>
                <label className="text-sm font-semibold text-neutral-700">Cor de Destaque</label>
                <div className="mt-3 flex items-center gap-4">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-neutral-200">
                    <input
                      type="color"
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="absolute inset-[-50%] h-[200%] w-[200%] cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="w-32 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-black/5"
                  />
                  <button
                    onClick={() => setAccent("#007AFF")}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Resetar
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4">
              <button
                onClick={() => handleGenerate(true)}
                disabled={generating}
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-black py-4 text-sm font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                {generating ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Gerando PDF...
                  </span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                    Gerar Manual Profissional
                  </>
                )}
              </button>
              <button
                onClick={() => handleGenerate(false)}
                disabled={generating}
                className="text-xs font-bold text-neutral-400 transition hover:text-neutral-600"
              >
                Gerar versão genérica (sem logo)
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
                <div className="mx-auto my-10 flex h-64 w-32 flex-col items-center rounded-[1.5rem] border-4 p-1.5 shadow-xl transition-transform hover:scale-105" style={{ borderColor: accent }}>
                  <div className="h-2 w-10 rounded-full bg-neutral-900 mt-2 mb-1" />
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

        <footer className="mt-12 border-t border-neutral-200/50 pt-6 text-center text-xs text-neutral-400">
          Gerado no seu navegador. Nada é enviado para servidores.
        </footer>
      </main>

      {/* PROMO POPUP */}
      {showPromo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/20 animate-in fade-in duration-300">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowPromo(false)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </button>
            
            <div className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-black shadow-lg">
                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.38 17 4.1 11.2 7 8.3c1.4-1.4 3-1.6 4.3-1.1 1.2.4 2.1.4 3.3 0 1.1-.5 2.8-.8 4 .8-2.6 1.8-2.1 5.4.5 6.4-1.1 2.5-2.2 4.1-2.05 5.88M12.03 7.25c-.1 0-.1 0 0 0 2.22-.27 3.34-1.9 3.14-3.5-1.93.12-3.3 1.6-3.14 3.5" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold tracking-tight text-neutral-900">
                Sua loja Apple pode lucrar muito mais!
              </h3>
              
              <p className="mt-4 text-neutral-500 text-sm leading-relaxed">
                Mais conteúdos e ferramentas para a sua loja Apple, você encontra na comunidade.
              </p>
              
              <div className="mt-6 inline-block rounded-full bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-900">
                A partir de <span className="text-blue-600 font-extrabold">R$97 por mês</span>
              </div>
              
              <div className="mt-8 flex flex-col gap-3">
                <a
                  href="https://www.comunidademacalucrativa.com.br/"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-black py-4 text-sm font-bold text-white shadow-xl transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Conhecer a Comunidade
                </a>
                <button
                  onClick={() => setShowPromo(false)}
                  className="text-xs font-bold text-neutral-400 hover:text-neutral-600 transition"
                >
                  Continuar no site
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
