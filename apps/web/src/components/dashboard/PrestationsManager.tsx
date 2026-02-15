'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { trpc } from '@/lib/trpc/client';
import { Button, Input, Card, Spinner, Badge } from '@/components/ui';
import { ServiceForm } from './ServiceForm';

// ===== TYPES =====

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  order: number;
  services: ServiceItem[];
  _count: { services: number };
}

interface CategoryWithServices {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  order: number;
  services: ServiceItem[];
  children: SubCategory[];
  _count: { services: number };
}

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  categoryId: string;
  order: number;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  };
}

interface PrestationsManagerProps {
  salonId: string;
}

// ===== GRIP ICON =====

function GripIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <circle cx="5" cy="3" r="1.5" />
      <circle cx="11" cy="3" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="13" r="1.5" />
      <circle cx="11" cy="13" r="1.5" />
    </svg>
  );
}

// ===== SORTABLE SERVICE CARD =====

interface SortableServiceCardProps {
  service: ServiceItem;
  onEdit: (service: ServiceItem) => void;
  onDelete: (serviceId: string) => void;
}

function SortableServiceCard({ service, onEdit, onDelete }: SortableServiceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: service.id, data: { type: 'service', service } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-sand-50 rounded-lg group hover:bg-sand-100 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-coffee-300 hover:text-coffee-500 touch-none"
        tabIndex={-1}
      >
        <GripIcon />
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-coffee-800 truncate">{service.name}</p>
        {service.description && (
          <p className="text-xs text-coffee-400 truncate">{service.description}</p>
        )}
      </div>

      <span className="text-sm text-coffee-500 whitespace-nowrap">
        {service.durationMinutes} min
      </span>

      <span className="font-semibold text-coffee-800 whitespace-nowrap">
        {(service.price / 100).toFixed(2)} €
      </span>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(service)}
          className="p-1.5 text-coffee-400 hover:text-coffee-700 hover:bg-sand-200 rounded-md transition-colors"
          title="Modifier"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(service.id)}
          className="p-1.5 text-coffee-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Supprimer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Static version for DragOverlay
function ServiceCardOverlay({ service }: { service: ServiceItem }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-lg ring-2 ring-cream-400">
      <GripIcon className="text-coffee-400" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-coffee-800 truncate">{service.name}</p>
      </div>
      <span className="text-sm text-coffee-500">{service.durationMinutes} min</span>
      <span className="font-semibold text-coffee-800">{(service.price / 100).toFixed(2)} €</span>
    </div>
  );
}

// ===== SORTABLE SUB-CATEGORY SECTION =====

interface SortableSubCategorySectionProps {
  subCategory: SubCategory;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onEditService: (service: ServiceItem) => void;
  onDeleteService: (serviceId: string) => void;
  onAddService: (categoryId: string) => void;
}

function SortableSubCategorySection({
  subCategory,
  isExpanded,
  onToggleExpand,
  onEditCategory,
  onDeleteCategory,
  onEditService,
  onDeleteService,
  onAddService,
}: SortableSubCategorySectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `subcat-${subCategory.id}`, data: { type: 'subcategory', subCategory } });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(subCategory.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== subCategory.name) {
      onEditCategory(subCategory.id, trimmed);
    }
    setIsEditing(false);
    setEditName(subCategory.name);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-sand-50 rounded-xl border border-sand-200 overflow-hidden">
      {/* Sub-category Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-coffee-300 hover:text-coffee-500 touch-none"
          tabIndex={-1}
        >
          <GripIcon />
        </button>

        {subCategory.icon && <span className="text-base">{subCategory.icon}</span>}

        {isEditing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveName();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditName(subCategory.name);
              }
            }}
            className="flex-1 text-sm font-semibold text-coffee-800 bg-white border border-sand-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-cream-400"
          />
        ) : (
          <h4
            className="flex-1 text-sm font-semibold text-coffee-700 cursor-pointer hover:text-cream-700 transition-colors"
            onDoubleClick={() => {
              setEditName(subCategory.name);
              setIsEditing(true);
            }}
            title="Double-cliquez pour renommer"
          >
            {subCategory.name}
          </h4>
        )}

        <Badge variant="default" className="text-xs">{subCategory.services.length}</Badge>

        {subCategory.services.length === 0 && (
          <button
            onClick={() => onDeleteCategory(subCategory.id)}
            className="p-1 text-coffee-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Supprimer la sous-catégorie"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}

        <button
          onClick={onToggleExpand}
          className="p-1 text-coffee-400 hover:text-coffee-700 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Services */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <SortableContext
            items={subCategory.services.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {subCategory.services.map((service) => (
                <SortableServiceCard
                  key={service.id}
                  service={service}
                  onEdit={onEditService}
                  onDelete={onDeleteService}
                />
              ))}
            </div>
          </SortableContext>

          {subCategory.services.length === 0 && (
            <div className="py-4 text-center text-sm text-coffee-400 border-2 border-dashed border-sand-300 rounded-lg">
              Glissez une prestation ici ou ajoutez-en une
            </div>
          )}

          <button
            onClick={() => onAddService(subCategory.id)}
            className="mt-2 flex items-center gap-1.5 text-xs text-cream-700 hover:text-cream-800 font-medium transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Ajouter une prestation
          </button>
        </div>
      )}
    </div>
  );
}

