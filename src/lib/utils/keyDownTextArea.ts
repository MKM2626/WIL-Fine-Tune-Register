

export function tabIndentation(node: HTMLTextAreaElement) {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key == 'Tab') {
            const { value, selectionStart, selectionEnd } = node;
            event.preventDefault();

            if (!event.shiftKey) {
                document.execCommand('insertText', false, '\t');
                return;
            }

            const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;

            if (value[lineStart] == '\t') {
                node.setSelectionRange(lineStart, lineStart + 1);
                document.execCommand('insertText', false, '');
                
                const offset = selectionStart === lineStart ? 0 : 1;
                node.setSelectionRange(selectionStart - offset, selectionEnd - offset);
            }
        }

        if (event.key == 'Enter' && event.shiftKey) {
            event.preventDefault();
            const form = node.closest('form');
            if (!form) return;

            const inputs = Array.from(
                form.querySelectorAll<HTMLElement>(
                    'input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
                )
            );

            const currentIndex = inputs.indexOf(node);
            const next = inputs[currentIndex + 1];
            next?.focus();
        }
    };

    node.addEventListener('keydown', handleKeyDown);

    return {
        destroy() {
            node.removeEventListener('keydown', handleKeyDown);
        }
    };
}