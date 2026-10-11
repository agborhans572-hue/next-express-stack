export const footerGroups = [
  {
    title: "Platform",
    links: [
      ["Home", "/"],
      ["About Us", "/about"],
      ["Technology", "/tech"],
      ["Services", "/services"],
      ["Track Package", "/track"],
      ["News & Insights", "/news"],
    ],
  },
  {
    title: "Solutions",
    links: [
      ["Air Freight", "/services"],
      ["Road Freight", "/services"],
      ["Ocean Freight", "/services"],
      ["Rate Calculator", "/calculator"],
      ["Contact Us", "/contact"],
      ["Login", "/login"],
      ["Create Account", "/login?tab=register"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Privacy Policy", "/privacy"],
      ["Terms & Conditions", "/terms"],
      ["Cookie Policy", "/cookies"],
      ["Shipping Policy", "/shipping-policy"],
      ["Insurance Policy", "/insurance-policy"],
      ["FAQ", "/faq"],
      ["Legal Notice", "/legal"],
    ],
  },
] as const;

export const shippingLinks = [
  ["Track order", "/track"],
  ["Shipping calculator", "/calculator"],
  ["Contact Shiprion", "/contact"],
] as const;

export const accountLinks = [
  ["Login", "/login"],
  ["Sign up", "/login?tab=register"],
] as const;

/** Add the original shipping destinations to every locally captured page. */
export function withShippingNavigation(template: string) {
  const groups = footerGroups
    .map(
      ({ title, links }) =>
        `<div class="shipping-footer-group"><h3 class="txt txt-14 txt-bold">${title}</h3>${links
          .map(
            ([label, href]) =>
              `<a class="footer__link txt txt-16" href="${href}">${label.replaceAll("&", "&amp;")}</a>`,
          )
          .join("")}</div>`,
    )
    .join("");
  return template
    .replace(
      /<div class="footer__links">[\s\S]*?(?=<div class="footer__info)/,
      `<div class="footer__links shipping-footer-links">${groups}</div>\n`,
    )
    .replace(
      /(<div class="header__links-inner">)([\s\S]*?)(<\/div>)/,
      (_, start: string, links: string, end: string) =>
        `${start}${links}${shippingLinks
          .map(
            ([label, href]) =>
              `<a class="header__link txt txt-16" href="${href}">${label}.</a>`,
          )
          .join("")}${end}`,
    )
    .replace(
      /(<div class="header_act">)/,
      `<nav class="header__account-links" aria-label="Account navigation">${accountLinks
        .map(
          ([label, href]) =>
            `<a class="txt txt-16${label === "Sign up" ? " header__signup" : ""}" data-account-guest href="${href}">${label}</a>`,
        )
        .join(
          "",
        )}<a class="txt txt-16 header__signup" data-account-member hidden href="/dashboard">My dashboard</a></nav>$1`,
    )
    .replace(
      /(<li class="header__nav-item">\s*<a class="h6 header__nav-cta)/,
      `${shippingLinks
        .map(
          ([label, href]) =>
            `<li class="header__nav-item"><a class="header__nav-link txt txt-16 txt-med" href="${href}">${label}.</a></li>`,
        )
        .join("")}${accountLinks
        .map(
          ([label, href]) =>
            `<li class="header__nav-item" data-account-guest><a class="header__nav-link txt txt-16 txt-med" href="${href}">${label}.</a></li>`,
        )
        .join(
          "",
        )}<li class="header__nav-item" data-account-member hidden><a class="header__nav-link txt txt-16 txt-med" href="/dashboard">My dashboard.</a></li>$1`,
    );
}
