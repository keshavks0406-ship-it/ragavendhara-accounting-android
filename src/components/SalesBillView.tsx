import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Maximize2,
  Printer,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { Customer, SalesEntry } from '../types/accounting';
import {
  amountToIndianWords,
  exportToExcel,
  formatCurrency,
  formatDate,
  formatNumber,
} from '../utils/formatters';
import { printCurrentPage } from '../utils/nativeActions';

const A4_WIDTH_PX = 794; // 210 mm at 96 DPI
const A4_HEIGHT_PX = 1123; // 297 mm at 96 DPI

interface SingleBillProps {
  copyType: 'ORIGINAL' | 'DUPLICATE';
  company: {
    companyName: string;
    addressLine1: string;
    addressLine2: string;
    phone: string;
    gstin: string;
  };
  sale: SalesEntry;
  customer?: Customer;
}

const SingleBill: React.FC<SingleBillProps> = ({
  copyType,
  company,
  sale,
  customer,
}) => {
  const rawWords = amountToIndianWords(sale.amount);
  const wordsOnly = rawWords.replace(/^Rupees\s+/i, '');

  return (
    <div className="a4-bill-half h-full flex flex-col justify-between border-[1.5px] border-black bg-white text-black font-sans leading-tight">
      {/* 1. Header Box */}
      <div className="relative text-center py-1.5 px-3 border-b-[1.5px] border-black bg-white">
        <span className="absolute right-2 top-1.5 text-[9px] font-bold tracking-wider px-1.5 py-0.5 border border-black uppercase bg-white">
          {copyType}
        </span>
        <div className="text-[10px] font-extrabold tracking-widest uppercase text-slate-700">
          BILL
        </div>
        <div className="mt-0.5">
          <span className="inline-block border border-black px-3 py-1 text-[16px] font-black tracking-wide uppercase font-serif text-black leading-tight">
            {company.companyName || 'RAGAVENDHARA & CO'}
          </span>
        </div>
        <div className="text-[9.5px] font-semibold text-black leading-tight mt-0.5">
          {company.addressLine1 || '2,KNS GARDEN 1st STREET,PARAPALAYAM'}
        </div>
        <div className="text-[9.5px] font-semibold text-black leading-tight">
          {company.addressLine2 || 'MANGALAM ROAD, TIRUPUR-641604'}
        </div>
        <div className="text-[9.5px] font-semibold text-black leading-tight">
          cell:{company.phone || '9842218444'}
        </div>
        <div className="text-[9.5px] font-bold text-black leading-tight">
          GST NO:{company.gstin || '33AQOPS0743E1ZV'}
        </div>
      </div>

      {/* 2. Customer & Bill Info Subheader */}
      <div className="grid grid-cols-[1fr_210px] border-b-[1.5px] border-black text-black">
        {/* Left: To & GSTIN */}
        <div className="p-2 border-r-[1.5px] border-black flex flex-col justify-between min-h-[58px]">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-bold">To:</span>
              <span className="font-extrabold text-[11px] text-black">
                {sale.customerName}
              </span>
            </div>
            {customer?.address && (
              <div className="text-[9px] font-medium text-slate-800 leading-tight ml-4 mt-0.5 line-clamp-1">
                {customer.address}
              </div>
            )}
          </div>
          <div className="text-[9.5px] font-bold mt-1">
            GSTIN:{' '}
            <span className="font-mono font-bold">
              {customer?.gstNumber && customer.gstNumber !== '—'
                ? customer.gstNumber
                : 'URP'}
            </span>
          </div>
        </div>

        {/* Right: Bill No & Date */}
        <div className="flex flex-col justify-between">
          <div className="px-2.5 py-1.5 border-b-[1.5px] border-black flex items-center justify-between">
            <span className="text-[10px] font-bold">Bill No:</span>
            <span className="font-mono font-black text-[11.5px]">
              {sale.invoiceNo}
            </span>
          </div>
          <div className="px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold">Date:</span>
            <span className="font-mono font-bold text-[10.5px]">
              {formatDate(sale.date)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Table: Rate | Particulars | Weight | Amount */}
      <div className="flex-1 flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-[85px_1fr_110px_100px] border-b-[1.5px] border-black bg-white text-[10px] font-bold text-center">
          <div className="py-1 px-1.5 border-r-[1.5px] border-black">Rate</div>
          <div className="py-1 px-1.5 border-r-[1.5px] border-black text-left pl-3">
            Particulars
          </div>
          <div className="py-1 px-1.5 border-r-[1.5px] border-black">Weight</div>
          <div className="py-1 px-1.5">Amount</div>
        </div>

        {/* Table Content Row */}
        <div className="grid grid-cols-[85px_1fr_110px_100px] flex-1 text-black text-[10px]">
          {/* Rate Column */}
          <div className="p-2 border-r-[1.5px] border-black flex flex-col justify-between text-center">
            <div className="font-mono font-bold leading-tight">
              <div>{formatNumber(sale.ratePerTon, 0)}</div>
              <div className="text-[9px] font-semibold">per ton</div>
            </div>
            <div className="font-bold text-[9px] pt-4 text-left">E&OE</div>
          </div>

          {/* Particulars Column */}
          <div className="p-2 border-r-[1.5px] border-black flex flex-col justify-between">
            <div className="font-extrabold text-[11.5px] text-black">
              {sale.goodsName}
            </div>

            <div className="mt-2 space-y-0.5 text-[9.5px]">
              <div className="flex">
                <span className="w-24 font-bold text-black">Vehicle No:</span>
                <span className="font-mono font-extrabold text-black">
                  {sale.vehicleNo}
                </span>
              </div>
              <div className="flex">
                <span className="w-24 font-semibold text-black">Load weight:</span>
                <span className="font-mono text-black">
                  {formatNumber(sale.loadWeightKg)} KGs
                </span>
              </div>
              <div className="flex">
                <span className="w-24 font-semibold text-black">MT weight:</span>
                <span className="font-mono text-black">
                  {formatNumber(sale.emptyWeightKg)} KGs
                </span>
              </div>
              <div className="flex">
                <span className="w-24 font-bold text-black">Net weight:</span>
                <span className="font-mono font-bold text-black">
                  {formatNumber(sale.netWeightKg)} KGs
                </span>
              </div>
            </div>
          </div>

          {/* Weight Column */}
          <div className="p-2 border-r-[1.5px] border-black flex flex-col justify-between text-right">
            <div className="font-mono font-bold text-[10.5px]">
              {formatNumber(sale.netWeightKg / 1000, 3)} MT
              <div className="text-[8.5px] font-normal text-slate-600">
                ({formatNumber(sale.netWeightKg)} KG)
              </div>
            </div>
            <div className="font-bold text-[10px] pt-4">Total:</div>
          </div>

          {/* Amount Column */}
          <div className="p-2 flex flex-col justify-between text-right">
            <div className="font-mono font-bold text-[11px]">
              {formatNumber(sale.amount, 2)}
            </div>
            <div className="font-mono font-black text-[11.5px] pt-4 border-t border-dotted border-black">
              {formatNumber(sale.amount, 2)}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Rupees in Words & Signature */}
      <div className="grid grid-cols-[1fr_240px] border-t-[1.5px] border-black text-black">
        {/* Left: Rupees in words */}
        <div className="p-2 border-r-[1.5px] border-black flex items-center text-[9.5px]">
          <span className="font-bold whitespace-nowrap mr-1">Rupees:</span>
          <span className="font-semibold italic leading-tight">
            {wordsOnly}
          </span>
        </div>

        {/* Right: Enlarged Signature Box */}
        <div className="min-h-[72px] p-3 flex flex-col justify-between text-right text-[10px]">
          <div className="font-bold">
            For {company.companyName || 'RAGAVENDHARA & CO'}
          </div>
          <div className="h-7"></div>
          <div className="text-[9px] font-medium text-slate-800">
            Authorised Signatory
          </div>
        </div>
      </div>
    </div>
  );
};

