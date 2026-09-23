export function tabIndentation(node: HTMLTextAreaElement) {
    const handleKeyDown = (event: KeyboardEvent) => {

        

        if (event.key == 'Tab') {

            const { value, selectionStart, selectionEnd } = node;

            event.preventDefault();

            if (!event.shiftKey) {
                node.value =
                    value.substring(0, selectionStart) +
                    '\t' +
                    value.substring(selectionEnd);

                const newCursorPosition = selectionStart + 1;

                node.selectionStart = newCursorPosition;
                node.selectionEnd = newCursorPosition;

                node.dispatchEvent(new Event('input', { bubbles: true }));

                return;
            }

            const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;

            if (value[lineStart] === '\t') {
                node.value =
                    value.substring(0, lineStart) +
                    value.substring(lineStart + 1);

                node.selectionStart = Math.max(lineStart, selectionStart - 1);
                node.selectionEnd = Math.max(lineStart, selectionEnd - 1);

                node.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        if (event.key == 'Enter' && event.shiftKey) {
            event.preventDefault()

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