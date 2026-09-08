import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Copy, 
  Check, 
  Download, 
  Image as ImageIcon, 
  Sparkles, 
  Sun, 
  Moon, 
  Terminal 
} from 'lucide-react';
import { NeuSelect } from './NeuSelect';
import { useToast } from '../context/ToastContext';

export const ImageToMatrixConverter: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [matrixText, setMatrixText] = useState<string>('');
  const [width, setWidth] = useState<number>(64);
  const [threshold, setThreshold] = useState<number>(128);
  const [invert, setInvert] = useState<boolean>(false);
  const [charMode, setCharMode] = useState<'binary' | 'custom_word' | 'ascii_density' | 'matrix_chars'>('binary');
  const [customWord, setCustomWord] = useState<string>('01');
  const [colorTheme, setColorTheme] = useState<'green' | 'cyan' | 'amber' | 'white'>('green');
  const [copied, setCopied] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { showToast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WebP)!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        showToast('Đã tải ảnh lên! Đang chuyển đổi sang mã nhị phân 01...', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const processImageToMatrix = () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Character aspect ratio compensation (terminal characters are taller than wide, approx 0.5 ratio)
      const aspect = img.height / img.width;
      const targetWidth = Math.max(20, Math.min(140, width));
      const targetHeight = Math.round(targetWidth * aspect * 0.52);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw and scale image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const pixels = imgData.data;

      let result = '';
      let wordIdx = 0;
      const wordClean = customWord.trim() || '01';

      const asciiRamp = '@%#*+=-:. ';

      for (let y = 0; y < targetHeight; y++) {
        let line = '';
        for (let x = 0; x < targetWidth; x++) {
          const idx = (y * targetWidth + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const a = pixels[idx + 3];

          // Transparent pixels treat as dark or space
          if (a < 30) {
            line += ' ';
            continue;
          }

          // Grayscale luminance (Perceived brightness formula)
          let luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          if (invert) luminance = 255 - luminance;

          if (charMode === 'binary') {
            line += luminance >= threshold ? '1' : '0';
          } else if (charMode === 'custom_word') {
            if (luminance >= threshold) {
              line += wordClean[wordIdx % wordClean.length];
              wordIdx++;
            } else {
              line += ' ';
            }
          } else if (charMode === 'ascii_density') {
            const rampIdx = Math.floor((luminance / 256) * asciiRamp.length);
            line += asciiRamp[Math.min(asciiRamp.length - 1, rampIdx)];
          } else if (charMode === 'matrix_chars') {
            if (luminance >= threshold) {
              const matrixPool = '01日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';
              line += matrixPool[Math.floor(Math.random() * matrixPool.length)];
            } else {
              line += ' ';
            }
          }
        }
        result += line + '\n';
      }

      setMatrixText(result);
      setIsProcessing(false);
    };
  };

  useEffect(() => {
    if (imageSrc) {
      processImageToMatrix();
    }
  }, [imageSrc, width, threshold, invert, charMode, customWord]);

  const handleCopy = () => {
    if (!matrixText) return;
    navigator.clipboard.writeText(matrixText);
    setCopied(true);
    showToast('Đã sao chép toàn bộ chuỗi Matrix 01 vào Clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!matrixText) return;
    const blob = new Blob([matrixText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matrix-art-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải file Matrix Art (.txt)!', 'success');
  };

  const handleDownloadHtml = () => {
    if (!matrixText) return;
    const themeColor = colorTheme === 'green' ? '#00ff88' : colorTheme === 'cyan' ? '#00e5ff' : colorTheme === 'amber' ? '#ffb700' : '#ffffff';
    const htmlPage = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cyber Matrix 01 Art</title>
  <style>
    body {
      background-color: #050811;
      color: ${themeColor};
      font-family: 'Courier New', Courier, monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-shadow: 0 0 8px ${themeColor};
    }
    pre {
      font-size: 11px;
      line-height: 1.15;
      letter-spacing: 1px;
      white-space: pre;
    }
  </style>
</head>
<body>
  <pre>${matrixText}</pre>
</body>
</html>`;
    const blob = new Blob([htmlPage], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matrix-glowing-art-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải trang web Matrix HTML phát sáng!', 'success');
  };

  const getThemeClasses = () => {
    switch (colorTheme) {
      case 'green': return 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]';
      case 'cyan': return 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]';
      case 'amber': return 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]';
      case 'white': return 'text-slate-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]';
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl neu-flat space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--shadow-dark)]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)]">
                Chuyển Đổi Ảnh Thành Mã Nhị Phân 01 & Matrix Art
              </h3>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full neu-inset-sm text-[var(--primary)] font-semibold whitespace-nowrap shrink-0 inline-flex items-center">
                100% Client Privacy
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Tải bất kỳ ảnh nào sang chuỗi nhị phân 01, Matrix Hacker hoặc chữ nghệ thuật thời gian thực.
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl neu-primary text-white text-xs font-semibold transition-all active:scale-[0.97] hover:-translate-y-0.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Chọn ảnh từ máy của bạn</span>
          </button>
        </div>
      </div>

      {/* Control Sliders & Options */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl neu-inset text-xs">
        {/* Width / Resolution Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-bold text-[var(--text-main)]">
            <span>Độ phân giải (Độ rộng):</span>
            <span className="font-mono text-[var(--primary)]">{width} ký tự</span>
          </div>
          <input
            type="range"
            min="24"
            max="120"
            step="2"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
            className="w-full accent-[var(--primary)] cursor-pointer"
          />
        </div>

        {/* Threshold / Contrast Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-bold text-[var(--text-main)]">
            <span>Ngưỡng tương phản:</span>
            <span className="font-mono text-[var(--primary)]">{threshold}</span>
          </div>
          <input
            type="range"
            min="30"
            max="225"
            step="1"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value))}
            className="w-full accent-[var(--primary)] cursor-pointer"
          />
        </div>

        {/* Character Mode Selection */}
        <div className="space-y-1.5">
          <label className="font-bold text-[var(--text-main)] block text-xs">Kiểu ký tự Matrix:</label>
          <NeuSelect
            value={charMode}
            onChange={(val) => setCharMode(val as any)}
            options={[
              { value: 'binary', label: 'Số nhị phân thuần (0 và 1)' },
              { value: 'custom_word', label: 'Tùy biến chữ (VD: HIẾU, LOVE)' },
              { value: 'matrix_chars', label: 'Ký tự Matrix Hacker (01 & Katakana)' },
              { value: 'ascii_density', label: 'Độ bóng ASCII (@%#*+=-:.)' },
            ]}
            size="md"
            variant="flat"
            searchable={false}
            fullWidth={true}
          />
        </div>

        {/* Color Theme & Invert */}
        <div className="space-y-1.5">
          <label className="font-bold text-[var(--text-main)] block">Tông màu hiển thị:</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setColorTheme('green')}
              className={`w-5 h-5 rounded-full bg-emerald-500 border ${colorTheme === 'green' ? 'ring-2 ring-[var(--text-main)]' : 'border-transparent'}`}
              title="Matrix Green"
            />
            <button
              onClick={() => setColorTheme('cyan')}
              className={`w-5 h-5 rounded-full bg-cyan-400 border ${colorTheme === 'cyan' ? 'ring-2 ring-[var(--text-main)]' : 'border-transparent'}`}
              title="Cyber Cyan"
            />
            <button
              onClick={() => setColorTheme('amber')}
              className={`w-5 h-5 rounded-full bg-amber-400 border ${colorTheme === 'amber' ? 'ring-2 ring-[var(--text-main)]' : 'border-transparent'}`}
              title="Amber Gold"
            />
            <button
              onClick={() => setColorTheme('white')}
              className={`w-5 h-5 rounded-full bg-zinc-100 border ${colorTheme === 'white' ? 'ring-2 ring-[var(--text-main)]' : 'border-transparent'}`}
              title="Classic White"
            />

            <button
              onClick={() => setInvert(!invert)}
              className={`ml-auto px-3 py-1.5 rounded-xl neu-btn text-[11px] font-semibold flex items-center gap-1 transition-all ${
                invert ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {invert ? <Moon className="w-3 h-3 text-[var(--primary)]" /> : <Sun className="w-3 h-3" />}
              <span>Đảo ngược</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Word Input (if selected) */}
      {charMode === 'custom_word' && (
        <div className="flex items-center gap-3 p-4 rounded-2xl neu-flat animate-fade-in">
          <span className="text-xs font-bold text-[var(--text-main)]">Nhập từ/tên muốn lặp vào ảnh:</span>
          <input
            type="text"
            value={customWord}
            onChange={(e) => setCustomWord(e.target.value)}
            placeholder="VD: HIẾU, EM_YÊU, 01..."
            className="p-2 px-3 rounded-xl neu-inset bg-transparent text-xs font-mono text-[var(--primary)] font-bold focus:outline-none"
          />
        </div>
      )}

      {/* Main Preview Screen */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5 font-bold">
            <Terminal className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Màn Hình Ma Trận Ký Tự Nhị Phân 01</span>
          </div>

          {matrixText && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadHtml}
                className="px-3 py-1.5 rounded-xl text-xs font-mono neu-btn text-[var(--text-main)] hover:text-[var(--primary)] transition-all flex items-center gap-1.5 font-semibold"
                title="Tải trang web Matrix phát sáng"
              >
                <Download className="w-3 h-3" />
                <span>Xuất HTML</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="px-3 py-1.5 rounded-xl text-xs font-mono neu-btn text-[var(--text-main)] hover:text-[var(--primary)] transition-all flex items-center gap-1.5 font-semibold"
              >
                <Download className="w-3 h-3" />
                <span>Tải .TXT</span>
              </button>

              <button
                onClick={handleCopy}
                className="px-3.5 py-1.5 rounded-xl neu-primary text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép Matrix 01'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Terminal Screen Box */}
        <div className="rounded-3xl bg-zinc-950 neu-inset p-5 min-h-[360px] flex items-center justify-center overflow-x-auto shadow-inner">
          {isProcessing ? (
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>Đang tính toán pixel sang ma trận nhị phân...</span>
            </div>
          ) : matrixText ? (
            <pre 
              className={`font-mono text-[10px] sm:text-[11px] leading-[1.12] tracking-wider select-all transition-all ${getThemeClasses()}`}
            >
              {matrixText}
            </pre>
          ) : (
            <div className="text-center space-y-3 p-8 max-w-md text-[var(--text-muted)]">
              <div className="w-12 h-12 mx-auto rounded-2xl neu-inset flex items-center justify-center text-[var(--primary)]">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-main)]">Chưa có hình ảnh nào được chọn</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Hãy nhấn nút <strong>"Chọn ảnh từ máy của bạn"</strong> ở trên để tải bức ảnh yêu thích.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
