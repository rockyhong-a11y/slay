const PAGES = new Set(["battle", "map", "cards", "guide"]);
const MODALS = new Set(["deck", "roster", "inventory"]);

/** Modal routes retain their page when traversing this tab's history. */
export function navigationFromHash(hash, currentPage = "battle") {
  const id = String(hash || "").replace(/^#/, "");
  if (MODALS.has(id))
    return { page: PAGES.has(currentPage) ? currentPage : "battle", modal: id };
  return { page: PAGES.has(id) ? id : "battle", modal: null };
}

export function navigationHash(page, modal = null) {
  const id = MODALS.has(modal) ? modal : PAGES.has(page) ? page : "battle";
  return id === "battle" ? "" : `#${id}`;
}

export function dismissNavigationOnBlur(menu, relatedTarget) {
  // Safari does not focus buttons on tap. The summary can blur with a null
  // destination before the item's click; hiding details would swallow it.
  // Explicit outside pointerdown handles non-focusable dismissal targets.
  if (relatedTarget && !menu.contains(relatedTarget)) menu.open = false;
}

export function installNavigationDismissal(menu, doc = globalThis.document) {
  if (!menu || !doc) return () => {};
  const pointerDown = (event) => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  };
  const options = { capture: true };
  doc.addEventListener("pointerdown", pointerDown, options);
  return () => doc.removeEventListener("pointerdown", pointerDown, options);
}
