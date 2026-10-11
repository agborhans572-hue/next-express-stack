import ports from "./content/ports.json";
import type * as Leaflet from "leaflet";

const coordinates: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(ports).map(([id, [latitude, longitude]]) => [
    id,
    [latitude, longitude] as [number, number],
  ]),
);

export function initializeMap(root: HTMLElement, mobile: boolean) {
  const element = root.querySelector<HTMLElement>("[data-ck-map]");
  if (!element) return { refresh() {}, destroy() {} };
  const controller = new AbortController();
  let disposed = false;
  let map: Leaflet.Map | undefined;
  let route: Leaflet.Polyline | undefined;
  const markers: Leaflet.CircleMarker[] = [];
  let ready: Promise<typeof Leaflet> | undefined;
  const initialize = () =>
    (ready ??= import("leaflet").then((L) => {
      if (!disposed) {
        element.className = "tech-intro__map-main-inner";
        map = L.map(element, {
          scrollWheelZoom: false,
          worldCopyJump: true,
          minZoom: 2,
        }).setView([44.5, -10], 3);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        map.invalidateSize();
      }
      return L;
    }));
  // No bulk downloads or prefetching: only initialize when the map is on screen.
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void initialize();
    },
    { root: mobile ? root.querySelector(".wrapper") : null },
  );
  observer.observe(element);
  const start = root.querySelector<HTMLElement>(".input-wrap-start");
  const end = root.querySelector<HTMLElement>(".input-wrap-end");
  const button = root.querySelector<HTMLButtonElement>(
    ".tech-intro__map-submit",
  );
  const selected = new Map<HTMLElement, { id: string; label: string }>();
  const dropdowns = [start, end].filter((item): item is HTMLElement =>
    Boolean(item),
  );
  dropdowns.forEach((wrap) => {
    const input = wrap.querySelector<HTMLInputElement>(".input-field")!;
    const list = wrap.querySelector<HTMLElement>(".input-drop-inner")!;
    if (wrap === end && !list.querySelector(".port-item")) {
      start
        ?.querySelectorAll(".port-item")
        .forEach((option) => list.append(option.cloneNode(true)));
    }
    const options = Array.from(
      wrap.querySelectorAll<HTMLElement>(".port-item"),
    );
    input.setAttribute("aria-label", input.placeholder);
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    list.id = wrap === start ? "ck-start-ports" : "ck-end-ports";
    list.setAttribute("role", "listbox");
    input.setAttribute("aria-controls", list.id);
    options.forEach((option) => option.setAttribute("role", "option"));
    const open = () => {
      wrap.classList.add("ck-port-open");
      input.setAttribute("aria-expanded", "true");
    };
    const close = () => {
      wrap.classList.remove("ck-port-open");
      input.setAttribute("aria-expanded", "false");
    };
    input.addEventListener("focus", open, { signal: controller.signal });
    input.addEventListener(
      "input",
      () => {
        selected.delete(wrap);
        if (wrap === start && end) {
          selected.delete(end);
          const destination =
            end.querySelector<HTMLInputElement>(".input-field")!;
          destination.value = "";
          destination.disabled = true;
        }
        if (button) {
          button.disabled = true;
          button.classList.add("disable");
        }
        const query = input.value.toLocaleLowerCase();
        options.forEach(
          (option) =>
            (option.hidden = !option
              .querySelector(".port-item-name")!
              .textContent!.toLocaleLowerCase()
              .includes(query)),
        );
        const empty = wrap.querySelector<HTMLElement>(".port-item-empty-txt");
        if (empty)
          empty.style.display = options.some((option) => !option.hidden)
            ? ""
            : "block";
        open();
      },
      { signal: controller.signal },
    );
    wrap.addEventListener(
      "focusout",
      (event) => {
        if (!wrap.contains(event.relatedTarget as Node)) close();
      },
      { signal: controller.signal },
    );
    wrap.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          input.focus();
          close();
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const visible = options.filter((option) => !option.hidden);
          const index = visible.indexOf(document.activeElement as HTMLElement);
          const next =
            index < 0
              ? event.key === "ArrowDown"
                ? 0
                : visible.length - 1
              : (index +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  visible.length) %
                visible.length;
          visible[next]?.focus();
        }
      },
      { signal: controller.signal },
    );
    list.addEventListener(
      "click",
      (event) => {
        const option = (event.target as Element).closest<HTMLElement>(
          ".port-item",
        );
        if (!option) return;
        event.preventDefault();
        const id = option.querySelector(".port-item-id")!.textContent!.trim();
        const label = option
          .querySelector(".port-item-name")!
          .textContent!.trim();
        selected.set(wrap, { id, label });
        options.forEach((item) =>
          item.setAttribute("aria-selected", String(item === option)),
        );
        input.value = label;
        wrap.querySelector<HTMLInputElement>(".input-hidden")!.value = id;
        input.focus({ preventScroll: true });
        close();
        if (end && selected.has(start!))
          end.querySelector<HTMLInputElement>(".input-field")!.disabled = false;
        const valid =
          start &&
          end &&
          selected.has(start) &&
          selected.has(end) &&
          selected.get(start)!.id !== selected.get(end)!.id;
        if (button) {
          button.disabled = !valid;
          button.classList.toggle("disable", !valid);
        }
      },
      { signal: controller.signal },
    );
  });
  button?.addEventListener(
    "click",
    async (event) => {
      event.preventDefault();
      if (!start || !end || !selected.has(start) || !selected.has(end)) return;
      const from = selected.get(start)!,
        to = selected.get(end)!;
      const L = await initialize();
      if (!map || disposed) return;
      route?.remove();
      markers.forEach((marker) => marker.remove());
      markers.length = 0;
      const points = [coordinates[from.id], coordinates[to.id]];
      route = L.polyline(points, {
        color: "#ff471d",
        weight: 2,
        dashArray: "5 5",
      }).addTo(map);
      points.forEach((point, index) =>
        markers.push(
          L.circleMarker(point, {
            radius: 6,
            color: "#fff",
            weight: 2,
            fillColor: "#ff471d",
            fillOpacity: 1,
          })
            .addTo(map!)
            .bindTooltip(index ? to.label : from.label),
        ),
      );
      map.fitBounds(route.getBounds(), {
        padding: [45, 45],
        maxZoom: 7,
        animate: !matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
      let status = root.querySelector<HTMLElement>(".ck-route-status");
      if (!status) {
        status = document.createElement("p");
        status.className = "ck-route-status txt txt-14";
        status.setAttribute("role", "status");
        root.querySelector(".tech-intro__map-head")!.append(status);
      }
      status.textContent = `Selected ports: ${from.label} → ${to.label}`;
      const study =
        root.querySelector<HTMLTextAreaElement>(".download textarea");
      if (study && !study.value)
        study.value = `Route: ${from.label} to ${to.label}.\nSchedule details: `;
    },
    { signal: controller.signal },
  );
  return {
    refresh: () => map?.invalidateSize(),
    destroy: () => {
      disposed = true;
      controller.abort();
      observer.disconnect();
      map?.remove();
    },
  };
}
