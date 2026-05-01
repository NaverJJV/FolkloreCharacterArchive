import { useState } from 'react';
import html2pdf from 'html2pdf.js';
import './App.css'; // Reusing your existing button styles

function ExportMenu({ title, rawData, type, targetId }) {
    const [isOpen, setIsOpen] = useState(false);

    // --- Formatters ---
    const generateMarkdown = () => {
        if (type === 'story') {
            return `# ${rawData.title}\n\n**Era:** ${rawData.publication_date || 'Unknown'}\n\n## Synopsis\n*${rawData.synopsis || 'No synopsis'}*\n\n## The Tale\n${rawData.content || 'No content written yet.'}`;
        } else if (type === 'character') {
            return `# ${rawData.name}\n**Alias:** "${rawData.alias}"\n**Era:** ${rawData.origin_name || 'Unknown'}\n\n## Description\n${rawData.description || 'None'}\n\n## Appearance\n${rawData.appearance || 'None'}\n\n## Personality\n${rawData.personality || 'None'}\n\n## Story Synopsis\n${rawData.story_synopsis || 'None'}`;
        }
        return '';
    };

    const generatePlainText = () => {
        // Strip markdown formatting for pure text
        return generateMarkdown().replace(/[#*]/g, '');
    };

    // --- Download Handlers ---
    const triggerDownload = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsOpen(false);
    };

    const handleTxt = () => {
        const content = generatePlainText();
        triggerDownload(content, `${title.replace(/\s+/g, '_')}.txt`, 'text/plain');
    };

    const handleMd = () => {
        const content = generateMarkdown();
        triggerDownload(content, `${title.replace(/\s+/g, '_')}.md`, 'text/markdown');
    };

    const handlePdf = () => {
        const element = document.getElementById(targetId);

        // Hide the edit buttons temporarily for a clean PDF
        const editButtons = element.querySelectorAll('.inline-edit-icon, .edit-tale-btn, .toggle-button');
        editButtons.forEach(btn => btn.style.display = 'none');

        const opt = {
            margin:       0.5,
            filename:     `${title.replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            // Restore buttons after PDF generates
            editButtons.forEach(btn => btn.style.display = '');
            setIsOpen(false);
        });
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                className="edit-button"
                onClick={() => setIsOpen(!isOpen)}
                style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-ink)', color: 'var(--color-parchment)' }}
            >
                ↓ Export
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '5px',
                    backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-card)',
                    display: 'flex', flexDirection: 'column', zIndex: 100, width: '120px', overflow: 'hidden'
                }}>
                    <button onClick={handleTxt} style={dropdownItemStyle}>.TXT (Plain)</button>
                    <button onClick={handleMd} style={dropdownItemStyle}>.MD (Markdown)</button>
                    <button onClick={handlePdf} style={dropdownItemStyle}>.PDF (Document)</button>
                </div>
            )}
        </div>
    );
}

const dropdownItemStyle = {
    padding: '0.6rem 1rem',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-ink-soft)',
    borderBottom: '1px solid var(--border-light)'
};

export default ExportMenu;