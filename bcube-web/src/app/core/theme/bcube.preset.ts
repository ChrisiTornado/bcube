import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

// Colours reference the CSS variables from src/styles/_tokens.scss so the brand
// palette stays defined in exactly one place.
const orange = 'var(--bcube-orange)';
const orangeStrong = 'var(--bcube-orange-strong)';
const ink = 'var(--bcube-on-orange)';
const soft = 'rgba(var(--bcube-orange-rgb), 0.08)';
const softHover = 'var(--state-hover-bg)';
const line = 'rgba(var(--bcube-orange-rgb), 0.28)';
const lineHover = 'var(--state-hover-line)';
const text = 'var(--bcube-text)';
const textSoft = 'var(--bcube-text-soft)';

// Text-style form controls (inputtext, textarea, multiselect; also the datepicker
// and password inputs, which render a .p-inputtext).
const fieldLine = 'rgba(var(--bcube-orange-rgb), 0.18)';
const fieldFill = 'rgba(255, 255, 255, 0.06)';
const fieldHoverLine = 'rgba(var(--bcube-orange-rgb), 0.42)';
const fieldFocusRing = '0 0 0 4px rgba(var(--bcube-orange-rgb), 0.16)';

const fieldShape = {
  borderRadius: 'var(--radius-md)',
  focusRing: { width: '0', style: 'none', color: 'unset', offset: '0', shadow: fieldFocusRing },
};

const field = {
  background: fieldFill,
  disabledBackground: fieldFill,
  filledBackground: fieldFill,
  filledHoverBackground: fieldFill,
  filledFocusBackground: fieldFill,
  borderColor: fieldLine,
  hoverBorderColor: fieldHoverLine,
  focusBorderColor: orange,
  color: text,
  disabledColor: textSoft,
  placeholderColor: 'rgba(255, 255, 255, 0.45)',
  shadow: 'none',
};

// Dropdown surface matches the outlined button palette.
const selectField = {
  ...field,
  background: soft,
  disabledBackground: soft,
  filledBackground: soft,
  filledHoverBackground: soft,
  filledFocusBackground: soft,
  borderColor: line,
  placeholderColor: textSoft,
};


const solid = {
  background: orange,
  hoverBackground: orangeStrong,
  activeBackground: orangeStrong,
  borderColor: orange,
  hoverBorderColor: orangeStrong,
  activeBorderColor: orangeStrong,
  color: ink,
  hoverColor: ink,
  activeColor: ink,
};

// Dark panel surface shared by dialogs, cards, dropdown panels and toasts.
const panelFill = 'rgba(12, 12, 12, 0.96)';
const panelGradient = `linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)), ${panelFill}`;
const panelLine = 'rgba(var(--bcube-orange-rgb), 0.18)';
const panelShadow = 'var(--bcube-shadow)';
const dividerLine = 'rgba(var(--bcube-orange-rgb), 0.14)';

const toastSeverity = {
  background: panelFill,
  borderColor: panelLine,
  color: text,
  detailColor: orange,
  shadow: panelShadow,
  closeButton: { hoverBackground: softHover, focusRing: { color: orange, shadow: 'none' } },
};

