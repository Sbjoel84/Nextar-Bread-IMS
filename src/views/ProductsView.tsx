import React, { useState } from 'react';
import { BreadProduct } from '../types/erp';
import { formatNaira } from '../utils/formatters';
import {
  Wheat,
  Plus,
  Edit2,
  DollarSign,
  Tag,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';

interface ProductsViewProps {
  products: BreadProduct[];
  onAddProduct: (data: any) => Promise<void>;
  onUpdateProduct: (id: string, data: any) => Promise<void>;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
}) => {
  const [editingProduct, setEditingProduct] = useState<BreadProduct | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'STANDARD' | 'PREMIUM' | 'SPECIALTY' | 'MINI'>('PREMIUM');
  const [sizeGrams, setSizeGrams] = useState(800);
  const [isSliced, setIsSliced] = useState(false);
  const [retailPrice, setRetailPrice] = useState(1200);
  const [wholesalePrice, setWholesalePrice] = useState(1020);
  const [distributorPrice, setDistributorPrice] = useState(960);
  const [estimatedCost, setEstimatedCost] = useState(680);
  const [shelfLifeDays, setShelfLifeDays] = useState(5);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddProduct({
      name,
      category,
      sizeGrams,
      isSliced,
      standardRetailPrice: retailPrice,
      wholesalePrice,
      distributorPrice,
      estimatedCostPrice: estimatedCost,
      shelfLifeDays,
    });
    setShowAddModal(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await onUpdateProduct(editingProduct.id, {
      name,
      category,
      sizeGrams,
      isSliced,
      standardRetailPrice: retailPrice,
      wholesalePrice,
      distributorPrice,
      estimatedCostPrice: estimatedCost,
      shelfLifeDays,
    });
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Wheat className="w-5 h-5 text-amber-400" />
            Nextar Bread Product Catalogue & Multi-Tier Pricing
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Loaf specifications, sliced/unsliced options, standard retail, wholesale depot, and bulk distributor price lists.
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setCategory('PREMIUM');
            setSizeGrams(800);
            setIsSliced(false);
            setRetailPrice(1200);
            setWholesalePrice(1020);
            setDistributorPrice(960);
            setEstimatedCost(680);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Bread Product</span>
        </button>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(p => {
          const wholesaleMargin = p.wholesalePrice - p.estimatedCostPrice;
          const marginPercent = Math.round((wholesaleMargin / p.wholesalePrice) * 100);

          return (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">
                    {p.code}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-amber-300 border border-slate-700">
                    {p.sizeGrams}g • {p.isSliced ? 'Sliced' : 'Unsliced'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">
                  {p.name}
                </h3>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Category: <strong className="text-slate-300">{p.category}</strong> • Shelf Life: {p.shelfLifeDays} days
                </div>

                {/* Price Matrix */}
                <div className="mt-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Retail Price:</span>
                    <span className="font-bold text-white font-mono">{formatNaira(p.standardRetailPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Wholesale Price:</span>
                    <span className="font-bold text-emerald-400 font-mono">{formatNaira(p.wholesalePrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Distributor Price:</span>
                    <span className="font-bold text-blue-400 font-mono">{formatNaira(p.distributorPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800 text-slate-400">
                    <span>Est. Cost: {formatNaira(p.estimatedCostPrice)}</span>
                    <span className="text-cyan-400 font-semibold">{marginPercent}% Margin</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Stock: <strong className="text-white">{p.currentStockLoaves}</strong> loaves
                </span>
                <button
                  onClick={() => {
                    setEditingProduct(p);
                    setName(p.name);
                    setCategory(p.category);
                    setSizeGrams(p.sizeGrams);
                    setIsSliced(p.isSliced);
                    setRetailPrice(p.standardRetailPrice);
                    setWholesalePrice(p.wholesalePrice);
                    setDistributorPrice(p.distributorPrice);
                    setEstimatedCost(p.estimatedCostPrice);
                    setShelfLifeDays(p.shelfLifeDays);
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded"
                  title="Edit Product & Prices"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Wheat className="w-5 h-5 text-amber-500" />
                {editingProduct ? 'Edit Bread Product & Pricing' : 'Add New Bread Product'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingProduct ? handleEditSubmit : handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Nextar Jumbo Special Loaf"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="STANDARD">Standard Loaf</option>
                    <option value="PREMIUM">Premium Loaf</option>
                    <option value="SPECIALTY">Specialty (Wheat/Coconut/Choc)</option>
                    <option value="MINI">Mini Rolls</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Size (Grams)</label>
                  <input
                    type="number"
                    value={sizeGrams}
                    onChange={e => setSizeGrams(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="slicedCheck"
                  checked={isSliced}
                  onChange={e => setIsSliced(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 w-4 h-4"
                />
                <label htmlFor="slicedCheck" className="text-slate-300 font-medium cursor-pointer">
                  Sliced Bread (Requires Slicing Machine Station)
                </label>
              </div>

              {/* Price Tiers */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Configurable Price Tiers (NGN ₦)
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Standard Retail (₦)</label>
                    <input
                      type="number"
                      value={retailPrice}
                      onChange={e => setRetailPrice(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Wholesale (₦)</label>
                    <input
                      type="number"
                      value={wholesalePrice}
                      onChange={e => setWholesalePrice(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono font-bold text-emerald-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Distributor (₦)</label>
                    <input
                      type="number"
                      value={distributorPrice}
                      onChange={e => setDistributorPrice(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono font-bold text-blue-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Estimated Unit Cost (₦)</label>
                    <input
                      type="number"
                      value={estimatedCost}
                      onChange={e => setEstimatedCost(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Shelf Life (Days)</label>
                    <input
                      type="number"
                      value={shelfLifeDays}
                      onChange={e => setShelfLifeDays(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
