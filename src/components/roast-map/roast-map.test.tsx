// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import RoastMap from "./roast-map";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const leafletMocks = vi.hoisted(() => {
  const mapSetViewMock = vi.fn();
  const mapRemoveMock = vi.fn();
  const mapMock = vi.fn(() => ({
    setView: mapSetViewMock.mockReturnThis(),
    remove: mapRemoveMock
  }));

  const tileLayerAddToMock = vi.fn();
  const tileLayerMock = vi.fn(() => ({
    addTo: tileLayerAddToMock
  }));

  const markerAddToMock = vi.fn(function markerAddTo(this: unknown) {
    return this;
  });
  const markerBindTooltipMock = vi.fn(function markerBindTooltip(this: unknown) {
    return this;
  });
  const markerBindPopupMock = vi.fn(function markerBindPopup(this: unknown) {
    return this;
  });
  const markerMock = vi.fn(() => ({
    addTo: markerAddToMock,
    bindTooltip: markerBindTooltipMock,
    bindPopup: markerBindPopupMock
  }));

  const divIconMock = vi.fn();

  return {
    mapSetViewMock,
    mapRemoveMock,
    mapMock,
    tileLayerAddToMock,
    tileLayerMock,
    markerAddToMock,
    markerBindTooltipMock,
    markerBindPopupMock,
    markerMock,
    divIconMock
  };
});

vi.mock("leaflet", () => ({
  default: {
    map: leafletMocks.mapMock,
    tileLayer: leafletMocks.tileLayerMock,
    marker: leafletMocks.markerMock,
    divIcon: leafletMocks.divIconMock
  }
}));

const waitForRender = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const createHost = () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  return { host, root };
};

const sampleMarkers = [
  { lat: 51.51, lng: -0.1, label: "Open One", rating: 9.2, slug: "open-one" },
  { lat: 51.49, lng: -0.08, label: "Closed One", rating: 8.6, slug: "closed-one", closed: "Closed" },
  { lat: 51.5, lng: -0.11, rating: 7.8, slug: "unnamed-open" },
  { lat: 0, lng: -0.07, label: "Zero Lat", rating: 8.1, slug: "zero-lat" },
  { lat: 51.52, lng: -0.12, label: "NaN Rating", rating: Number.NaN, slug: "nan-rating" }
];

const colourBandMarkers = [
  { lat: 51.501, lng: -0.101, label: "Nine Plus", rating: 9.0, slug: "nine-plus" },
  { lat: 51.502, lng: -0.102, label: "Eight Point Five", rating: 8.5, slug: "eight-five" },
  { lat: 51.503, lng: -0.103, label: "Eight Plus", rating: 8.0, slug: "eight-plus" },
  { lat: 51.504, lng: -0.104, label: "Seven Point Five", rating: 7.5, slug: "seven-five" },
  { lat: 51.505, lng: -0.105, label: "Seven Plus", rating: 7.0, slug: "seven-plus" },
  { lat: 51.506, lng: -0.106, label: "Six Point Five", rating: 6.5, slug: "six-five" },
  { lat: 51.507, lng: -0.107, label: "Six Plus", rating: 6.0, slug: "six-plus" },
  { lat: 51.508, lng: -0.108, label: "Five Plus", rating: 5.0, slug: "five-plus" },
  { lat: 51.509, lng: -0.109, label: "Four Plus", rating: 4.0, slug: "four-plus" },
  { lat: 51.51, lng: -0.11, label: "Three Plus", rating: 3.0, slug: "three-plus" },
  { lat: 51.511, lng: -0.111, label: "Below Three", rating: 2.9, slug: "below-three" }
];

