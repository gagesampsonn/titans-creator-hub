/**
 * Campaign Overview Modal
 * 
 * Generates a professional PDF campaign overview for brands.
 * Uses jsPDF for client-side PDF generation.
 */

import React, { useState } from 'react';
import { X, FileText, Loader2, Download, Users, ChevronDown, CheckCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface CampaignOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CampaignConfig {
  totalCost: number;
  totalVideos: number;
  managementFee: number;
  retainerBudget: number;
  upfrontPayment: number;
}

const CAMPAIGN_CONFIGS: Record<number, CampaignConfig> = {
  5: {
    totalCost: 5500,
    totalVideos: 120,
    managementFee: 2000,
    retainerBudget: 3500,
    upfrontPayment: 2000 + (3500 * 0.5), // $3,750
  },
  10: {
    totalCost: 10500,
    totalVideos: 225,
    managementFee: 3000,
    retainerBudget: 7500,
    upfrontPayment: 3000 + (7500 * 0.5), // $6,750
  },
  15: {
    totalCost: 13500,
    totalVideos: 325,
    managementFee: 3000,
    retainerBudget: 10500,
    upfrontPayment: 3000 + (10500 * 0.5), // $8,250
  },
};

const CAMPAIGN_DURATION = 44;


export const CampaignOverviewModal: React.FC<CampaignOverviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [brandName, setBrandName] = useState('');
  const [creatorCount, setCreatorCount] = useState<5 | 10 | 15>(10);
  const [totalSales, setTotalSales] = useState('');
  const [website, setWebsite] = useState('');
  const [contact, setContact] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const config = CAMPAIGN_CONFIGS[creatorCount];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const generatePDF = async () => {
    if (!brandName.trim()) {
      setError('Please enter a brand name');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Colors
      const primaryColor: [number, number, number] = [139, 92, 246]; // Purple/Fuchsia
      const secondaryColor: [number, number, number] = [6, 182, 212]; // Cyan
      const darkBg: [number, number, number] = [15, 15, 16];
      const cardBg: [number, number, number] = [26, 26, 30];
      const textPrimary: [number, number, number] = [245, 245, 245];
      const textSecondary: [number, number, number] = [138, 138, 138];

      // Background
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Header gradient bar
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 4, 'F');

      // Title
      yPos = 20;
      doc.setTextColor(...textPrimary);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('TITANS', margin, yPos);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textSecondary);
      doc.text('Campaign Overview', margin + 52, yPos);

      // Brand name & campaign type
      yPos += 15;
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textPrimary);
      doc.text(brandName.trim(), margin, yPos);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...secondaryColor);
      doc.text(`${creatorCount} Creator Campaign`, margin, yPos + 8);

      // Campaign Snapshot Box
      yPos += 25;
      const snapshotHeight = 50;
      doc.setFillColor(...cardBg);
      doc.roundedRect(margin, yPos, contentWidth, snapshotHeight, 3, 3, 'F');

      // Snapshot content
      const col1 = margin + 10;
      const col2 = margin + (contentWidth / 3);
      const col3 = margin + (contentWidth * 2 / 3);
      
      yPos += 12;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textSecondary);
      doc.text('TOTAL CREATORS', col1, yPos);
      doc.text('TOTAL VIDEOS', col2, yPos);
      doc.text('CAMPAIGN DURATION', col3, yPos);
      
      yPos += 8;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textPrimary);
      doc.text(String(creatorCount), col1, yPos);
      doc.text(String(config.totalVideos), col2, yPos);
      doc.text(`${CAMPAIGN_DURATION} Days`, col3, yPos);

      yPos += 12;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textSecondary);
      doc.text('TOTAL COST', col1, yPos);
      doc.text('UPFRONT PAYMENT', col2, yPos);
      doc.text('INCLUDES', col3, yPos);
      
      yPos += 8;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(formatCurrency(config.totalCost), col1, yPos);
      doc.setTextColor(...secondaryColor);
      doc.text(formatCurrency(config.upfrontPayment), col2, yPos);
      doc.setFontSize(10);
      doc.setTextColor(...textPrimary);
      doc.text('Management + Retainers', col3, yPos);

      // Campaign Phases & Timeline Section
      yPos += 25;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textPrimary);
      doc.text('Campaign Phases & Timeline', margin, yPos);

      // Phase boxes
      const phaseHeight = 42;
      const phaseWidth = (contentWidth - 10) / 3;

      yPos += 8;

      // Onboarding Phase
      doc.setFillColor(...cardBg);
      doc.roundedRect(margin, yPos, phaseWidth, phaseHeight, 2, 2, 'F');
      doc.setFillColor(...primaryColor);
      doc.rect(margin, yPos, phaseWidth, 3, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textPrimary);
      doc.text('Onboarding', margin + 5, yPos + 12);
      doc.setFontSize(8);
      doc.setTextColor(...secondaryColor);
      doc.text('14 Days', margin + 5, yPos + 18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textSecondary);
      doc.setFontSize(7);
      doc.text('• Find content trends', margin + 5, yPos + 26);
      doc.text('• Send samples', margin + 5, yPos + 31);
      doc.text('• Set up Spark Ad forms', margin + 5, yPos + 36);

      // Phase 1
      const phase1X = margin + phaseWidth + 5;
      doc.setFillColor(...cardBg);
      doc.roundedRect(phase1X, yPos, phaseWidth, phaseHeight, 2, 2, 'F');
      doc.setFillColor(...secondaryColor);
      doc.rect(phase1X, yPos, phaseWidth, 3, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textPrimary);
      doc.text('Phase 1', phase1X + 5, yPos + 12);
      doc.setFontSize(8);
      doc.setTextColor(...secondaryColor);
      doc.text('15 Days', phase1X + 5, yPos + 18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textSecondary);
      doc.setFontSize(7);
      doc.text(`• ${creatorCount} creators post daily`, phase1X + 5, yPos + 26);
      doc.text('• Performance monitoring', phase1X + 5, yPos + 31);
      doc.text('• Real-time optimization', phase1X + 5, yPos + 36);

      // Phase 2
      const phase2X = margin + (phaseWidth * 2) + 10;
      doc.setFillColor(...cardBg);
      doc.roundedRect(phase2X, yPos, phaseWidth, phaseHeight, 2, 2, 'F');
      doc.setFillColor(34, 197, 94); // Green
      doc.rect(phase2X, yPos, phaseWidth, 3, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textPrimary);
      doc.text('Phase 2', phase2X + 5, yPos + 12);
      doc.setFontSize(8);
      doc.setTextColor(34, 197, 94);
      doc.text('15 Days', phase2X + 5, yPos + 18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textSecondary);
      doc.setFontSize(7);
      doc.text('• Top 50% continue', phase2X + 5, yPos + 26);
      doc.text('• 15 additional videos each', phase2X + 5, yPos + 31);
      doc.text('• Scale winning angles', phase2X + 5, yPos + 36);

      // Key Deliverables Section
      yPos += phaseHeight + 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textPrimary);
      doc.text('Key Deliverables & Execution', margin, yPos);

      yPos += 8;
      doc.setFillColor(...cardBg);
      doc.roundedRect(margin, yPos, contentWidth, 40, 2, 2, 'F');

      const deliverables = [
        `${config.totalVideos} total videos over ${CAMPAIGN_DURATION} days`,
        'Strategic onboarding + content guidance',
        'Sample distribution & creator management',
        'Spark Ad code collection for scaling',
      ];

      yPos += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textPrimary);
      
      deliverables.forEach((item, index) => {
        const xOffset = index < 2 ? margin + 10 : margin + (contentWidth / 2) + 10;
        const yOffset = yPos + (index % 2) * 12;
        doc.setFillColor(...secondaryColor);
        doc.circle(xOffset - 3, yOffset - 1.5, 1.5, 'F');
        doc.text(item, xOffset + 2, yOffset);
      });

      // Payment Breakdown Section
      yPos += 50;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textPrimary);
      doc.text('Investment Breakdown', margin, yPos);

      yPos += 8;
      doc.setFillColor(...cardBg);
      doc.roundedRect(margin, yPos, contentWidth, 35, 2, 2, 'F');

      const breakdownY = yPos + 12;
      doc.setFontSize(9);
      doc.setTextColor(...textSecondary);
      doc.text('Management Fee', margin + 10, breakdownY);
      doc.text('Creator Retainers', margin + (contentWidth / 3), breakdownY);
      doc.text('Upfront (50% retainer)', margin + (contentWidth * 2 / 3), breakdownY);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textPrimary);
      doc.text(formatCurrency(config.managementFee), margin + 10, breakdownY + 12);
      doc.text(formatCurrency(config.retainerBudget), margin + (contentWidth / 3), breakdownY + 12);
      doc.setTextColor(...primaryColor);
      doc.text(formatCurrency(config.upfrontPayment), margin + (contentWidth * 2 / 3), breakdownY + 12);

      // CTA Footer
      yPos = pageHeight - 35;
      doc.setFillColor(30, 30, 35);
      doc.roundedRect(margin, yPos, contentWidth, 25, 2, 2, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textPrimary);
      doc.text('Ready to launch?', margin + 10, yPos + 10);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textSecondary);
      doc.text("Click 'Contact Sales' on titansagency.co to start onboarding.", margin + 10, yPos + 18);

      // Footer line
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

      // Generate filename and download
      const sanitizedBrandName = brandName.trim().replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Titans_Campaign_Overview_${sanitizedBrandName}_${creatorCount}.pdf`;
      
      doc.save(filename);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        // Reset form
        setBrandName('');
        setCreatorCount(10);
        setTotalSales('');
        setWebsite('');
        setContact('');
      }, 2000);

    } catch (err: any) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    if (!generating) {
      onClose();
      setError('');
      setSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl shadow-fuchsia-500/10">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={generating}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Generate Campaign Overview</h3>
              <p className="text-gray-400 text-sm">Create a professional PDF proposal</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                PDF Generated!
              </h3>
              <p className="text-sm text-gray-400">
                Your campaign overview has been downloaded.
              </p>
            </div>
          ) : (
            <>
              {/* Brand Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Brand Name <span className="text-fuchsia-400">*</span>
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Enter your brand name"
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all"
                />
              </div>

              {/* Number of Creators */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Number of Creators <span className="text-fuchsia-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={creatorCount}
                    onChange={(e) => setCreatorCount(Number(e.target.value) as 5 | 10 | 15)}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all"
                  >
                    <option value={5}>5 Creators</option>
                    <option value={10}>10 Creators</option>
                    <option value={15}>15 Creators</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Total Sales on TikTok Shop */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Total Sales on TikTok Shop <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={totalSales}
                  onChange={(e) => setTotalSales(e.target.value)}
                  placeholder="e.g. $50,000"
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all"
                />
              </div>

              {/* Company Website */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Company Website <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourbrand.com"
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all"
                />
              </div>

              {/* Contact Email or WhatsApp */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Contact Email or WhatsApp <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="email@example.com or +1 234 567 8900"
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all"
                />
              </div>

              {/* Preview Stats */}
              <div className="mb-6 p-4 bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 border border-gray-700 rounded-xl">
                <div className="text-xs text-gray-400 mb-3 font-medium">CAMPAIGN PREVIEW</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                      {formatCurrency(config.totalCost)}
                    </div>
                    <div className="text-xs text-gray-500">Total Cost</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {config.totalVideos}
                    </div>
                    <div className="text-xs text-gray-500">Total Videos</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-cyan-400">
                      {formatCurrency(config.upfrontPayment)}
                    </div>
                    <div className="text-xs text-gray-500">Upfront Payment</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">
                      {CAMPAIGN_DURATION} Days
                    </div>
                    <div className="text-xs text-gray-500">Campaign Duration</div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={generating}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-300 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={generatePDF}
                  disabled={generating || !brandName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Generate PDF
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignOverviewModal;

