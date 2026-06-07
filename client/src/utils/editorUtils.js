export const sanitizeEditorHtml = (html) => {
  const temp = document.createElement("div");
  temp.innerHTML = html;

  temp.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-")) {
        el.removeAttribute(attr.name);
      }
    });
    el.removeAttribute("class");
    el.removeAttribute("style");
  });

  temp.querySelectorAll("p p").forEach((innerP) => {
    const parent = innerP.parentNode;
    while (innerP.firstChild) {
      parent.insertBefore(innerP.firstChild, innerP);
    }
    parent.removeChild(innerP);
  });

  return (
    temp.innerHTML
      .replace(/\u200B/g, "")
      .replace(/​/g, "")
      .replace(/<p>\s*<\/p>/g, "")
      .trim()
  );
};
