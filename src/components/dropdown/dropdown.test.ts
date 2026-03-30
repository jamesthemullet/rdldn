import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("dropdown component", () => {
  test("renders defaults without optional form or placeholder props", async () => {
    const container = await AstroContainer.create();
    const { default: Dropdown } = await import("./dropdown.astro");

    const html = await container.renderToString(Dropdown, {
      props: {
        label: "Sort posts",
        id: "sortBy",
        name: "sortBy",
        options: [
          { value: "latest", label: "Latest first" },
          { value: "rating", label: "Top rated" }
        ]
      }
    });

    expect(html).toMatch(/<label[^>]*for="sortBy"[^>]*>Sort posts<\/label>/);
    expect(html).toContain('method="get"');
    expect(html).toContain('id="sortBy"');
    expect(html).toContain('name="sortBy"');
    expect(html).toContain('onchange="this.form.submit()"');
    expect(html).toContain('value="latest"');
    expect(html).toContain('title="Latest first"');
    expect(html).toContain("Latest first");
    expect(html).not.toContain('value=""');
    expect(html).not.toContain("display: block; text-align: center;");
  });

  test("renders centred layout, placeholder option and truncated labels", async () => {
    const container = await AstroContainer.create();
    const { default: Dropdown } = await import("./dropdown.astro");

    const html = await container.renderToString(Dropdown, {
      props: {
        label: "Choose area",
        id: "area",
        name: "area",
        options: [
          { value: "long", label: "Very long roast dinner neighbourhood name" },
          { value: "short", label: "Soho" }
        ],
        selectedValue: "long",
        formId: "area-form",
        formMethod: "post",
        onChange: "console.log('changed')",
        defaultOptionLabel: "All areas",
        maxOptionLabelLength: 12,
        center: true
      }
    });

    expect(html).toContain('style="display: block; text-align: center;"');
    expect(html).toContain('id="area-form"');
    expect(html).toContain('method="post"');
    expect(html).toContain('style="display: flex; justify-content: center;"');
    expect(html).toContain('onchange="console.log(\'changed\')"');
    expect(html).toContain('value=""');
    expect(html).toContain("All areas");
    expect(html).toContain('selected title="Very long roast dinner neighbourhood name"');
    expect(html).toContain("Very long r…");
    expect(html).toContain("Soho");
  });
});