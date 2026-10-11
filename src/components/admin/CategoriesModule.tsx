import React, { useState } from 'react';
import {
  Tags,
  Plus,
  Trash2,
  Check,
  Ban,
  Edit2,
  RotateCcw,
  X,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Category } from '../../types';

export const CategoriesModule: React.FC = () => {
  const {
    categories,
    addCategory,
    deactivateCategory,
    reactivateCategory,
    editCategory,
  } = useApp();

  // Add category state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [parentName, setParentName] = useState('');
  const [subsText, setSubsText] = useState('');

  // Edit category state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubcategories, setEditSubcategories] = useState<string[]>([]);
  const [newSubInput, setNewSubInput] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim()) return;
    const subList = subsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    addCategory(parentName.trim(), subList);
    setNewModalOpen(false);
    setParentName('');
    setSubsText('');
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setEditName(c.name);
    setEditSubcategories([...c.subcategories]);
    setNewSubInput('');
    setEditModalOpen(true);
  };

  const handleAddSubcategoryToEdit = () => {
    if (!newSubInput.trim()) return;
    const trimmed = newSubInput.trim();
    if (!editSubcategories.includes(trimmed)) {
      setEditSubcategories([...editSubcategories, trimmed]);
    }
    setNewSubInput('');
  };

  const handleRemoveSubcategoryFromEdit = (subToRemove: string) => {
    setEditSubcategories(editSubcategories.filter((s) => s !== subToRemove));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;
    editCategory(editingCategory.id, editName.trim(), editSubcategories);
    setEditModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">
            Procurement Categories & Taxonomy
          </h2>
          <p className="text-xs text-[#A8B5AB] mt-0.5">
            2-level category hierarchy utilized for automated tender-to-vendor matching in the database layer.
          </p>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="px-4 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] text-xs font-semibold flex items-center gap-2 hover:brightness-110 shadow"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" /> Add Parent Category
        </button>
      </div>

      {/* Categories Grid (Section 7.8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((c) => (
          <div
            key={c.id}
            className={`p-5 rounded-2xl border transition-all shadow-lg ${
              c.active
                ? 'bg-[#0D1F17] border-[#1F3A2D]'
                : 'bg-[#0D1F17]/50 border-[#1F3A2D]/50 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tags className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-bold text-sm font-serif-heading text-[#F2EFE6]">{c.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    c.active ? 'bg-[#3FB67A]/20 text-[#3FB67A]' : 'bg-[#D9534F]/20 text-[#D9534F]'
                  }`}
                >
                  {c.active ? 'Active' : 'Deactivated'}
                </span>

                {/* Edit Category Button */}
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-1.5 text-[#A8B5AB] hover:text-[#D4AF37] rounded hover:bg-[#132A20] transition-colors"
                  title="Edit Category & Subcategories"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Reactivate or Deactivate Category Button */}
                {c.active ? (
                  <button
                    onClick={() => deactivateCategory(c.id)}
                    className="p-1.5 text-[#A8B5AB] hover:text-[#D9534F] rounded hover:bg-[#132A20] transition-colors"
                    title="Deactivate Category"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => reactivateCategory(c.id)}
                    className="px-2 py-1 text-[11px] font-semibold text-[#3FB67A] hover:bg-[#3FB67A]/20 rounded border border-[#3FB67A]/40 flex items-center gap-1 transition-colors"
                    title="Reactivate Category"
                  >
                    <RotateCcw className="w-3 h-3" /> Reactivate
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#A8B5AB] font-semibold">Subcategories ({c.subcategories.length}):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.subcategories.map((sub) => (
                  <span
                    key={sub}
                    className="px-2.5 py-1 rounded-md bg-[#132A20] text-[#E8CF7A] text-[11px] border border-[#1F3A2D]"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD CATEGORY MODAL */}
      <Modal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="Add Procurement Category"
        subtitle="Specify parent category and comma-separated subcategories."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Parent Category Name *</label>
            <input
              type="text"
              required
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="e.g. Environmental and Waste Management"
              className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">
              Subcategories (Comma-separated) *
            </label>
            <textarea
              rows={3}
              required
              value={subsText}
              onChange={(e) => setSubsText(e.target.value)}
              placeholder="e.g. Hazardous Waste, Sewage Treatment, Landscaping"
              className="w-full p-2.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
            />
          </div>

          <div className="flex justify-between pt-2 border-t border-[#1F3A2D]">
            <button type="button" onClick={() => setNewModalOpen(false)} className="px-4 py-2 text-[#A8B5AB]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!parentName.trim()}
              className="px-5 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold hover:brightness-110 shadow disabled:opacity-40"
            >
              Add Category
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT CATEGORY MODAL */}
      {editingCategory && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingCategory(null);
          }}
          title={`Edit Category: ${editingCategory.name}`}
          subtitle="Modify parent category name and add or remove subcategories."
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Parent Category Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
              />
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Current Subcategories</label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#07130E] rounded-lg border border-[#1F3A2D]">
                {editSubcategories.length === 0 ? (
                  <span className="text-[#A8B5AB] italic">No subcategories defined. Add one below.</span>
                ) : (
                  editSubcategories.map((sub) => (
                    <span
                      key={sub}
                      className="px-2.5 py-1 rounded-md bg-[#132A20] text-[#E8CF7A] text-[11px] border border-[#1F3A2D] flex items-center gap-1.5"
                    >
                      {sub}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcategoryFromEdit(sub)}
                        className="text-[#A8B5AB] hover:text-[#D9534F] transition-colors"
                        title="Remove subcategory"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Add Subcategory</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubInput}
                  onChange={(e) => setNewSubInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubcategoryToEdit();
                    }
                  }}
                  placeholder="e.g. Drone Surveying"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSubcategoryToEdit}
                  disabled={!newSubInput.trim()}
                  className="px-3.5 py-2 rounded-lg bg-[#132A20] hover:bg-[#1F3A2D] text-[#D4AF37] border border-[#1F3A2D] font-semibold text-xs disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-[#1F3A2D]">
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingCategory(null);
                }}
                className="px-4 py-2 text-[#A8B5AB]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!editName.trim()}
                className="px-5 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold hover:brightness-110 shadow disabled:opacity-40"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
