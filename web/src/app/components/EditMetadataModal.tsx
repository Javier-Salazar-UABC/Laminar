import { useState } from 'react';
import { X } from 'lucide-react';
import { FileMetadata } from '../data/mockData';
import { Button } from './Button';
import { Pill } from './Pill';

interface EditMetadataModalProps {
  file: FileMetadata;
  onClose: () => void;
  onSave: (data: { description: string; tags: string[]; author: string }) => void;
}

export function EditMetadataModal({ file, onClose, onSave }: EditMetadataModalProps) {
  const [description, setDescription] = useState(file.description);
  const [tags, setTags] = useState<string[]>(file.tags);
  const [author, setAuthor] = useState(file.author);
  const [newTag, setNewTag] = useState('');
  
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleSave = () => {
    onSave({ description, tags, author });
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[560px] rounded-[var(--radius-card)] overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            fontFamily: 'var(--font-family-base)'
          }}
        >
          {/* Top stripe */}
          <div 
            className="h-1"
            style={{ backgroundColor: 'var(--purple-dark)' }}
          />
          
          {/* Header */}
          <div 
            className="p-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <h2 
              className="text-lg"
              style={{ 
                color: 'var(--text-main)',
                fontWeight: 600
              }}
            >
              Editar Metadatos
            </h2>
            <button
              onClick={onClose}
              className="hover:opacity-70 transition-opacity"
            >
              <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
          
          {/* Form */}
          <div className="p-6 space-y-5">
            {/* File name (read-only) */}
            <div>
              <label 
                className="block mb-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Archivo
              </label>
              <p 
                className="text-sm"
                style={{ 
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-family-mono)'
                }}
              >
                {file.name}
              </p>
            </div>
            
            {/* Description */}
            <div>
              <label 
                className="block mb-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica qué hace este código en lenguaje humano..."
                rows={4}
                className="w-full px-3 py-2 rounded-[var(--radius-input)] outline-none resize-none text-sm"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-family-base)'
                }}
              />
            </div>
            
            {/* Tags */}
            <div>
              <label 
                className="block mb-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Etiquetas
              </label>
              
              {/* Tag input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Agregar etiqueta..."
                  className="flex-1 px-3 py-2 rounded-[var(--radius-input)] outline-none text-sm"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)'
                  }}
                />
                <Button variant="outline" onClick={handleAddTag}>
                  Agregar
                </Button>
              </div>
              
              {/* Tag list */}
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, idx) => (
                  <Pill key={idx} variant="removable" onRemove={() => handleRemoveTag(tag)}>
                    {tag}
                  </Pill>
                ))}
              </div>
            </div>
            
            {/* Author */}
            <div>
              <label 
                className="block mb-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Autor
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-input)] outline-none text-sm"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)'
                }}
              />
            </div>
          </div>
          
          {/* Footer */}
          <div 
            className="p-4 border-t flex items-center justify-end gap-3"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <Button variant="gray" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="blue" onClick={handleSave}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