beforeEach(() => {
  document.body.innerHTML = "";
  leafletMocks.mapSetViewMock.mockReset();
  leafletMocks.mapRemoveMock.mockReset();
  leafletMocks.mapMock.mockClear();
  leafletMocks.tileLayerAddToMock.mockReset();
  leafletMocks.tileLayerMock.mockClear();
  leafletMocks.markerAddToMock.mockReset();
  leafletMocks.markerBindTooltipMock.mockReset();
  leafletMocks.markerBindPopupMock.mockReset();
  leafletMocks.markerMock.mockClear();
  leafletMocks.divIconMock.mockReset();
  leafletMocks.divIconMock.mockImplementation((options: unknown) => ({ options }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("roast-map component", () => {
  test("renders map controls and only plots open, valid markers by default", async () => {
    const { host, root } = createHost();

    await act(async () => {
      root.render(<RoastMap markers={sampleMarkers} />);
    });
    await waitForRender();

    const counts = host.querySelector('[data-test-id="map-marker-counts"]');
    expect(counts?.getAttribute("data-total-markers")).toBe("5");
    expect(counts?.getAttribute("data-visible-markers")).toBe("2");
    expect(counts?.getAttribute("data-closed-markers")).toBe("1");

    expect(leafletMocks.mapMock).toHaveBeenCalledTimes(1);
    expect(leafletMocks.tileLayerMock).toHaveBeenCalledTimes(1);
    expect(leafletMocks.markerMock).toHaveBeenCalledTimes(2);

    expect(leafletMocks.markerMock).toHaveBeenNthCalledWith(1, [51.51, -0.1], {
      icon: expect.anything(),
      title: "Open One (9.2/10)",
      alt: "Open One (9.2/10)"
    });

    expect(leafletMocks.markerMock).toHaveBeenNthCalledWith(2, [51.5, -0.11], {
      icon: expect.anything(),
      title: "Roast location (7.8/10)",
      alt: "Roast location (7.8/10)"
    });

    expect(leafletMocks.divIconMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        className: "",
        html: expect.stringContaining("9.2")
      })
    );
    expect((leafletMocks.divIconMock.mock.calls[0]?.[0] as { html?: string }).html).toContain("#4B0082");

    await act(async () => {
      root.unmount();
    });
    expect(leafletMocks.mapRemoveMock).toHaveBeenCalledTimes(1);
  });

  test("includes closed markers when checkbox is enabled", async () => {
    const { host, root } = createHost();

    await act(async () => {
      root.render(<RoastMap markers={sampleMarkers} />);
    });
    await waitForRender();

    leafletMocks.markerMock.mockClear();

    const checkbox = host.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await act(async () => {
      checkbox.click();
    });
    await waitForRender();

    const counts = host.querySelector('[data-test-id="map-marker-counts"]');
    expect(counts?.getAttribute("data-visible-markers")).toBe("3");

    expect(leafletMocks.markerMock).toHaveBeenCalledTimes(3);
    expect(leafletMocks.markerMock).toHaveBeenCalledWith([51.49, -0.08], {
      icon: expect.anything(),
      title: "Closed One (8.6/10)",
      alt: "Closed One (8.6/10)"
    });
    expect(leafletMocks.mapRemoveMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });

  test("filters visible markers by minimum rating", async () => {
    const { host, root } = createHost();

    await act(async () => {
      root.render(<RoastMap markers={sampleMarkers} />);
    });
    await waitForRender();

    leafletMocks.markerMock.mockClear();

    const slider = host.querySelector('input[type="range"]') as HTMLInputElement;
    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set;
      valueSetter?.call(slider, "8.5");
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      slider.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();

    expect(host.textContent).toContain("Minimum rating: 8.5");

    const counts = host.querySelector('[data-test-id="map-marker-counts"]');
    expect(counts?.getAttribute("data-visible-markers")).toBe("1");

    expect(leafletMocks.markerMock).toHaveBeenCalledTimes(1);
    expect(leafletMocks.markerMock).toHaveBeenCalledWith([51.51, -0.1], {
      icon: expect.anything(),
      title: "Open One (9.2/10)",
      alt: "Open One (9.2/10)"
    });

    await act(async () => {
      root.unmount();
    });
  });

  test("assigns the expected colour band for each rating threshold", async () => {
    const { root } = createHost();

    await act(async () => {
      root.render(<RoastMap markers={colourBandMarkers} />);
    });
    await waitForRender();

    expect(leafletMocks.markerMock).toHaveBeenCalledTimes(11);
    expect(leafletMocks.divIconMock).toHaveBeenCalledTimes(11);

    const iconHtml = leafletMocks.divIconMock.mock.calls
      .map(([arg]) => (arg as { html?: string }).html ?? "")
      .join("\n");

    expect(iconHtml).toContain('fill="#4B0082"');
    expect(iconHtml).toContain('fill="#83539B"');
    expect(iconHtml).toContain('fill="#588EB5"');
    expect(iconHtml).toContain('fill="#51A790"');
    expect(iconHtml).toContain('fill="#4D7833"');
    expect(iconHtml).toContain('fill="#6A972A"');
    expect(iconHtml).toContain('fill="#CFB920"');
    expect(iconHtml).toContain('fill="#CF7C1D"');
    expect(iconHtml).toContain('fill="#FF0000"');
    expect(iconHtml).toContain('fill="#8B0000"');
    expect(iconHtml).toContain('fill="#000000"');

    await act(async () => {
      root.unmount();
    });
  });

  test("skips Leaflet initialisation when the map ref is unavailable", async () => {
    vi.resetModules();

    vi.doMock("react", async () => {
      const actual = await vi.importActual<typeof import("react")>("react");
      return {
        ...actual,
        useRef: () => ({ current: null }),
        useState: <T,>(initialValue: T) => [initialValue, vi.fn()],
        useMemo: <T,>(fn: () => T) => fn(),
        useEffect: (callback: () => unknown) => {
          callback();
        }
      };
    });

    const leafletModule = await import("leaflet");
    const mockedLeaflet = leafletModule.default as unknown as {
      map: ReturnType<typeof vi.fn>;
    };
    mockedLeaflet.map.mockClear();

    const { default: RoastMapWithoutRef } = await import("./roast-map");
    RoastMapWithoutRef({ markers: sampleMarkers });

    expect(mockedLeaflet.map).not.toHaveBeenCalled();

    vi.doUnmock("react");
    vi.resetModules();
  });
});
