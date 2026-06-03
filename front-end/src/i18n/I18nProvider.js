import { createContext, useEffect, useMemo, useRef, useState } from "react";
import { getLanguageMeta, translatePlainText } from "./translations";
import "./i18n.css";

export const I18nContext = createContext({
  language: "ar",
  direction: "rtl",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (value) => value,
});

const STORAGE_KEY = "app_language";
const STUDENT_PREF_KEY = "student_portal_preferences";
const TEXT_NODE_ORIGINALS = new WeakMap();
const SKIP_TEXT_TAGS = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA"]);

function normalizeInitialLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "ar" || stored === "en") return stored;

  try {
    const studentPrefs = JSON.parse(localStorage.getItem(STUDENT_PREF_KEY) || "{}");
    if (studentPrefs.language === "ar" || studentPrefs.language === "en") {
      return studentPrefs.language;
    }
  } catch {
    // ignore invalid stored preferences
  }

  // Default project language is Arabic. English remains available from the switcher.
  return "ar";
}

function syncStudentPortalLanguage(language) {
  try {
    const current = JSON.parse(localStorage.getItem(STUDENT_PREF_KEY) || "{}");
    localStorage.setItem(STUDENT_PREF_KEY, JSON.stringify({ ...current, language }));
  } catch {
    localStorage.setItem(STUDENT_PREF_KEY, JSON.stringify({ language }));
  }
}

function shouldSkipTextNode(node) {
  const parent = node.parentElement;
  if (!parent) return true;
  if (SKIP_TEXT_TAGS.has(parent.tagName)) return true;
  if (parent.closest("[data-i18n-skip='true']")) return true;
  if (parent.closest(".fa, .fa-solid, .fa-regular, .fa-brands")) return true;
  return false;
}

function translateTextNodes(root, language) {
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (shouldSkipTextNode(node)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    if (!TEXT_NODE_ORIGINALS.has(node)) {
      TEXT_NODE_ORIGINALS.set(node, node.nodeValue);
    }

    const original = TEXT_NODE_ORIGINALS.get(node) || node.nodeValue;
    const nextValue = translatePlainText(original, language);

    if (node.nodeValue !== nextValue) {
      node.nodeValue = nextValue;
    }
  });
}

function translateAttributes(root, language) {
  if (!root?.querySelectorAll) return;

  const attributes = ["placeholder", "title", "aria-label", "alt"];

  root.querySelectorAll("*").forEach((element) => {
    if (element.closest("[data-i18n-skip='true']")) return;

    attributes.forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;

      const originalAttribute = `data-i18n-original-${attribute}`;
      if (!element.hasAttribute(originalAttribute)) {
        element.setAttribute(originalAttribute, element.getAttribute(attribute) || "");
      }

      const original = element.getAttribute(originalAttribute) || "";
      const nextValue = translatePlainText(original, language);

      if (element.getAttribute(attribute) !== nextValue) {
        element.setAttribute(attribute, nextValue);
      }
    });
  });
}

function translateDom(language) {
  const root = document.body;
  if (!root) return;

  translateTextNodes(root, language);
  translateAttributes(root, language);
}

function LanguageSwitcher({ language, setLanguage }) {
  return (
    <div className="global-language-switcher" aria-label="Language switcher">
      <button
        type="button"
        className={language === "ar" ? "active" : ""}
        onClick={() => setLanguage("ar")}
      >
        عربي
      </button>
      <button
        type="button"
        className={language === "en" ? "active" : ""}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
    </div>
  );
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(normalizeInitialLanguage);
  const observerRef = useRef(null);
  const rafRef = useRef(null);
  const meta = getLanguageMeta(language);

  const setLanguage = (nextLanguage) => {
    const normalized = nextLanguage === "en" ? "en" : "ar";
    localStorage.setItem(STORAGE_KEY, normalized);
    syncStudentPortalLanguage(normalized);
    setLanguageState(normalized);
  };

  const value = useMemo(() => {
    return {
      language,
      direction: meta.dir,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "ar" ? "en" : "ar"),
      t: (text) => translatePlainText(text, language),
    };
  }, [language, meta.dir]);

  useEffect(() => {
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
    document.body.dir = meta.dir;
    document.body.classList.toggle("i18n-rtl", meta.dir === "rtl");
    document.body.classList.toggle("i18n-ltr", meta.dir === "ltr");

    window.requestAnimationFrame(() => translateDom(language));
  }, [language, meta.code, meta.dir]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new MutationObserver(() => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = window.requestAnimationFrame(() => translateDom(language));
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label", "alt"],
    });

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      observerRef.current?.disconnect();
    };
  }, [language]);

  return (
    <I18nContext.Provider value={value}>
      <div className={`i18n-shell ${meta.dir === "rtl" ? "i18n-shell-rtl" : "i18n-shell-ltr"}`}>
        {children}
        <LanguageSwitcher language={language} setLanguage={setLanguage} />
      </div>
    </I18nContext.Provider>
  );
}