export const BcubePreset = definePreset(Aura, {
  semantic: {
    colorScheme: { light: { mask: { background: 'rgba(5, 5, 5, 0.6)' } } },
  },
  components: {
    dialog: {
      colorScheme: { light: { root: { background: panelFill, borderColor: panelLine, color: text, shadow: panelShadow } } },
      css: () => `
        .p-dialog { background: ${panelGradient}; }
        .p-dialog-header { border-bottom: 1px solid ${dividerLine}; }
        .p-dialog-footer { border-top: 1px solid ${dividerLine}; }
      `,
    },
    datatable: {
      headerCell: { padding: '0.8rem 1rem' },
      bodyCell: { padding: '0.4rem 1rem' },
      colorScheme: {
        light: {
          headerCell: {
            background: 'rgba(var(--bcube-orange-rgb), 0.12)',
            hoverBackground: 'rgba(var(--bcube-orange-rgb), 0.12)',
            selectedBackground: 'rgba(var(--bcube-orange-rgb), 0.12)',
            borderColor: 'rgba(var(--bcube-orange-rgb), 0.18)',
            color: text,
            hoverColor: text,
            selectedColor: text,
          },
          row: {
            background: 'transparent',
            hoverBackground: 'rgba(var(--bcube-orange-rgb), 0.08)',
            color: text,
            hoverColor: text,
          },
          sortIcon: { color: orange, hoverColor: orange },
          root: { borderColor: 'rgba(255, 255, 255, 0.06)' },
        },
      },
    },
    megamenu: {
      item: { padding: '0.65rem 0.8rem', gap: '0.5rem' },
      colorScheme: {
        light: {
          root: { background: 'transparent', borderColor: 'transparent', color: text },
          item: {
            focusBackground: softHover,
            activeBackground: softHover,
            color: text,
            focusColor: text,
            activeColor: text,
            icon: { color: text, focusColor: text, activeColor: text },
          },
          submenuIcon: { color: text, focusColor: text, activeColor: text },
        },
      },
    },
    confirmdialog: { icon: { color: orange } },
    card: {
      colorScheme: {
        light: {
          root: { background: panelFill, color: text, shadow: panelShadow },
          subtitle: { color: text },
        },
      },
      css: () => `.p-card { background: ${panelGradient}; border: 1px solid ${panelLine}; }`,
    },
    toast: {
      colorScheme: {
        light: { info: toastSeverity, success: toastSeverity, warn: toastSeverity, error: toastSeverity },
      },
      css: () => `
        .p-toast-message { background: ${panelGradient}; }
        .p-toast-close-icon, .p-toast-close-button { color: ${orange}; }
      `,
    },
    floatlabel: {
      colorScheme: { light: { root: { color: textSoft, focusColor: textSoft, activeColor: textSoft } } },
    },
    inputtext: { root: fieldShape, colorScheme: { light: { root: field } } },
    textarea: { root: fieldShape, colorScheme: { light: { root: field } } },
    multiselect: { root: fieldShape, colorScheme: { light: { root: field } } },
    select: {
      root: fieldShape,
      dropdown: { color: textSoft },
      colorScheme: {
        light: {
          root: selectField,
          overlay: { background: panelFill, borderColor: panelLine, color: text, shadow: panelShadow },
          option: {
            color: text,
            focusColor: text,
            selectedColor: text,
            selectedFocusColor: text,
            focusBackground: 'rgba(var(--bcube-orange-rgb), 0.12)',
            selectedBackground: 'rgba(var(--bcube-orange-rgb), 0.08)',
            selectedFocusBackground: 'rgba(var(--bcube-orange-rgb), 0.14)',
          },
        },
      },
      css: () => `.p-select-overlay { background: ${panelGradient}; }`,
    },
    button: {
      root: {
        borderRadius: 'var(--radius-md)',
      },
      colorScheme: {
        light: {
          root: {
            // "danger" has always rendered in the brand orange (a global
            // `.p-button.p-component` rule used to override it); kept as-is.
            primary: solid,
            danger: solid,
          },
          outlined: {
            primary: { hoverBackground: softHover, activeBackground: softHover, borderColor: line, color: text },
          },
          text: {
            primary: { hoverBackground: softHover, activeBackground: softHover, color: text },
          },
        },
      },
      // Tokens cannot express a resting background/border on text + outlined
      // buttons (Aura makes them transparent), nor weight/spacing/shadow.
      css: () => `
        .p-button {
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .p-button:not(.p-button-text) {
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.16);
        }
        .p-button.p-button-text,
        .p-button.p-button-outlined {
          background: ${soft};
          border-color: ${line};
          color: ${text};
        }
        .p-button.p-button-text:not(:disabled):hover,
        .p-button.p-button-outlined:not(:disabled):hover {
          border-color: ${lineHover};
        }
      `,
    },
  },
});
