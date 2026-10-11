import { useEffect, useRef, useState, type KeyboardEvent } from "react";

const categories = [
  {
    name: "Strictly necessary cookies",
    description:
      "These cookies are essential for the proper functioning of my website. Without these cookies, the website would not work properly",
  },
  {
    name: "Performance and Analytics cookies",
    description:
      "These cookies allow the website to remember the choices you have made in the past",
  },
  {
    name: "Advertisement and Targeting cookies",
    description:
      "These cookies collect information about how you use the website, which pages you visited and which links you clicked on. All of the data is anonymized and cannot be used to identify you",
  },
];

export default function CookieConsent({
  onContact,
}: {
  onContact: () => void;
}) {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem("cookieChoice");
    } catch {
      return true;
    }
  });
  const [settings, setSettings] = useState(false);
  const [enabled, setEnabled] = useState([true, false, false]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const choose = (choice: string) => {
    try {
      localStorage.setItem("cookieChoice", choice);
      localStorage.setItem(
        "cookiePreferences",
        JSON.stringify({
          necessary: true,
          analytics:
            choice === "accepted" || (choice === "custom" && enabled[1]),
          targeting:
            choice === "accepted" || (choice === "custom" && enabled[2]),
        }),
      );
    } catch {
      /* Consent remains usable when browser storage is unavailable. */
    }
    setSettings(false);
    setVisible(false);
  };
  useEffect(() => {
    if (!settings || !visible) return;
    const wrapper = document.querySelector<HTMLElement>(".wrapper");
    const previous = wrapper?.inert ?? false;
    if (wrapper) wrapper.inert = true;
    dialog.current?.focus();
    return () => {
      if (wrapper) wrapper.inert = previous;
      requestAnimationFrame(() =>
        document.getElementById("ck-cookie-settings")?.focus(),
      );
    };
  }, [settings, visible]);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (settings) setSettings(false);
      else choose("rejected");
    }
    if (event.key !== "Tab" || !settings || !dialog.current) return;
    const items = Array.from(
      dialog.current.querySelectorAll<HTMLElement>(
        "button, a[href], input:not(:disabled)",
      ),
    );
    const first = items[0];
    const last = items[items.length - 1];
    if (
      event.shiftKey &&
      [first, dialog.current].includes(document.activeElement as HTMLElement)
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  if (!visible) return null;
  return (
    <div
      className={settings ? "show--settings" : "show--consent"}
      onKeyDown={onKeyDown}
    >
      <div id="cc--main" className="c--anim">
        <div id="cc_div" className="cc_div">
          {!settings ? (
            <div
              id="cm"
              className="slide"
              role="dialog"
              aria-modal="false"
              aria-labelledby="c-ttl"
              aria-describedby="c-txt"
            >
              <div id="c-inr">
                <div id="c-inr-i">
                  <h2 id="c-ttl">Cookies consent</h2>
                  <div id="c-txt">
                    By clicking “Accept All Cookies”, you agree to the storing
                    of cookies on your device to enhance site navigation,
                    analyze site usage, and assist in our marketing efforts.{" "}
                    <button
                      type="button"
                      id="ck-cookie-settings"
                      className="cc-link"
                      aria-haspopup="dialog"
                      onClick={() => setSettings(true)}
                    >
                      Settings
                    </button>
                  </div>
                </div>
                <div id="c-bns">
                  <button
                    type="button"
                    id="c-p-bn"
                    className="c-bn"
                    onClick={() => choose("accepted")}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    id="c-s-bn"
                    className="c-bn c_link"
                    onClick={() => choose("rejected")}
                  >
                    Deny
                  </button>
                </div>
              </div>
              <button
                type="button"
                id="s-c-bn"
                className="c-bn ck-consent-close"
                style={{ position: "absolute", top: 0, right: 0 }}
                aria-label="Close"
                onClick={() => choose("rejected")}
              >
                <span />
              </button>
            </div>
          ) : (
            <>
              <div id="cs-ov" onClick={() => setSettings(false)} />
              <div
                ref={dialog}
                tabIndex={-1}
                id="s-cnt"
                role="dialog"
                aria-modal="true"
                aria-labelledby="s-ttl"
                className="bar right slide"
              >
                <div id="c-vln">
                  <div id="cs">
                    <div id="c-s-in">
                      <div id="s-inr" className="bns-t">
                        <div id="s-hdr">
                          <h2 id="s-ttl">Cookie preferences</h2>
                          <div id="s-c-bnc">
                            <button
                              type="button"
                              id="s-c-bn"
                              className="c-bn"
                              aria-label="Close"
                              onClick={() => setSettings(false)}
                            >
                              <span />
                            </button>
                          </div>
                        </div>
                        <div id="s-bl">
                          <div className="c-bl">
                            <div className="title">
                              <h3 className="b-tl">Cookie usage</h3>
                            </div>
                            <div className="desc">
                              <div className="p">
                                I use cookies to ensure the basic
                                functionalities of the website and to enhance
                                your online experience. You can choose for each
                                category to opt-in/out whenever you want. For
                                more details relative to cookies and other
                                sensitive data, please read the full{" "}
                                <a
                                  href="/privacy"
                                  className="cc-link"
                                  onClick={() => choose("rejected")}
                                >
                                  privacy policy
                                </a>
                                .
                              </div>
                            </div>
                          </div>
                          {categories.map((category, index) => (
                            <div
                              className={`c-bl b-ex ${expanded === index ? "act" : ""}`}
                              key={category.name}
                            >
                              <div className="title b-bn">
                                <button
                                  type="button"
                                  className="b-tl exp"
                                  aria-expanded={expanded === index}
                                  aria-controls={`c-ac-${index + 1}`}
                                  onClick={() =>
                                    setExpanded(
                                      expanded === index ? null : index,
                                    )
                                  }
                                >
                                  {category.name}
                                </button>
                                <label className="b-tg">
                                  <input
                                    className="c-tgl"
                                    type="checkbox"
                                    disabled={index === 0}
                                    checked={enabled[index]}
                                    onChange={(event) =>
                                      setEnabled(
                                        enabled.map((value, i) =>
                                          i === index
                                            ? event.target.checked
                                            : value,
                                        ),
                                      )
                                    }
                                  />
                                  <span
                                    className={`c-tg ${index === 0 ? "c-ro" : ""}`}
                                    aria-hidden="true"
                                  >
                                    <span className="on-i" />
                                    <span className="off-i" />
                                  </span>
                                  <span className="t-lb">{category.name}</span>
                                </label>
                              </div>
                              <div
                                className="desc b-acc"
                                id={`c-ac-${index + 1}`}
                                aria-hidden={expanded !== index}
                              >
                                <div className="p">{category.description}</div>
                              </div>
                            </div>
                          ))}
                          <div className="c-bl">
                            <div className="title">
                              <h3 className="b-tl">More information</h3>
                            </div>
                            <div className="desc">
                              <div className="p">
                                For any queries in relation to our policy on
                                cookies and your choices, please{" "}
                                <button
                                  type="button"
                                  className="cc-link"
                                  onClick={() => {
                                    choose("rejected");
                                    requestAnimationFrame(onContact);
                                  }}
                                >
                                  contact us
                                </button>
                                .
                              </div>
                            </div>
                          </div>
                        </div>
                        <div id="s-bns">
                          <button
                            type="button"
                            id="s-all-bn"
                            className="c-bn"
                            onClick={() => choose("accepted")}
                          >
                            Accept all
                          </button>
                          <button
                            type="button"
                            id="s-rall-bn"
                            className="c-bn"
                            onClick={() => choose("rejected")}
                          >
                            Reject all
                          </button>
                          <button
                            type="button"
                            id="s-sv-bn"
                            className="c-bn"
                            onClick={() => choose("custom")}
                          >
                            Save settings
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
