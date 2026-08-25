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
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Chuyển Đổi Ảnh Thành Mã Nhị Phân 01 & Matrix String Art
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                100% Client Privacy
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tải bất kỳ ảnh nào (chân dung, bạn gái, Phật Tổ, logo, meme) ➔ Tự động biến thành chuỗi nhị phân 01, Matrix Hacker hoặc chữ nghệ thuật thời gian thực.
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Chọn ảnh từ máy của bạn</span>
          </button>
        </div>
      </div>

      {/* Control Sliders & Options */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
        {/* Width / Resolution Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
            <span>Độ phân giải (Độ rộng):</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{width} ký tự</span>
          </div>
          <input
            type="range"
            min="24"
            max="120"
            step="2"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Threshold / Contrast Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
            <span>Ngưỡng tương phản sáng/tối:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{threshold}</span>
          </div>
          <input
            type="range"
            min="30"
            max="225"
            step="1"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Character Mode Selection */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">Kiểu ký tự Matrix:</label>
          <select
            value={charMode}
            onChange={(e: any) => setCharMode(e.target.value)}
            className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
          >
            <option value="binary">Số nhị phân thuần (0 và 1)</option>
            <option value="custom_word">Tùy biến chữ (VD: HIẾU, LOVE)</option>
            <option value="matrix_chars">Ký tự Matrix Hacker (Katakana/01)</option>
            <option value="ascii_density">Độ bóng ASCII (@%#*+=-:.)</option>
          </select>
        </div>

        {/* Color Theme & Invert */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">Tông màu hiển thị:</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setColorTheme('green')}
              className={`w-6 h-6 rounded-full bg-emerald-500 border-2 ${colorTheme === 'green' ? 'border-white ring-2 ring-emerald-500' : 'border-transparent'}`}
              title="Matrix Green"
            />
            <button
              onClick={() => setColorTheme('cyan')}
              className={`w-6 h-6 rounded-full bg-cyan-400 border-2 ${colorTheme === 'cyan' ? 'border-white ring-2 ring-cyan-400' : 'border-transparent'}`}
              title="Cyber Cyan"
            />
            <button
              onClick={() => setColorTheme('amber')}
              className={`w-6 h-6 rounded-full bg-amber-400 border-2 ${colorTheme === 'amber' ? 'border-white ring-2 ring-amber-400' : 'border-transparent'}`}
              title="Amber Gold"
            />
            <button
              onClick={() => setColorTheme('white')}
              className={`w-6 h-6 rounded-full bg-slate-100 border-2 ${colorTheme === 'white' ? 'border-emerald-500 ring-2 ring-slate-300' : 'border-transparent'}`}
              title="Classic White"
            />

            <button
              onClick={() => setInvert(!invert)}
              className={`ml-auto px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-colors ${
                invert
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {invert ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
              <span>Đảo ngược</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Word Input (if selected) */}
      {charMode === 'custom_word' && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 animate-in fade-in">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Nhập từ/tên muốn lặp vào ảnh:</span>
          <input
            type="text"
            value={customWord}
            onChange={(e) => setCustomWord(e.target.value)}
            placeholder="VD: HIẾU, EM_YÊU, 01..."
            className="p-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none"
          />
        </div>
      )}

      {/* Main Preview Screen */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-500" />
            <span>Màn Hình Ma Trận Ký Tự Nhị Phân 01 (Live Canvas Stream)</span>
          </div>

          {matrixText && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadHtml}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                title="Tải trang web Matrix phát sáng"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Web HTML</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải .TXT</span>
              </button>

              <button
                onClick={handleCopy}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép chuỗi!' : 'Sao chép chuỗi Matrix 01'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Terminal Screen Box */}
        <div className="relative rounded-3xl bg-slate-950 border border-slate-800 p-6 min-h-[360px] flex items-center justify-center overflow-x-auto shadow-2xl">
          {isProcessing ? (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 animate-pulse">
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
            <div className="text-center space-y-3 p-8 max-w-md text-slate-400">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-300">Chưa có hình ảnh nào được chọn</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Hãy nhấn nút <strong>"Chọn ảnh từ máy của bạn"</strong> ở trên để tải bất kỳ bức ảnh chân dung, bạn gái hay hình yêu thích nào.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
