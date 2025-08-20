"use client";

import { useEffect } from "react";

export default function HydrationFix() {
  useEffect(() => {
    // Remove browser extension attributes that cause hydration mismatches
    const removeExtensionAttributes = () => {
      const body = document.body;
      if (body) {
        // Common browser extension attributes that cause hydration issues
        const extensionAttributes = [
          "cz-shortcut-listen",
          "data-new-gr-c-s-check-loaded",
          "data-gr-ext-installed",
          "spellcheck",
          "data-lt-installed",
          "data-darkreader-mode",
          "data-darkreader-scheme",
        ];

        extensionAttributes.forEach((attr) => {
          if (body.hasAttribute(attr)) {
            body.removeAttribute(attr);
          }
        });
      }
    };

    // Run immediately and also after a short delay to catch late additions
    removeExtensionAttributes();

    const timeoutId = setTimeout(removeExtensionAttributes, 100);

    // Set up a MutationObserver to watch for new attributes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.target === document.body
        ) {
          removeExtensionAttributes();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        "cz-shortcut-listen",
        "data-new-gr-c-s-check-loaded",
        "data-gr-ext-installed",
        "data-lt-installed",
        "data-darkreader-mode",
        "data-darkreader-scheme",
      ],
    });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return null;
}