export const SalesBillView: React.FC = () => {
  const {
    company,
    sales,
    customers,
    selectedSalesBillId,
    setSelectedSalesBillId,
    setActiveView,
  } = useAccounting();

  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.55);
  const [zoomMode, setZoomMode] = useState<'fit' | '100%' | 'custom'>('fit');

  // Sort sales in descending order (newest date, newest invoice first)
  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.invoiceNo.localeCompare(a.invoiceNo, undefined, { numeric: true });
    });
  }, [sales]);

  const currentSale = useMemo(() => {
    if (selectedSalesBillId) {
      const match = sortedSales.find((s) => s.id === selectedSalesBillId);
      if (match) return match;
    }
    return sortedSales[0] || null;
  }, [selectedSalesBillId, sortedSales]);

  const currentIndex = currentSale
    ? sortedSales.findIndex((s) => s.id === currentSale.id)
    : -1;

  const customer = currentSale
    ? customers.find((c) => c.id === currentSale.customerId)
    : undefined;

  // Auto-fit scale to frame logic
  useEffect(() => {
    const computeFitScale = () => {
      if (!frameRef.current) return;
      const frameWidth = frameRef.current.clientWidth;
      const availableWidth = Math.max(260, frameWidth - 32);
      const widthScale = availableWidth / A4_WIDTH_PX;

      // Available viewport height consideration
      const windowHeight = window.innerHeight;
      const availableHeight = Math.max(380, windowHeight - 270);
      const heightScale = availableHeight / A4_HEIGHT_PX;

      // Fit full page within screen frame comfortably
      const optimal = Math.max(0.35, Math.min(widthScale, heightScale, 0.9));

      if (zoomMode === 'fit') {
        setScale(Number(optimal.toFixed(2)));
      }
    };

    computeFitScale();
    window.addEventListener('resize', computeFitScale);
    return () => window.removeEventListener('resize', computeFitScale);
  }, [zoomMode, currentSale]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedSalesBillId(sortedSales[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < sortedSales.length - 1 && currentIndex >= 0) {
      setSelectedSalesBillId(sortedSales[currentIndex + 1].id);
    }
  };

  const handleZoomIn = () => {
    setZoomMode('custom');
    setScale((prev) => Math.min(1.2, Number((prev + 0.08).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomMode('custom');
    setScale((prev) => Math.max(0.3, Number((prev - 0.08).toFixed(2))));
  };

  const handleFitScreen = () => {
    setZoomMode('fit');
    if (frameRef.current) {
      const frameWidth = frameRef.current.clientWidth;
      const availableWidth = Math.max(260, frameWidth - 32);
      const widthScale = availableWidth / A4_WIDTH_PX;
      const availableHeight = Math.max(380, window.innerHeight - 270);
      const heightScale = availableHeight / A4_HEIGHT_PX;
      const optimal = Math.max(0.35, Math.min(widthScale, heightScale, 0.9));
      setScale(Number(optimal.toFixed(2)));
    }
  };

  const handleActualSize = () => {
    setZoomMode('100%');
    setScale(1.0);
  };

  const handleExportExcel = () => {
    if (!currentSale) return;
    const rawWords = amountToIndianWords(currentSale.amount);
    const wordsOnly = rawWords.replace(/^Rupees\s+/i, '');

    const safeInv = currentSale.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Sales_Bill_${safeInv}.xlsx`;

    const headers = [
      'Field / Particular',
      'Value / Details',
      'Rate (/Ton)',
      'Particulars',
      'Weight (MT / KG)',
      'Amount (₹)',
    ];

    const rows: (string | number | null | undefined)[][] = [
      ['BILL TYPE', 'SALES BILL (2-IN-1 FORMAT)', '', '', '', ''],
      ['Company Name', company.companyName || 'RAGAVENDHARA & CO', '', '', '', ''],
      [
        'Company Address',
        `${company.addressLine1 || '2,KNS GARDEN 1st STREET,PARAPALAYAM'}, ${company.addressLine2 || 'MANGALAM ROAD, TIRUPUR-641604'}`,
        '',
        '',
        '',
        '',
      ],
      [
        'Company Contact & GST',
        `cell: ${company.phone || '9842218444'} | GST NO: ${company.gstin || '33AQOPS0743E1ZV'}`,
        '',
        '',
        '',
        '',
      ],
      ['', '', '', '', '', ''],
      ['Bill No.', currentSale.invoiceNo, '', '', '', ''],
      ['Sales Date', formatDate(currentSale.date), '', '', '', ''],
      ['Customer / Party Name', currentSale.customerName, '', '', '', ''],
      ['Customer Address', customer?.address || '—', '', '', '', ''],
      ['Customer GSTIN', customer?.gstNumber || 'URP', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['--- WEIGHBRIDGE & TONNAGE ITEM ---', '', '', '', '', ''],
      [
        'Item 1',
        currentSale.goodsName,
        formatCurrency(currentSale.ratePerTon) + '/Ton',
        `Vehicle: ${currentSale.vehicleNo} | Load: ${formatNumber(currentSale.loadWeightKg)} KG | MT: ${formatNumber(currentSale.emptyWeightKg)} KG | Net: ${formatNumber(currentSale.netWeightKg)} KG`,
        `${formatNumber(currentSale.netWeightKg / 1000, 3)} MT (${formatNumber(currentSale.netWeightKg)} KG)`,
        currentSale.amount,
      ],
      ['', '', '', '', '', ''],
      [
        'Total Net Weight',
        `${formatNumber(currentSale.netWeightKg / 1000, 3)} MT (${formatNumber(currentSale.netWeightKg)} KG)`,
        '',
        '',
        'Total Amount (₹):',
        currentSale.amount,
      ],
      ['Amount in Words', `Rupees: ${wordsOnly}`, '', '', '', ''],
      ['Terms', 'E&OE', '', '', '', ''],
      [
        'Signatory',
        `For ${company.companyName || 'RAGAVENDHARA & CO'} (Authorised Signatory)`,
        '',
        '',
        '',
        '',
      ],
    ];

    exportToExcel(filename, headers, rows, 'Sales Bill');
  };

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      {/* Search Toolbar: Responsive and contained within mobile borders */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm w-full max-w-full overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Search bar row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto min-w-0">
          <label
            htmlFor="sales-bill-select"
            className="text-xs font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap shrink-0"
          >
            Select Sales Bill:
          </label>
          <div className="flex items-center gap-1.5 w-full sm:w-auto min-w-0">
            <div className="relative flex-1 min-w-0">
              <select
                id="sales-bill-select"
                value={currentSale?.id || ''}
                onChange={(e) => setSelectedSalesBillId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-mono font-medium border border-slate-300 rounded-lg bg-white text-slate-900 truncate cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                {sortedSales.length === 0 ? (
                  <option value="">No Sales Invoices Available</option>
                ) : (
                  sortedSales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.invoiceNo} — {s.customerName} ({formatDate(s.date)})
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="shrink-0 p-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous invoice"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= sortedSales.length - 1 || currentIndex < 0}
              className="shrink-0 p-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next invoice"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons: Export Excel and Print */}
        {currentSale && (
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => void printCurrentPage(`Invoice_${currentSale.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '_')}`, 'portrait')}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        )}
      </div>

      {/* Main A4 Printable Layout Framed within the Screen */}
      {!currentSale ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <h2 className="text-base font-bold text-slate-900">No Sales Invoices Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            Create a Sales Entry first to generate, view, and print sales bills.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('sales-entry')}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            Go to Sales Entry
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          {/* Zoom & Frame Controller */}
          <div className="no-print w-full flex items-center justify-between px-2 py-1.5 mb-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg shadow-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Eye className="w-3.5 h-3.5 text-teal-700" />
              <span>Bill Preview</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="font-mono text-[11px] font-semibold text-slate-700 min-w-[42px] text-center">
                {Math.round(scale * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="h-3.5 w-px bg-slate-300 mx-1" />

              <button
                type="button"
                onClick={handleFitScreen}
                className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer transition-colors ${
                  zoomMode === 'fit'
                    ? 'bg-teal-700 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="Zoom out to fit screen"
              >
                Fit Screen
              </button>

              <button
                type="button"
                onClick={handleActualSize}
                className={`px-2 py-0.5 text-[11px] font-medium rounded cursor-pointer transition-colors ${
                  zoomMode === '100%'
                    ? 'bg-teal-700 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title="100% Actual Size"
              >
                100%
              </button>
            </div>
          </div>

          {/* Screen Frame Container */}
          <div
            ref={frameRef}
            className="preview-frame w-full max-w-full bg-slate-100/90 border border-slate-300 rounded-2xl p-2 sm:p-5 shadow-inner flex flex-col items-center justify-start overflow-hidden"
          >
            {/* Scaled Wrapper: Constrains width and height strictly to the scaled size */}
            <div
              className="preview-scale-wrapper flex items-start justify-center transition-all duration-150"
              style={{
                width: `${Math.round(A4_WIDTH_PX * scale)}px`,
                height: `${Math.round(A4_HEIGHT_PX * scale)}px`,
                maxWidth: '100%',
              }}
            >
              {/* Actual A4 Sheet: 210mm x 297mm with 10mm margins */}
              <div
                className="a4-sheet-container bg-white border border-slate-300 shadow-xl relative shrink-0"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  height: '297mm',
                  padding: '10mm',
                  boxSizing: 'border-box',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                }}
              >
                {/* Inner Content: 190mm wide x 277mm high */}
                <div
                  className="a4-inner-content flex flex-col justify-between h-full"
                  style={{
                    width: '190mm',
                    height: '277mm',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* 1. TOP HALF: ORIGINAL (1 cm space from Top, Left, Right sheet borders; 2 cm gap at bottom) */}
                  <div style={{ height: '128.5mm', boxSizing: 'border-box' }}>
                    <SingleBill
                      copyType="ORIGINAL"
                      company={company}
                      sale={currentSale}
                      customer={customer}
                    />
                  </div>

                  {/* Horizontal separator between the Original and Duplicate copies */}
                  <div
                    className="a4-bill-gap flex items-center"
                    style={{ height: '20mm', boxSizing: 'border-box' }}
                    aria-hidden="true"
                  >
                    <span className="w-full border-b border-dashed border-black" />
                  </div>

                  {/* 3. BOTTOM HALF: DUPLICATE (2 cm gap at top; 1 cm space from Bottom, Left, Right sheet borders) */}
                  <div style={{ height: '128.5mm', boxSizing: 'border-box' }}>
                    <SingleBill
                      copyType="DUPLICATE"
                      company={company}
                      sale={currentSale}
                      customer={customer}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