// ===== SORTABLE CATEGORY SECTION =====

interface SortableCategorySectionProps {
  category: CategoryWithServices;
  isExpanded: boolean;
  expandedSubCategories: Set<string>;
  onToggleExpand: () => void;
  onToggleSubExpand: (subCatId: string) => void;
  onEditCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onEditService: (service: ServiceItem) => void;
  onDeleteService: (serviceId: string) => void;
  onAddService: (categoryId: string) => void;
  onAddSubCategory: (parentId: string) => void;
}

function SortableCategorySection({
  category,
  isExpanded,
  expandedSubCategories,
  onToggleExpand,
  onToggleSubExpand,
  onEditCategory,
  onDeleteCategory,
  onEditService,
  onDeleteService,
  onAddService,
  onAddSubCategory,
}: SortableCategorySectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `cat-${category.id}`, data: { type: 'category', category } });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== category.name) {
      onEditCategory(category.id, trimmed);
    }
    setIsEditing(false);
    setEditName(category.name);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const totalServiceCount = category.services.length + category.children.reduce((sum, sub) => sum + sub.services.length, 0);
  const canDelete = totalServiceCount === 0 && category.children.length === 0;

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-2xl shadow-soft overflow-hidden">
      {/* Category Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-coffee-300 hover:text-coffee-500 touch-none"
          tabIndex={-1}
        >
          <GripIcon />
        </button>

        {category.icon && <span className="text-xl">{category.icon}</span>}

        {isEditing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveName();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditName(category.name);
              }
            }}
            className="flex-1 text-lg font-semibold text-coffee-800 bg-sand-50 border border-sand-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-cream-400"
          />
        ) : (
          <h3
            className="flex-1 text-lg font-semibold text-coffee-800 cursor-pointer hover:text-cream-700 transition-colors"
            onDoubleClick={() => {
              setEditName(category.name);
              setIsEditing(true);
            }}
            title="Double-cliquez pour renommer"
          >
            {category.name}
          </h3>
        )}

        <Badge variant="default">{totalServiceCount}</Badge>

        {canDelete && (
          <button
            onClick={() => onDeleteCategory(category.id)}
            className="p-1.5 text-coffee-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Supprimer la catégorie"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}

        <button
          onClick={onToggleExpand}
          className="p-1.5 text-coffee-400 hover:text-coffee-700 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Content: sub-categories + direct services */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Sub-categories */}
          {category.children.length > 0 && (
            <SortableContext
              items={category.children.map((sc) => `subcat-${sc.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {category.children.map((subCat) => (
                  <SortableSubCategorySection
                    key={subCat.id}
                    subCategory={subCat}
                    isExpanded={expandedSubCategories.has(subCat.id)}
                    onToggleExpand={() => onToggleSubExpand(subCat.id)}
                    onEditCategory={onEditCategory}
                    onDeleteCategory={onDeleteCategory}
                    onEditService={onEditService}
                    onDeleteService={onDeleteService}
                    onAddService={onAddService}
                  />
                ))}
              </div>
            </SortableContext>
          )}

          {/* Direct services (not in sub-categories) */}
          {category.services.length > 0 && (
            <SortableContext
              items={category.services.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {category.children.length > 0 && (
                  <p className="text-xs text-coffee-400 font-medium uppercase tracking-wide mt-2">
                    Sans sous-catégorie
                  </p>
                )}
                {category.services.map((service) => (
                  <SortableServiceCard
                    key={service.id}
                    service={service}
                    onEdit={onEditService}
                    onDelete={onDeleteService}
                  />
                ))}
              </div>
            </SortableContext>
          )}

          {category.services.length === 0 && category.children.length === 0 && (
            <div className="py-6 text-center text-coffee-400 border-2 border-dashed border-sand-200 rounded-lg">
              Glissez une prestation ici ou ajoutez-en une
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 mt-3">
            <button
              onClick={() => onAddService(category.id)}
              className="flex items-center gap-2 text-sm text-cream-700 hover:text-cream-800 font-medium transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Ajouter une prestation
            </button>
            <button
              onClick={() => onAddSubCategory(category.id)}
              className="flex items-center gap-2 text-sm text-coffee-500 hover:text-coffee-700 font-medium transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
              Sous-catégorie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Static overlays for DragOverlay
function CategoryOverlay({ category }: { category: CategoryWithServices }) {
  const totalServiceCount = category.services.length + category.children.reduce((sum, sub) => sum + sub.services.length, 0);
  return (
    <div className="bg-white rounded-2xl shadow-lg ring-2 ring-cream-400 p-4">
      <div className="flex items-center gap-3">
        <GripIcon className="text-coffee-400" />
        {category.icon && <span className="text-xl">{category.icon}</span>}
        <h3 className="text-lg font-semibold text-coffee-800">{category.name}</h3>
        <Badge variant="default">{totalServiceCount}</Badge>
      </div>
    </div>
  );
}

function SubCategoryOverlay({ subCategory }: { subCategory: SubCategory }) {
  return (
    <div className="bg-sand-50 rounded-xl shadow-lg ring-2 ring-cream-400 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <GripIcon className="text-coffee-400" />
        {subCategory.icon && <span className="text-base">{subCategory.icon}</span>}
        <h4 className="text-sm font-semibold text-coffee-700">{subCategory.name}</h4>
        <Badge variant="default" className="text-xs">{subCategory.services.length}</Badge>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====

export function PrestationsManager({ salonId }: PrestationsManagerProps) {
  // Queries
  const { data: categoriesData, isLoading, refetch } = trpc.category.getBySalonId.useQuery(
    { salonId },
    { enabled: !!salonId }
  );

  // Local state for optimistic DnD
  const [categories, setCategories] = useState<CategoryWithServices[]>([]);

  // Sync with server data
  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData as CategoryWithServices[]);
    }
  }, [categoriesData]);

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'category' | 'subcategory' | 'service' | null>(null);

  // UI state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceDefaultCategoryId, setServiceDefaultCategoryId] = useState<string>('');

  // Sub-category creation state
  const [addingSubCategoryFor, setAddingSubCategoryFor] = useState<string | null>(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const subCatInputRef = useRef<HTMLInputElement>(null);

  // Expand all categories and sub-categories by default
  useEffect(() => {
    if (categoriesData) {
      setExpandedCategories(new Set(categoriesData.map((c) => c.id)));
      const allSubCats = new Set<string>();
      for (const cat of categoriesData) {
        const children = (cat as CategoryWithServices).children;
        if (children) {
          for (const sub of children) {
            allSubCats.add(sub.id);
          }
        }
      }
      setExpandedSubCategories(allSubCats);
    }
  }, [categoriesData]);

  // Focus sub-category input when it appears
  useEffect(() => {
    if (addingSubCategoryFor && subCatInputRef.current) {
      subCatInputRef.current.focus();
    }
  }, [addingSubCategoryFor]);

  // Mutations
  const createCategoryMutation = trpc.category.create.useMutation({
    onSuccess: () => refetch(),
  });
  const updateCategoryMutation = trpc.category.update.useMutation({
    onSuccess: () => refetch(),
  });
  const deleteCategoryMutation = trpc.category.delete.useMutation({
    onSuccess: () => refetch(),
  });
  const reorderCategoriesMutation = trpc.category.reorder.useMutation();
  const reorderServicesMutation = trpc.service.reorder.useMutation();
  const deleteServiceMutation = trpc.service.delete.useMutation({
    onSuccess: () => refetch(),
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ===== Helper: find service's container (category or sub-category) =====

  const findServiceContainer = useCallback((serviceId: string, cats: CategoryWithServices[]) => {
    for (const cat of cats) {
      if (cat.services.some((s) => s.id === serviceId)) {
        return { type: 'category' as const, categoryId: cat.id };
      }
      for (const sub of cat.children) {
        if (sub.services.some((s) => s.id === serviceId)) {
          return { type: 'subcategory' as const, categoryId: cat.id, subCategoryId: sub.id };
        }
      }
    }
    return null;
  }, []);

  // ===== DnD Handlers =====

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;

    if (id.startsWith('cat-')) {
      setActiveId(id);
      setActiveType('category');
    } else if (id.startsWith('subcat-')) {
      setActiveId(id);
      setActiveType('subcategory');
    } else {
      setActiveId(id);
      setActiveType('service');
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (activeType === 'service') {
      // Find where the active service currently is
      const activeContainer = findServiceContainer(activeIdStr, categories);
      if (!activeContainer) return;

      // Find where the over element belongs
      let overContainerId: string | undefined;

      if (overIdStr.startsWith('subcat-')) {
        overContainerId = overIdStr.replace('subcat-', '');
      } else if (overIdStr.startsWith('cat-')) {
        overContainerId = overIdStr.replace('cat-', '');
      } else {
        // Over is another service — find its container
        const overContainer = findServiceContainer(overIdStr, categories);
        if (overContainer) {
          overContainerId = overContainer.type === 'subcategory' ? overContainer.subCategoryId : overContainer.categoryId;
        }
      }

      if (!overContainerId) return;

      const activeContainerId = activeContainer.type === 'subcategory' ? activeContainer.subCategoryId : activeContainer.categoryId;

      if (activeContainerId === overContainerId) return;

      // Move service from one container to another (optimistic)
      setCategories((prev) => {
        // Find and extract the service
        let movedService: ServiceItem | undefined;

        const updated = prev.map((cat) => {
          // Check direct services of this category
          const serviceInDirect = cat.services.find((s) => s.id === activeIdStr);
          if (serviceInDirect) {
            movedService = serviceInDirect;
            return {
              ...cat,
              services: cat.services.filter((s) => s.id !== activeIdStr),
            };
          }

          // Check sub-categories
          const updatedChildren = cat.children.map((sub) => {
            const serviceInSub = sub.services.find((s) => s.id === activeIdStr);
            if (serviceInSub) {
              movedService = serviceInSub;
              return { ...sub, services: sub.services.filter((s) => s.id !== activeIdStr) };
            }
            return sub;
          });

          if (updatedChildren !== cat.children) {
            return { ...cat, children: updatedChildren };
          }
          return cat;
        });

        if (!movedService) return prev;

        // Insert into the target container
        return updated.map((cat) => {
          if (cat.id === overContainerId) {
            const overIndex = cat.services.findIndex((s) => s.id === overIdStr);
            const insertIndex = overIndex >= 0 ? overIndex : cat.services.length;
            const newServices = [...cat.services];
            newServices.splice(insertIndex, 0, { ...movedService!, categoryId: cat.id });
            return { ...cat, services: newServices };
          }

          const updatedChildren = cat.children.map((sub) => {
            if (sub.id === overContainerId) {
              const overIndex = sub.services.findIndex((s) => s.id === overIdStr);
              const insertIndex = overIndex >= 0 ? overIndex : sub.services.length;
              const newServices = [...sub.services];
              newServices.splice(insertIndex, 0, { ...movedService!, categoryId: sub.id });
              return { ...sub, services: newServices };
            }
            return sub;
          });

          return { ...cat, children: updatedChildren };
        });
      });
    }
  }, [activeType, categories, findServiceContainer]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (activeIdStr === overIdStr) return;

    // Category reorder
    if (activeIdStr.startsWith('cat-') && overIdStr.startsWith('cat-')) {
      const activeCatId = activeIdStr.replace('cat-', '');
      const overCatId = overIdStr.replace('cat-', '');

      setCategories((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === activeCatId);
        const newIndex = prev.findIndex((c) => c.id === overCatId);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const reordered = arrayMove(prev, oldIndex, newIndex);
        reorderCategoriesMutation.mutate({
          salonId,
          categoryIds: reordered.map((c) => c.id),
        });
        return reordered;
      });
      return;
    }

    // Sub-category reorder within same parent
    if (activeIdStr.startsWith('subcat-') && overIdStr.startsWith('subcat-')) {
      const activeSubId = activeIdStr.replace('subcat-', '');
      const overSubId = overIdStr.replace('subcat-', '');

      setCategories((prev) => {
        return prev.map((cat) => {
          const oldIndex = cat.children.findIndex((sc) => sc.id === activeSubId);
          const newIndex = cat.children.findIndex((sc) => sc.id === overSubId);
          if (oldIndex === -1 || newIndex === -1) return cat;

          const reordered = arrayMove(cat.children, oldIndex, newIndex);

          // Persist
          reorderCategoriesMutation.mutate({
            salonId,
            categoryIds: reordered.map((sc) => sc.id),
          });

          return { ...cat, children: reordered };
        });
      });
      return;
    }

    // Service reorder (within same container — cross-container was handled in onDragOver)
    if (!activeIdStr.startsWith('cat-') && !activeIdStr.startsWith('subcat-') &&
        !overIdStr.startsWith('cat-') && !overIdStr.startsWith('subcat-')) {

      setCategories((prev) => {
        return prev.map((cat) => {
          // Check direct services
          const oldIdx = cat.services.findIndex((s) => s.id === activeIdStr);
          const newIdx = cat.services.findIndex((s) => s.id === overIdStr);
          if (oldIdx !== -1 && newIdx !== -1) {
            return { ...cat, services: arrayMove(cat.services, oldIdx, newIdx) };
          }

          // Check sub-categories
          const updatedChildren = cat.children.map((sub) => {
            const subOld = sub.services.findIndex((s) => s.id === activeIdStr);
            const subNew = sub.services.findIndex((s) => s.id === overIdStr);
            if (subOld !== -1 && subNew !== -1) {
              return { ...sub, services: arrayMove(sub.services, subOld, subNew) };
            }
            return sub;
          });

          return { ...cat, children: updatedChildren };
        });
      });
    }

    // Persist all service orders to backend
    setTimeout(() => {
      setCategories((currentCats) => {
        const allServices = currentCats.flatMap((cat) => [
          ...cat.services.map((s, index) => ({ id: s.id, categoryId: cat.id, order: index })),
          ...cat.children.flatMap((sub) =>
            sub.services.map((s, index) => ({ id: s.id, categoryId: sub.id, order: index }))
          ),
        ]);

        if (allServices.length > 0) {
          reorderServicesMutation.mutate({ salonId, services: allServices });
        }

        return currentCats;
      });
    }, 0);
  }, [salonId, reorderCategoriesMutation, reorderServicesMutation]);

  // ===== Category Actions =====

  const handleCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    createCategoryMutation.mutate({ salonId, name: trimmed });
    setNewCategoryName('');
  };

  const handleCreateSubCategory = (parentId: string) => {
    const trimmed = newSubCategoryName.trim();
    if (!trimmed) return;
    createCategoryMutation.mutate({ salonId, name: trimmed, parentId });
    setNewSubCategoryName('');
    setAddingSubCategoryFor(null);
  };

  const handleEditCategory = (id: string, name: string) => {
    updateCategoryMutation.mutate({ id, name });
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategoryMutation.mutate({ id });
  };

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const toggleSubExpand = (subCatId: string) => {
    setExpandedSubCategories((prev) => {
      const next = new Set(prev);
      if (next.has(subCatId)) next.delete(subCatId);
      else next.add(subCatId);
      return next;
    });
  };

  // ===== Service Actions =====

  const handleAddService = (categoryId: string) => {
    setServiceDefaultCategoryId(categoryId);
    setEditingService(null);
    setShowServiceForm(true);
  };

  const handleEditService = (service: ServiceItem) => {
    setServiceDefaultCategoryId(service.categoryId);
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleDeleteService = (serviceId: string) => {
    deleteServiceMutation.mutate({ id: serviceId });
  };

  const handleAddSubCategory = (parentId: string) => {
    setAddingSubCategoryFor(parentId);
    setNewSubCategoryName('');
  };

  // ===== Find active items for overlay =====

  const getActiveCategory = (): CategoryWithServices | undefined => {
    if (!activeId || activeType !== 'category') return undefined;
    const catId = activeId.replace('cat-', '');
    return categories.find((c) => c.id === catId);
  };

  const getActiveSubCategory = (): SubCategory | undefined => {
    if (!activeId || activeType !== 'subcategory') return undefined;
    const subId = activeId.replace('subcat-', '');
    for (const cat of categories) {
      const sub = cat.children.find((sc) => sc.id === subId);
      if (sub) return sub;
    }
    return undefined;
  };

  const getActiveService = (): ServiceItem | undefined => {
    if (!activeId || activeType !== 'service') return undefined;
    for (const cat of categories) {
      const service = cat.services.find((s) => s.id === activeId);
      if (service) return service;
      for (const sub of cat.children) {
        const subService = sub.services.find((s) => s.id === activeId);
        if (subService) return subService;
      }
    }
    return undefined;
  };

  // ===== Render =====

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map((c) => `cat-${c.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id}>
                <SortableCategorySection
                  category={category}
                  isExpanded={expandedCategories.has(category.id)}
                  expandedSubCategories={expandedSubCategories}
                  onToggleExpand={() => toggleExpand(category.id)}
                  onToggleSubExpand={toggleSubExpand}
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onEditService={handleEditService}
                  onDeleteService={handleDeleteService}
                  onAddService={handleAddService}
                  onAddSubCategory={handleAddSubCategory}
                />

                {/* Inline sub-category creation */}
                {addingSubCategoryFor === category.id && (
                  <div className="mt-2 ml-8 flex gap-2">
                    <input
                      ref={subCatInputRef}
                      value={newSubCategoryName}
                      onChange={(e) => setNewSubCategoryName(e.target.value)}
                      placeholder="Nom de la sous-catégorie..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSubCategory(category.id);
                        if (e.key === 'Escape') setAddingSubCategoryFor(null);
                      }}
                      className="flex-1 text-sm bg-white border border-sand-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-cream-400"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleCreateSubCategory(category.id)}
                      disabled={!newSubCategoryName.trim() || createCategoryMutation.isPending}
                    >
                      Créer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAddingSubCategoryFor(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeType === 'category' && getActiveCategory() && (
            <CategoryOverlay category={getActiveCategory()!} />
          )}
          {activeType === 'subcategory' && getActiveSubCategory() && (
            <SubCategoryOverlay subCategory={getActiveSubCategory()!} />
          )}
          {activeType === 'service' && getActiveService() && (
            <ServiceCardOverlay service={getActiveService()!} />
          )}
        </DragOverlay>
      </DndContext>

      {/* Empty state */}
      {categories.length === 0 && (
        <Card className="text-center py-12 mb-4">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-semibold text-coffee-800 mb-2">Aucune catégorie</h3>
          <p className="text-coffee-600">
            Créez votre première catégorie pour organiser vos prestations.
          </p>
        </Card>
      )}

      {/* Add category */}
      <div className="mt-6 flex gap-3">
        <Input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nom de la catégorie..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreateCategory();
          }}
        />
        <Button
          onClick={handleCreateCategory}
          disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
          variant="outline"
        >
          {createCategoryMutation.isPending ? 'Création...' : '+ Catégorie'}
        </Button>
      </div>

      {/* ServiceForm modal */}
      <ServiceForm
        isOpen={showServiceForm}
        onClose={() => {
          setShowServiceForm(false);
          setEditingService(null);
        }}
        salonId={salonId}
        service={editingService ? {
          id: editingService.id,
          name: editingService.name,
          description: editingService.description,
          price: editingService.price,
          durationMinutes: editingService.durationMinutes,
          categoryId: editingService.categoryId,
        } : undefined}
        defaultCategoryId={serviceDefaultCategoryId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
